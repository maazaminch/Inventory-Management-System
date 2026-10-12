import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "./lib/auth";
import { errorResponse } from "./lib/utils";

const publicAuthPaths = new Set([
  "/api/auth/login",
  "/api/auth/logout",
]);

export async function proxy(request: NextRequest) {
  if (publicAuthPaths.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    return errorResponse("Authentication required.", 401);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
