import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import { createSale, listSales } from "../../../services/transaction-service";
import { saleCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const result = await listSales(request);

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
    const input = saleCreateSchema.parse(await readJsonBody(request));
    const sale = await createSale(input);

    return successResponse({ sale }, 201);
  });
}
