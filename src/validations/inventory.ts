import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const optionalText = z.string().trim().max(1000).nullable().optional();
const price = z
  .number()
  .finite()
  .min(0)
  .max(99_999_999.99)
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: "Price must have no more than two decimal places.",
  });
const positiveId = z.number().int().positive();
const positiveQuantity = z.number().int().positive().max(2_147_483_647);
const email = z
  .string()
  .trim()
  .pipe(z.email().max(254))
  .transform((value) => value.toLowerCase());

export const categoryCreateSchema = z
  .object({ name })
  .strict();

export const categoryUpdateSchema = categoryCreateSchema;

export const supplierCreateSchema = z
  .object({
    name,
    phone: z.string().trim().max(40).nullable().optional(),
    email: email.nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export const supplierUpdateSchema = supplierCreateSchema;

const productFields = {
  name,
  SKU: z.string().trim().min(1).max(100),
  description: optionalText,
  purchasePrice: price,
  sellingPrice: price,
  minimumStock: z.number().int().min(0).max(2_147_483_647).optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  expiryDate: z.union([z.iso.date(), z.iso.datetime()]).nullable().optional(),
  batchNumber: z.string().trim().max(100).nullable().optional(),
  categoryId: positiveId,
  supplierId: positiveId.nullable().optional(),
};

export const productCreateSchema = z
  .object(productFields)
  .strict();

export const productUpdateSchema = z
  .object({
    name: productFields.name.optional(),
    SKU: productFields.SKU.optional(),
    description: productFields.description,
    sellingPrice: productFields.sellingPrice.optional(),
    minimumStock: productFields.minimumStock,
    unit: productFields.unit,
    expiryDate: productFields.expiryDate,
    batchNumber: productFields.batchNumber,
    categoryId: productFields.categoryId.optional(),
    supplierId: productFields.supplierId,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const staffCreateSchema = z
  .object({
    name,
    email,
    password: z.string().min(8).max(72),
  })
  .strict();

export const staffUpdateSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

const transactionItemSchema = z
  .object({
    productId: positiveId,
    quantity: positiveQuantity,
    price: price.optional(),
  })
  .strict();

const uniqueProductItems = (
  value: { items: Array<{ productId: number }> },
) => new Set(value.items.map((item) => item.productId)).size === value.items.length;

export const purchaseCreateSchema = z
  .object({
    supplierId: positiveId.nullable().optional(),
    items: z.array(transactionItemSchema).min(1).max(500),
  })
  .strict()
  .refine(uniqueProductItems, {
    message: "Each product may appear only once per purchase.",
    path: ["items"],
  });

export const saleCreateSchema = z
  .object({
    items: z.array(transactionItemSchema).min(1).max(500),
  })
  .strict()
  .refine(uniqueProductItems, {
    message: "Each product may appear only once per sale.",
    path: ["items"],
  });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type PurchaseCreateInput = z.infer<typeof purchaseCreateSchema>;
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
