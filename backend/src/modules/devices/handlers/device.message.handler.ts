import { FastifyBaseLogger } from "fastify";
import { deviceMessageSchema } from "@app/modules/devices/schemas/device.payload.schema";
import { DeviceService } from "@app/modules/devices/services/device.service";

export class DeviceMessageHandler {
  constructor(
    private logger: FastifyBaseLogger,
    private deviceService: DeviceService
  ) {}

  async handleDeviceMessage(payload: Buffer<ArrayBufferLike>) {
    try {
      const parsedPayload = JSON.parse(payload.toString());

      const { success, data, error } = deviceMessageSchema.safeParse(parsedPayload);

      if (!success) {
        this.logger.error(
          { errors: error.issues },
          `${DeviceMessageHandler.name}: Failed to parse to Device payload`
        );

        return;
      }
      // Note: In the future each device id can be reponsible for the data it sends
      // Example: Temperature-Device-1 - temperature data, in room #1
      await this.deviceService.handleTemperatureDevicePayload(data);

    } catch (error) {
      this.logger.error(
        { error }, 
        `${DeviceMessageHandler.name}: Failed to parse to JSON`
      );
    }
  };
}