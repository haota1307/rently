import { UserSchema } from "@/schemas/user.schema";
import { z } from "zod";

export const UpdateMeBodySchema = UserSchema.pick({
  name: true,
  phoneNumber: true,
  avatar: true,
}).strict();

export type UpdateMeBodyType = z.infer<typeof UpdateMeBodySchema>;
