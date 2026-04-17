import fp from "fastify-plugin";
import { type FastifyPluginAsync } from "fastify";
import { createPrismaClient } from "@app/shared/prisma/prisma.client";
import { PrismaClient } from "@app/generated/prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync<{ connectionString: string }> = async (app, opts) => {
  const prisma = createPrismaClient(opts.connectionString);

  try {
    await prisma.$connect();
    // Test query to ensure we have connection
    await prisma.$queryRaw`SELECT 1`;
    app.log.info("Prisma: Connected");
  } catch (error) {
    app.log.error({ error }, "Prisma: Was not able to connect");
    throw new Error("Prisma: Was not able to connect", { cause: error });
  }

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (app) => {
    await app.prisma.$disconnect();
    app.log.info("Prisma: Client was closed");
  });
};

export default fp(prismaPlugin, { name: 'prisma' });