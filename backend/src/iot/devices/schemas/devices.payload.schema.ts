import * as z from "zod";

export const deviceMessageSchema = z.object({
  deviceId: z.string(),
  data: z.object({
    temperature: z.string(),
    sentAt: z.iso.datetime(),
  }),
});

export type DeviceMessagePayloadType = z.infer<typeof deviceMessageSchema>;