import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, readJsonBody, successResponse } from "../../../../lib/utils";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "../../../../services/product-service";
import { productUpdateSchema } from "../../../../validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const product = await getProduct(parseId(id));

    return successResponse({ product });
  });
}

export function PUT(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const input = productUpdateSchema.parse(await readJsonBody(request));
    const product = await updateProduct(parseId(id), input);

    return successResponse({ product });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    await deleteProduct(parseId(id));

    return successResponse({ message: "Product deleted." });
  });
}
