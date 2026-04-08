import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
  var mariadb: any;
}

async function createPrismaClient() {
  if (!global.mariadb) {
    global.mariadb = await import("mariadb");
  }
  
  const url = new URL(process.env.DATABASE_URL || "");
  const pool = global.mariadb.createPool({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || "root",
    password: url.password || "",
    database: url.pathname?.replace("/", "") || "salao",
    connectionLimit: 10,
  });

  const adapter = new PrismaMariaDb(pool);
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

const prisma = await createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };