import "dotenv/config";

import fastify from "fastify";
import type { FastifyInstance } from "fastify";

import * as z from "zod";

const app: FastifyInstance = fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    // Setup env vars
    const { HOST, PORT } = z.object({
      PORT: z.string().transform(Number),
      HOST: z.string(),
    }).parse(process.env);

    // Start server
    await app.listen({ port: PORT, host: HOST });
  } catch(error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();