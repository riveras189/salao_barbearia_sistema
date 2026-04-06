import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida no .env");
}

function createAdapter(urlString: string) {
  const url = new URL(urlString);

  if (url.protocol.startsWith("postgres")) {
    return new PrismaPg({ connectionString: urlString });
  }

  if (url.protocol.startsWith("mysql")) {
    return new PrismaMariaDb(urlString);
  }

  throw new Error("DATABASE_URL precisa usar PostgreSQL ou MySQL.");
}

const adapter = createAdapter(connectionString);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
