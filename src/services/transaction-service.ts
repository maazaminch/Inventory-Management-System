import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/utils";
import {
  calculateTransactionTotal,
  weightedAverageCost,
} from "../lib/inventory-money";
import type {
  PurchaseCreateInput,
  SaleCreateInput,
} from "../validations/inventory";
import {
  parseQuery,
  purchaseQuerySchema,
  saleQuerySchema,
} from "../validations/query";

const purchaseInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          SKU: true,
          unit: true,
        },
      },
    },
  },
  supplier: true,
} as const;

const saleInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          SKU: true,
          unit: true,
        },
      },
    },
  },
} as const;

function assertProductsFound(
  requestedCount: number,
  foundCount: number,
): void {
  if (requestedCount !== foundCount) {
    throw new ApiError("One or more products were not found.", 404);
  }
}

function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

async function withInventoryTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isSerializationConflict(error) || attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("Inventory transaction retry limit exceeded.");
}

export async function listPurchases(request: Request) {
  const { page, limit, search, supplierId, productId, from, to } =
    parseQuery(request, purchaseQuerySchema);
  const skip = (page - 1) * limit;
  const where = {
    ...(supplierId === undefined ? {} : { supplierId }),
    ...dateRangeFilter(from, to),
    ...(productId === undefined
      ? {}
      : { items: { some: { productId } } }),
    ...(search
      ? {
          OR: [
            {
              supplier: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    {
                      email: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
            {
              items: {
                some: {
                  product: {
                    is: {
                      OR: [
                        {
                          name: {
                            contains: search,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          SKU: {
                            contains: search,
                            mode: "insensitive" as const,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
  const [data, totalItems] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: purchaseInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getPurchase(id: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw new ApiError("Purchase not found.", 404);
  }

  return purchase;
}

export async function createPurchase(input: PurchaseCreateInput) {
  return withInventoryTransaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) } },
      select: { id: true, purchasePrice: true, quantity: true },
    });
    assertProductsFound(input.items.length, products.length);
    const productsById = new Map(products.map((product) => [product.id, product]));
    const items = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new ApiError("One or more products were not found.", 404);
      }

      return {
        ...item,
        price: new Prisma.Decimal(item.price ?? product.purchasePrice),
        product,
      };
    }).sort((left, right) => left.productId - right.productId);
    const totalAmount = calculateTransactionTotal(
      items,
      new Prisma.Decimal("99999999.99"),
    );

    const purchase = await tx.purchase.create({
      data: {
        supplierId: input.supplierId ?? null,
        totalAmount,
        items: {
          create: items.map(({ productId, quantity, price }) => ({
            productId,
            quantity,
            price,
          })),
        },
      },
    });

    for (const item of items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          quantity: {
            equals: item.product.quantity,
            lte: 2_147_483_647 - item.quantity,
          },
          purchasePrice: item.product.purchasePrice,
        },
        data: {
          quantity: { increment: item.quantity },
          purchasePrice: weightedAverageCost(
            item.product.purchasePrice,
            item.product.quantity,
            item.price,
            item.quantity,
          ),
        },
      });

      if (result.count !== 1) {
        throw new ApiError(
          `Stock quantity limit exceeded for product ${item.productId}.`,
          409,
        );
      }
    }

    return tx.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
      include: purchaseInclude,
    });
  });
}

export async function preventPurchaseDeletion(id: number): Promise<never> {
  const exists = await prisma.purchase.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    throw new ApiError("Purchase not found.", 404);
  }

  throw new ApiError(
    "Posted purchases cannot be deleted because they affect stock history.",
    409,
  );
}

export async function listSales(request: Request) {
  const { page, limit, search, productId, from, to } = parseQuery(
    request,
    saleQuerySchema,
  );
  const skip = (page - 1) * limit;
  const where = {
    ...dateRangeFilter(from, to),
    ...(search || productId !== undefined
      ? {
          items: {
            some: {
              ...(productId === undefined ? {} : { productId }),
              ...(search
                ? {
                    product: {
                      is: {
                        OR: [
                          {
                            name: {
                              contains: search,
                              mode: "insensitive" as const,
                            },
                          },
                          {
                            SKU: {
                              contains: search,
                              mode: "insensitive" as const,
                            },
                          },
                        ],
                      },
                    },
                  }
                : {}),
            },
          },
        }
      : {}),
  };
  const [data, totalItems] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: saleInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getSale(id: number) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: saleInclude,
  });

  if (!sale) {
    throw new ApiError("Sale not found.", 404);
  }

  return sale;
}

export async function createSale(input: SaleCreateInput) {
  return withInventoryTransaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) } },
      select: { id: true, sellingPrice: true },
    });
    assertProductsFound(input.items.length, products.length);
    const productsById = new Map(products.map((product) => [product.id, product]));
    const items = input.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new ApiError("One or more products were not found.", 404);
      }

      return {
        ...item,
        price: new Prisma.Decimal(item.price ?? product.sellingPrice),
      };
    }).sort((left, right) => left.productId - right.productId);
    const totalAmount = calculateTransactionTotal(
      items,
      new Prisma.Decimal("99999999.99"),
    );

    for (const item of items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          quantity: { gte: item.quantity },
        },
        data: { quantity: { decrement: item.quantity } },
      });

      if (result.count !== 1) {
        throw new ApiError(
          `Insufficient stock for product ${item.productId}.`,
          409,
        );
      }
    }

    const sale = await tx.sale.create({
      data: {
        totalAmount,
        items: {
          create: items.map(({ productId, quantity, price }) => ({
            productId,
            quantity,
            price,
          })),
        },
      },
    });

    return tx.sale.findUniqueOrThrow({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
}

export async function preventSaleDeletion(id: number): Promise<never> {
  const exists = await prisma.sale.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    throw new ApiError("Sale not found.", 404);
  }

  throw new ApiError(
    "Posted sales cannot be deleted because they affect stock history.",
    409,
  );
}

function dateRangeFilter(from?: string, to?: string) {
  if (!from && !to) {
    return {};
  }

  return {
    createdAt: {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to
        ? { lt: new Date(Date.parse(`${to}T00:00:00.000Z`) + 86_400_000) }
        : {}),
    },
  };
}
