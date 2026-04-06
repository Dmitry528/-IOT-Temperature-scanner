import { FastifyBaseLogger } from "fastify";
import { deviceMessageSchema } from "@app/iot/devices/schemas/devices.payload.schema";
import { DevicesService } from "@app/iot/devices/services/devices.service";

export class DevicesMessageHandler {
  constructor(
    private logger: FastifyBaseLogger,
    private devicesService: DevicesService
  ) {}

  async handleDevicesMessage(payload: Buffer<ArrayBufferLike>) {
    try {
      const parsedPayload = JSON.parse(payload.toString());
      const { success, data, error } = deviceMessageSchema.safeParse(parsedPayload);

      if (!success) {
        this.logger.error({ errors: error.issues }, 'Something is wrong with Devices payload structure, failed to parse to Device payload');
        return;
      }

      await this.devicesService.handleTemperatureDevicePayload(data);

    } catch (error) {
      this.logger.error({ error }, 'Something is wrong with Devices payload shape, failed to parse to JSON');
    }
  };
}