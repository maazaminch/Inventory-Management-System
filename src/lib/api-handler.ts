import type { UserRole } from "../generated/prisma/enums";
import {
  requireAuthenticatedUser,
  requireRole,
  type AuthenticatedUser,
} from "./authorization";
import { handleApiError } from "./utils";

type Authorization = "public" | "authenticated" | "admin";

export function runApiHandler(
  request: Request,
  authorization: "public",
  handler: (user: null) => Promise<Response>,
): Promise<Response>;
export function runApiHandler(
  request: Request,
  authorization: "authenticated" | "admin",
  handler: (user: AuthenticatedUser) => Promise<Response>,
): Promise<Response>;
export async function runApiHandler(
  request: Request,
  authorization: Authorization,
  handler: (user: AuthenticatedUser | null) => Promise<Response>,
): Promise<Response> {
  try {
    let user: AuthenticatedUser | null = null;

    if (authorization === "authenticated") {
      user = await requireAuthenticatedUser(request);
    } else if (authorization === "admin") {
      user = await requireRole(request, ["ADMIN"] satisfies readonly UserRole[]);
    }

    return await handler(user);
  } catch (error) {
    return handleApiError(error);
  }
}
