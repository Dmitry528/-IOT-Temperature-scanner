import { PrismaClient } from "@app/generated/prisma/client";
import { DeviceMessagePayloadType } from "@app/modules/devices/schemas/device.payload.schema";

export class DeviceRepository {
  constructor(
    private prisma: PrismaClient,
  ) {}

  async createTemperatureEntry({ data, deviceId }: DeviceMessagePayloadType): Promise<void> {
    await this.prisma.temperatureReadings.create({
      data: {
        deviceId,
        ...data,
      },
    });
  };
}