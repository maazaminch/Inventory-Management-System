import bcrypt from "bcryptjs";
import { errors, jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import type { UserRole } from "../generated/prisma/enums";
import { getAuthSecret } from "./env";

export const SESSION_COOKIE_NAME = "inventory_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

const passwordSaltRounds = 12;

export type { UserRole } from "../generated/prisma/enums";

export type AuthSession = {
  id: number;
  role: UserRole;
  sessionVersion: number;
};

function isUserRole(role: unknown): role is UserRole {
  return role === "ADMIN" || role === "STAFF";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, passwordSaltRounds);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(
  session: AuthSession,
): Promise<string> {
  return new SignJWT({
    role: session.role,
    sessionVersion: session.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<AuthSession | null> {
  let payload;

  try {
    ({ payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return null;
    }

    throw error;
  }

  const id = Number(payload.sub);
  const sessionVersion = payload.sessionVersion;

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !isUserRole(payload.role) ||
    typeof sessionVersion !== "number" ||
    !Number.isSafeInteger(sessionVersion) ||
    sessionVersion < 0
  ) {
    return null;
  }

  return { id, role: payload.role, sessionVersion };
}

export function getSessionTokenFromRequest(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookiePrefix = `${SESSION_COOKIE_NAME}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookiePrefix));

  return sessionCookie ? sessionCookie.slice(cookiePrefix.length) : null;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function getSessionFromRequest(
  request: Request,
): Promise<AuthSession | null> {
  const token = getSessionTokenFromRequest(request);

  return token ? verifySessionToken(token) : null;
}
