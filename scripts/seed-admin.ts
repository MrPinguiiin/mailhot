import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../packages/db/prisma/generated/client.js";
import { randomBytes, scrypt } from "node:crypto";

const dbUrl = new URL("../packages/db/dev.db", import.meta.url);
const dbPath = dbUrl.pathname;

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    const config = { N: 16384, r: 16, p: 1, dkLen: 64 };
    scrypt(
      password.normalize("NFKC"),
      salt,
      config.dkLen,
      {
        N: config.N,
        r: config.r,
        p: config.p,
        maxmem: 128 * config.N * config.r * 2,
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(`${salt}:${(key as Buffer).toString("hex")}`);
      },
    );
  });
}

const adapter = new PrismaLibSql({
  url: `file://${dbPath}`,
  authToken: process.env.DATABASE_AUTH_TOKEN || "",
});

const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@mailhog.dev";
const ADMIN_PASSWORD = "admin123456";
const ADMIN_NAME = "Admin";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: ADMIN_EMAIL,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log(`Admin user created:
  Email: ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}
  Name: ${ADMIN_NAME}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
