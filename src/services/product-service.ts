import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/utils";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "../validations/inventory";
import { parseQuery, productQuerySchema } from "../validations/query";

export async function listProducts(request: Request) {
  const { page, limit, search, categoryId, supplierId, lowStock } =
    parseQuery(request, productQuerySchema);
  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { SKU: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(supplierId !== undefined ? { supplierId } : {}),
    ...(lowStock === "true"
      ? { quantity: { lte: prisma.product.fields.minimumStock } }
      : lowStock === "false"
        ? { quantity: { gt: prisma.product.fields.minimumStock } }
        : {}),
  };

  const [data, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, supplier: true },
  });

  if (!product) {
    throw new ApiError("Product not found.", 404);
  }

  return product;
}

export async function createProduct(input: ProductCreateInput) {
  const { expiryDate, ...data } = input;
  return prisma.product.create({
    data: {
      ...data,
      ...(expiryDate !== undefined
        ? { expiryDate: expiryDate ? new Date(expiryDate) : null }
        : {}),
    },
    include: { category: true, supplier: true },
  });
}

export async function updateProduct(id: number, input: ProductUpdateInput) {
  const { expiryDate, ...data } = input;
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(expiryDate !== undefined
        ? { expiryDate: expiryDate ? new Date(expiryDate) : null }
        : {}),
    },
    include: { category: true, supplier: true },
  });
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
}
