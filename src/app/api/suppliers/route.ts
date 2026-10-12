import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import {
  createSupplier,
  listSuppliers,
} from "../../../services/supplier-service";
import { supplierCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const result = await listSuppliers(request);

    return paginatedResponse(
      result.data,
      result.totalItems,
      result.page,
      result.limit,
    );
  });
}

export function POST(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const input = supplierCreateSchema.parse(await readJsonBody(request));
    const supplier = await createSupplier(input);

    return successResponse({ supplier }, 201);
  });
}
