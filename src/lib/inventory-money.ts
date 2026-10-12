import { Prisma } from "../generated/prisma/client";
import { ApiError } from "./utils";

export function weightedAverageCost(
  currentCost: Prisma.Decimal,
  currentQuantity: number,
  incomingCost: Prisma.Decimal,
  incomingQuantity: number,
): Prisma.Decimal {
  if (currentQuantity === 0) {
    return incomingCost;
  }

  return currentCost
    .mul(currentQuantity)
    .plus(incomingCost.mul(incomingQuantity))
    .div(currentQuantity + incomingQuantity)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function calculateTransactionTotal(
  items: Array<{ quantity: number; price: Prisma.Decimal }>,
  maximumAmount: Prisma.Decimal,
): Prisma.Decimal {
  const total = items.reduce(
    (sum, item) => sum.plus(item.price.mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  if (total.greaterThan(maximumAmount)) {
    throw new ApiError("Transaction total exceeds the supported amount.", 400);
  }

  return total;
}
