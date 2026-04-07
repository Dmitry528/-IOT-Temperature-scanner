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
    app.log.info("Prisma was connected to database");
  } catch (error) {
    app.log.info(error, "Prisma was not able to connect to database");
    throw error;
  }

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (app) => {
    //  runs when - await app.close();
    await app.prisma.$disconnect();
    app.log.info("Prisma was disconnected");
  });
};

export default fp(prismaPlugin, { name: 'prisma' });