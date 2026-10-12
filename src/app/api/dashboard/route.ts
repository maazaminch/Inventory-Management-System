import { runApiHandler } from "../../../lib/api-handler";
import { successResponse } from "../../../lib/utils";
import { getDashboard } from "../../../services/dashboard-service";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () =>
    successResponse(await getDashboard()),
  );
}
