import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import { createStaff, listStaff } from "../../../services/staff-service";
import { staffCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "admin", async () => {
    const result = await listStaff(request);

    return paginatedResponse(
      result.data,
      result.totalItems,
      result.page,
      result.limit,
    );
  });
}

export function POST(request: Request) {
  return runApiHandler(request, "admin", async () => {
    const input = staffCreateSchema.parse(await readJsonBody(request));
    const staff = await createStaff(input);

    return successResponse({ staff }, 201);
  });
}
