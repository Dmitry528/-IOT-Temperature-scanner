import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DevicesMessageHandler } from "@app/iot/devices/handlers/devices.message.handler";

declare module 'fastify' {
  interface FastifyInstance {
    devicesMessageHandler: DevicesMessageHandler;
  }
}

const devicesMessageHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('devicesMessageHandler', new DevicesMessageHandler(app.log, app.devicesService));
};

export default fp(devicesMessageHandlerPlugin, {
  name: 'devicesMessageHandlerPlugin',
  dependencies: ["devicesServicePlugin"],
});