import type { UserRole } from "../generated/prisma/enums";
import { prisma } from "./prisma";
import { getSessionFromRequest } from "./auth";
import { ApiError } from "./utils";

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new ApiError("Authentication required.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sessionVersion: true,
      createdAt: true,
    },
  });

  if (!user || user.sessionVersion !== session.sessionVersion) {
    throw new ApiError("Authentication required.", 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function revokeUserSessions(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function revokeCurrentSession(request: Request): Promise<void> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { sessionVersion: true },
  });

  if (user && user.sessionVersion === session.sessionVersion) {
    await revokeUserSessions(session.id);
  }
}

export async function requireRole(
  request: Request,
  allowedRoles: readonly UserRole[],
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw new ApiError("You do not have permission to perform this action.", 403);
  }

  return user;
}
