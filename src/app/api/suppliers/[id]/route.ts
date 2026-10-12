import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, readJsonBody, successResponse } from "../../../../lib/utils";
import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "../../../../services/supplier-service";
import { supplierUpdateSchema } from "../../../../validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const supplier = await getSupplier(parseId(id));

    return successResponse({ supplier });
  });
}

export function PUT(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const input = supplierUpdateSchema.parse(await readJsonBody(request));
    const supplier = await updateSupplier(parseId(id), input);

    return successResponse({ supplier });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    await deleteSupplier(parseId(id));

    return successResponse({ message: "Supplier deleted." });
  });
}
