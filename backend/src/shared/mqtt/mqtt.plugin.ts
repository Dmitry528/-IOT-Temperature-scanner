import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';
import { ErrorWithReasonCode, MqttClient } from "mqtt";

import { IMqttClientOptions } from "@app/shared/mqtt/mqtt.types";
import { createMqttClient } from "@app/shared/mqtt/mqtt.client";
import { topicList, Topics } from "./mqtt.constants";

declare module 'fastify' {
  interface FastifyInstance {
    mqttClient: MqttClient;
  }
}

const mqttPlugin: FastifyPluginAsync<IMqttClientOptions> = async (app, opts) => {
  const client: MqttClient = createMqttClient(opts);

  app.decorate('mqttClient', client);

  client.on("connect", async () => {
    app.log.info("MQTT: Successfully connected");

    try {
      await client.subscribeAsync(topicList);

      app.log.info("MQTT: subscriptions are ready");
    } catch (error) {
      app.log.error({ error }, "MQTT: Failed to subscribe to topics");
    }
  });

  client.on("message", async (topic: string, payload: Buffer<ArrayBufferLike>) => {
    try {
      if (topic === Topics.Devices) {
        await app.deviceMessageHandler.handleDeviceMessage(payload);
      }
    } catch (error) {
      app.log.error({ error, topic }, "MQTT: Unhandled message processing error");
    }
  });

  client.on("reconnect", () => {
    app.log.info("MQTT: Reconnecting");
  });

  client.on("error", (error: Error | ErrorWithReasonCode) => {
    app.log.error({ error }, "MQTT: Error");
    throw error;
  });

  app.addHook('onClose', async () => {
    await client.endAsync()
    app.log.info('MQTT: client disconnected due to app shutdown');
  });
};

export default fp(mqttPlugin, {
  name: 'mqtt-plugin',
  dependencies: ['deviceMessageHandlerPlugin'],
});