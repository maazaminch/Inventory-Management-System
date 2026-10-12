import { runApiHandler } from "../../../lib/api-handler";
import {
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "../../../lib/utils";
import {
  createCategory,
  listCategories,
} from "../../../services/category-service";
import { categoryCreateSchema } from "../../../validations/inventory";

export function GET(request: Request) {
  return runApiHandler(request, "authenticated", async () => {
    const result = await listCategories(request);

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
    const input = categoryCreateSchema.parse(await readJsonBody(request));
    const category = await createCategory(input);

    return successResponse({ category }, 201);
  });
}
