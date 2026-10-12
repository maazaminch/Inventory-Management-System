import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, readJsonBody, successResponse } from "../../../../lib/utils";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "../../../../services/category-service";
import { categoryUpdateSchema } from "../../../../validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const category = await getCategory(parseId(id));

    return successResponse({ category });
  });
}

export function PUT(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const input = categoryUpdateSchema.parse(await readJsonBody(request));
    const category = await updateCategory(parseId(id), input);

    return successResponse({ category });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    await deleteCategory(parseId(id));

    return successResponse({ message: "Category deleted." });
  });
}
