import { PrismaClient } from "@app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const createPrismaClient = (connectionString: string) => {
  const adapter: PrismaPg = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: ["error", "info", "warn", "query"],
  });
};