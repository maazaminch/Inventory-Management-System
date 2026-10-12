import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, successResponse } from "../../../../lib/utils";
import {
  getPurchase,
  preventPurchaseDeletion,
} from "../../../../services/transaction-service";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const purchase = await getPurchase(parseId(id));

    return successResponse({ purchase });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    await preventPurchaseDeletion(parseId(id));

    return successResponse({ message: "Purchase deleted." });
  });
}
