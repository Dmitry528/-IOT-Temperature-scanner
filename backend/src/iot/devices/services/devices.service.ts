import { DeviceMessagePayloadType } from "@app/iot/devices/schemas/devices.payload.schema";
import { FastifyBaseLogger } from "fastify";

export class DevicesService {
  constructor(
    private logger: FastifyBaseLogger,
  ) {}

  async handleTemperatureDevicePayload(payload: DeviceMessagePayloadType) {
    try {
      this.logger.info(payload);
    } catch (error) {

    }
  }
};