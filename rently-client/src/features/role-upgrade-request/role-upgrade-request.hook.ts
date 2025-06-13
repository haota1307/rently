import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  roleUpgradeRequestApiRequest,
  prefix,
} from "./role-upgrade-request.api";
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestsQueryType,
  UpdateRoleUpgradeRequestBodyType,
} from "@/schemas/role-upgrade-request.schema";
import http from "@/lib/http";
import { checkAndRefreshToken } from "@/lib/utils";
import { useAppStore } from "@/components/app-provider";
import { Role } from "@/constants/type";

export const useRoleUpgradeRequests = (
  query: GetRoleUpgradeRequestsQueryType
) => {
  return useQuery({
    queryKey: ["role-upgrade-requests", query],
    queryFn: () => roleUpgradeRequestApiRequest.list(query),
  });
};

interface RoleUpgradeRequestPayload {
  reason: string;
  frontImage: string;
  backImage: string;
  selfieImage?: string;
  faceVerificationData?: {
    similarity: number;
    isVerified: boolean;
    timestamp: string;
    apiResponseCode?: string;
  };
}

export const useCreateRoleUpgradeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoleUpgradeRequestPayload) =>
      roleUpgradeRequestApiRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-upgrade-requests"] });
    },
  });
};

export const useUpdateRoleUpgradeRequest = () => {
  const queryClient = useQueryClient();
  const setRole = useAppStore((state) => state.setRole);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateRoleUpgradeRequestBodyType;
    }) => roleUpgradeRequestApiRequest.update(id, data),
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-upgrade-requests"] });

      // Nếu là phê duyệt, cập nhật token để refresh lại quyền
      if (variables.data.status === "APPROVED") {
        // Kích hoạt refresh token để cập nhật quyền
        await checkAndRefreshToken({
          force: true,
          onSuccess: () => {
            // Cập nhật role trong store
            setRole(Role.Landlord);
          },
        });
      }
    },
  });
};

// Hook để kiểm tra trạng thái yêu cầu nâng cấp tài khoản của người dùng hiện tại
export const useCheckRoleUpgradeStatus = () => {
  return useQuery({
    queryKey: ["role-upgrade-status"],
    queryFn: async () => {
      try {
        // Lấy danh sách yêu cầu nâng cấp của người dùng hiện tại
        const response = await roleUpgradeRequestApiRequest.me();
        return response.payload; // Trả về yêu cầu mới nhất
      } catch (error) {
        // Xử lý trường hợp không có yêu cầu nào
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });
};
