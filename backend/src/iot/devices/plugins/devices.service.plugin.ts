import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DevicesService } from "@app/iot/devices/services/devices.service";


declare module 'fastify' {
  interface FastifyInstance {
    devicesService: DevicesService;
  }
}

const devicesServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('devicesService', new DevicesService(app.log));
};

export default fp(devicesServicePlugin, {
  name: 'devicesServicePlugin',
});