import { z } from "zod";

const email = z
  .string()
  .trim()
  .pipe(z.email().max(254))
  .transform((value) => value.toLowerCase());

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(72),
  })
  .strict();

export const seedAdminSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(8).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
