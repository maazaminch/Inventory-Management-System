import { z } from "zod";

const authEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().min(32),
});

export function getAuthSecret(): Uint8Array {
  const result = authEnvironmentSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET,
  });

  if (!result.success) {
    throw new Error(
      "Invalid environment configuration: AUTH_SECRET must be set to at least 32 characters.",
    );
  }

  return new TextEncoder().encode(result.data.AUTH_SECRET);
}
