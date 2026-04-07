import { PrismaClient } from "@app/generated/prisma/client";
import { DeviceMessagePayloadType } from "@app/iot/devices/schemas/devices.payload.schema";

export class DevicesRepository {
  constructor(
    private prisma: PrismaClient,
  ) {}

  async createTemperatureSensorRecord({ data, deviceId }: DeviceMessagePayloadType): Promise<void> {
    await this.prisma.temperatureSensorData.create({
      data: {
        deviceId,
        ...data,
      },
    });
  };
}