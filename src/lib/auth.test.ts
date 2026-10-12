import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
  setSessionCookie,
  verifyPassword,
  verifySessionToken,
} from "./auth";
import { NextResponse } from "next/server";

const originalAuthSecret = process.env.AUTH_SECRET;
process.env.AUTH_SECRET = "test-only-secret-with-at-least-32-characters";

test("password hashes verify only the matching password", async () => {
  const hash = await hashPassword("correct-password");

  assert.notEqual(hash, "correct-password");
  assert.equal(await verifyPassword("correct-password", hash), true);
  assert.equal(await verifyPassword("incorrect-password", hash), false);
});

test("session tokens carry the user ID, role, and revocation version", async () => {
  const token = await createSessionToken({
    id: 42,
    role: "ADMIN",
    sessionVersion: 3,
  });

  assert.deepEqual(await verifySessionToken(token), {
    id: 42,
    role: "ADMIN",
    sessionVersion: 3,
  });
  assert.equal(await verifySessionToken(`${token}tampered`), null);
});

test("session cookies use secure server-side cookie attributes", () => {
  const response = setSessionCookie(NextResponse.json({}), "token");
  const sessionCookie = response.cookies.get(SESSION_COOKIE_NAME);

  assert.equal(sessionCookie?.httpOnly, true);
  assert.equal(sessionCookie?.sameSite, "lax");
  assert.equal(sessionCookie?.path, "/");

  const clearedResponse = clearSessionCookie(NextResponse.json({}));
  assert.equal(clearedResponse.cookies.get(SESSION_COOKIE_NAME)?.maxAge, 0);
});

test.after(() => {
  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }
});
