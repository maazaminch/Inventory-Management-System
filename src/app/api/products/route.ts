import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import {
  createProduct,
  listProducts,
} from "../../../services/product-service";
import { productCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const result = await listProducts(request);

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
    const input = productCreateSchema.parse(await readJsonBody(request));
    const product = await createProduct(input);

    return successResponse({ product }, 201);
  });
}
