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
    app.log.info("--- Successfully connected to MQTT ---");

    try {
      await client.subscribeAsync(topicList);

      app.log.info("MQTT subscriptions ready");
    } catch (error) {
      app.log.error({ error }, "Failed to subscribe to MQTT topics");
    }
  });

  client.on("message", async (topic: string, payload: Buffer<ArrayBufferLike>) => {
    try {
      if (topic === Topics.Devices) {
        await app.devicesMessageHandler.handleDevicesMessage(payload);
      }
    } catch (error) {
      app.log.error({ error, topic }, "MQTT: Unhandled MQTT message processing error");
    }
  });

  client.on("reconnect", () => {
    app.log.warn("--- MQTT reconnecting ---");
  });

  client.on("error", (error: Error | ErrorWithReasonCode) => {
    app.log.error({ error }, "--- MQTT error ---");
  });
};

export default fp(mqttPlugin, {
  name: 'mqtt-plugin',
  dependencies: ['devicesMessageHandlerPlugin'],
});