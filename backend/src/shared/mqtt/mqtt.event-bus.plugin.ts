import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';

import { MqttRawMessage } from '@app/shared/mqtt/mqtt.types';

declare module 'fastify' {
  interface FastifyInstance {
    subscribeToMqttMessages(handler: (msg: MqttRawMessage) => Promise<void>): void
  }
}

const subscribeToMqttMessagesPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("subscribeToMqttMessages",
    (handler: (msg: MqttRawMessage) => Promise<void>) => {
      app.mqttClient.on("message", async (topic, payload) => {
        await handler({
          topic,
          payload,
        });
      });
    },
  );
};

export default fp(subscribeToMqttMessagesPlugin, {
  name: 'subscribeToMqttMessagesPlugin',
  dependencies: ['mqttPlugin']
});