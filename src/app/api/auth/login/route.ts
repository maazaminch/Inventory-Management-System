import {
  createSessionToken,
  setSessionCookie,
} from "../../../../lib/auth";
import { runApiHandler } from "../../../../lib/api-handler";
import { readJsonBody, successResponse } from "../../../../lib/utils";
import { authenticateUser } from "../../../../services/auth-service";
import { loginSchema } from "../../../../validations/auth";

export function POST(request: Request) {
  return runApiHandler(request, "public", async () => {
    const input = loginSchema.parse(await readJsonBody(request));
    const user = await authenticateUser(input);
    const { sessionVersion, ...safeUser } = user;
    const token = await createSessionToken({
      id: user.id,
      role: user.role,
      sessionVersion,
    });

    return setSessionCookie(successResponse({ user: safeUser }), token);
  });
}
