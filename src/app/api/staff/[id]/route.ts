import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, readJsonBody, successResponse } from "../../../../lib/utils";
import {
  deleteStaff,
  getStaff,
  updateStaff,
} from "../../../../services/staff-service";
import { staffUpdateSchema } from "../../../../validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "admin", async () => {
    const { id } = await context.params;
    const staff = await getStaff(parseId(id));

    return successResponse({ staff });
  });
}

export function PUT(request: Request, context: RouteContext) {
  return runApiHandler(request, "admin", async () => {
    const { id } = await context.params;
    const input = staffUpdateSchema.parse(await readJsonBody(request));
    const staff = await updateStaff(parseId(id), input);

    return successResponse({ staff });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "admin", async () => {
    const { id } = await context.params;
    await deleteStaff(parseId(id));

    return successResponse({ message: "Staff member deleted." });
  });
}
