import { z } from "zod";

const positiveIntegerString = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().positive().safe());

const paginationFields = {
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(1_000_000).safe())
    .optional()
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(20),
};

const searchField = z.string().trim().max(100).optional();
const dateField = z.iso.date();

const dateRangeFields = {
  from: dateField.optional(),
  to: dateField.optional(),
};

function isValidDateRange(query: { from?: string; to?: string }) {
  return (
    query.from === undefined ||
    query.to === undefined ||
    query.from <= query.to
  );
}

export const idParamsSchema = z
  .object({ id: positiveIntegerString })
  .strict();

export const productQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
    categoryId: positiveIntegerString.optional(),
    supplierId: positiveIntegerString.optional(),
    lowStock: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const categoryQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
  })
  .strict();

export const supplierQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
  })
  .strict();

export const staffQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
  })
  .strict();

export const purchaseQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
    supplierId: positiveIntegerString.optional(),
    productId: positiveIntegerString.optional(),
    ...dateRangeFields,
  })
  .strict()
  .refine(isValidDateRange, {
    message: "'from' must be on or before 'to'.",
    path: ["from"],
  });

export const saleQuerySchema = z
  .object({
    ...paginationFields,
    search: searchField,
    productId: positiveIntegerString.optional(),
    ...dateRangeFields,
  })
  .strict()
  .refine(isValidDateRange, {
    message: "'from' must be on or before 'to'.",
    path: ["from"],
  });

export function parseIdParams(params: { id: string }): number {
  return idParamsSchema.parse(params).id;
}

export function parseQuery<T extends z.ZodType>(
  request: Request,
  schema: T,
): z.output<T> {
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of new URL(request.url).searchParams) {
    const previous = query[key];
    query[key] =
      previous === undefined
        ? value
        : Array.isArray(previous)
          ? [...previous, value]
          : [previous, value];
  }

  return schema.parse(query);
}
