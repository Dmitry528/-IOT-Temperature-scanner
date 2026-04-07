import { z } from 'zod';

const environmentVariablesSchema = z.object({
  PORT: z.string().transform(Number),
  HOST: z.string(),
  MQTT_USERNAME: z.string(),
  MQTT_PASSWORD: z.string(),
  MQTT_PORT: z.string().transform(Number),
  MQTT_HOST: z.string(),
  DATABASE_URL: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
});

export default environmentVariablesSchema;