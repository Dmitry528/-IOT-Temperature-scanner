export interface IMqttClientOptions {
  host: string;
  port: number;
  username: string;
  password: string;
};

export type MqttRawMessage = {
  topic: string;
  payload: Buffer<ArrayBufferLike>;
};