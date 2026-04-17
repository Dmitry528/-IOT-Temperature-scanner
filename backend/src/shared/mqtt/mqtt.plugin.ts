import fp from "fastify-plugin";
import type { FastifyPluginAsync } from 'fastify';
import { MqttClient, connectAsync } from "mqtt";

import { IMqttClientOptions } from "@app/shared/mqtt/mqtt.types";
import { topicList, Topics } from "./mqtt.constants";

declare module 'fastify' {
  interface FastifyInstance {
    mqttClient: MqttClient;
  }
}

const mqttPlugin: FastifyPluginAsync<IMqttClientOptions> = async (app, opts) => {
  try {
    const client: MqttClient = await connectAsync({
      protocol: 'mqtt',
      clientId: `backend-${process.pid}`,
      clean: true,
      reconnectPeriod: 3_000,
      ...opts,
    });

    if (!client.connected) {
      throw new Error("MQTT client was created but was not able to connect");
    }

    app.log.info("MQTT: Successfully connected");
  
    app.decorate('mqttClient', client);

    await client.subscribeAsync(topicList);
    app.log.info("MQTT: Subscribed to given topics");

    app.addHook("onClose", async () => {
      await client.endAsync();
      app.log.info("MQTT: client was closed");
    });
  }
  catch (error) {
    app.log.error(error, "MQTT: Failed to establish connection");
    throw new Error("MQTT: Failed to establish connection", { cause: error });
  }
};

export default fp(mqttPlugin, {
  name: 'mqttPlugin',
});