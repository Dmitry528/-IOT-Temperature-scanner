import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DeviceRepository } from "@app/modules/devices/repositories/device.repository";


declare module 'fastify' {
  interface FastifyInstance {
    deviceRepository: DeviceRepository;
  }
}

const deviceRepositoryPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('deviceRepository', new DeviceRepository(app.prisma));
};

export default fp(deviceRepositoryPlugin, {
  name: 'deviceRepositoryPlugin',
  dependencies: ['prisma']
});
