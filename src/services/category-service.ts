import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/utils";
import type { z } from "zod";
import { categoryQuerySchema, parseQuery } from "../validations/query";
import type {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "../validations/inventory";

type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export async function listCategories(request: Request) {
  const { page, limit, search } = parseQuery(request, categoryQuerySchema);
  const skip = (page - 1) * limit;

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [data, totalItems] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getCategory(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    throw new ApiError("Category not found.", 404);
  }

  return category;
}

export async function createCategory(input: CategoryCreateInput) {
  return prisma.category.create({ data: input });
}

export async function updateCategory(id: number, input: CategoryUpdateInput) {
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
}
