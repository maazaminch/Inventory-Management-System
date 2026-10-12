import { prisma } from "../lib/prisma";
import { verifyPassword } from "../lib/auth";
import { ApiError } from "../lib/utils";
import type { LoginInput } from "../validations/auth";

export async function authenticateUser(input: LoginInput) {
  if (new TextEncoder().encode(input.password).byteLength > 72) {
    throw new ApiError("Password must not exceed 72 UTF-8 bytes.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      sessionVersion: true,
      createdAt: true,
    },
  });

  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw new ApiError("Invalid email or password.", 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
    createdAt: user.createdAt,
  };
}
