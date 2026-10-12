import { runApiHandler } from "../../../../lib/api-handler";
import { parseId, successResponse } from "../../../../lib/utils";
import {
  getSale,
  preventSaleDeletion,
} from "../../../../services/transaction-service";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    const sale = await getSale(parseId(id));

    return successResponse({ sale });
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return runApiHandler(request, "authenticated", async () => {
    const { id } = await context.params;
    await preventSaleDeletion(parseId(id));

    return successResponse({ message: "Sale deleted." });
  });
}
