import { FastifyBaseLogger } from "fastify";
import { DeviceMessagePayloadType } from "@app/modules/devices/schemas/device.payload.schema";
import { DeviceRepository } from "@app/modules/devices/repositories/device.repository";

export class DeviceService {
  constructor(
    private logger: FastifyBaseLogger,
    private deviceRepository: DeviceRepository
  ) {}

  async handleTemperatureDevicePayload(payload: DeviceMessagePayloadType) {
    try {
      await this.deviceRepository.createTemperatureEntry(payload);
      this.logger.info(`${DeviceService.name}: Data from temperature device: ${payload.deviceId} was saved, sentAt: ${payload.data.sentAt}`);
    } catch (error) {
      this.logger.error(
        { error },
        `${DeviceService.name}: Was not able to save temperature data from device: ${payload.deviceId}, sentAt: ${payload.data.sentAt}`
      );
    }
  }
};
