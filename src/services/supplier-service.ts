import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/utils";
import type { z } from "zod";
import { parseQuery, supplierQuerySchema } from "../validations/query";
import type {
  supplierCreateSchema,
  supplierUpdateSchema,
} from "../validations/inventory";

type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

export async function listSuppliers(request: Request) {
  const { page, limit, search } = parseQuery(request, supplierQuerySchema);
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, totalItems] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { products: true, purchases: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getSupplier(id: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, purchases: true } },
    },
  });

  if (!supplier) {
    throw new ApiError("Supplier not found.", 404);
  }

  return supplier;
}

export async function createSupplier(input: SupplierCreateInput) {
  return prisma.supplier.create({ data: input });
}

export async function updateSupplier(id: number, input: SupplierUpdateInput) {
  return prisma.supplier.update({ where: { id }, data: input });
}

export async function deleteSupplier(id: number) {
  await prisma.supplier.delete({ where: { id } });
}
