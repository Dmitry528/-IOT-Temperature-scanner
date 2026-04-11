import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DeviceMessageHandler } from "@app/modules/devices/handlers/device.message.handler";

declare module 'fastify' {
  interface FastifyInstance {
    deviceMessageHandler: DeviceMessageHandler;
  }
}

const deviceMessageHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('deviceMessageHandler', new DeviceMessageHandler(app.log, app.deviceService));
};

export default fp(deviceMessageHandlerPlugin, {
  name: 'deviceMessageHandlerPlugin',
  dependencies: ["deviceServicePlugin"],
});
