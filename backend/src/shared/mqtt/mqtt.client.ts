import mqtt, { MqttClient } from "mqtt";
import { IMqttClientOptions } from "@app/shared/mqtt/mqtt.types";

const createMqttClient = ({
  username,
  password,
  host,
  port,
}: IMqttClientOptions): MqttClient => {
  const client = mqtt.connect({
    protocol: 'mqtt',
    clientId: `backend-${process.pid}`,
    clean: true,
    reconnectPeriod: 3_000,
    username,
    password,
    host,
    port,
  });

  return client;
};

export {
  createMqttClient,
};