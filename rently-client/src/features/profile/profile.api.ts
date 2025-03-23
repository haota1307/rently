import http from "@/lib/http";
import {
  GetUserProfileResType,
  UpdateProfileResType,
} from "@/schemas/user.schema";
import { UpdateMeBodyType } from "@/schemas/profile.model";

const prefix = "/profile";

const accountApiRequest = {
  getMe: () => http.get<GetUserProfileResType>(`${prefix}`),

  updateMe: (body: UpdateMeBodyType) =>
    http.put<UpdateProfileResType>(`${prefix}`, body),
};

export default accountApiRequest;
