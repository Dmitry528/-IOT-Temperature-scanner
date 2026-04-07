import "dotenv/config";

import fastify from "fastify";
import type { FastifyInstance } from "fastify";

import environmentVariablesSchema from "@app/shared/utils/environment-variables.schema";


import prismaPlugin from "@app/shared/prisma/prisma.client.plugin";

import devicesRepositoryPlugin from "@app/iot/devices/plugins/devices.repository.plugin";

import mqttPlugin from "@app/shared/mqtt/mqtt.plugin";
import devicesMessageHandlerPlugin from "@app/iot/devices/plugins/devices.message.handler.plugin";
import devicesServicePlugin from "@app/iot/devices/plugins/devices.service.plugin";

const app: FastifyInstance = fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    // Setup env vars
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

    await app.register(devicesRepositoryPlugin);

    await app.register(devicesServicePlugin);
    await app.register(devicesMessageHandlerPlugin);

    // Creates MQTT client, connects and subscribes to given topics
    await app.register(mqttPlugin, {
      host: MQTT_HOST,
      port: MQTT_PORT,
      password: MQTT_PASSWORD,
      username: MQTT_USERNAME,
    });

    // Start server
    await app.listen({ port: PORT, host: HOST });
  } catch(error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();