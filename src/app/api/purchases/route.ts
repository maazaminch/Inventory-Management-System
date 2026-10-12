import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import {
  createPurchase,
  listPurchases,
} from "../../../services/transaction-service";
import { purchaseCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const result = await listPurchases(request);

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
    const input = purchaseCreateSchema.parse(await readJsonBody(request));
    const purchase = await createPurchase(input);

    return successResponse({ purchase }, 201);
  });
}
