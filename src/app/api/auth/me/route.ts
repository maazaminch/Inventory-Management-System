import { runApiHandler } from "../../../../lib/api-handler";
import { successResponse } from "../../../../lib/utils";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async (user) =>
    successResponse({ user }),
  );
}
