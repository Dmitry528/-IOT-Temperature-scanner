import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DeviceService } from "@app/modules/devices/services/device.service";


declare module 'fastify' {
  interface FastifyInstance {
    deviceService: DeviceService;
  }
}

const deviceServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('deviceService', new DeviceService(app.log, app.deviceRepository));
};

export default fp(deviceServicePlugin, {
  name: 'deviceServicePlugin',
  dependencies: ['deviceRepositoryPlugin']
});
