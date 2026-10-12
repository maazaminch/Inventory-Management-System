import assert from "node:assert/strict";
import test from "node:test";
import { parseIdParams, parseQuery, saleQuerySchema } from "./query";

test("path IDs must be positive safe integers", () => {
  assert.equal(parseIdParams({ id: "42" }), 42);
  assert.throws(() => parseIdParams({ id: "0" }));
  assert.throws(() => parseIdParams({ id: "1.5" }));
  assert.throws(() => parseIdParams({ id: "9007199254740992" }));
});

test("purchase and sale filters validate pagination and date order", () => {
  assert.deepEqual(
    saleQuerySchema.parse({
      page: "2",
      limit: "25",
      productId: "4",
      from: "2026-01-01",
      to: "2026-01-31",
    }),
    {
      page: 2,
      limit: 25,
      productId: 4,
      from: "2026-01-01",
      to: "2026-01-31",
    },
  );
  assert.equal(
    saleQuerySchema.safeParse({
      from: "2026-02-01",
      to: "2026-01-01",
    }).success,
    false,
  );
});

test("duplicate and unknown query parameters are rejected", () => {
  assert.throws(
    () =>
      parseQuery(
        new Request("http://localhost/api/sales?page=1&page=2"),
        saleQuerySchema,
      ),
  );
  assert.throws(
    () =>
      parseQuery(
        new Request("http://localhost/api/sales?unexpected=value"),
        saleQuerySchema,
      ),
  );
});
