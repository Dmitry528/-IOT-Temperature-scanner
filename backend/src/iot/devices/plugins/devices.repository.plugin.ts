import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DevicesRepository } from "@app/iot/devices/repositories/devices.repository";


declare module 'fastify' {
  interface FastifyInstance {
    devicesRepository: DevicesRepository;
  }
}

const devicesRepositoryPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('devicesRepository', new DevicesRepository(app.prisma));
};

export default fp(devicesRepositoryPlugin, {
  name: 'devicesRepository',
  dependencies: ['prisma']
});