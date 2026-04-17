import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { DeviceMessageHandler } from "@app/modules/devices/handlers/device.message.handler";
import { MqttRawMessage } from "@app/shared/mqtt/mqtt.types";

const deviceMessageHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.subscribeToMqttMessages(async (msg: MqttRawMessage) => {
    const deviceMessageHandler: DeviceMessageHandler = new DeviceMessageHandler(
      app.log,
      app.deviceService,
    );

    await deviceMessageHandler.handle(msg);
  });
};

export default fp(deviceMessageHandlerPlugin, {
  name: 'deviceMessageHandlerPlugin',
  dependencies: ["deviceServicePlugin", "subscribeToMqttMessagesPlugin"],
});
