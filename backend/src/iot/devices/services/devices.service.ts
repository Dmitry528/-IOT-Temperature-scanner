import { DeviceMessagePayloadType } from "@app/iot/devices/schemas/devices.payload.schema";
import { FastifyBaseLogger } from "fastify";
import { DevicesRepository } from "@app/iot/devices/repositories/devices.repository";

export class DevicesService {
  constructor(
    private logger: FastifyBaseLogger,
    private devicesRepository: DevicesRepository
  ) {}

  async handleTemperatureDevicePayload(payload: DeviceMessagePayloadType) {
    try {
      await this.devicesRepository.createTemperatureSensorRecord(payload);
      this.logger.info(`Temperature data was received and saved for ${payload.deviceId}`);
    } catch (error) {
      this.logger.error({ error }, 'Something is wrong while creating new record for temperature device');
    }
  }
};