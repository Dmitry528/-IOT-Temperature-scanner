import "dotenv/config";

import fastify from "fastify";
import type { FastifyInstance } from "fastify";

import environmentVariablesSchema from "@app/shared/utils/environment-variables.schema";

import prismaPlugin from "@app/shared/prisma/prisma.client.plugin";
import mqttPlugin from "@app/shared/mqtt/mqtt.plugin";
import mqttEventBusPlugin from "@app/shared/mqtt/mqtt.event-bus.plugin";

import deviceRepositoryPlugin from "@app/modules/devices/plugins/device.repository.plugin";

import deviceServicePlugin from "@app/modules/devices/plugins/device.service.plugin";

import deviceMessageHandlerPlugin from "@app/modules/devices/plugins/device.message.handler.plugin";

const app: FastifyInstance = fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    const {
      HOST,
      PORT,
      MQTT_HOST,
      MQTT_PASSWORD,
      MQTT_PORT,
      MQTT_USERNAME,
      DATABASE_URL,
    } = environmentVariablesSchema.parse(process.env);

    // Creates db connection
    await app.register(prismaPlugin, {
      connectionString: DATABASE_URL,
    });

    await app.register(mqttPlugin, {
      host: MQTT_HOST,
      port: MQTT_PORT,
      password: MQTT_PASSWORD,
      username: MQTT_USERNAME,
    });

    await app.register(mqttEventBusPlugin);
    
    await app.register(deviceRepositoryPlugin);

    await app.register(deviceServicePlugin);

    await app.register(deviceMessageHandlerPlugin);

    // Start server
    await app.listen({ port: PORT, host: HOST });
  } catch(error) {
    app.log.error({ error }, "Failed to start server");
    process.exit(1);
  }
};

start();


const onCloseCleanup = async (signal: string) => {
  try {
    app.log.info(`${signal} received, closing app...`);
    // Runs onClose hooks and disconnects prisma and mosquitto
    await app.close();
    app.log.info("App: server is closed");
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => void onCloseCleanup("SIGINT"));
process.on("SIGTERM", () => void onCloseCleanup("SIGTERM"));