import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth";
import { seedAdminSchema } from "../src/validations/auth";

const prisma = new PrismaClient();

async function seedAdmin() {
  const result = seedAdminSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!result.success) {
    throw new Error(
      "Set valid ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables before seeding.",
    );
  }

  const { name, email, password } = result.data;
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  });

  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      throw new Error(
        "The configured admin email belongs to a non-admin user; no changes were made.",
      );
    }

    console.info("Admin account already exists; leaving it unchanged.");
    return;
  }

  if (new TextEncoder().encode(password).byteLength > 72) {
    throw new Error("ADMIN_PASSWORD must not exceed 72 UTF-8 bytes.");
  }

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: await hashPassword(password),
      role: "ADMIN",
    },
  });

  console.info("Admin account created.");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error("Failed to seed admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
