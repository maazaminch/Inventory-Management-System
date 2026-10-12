import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "../generated/prisma/client";
import {
  calculateTransactionTotal,
  weightedAverageCost,
} from "./inventory-money";
import { ApiError } from "./utils";

test("weighted average cost uses current and incoming inventory value", () => {
  const cost = weightedAverageCost(
    new Prisma.Decimal("2.00"),
    10,
    new Prisma.Decimal("3.00"),
    10,
  );

  assert.equal(cost.toFixed(2), "2.50");
});

test("weighted average cost uses incoming cost when no stock exists", () => {
  const cost = weightedAverageCost(
    new Prisma.Decimal("2.00"),
    0,
    new Prisma.Decimal("3.25"),
    4,
  );

  assert.equal(cost.toFixed(2), "3.25");
});

test("transaction totals use decimal arithmetic", () => {
  const total = calculateTransactionTotal(
    [
      { quantity: 3, price: new Prisma.Decimal("0.10") },
      { quantity: 2, price: new Prisma.Decimal("0.25") },
    ],
    new Prisma.Decimal("99999999.99"),
  );

  assert.equal(total.toFixed(2), "0.80");
});

test("transaction total enforces the database amount limit", () => {
  assert.throws(
    () =>
      calculateTransactionTotal(
        [{ quantity: 2, price: new Prisma.Decimal("99999999.99") }],
        new Prisma.Decimal("99999999.99"),
      ),
    ApiError,
  );
});
