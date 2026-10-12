import { clearSessionCookie } from "../../../../lib/auth";
import { revokeCurrentSession } from "../../../../lib/authorization";
import { runApiHandler } from "../../../../lib/api-handler";
import { successResponse } from "../../../../lib/utils";

export function POST(request: Request) {
  return runApiHandler(request, "public", async () => {
    await revokeCurrentSession(request);

    return clearSessionCookie(successResponse({ message: "Logged out." }));
  });
}
