import { hashPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/utils";
import { parseQuery, staffQuerySchema } from "../validations/query";
import type {
  StaffCreateInput,
  StaffUpdateInput,
} from "../validations/inventory";

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

function ensureBcryptPasswordLength(password: string) {
  if (new TextEncoder().encode(password).byteLength > 72) {
    throw new ApiError("Password must not exceed 72 UTF-8 bytes.", 400);
  }
}

export async function listStaff(request: Request) {
  const { page, limit, search } = parseQuery(request, staffQuerySchema);
  const skip = (page - 1) * limit;

  const where = {
    role: "STAFF" as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: staffSelect,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, totalItems, page, limit };
}

export async function getStaff(id: number) {
  const staff = await prisma.user.findFirst({
    where: { id, role: "STAFF" },
    select: staffSelect,
  });

  if (!staff) {
    throw new ApiError("Staff member not found.", 404);
  }

  return staff;
}

export async function createStaff(input: StaffCreateInput) {
  ensureBcryptPasswordLength(input.password);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      password: await hashPassword(input.password),
      role: "STAFF",
    },
    select: staffSelect,
  });
}

export async function updateStaff(id: number, input: StaffUpdateInput) {
  const staff = await getStaff(id);
  if (input.password !== undefined) {
    ensureBcryptPasswordLength(input.password);
  }

  const data = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
    ...(input.password !== undefined
      ? { password: await hashPassword(input.password) }
      : {}),
  };

  return prisma.user.update({
    where: { id: staff.id },
    data: {
      ...data,
      ...(input.password !== undefined
        ? { sessionVersion: { increment: 1 } }
        : {}),
    },
    select: staffSelect,
  });
}

export async function deleteStaff(id: number) {
  const staff = await getStaff(id);
  await prisma.user.delete({ where: { id: staff.id } });
}
