import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export async function getDashboard() {
  const [
    productCount,
    lowStockCount,
    categoryCount,
    supplierCount,
    staffCount,
    salesSummary,
    purchaseSummary,
    lowStockProducts,
    recentSales,
    recentPurchases,
    inventoryValueRows,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: { quantity: { lte: prisma.product.fields.minimumStock } },
    }),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true }),
    prisma.purchase.aggregate({ _sum: { totalAmount: true }, _count: true }),
    prisma.product.findMany({
      where: { quantity: { lte: prisma.product.fields.minimumStock } },
      select: {
        id: true,
        name: true,
        SKU: true,
        quantity: true,
        minimumStock: true,
        unit: true,
      },
      orderBy: { quantity: "asc" },
      take: 10,
    }),
    prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, SKU: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { id: true, name: true, SKU: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ inventoryValue: string }>>`
      SELECT COALESCE(SUM("quantity" * "purchasePrice"), 0)::text AS "inventoryValue"
      FROM "Product"
    `,
  ]);

  const inventoryValue = new Prisma.Decimal(
    inventoryValueRows[0]?.inventoryValue ?? "0",
  );

  return {
    summary: {
      products: productCount,
      lowStockProducts: lowStockCount,
      categories: categoryCount,
      suppliers: supplierCount,
      staff: staffCount,
      salesCount: salesSummary._count,
      salesTotal: salesSummary._sum.totalAmount?.toString() ?? "0.00",
      purchasesCount: purchaseSummary._count,
      purchasesTotal: purchaseSummary._sum.totalAmount?.toString() ?? "0.00",
      inventoryValue: inventoryValue.toFixed(2),
    },
    lowStockProducts,
    recentSales,
    recentPurchases,
  };
}
