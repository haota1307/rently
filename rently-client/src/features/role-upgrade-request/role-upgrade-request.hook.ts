import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleUpgradeRequestApiRequest } from "./role-upgrade-request.api";
import {
  CreateRoleUpgradeRequestBodyType,
  GetRoleUpgradeRequestsQueryType,
  UpdateRoleUpgradeRequestBodyType,
} from "@/schemas/role-upgrade-request.schema";
import http from "@/lib/http";

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

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateRoleUpgradeRequestBodyType;
    }) => roleUpgradeRequestApiRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-upgrade-requests"] });
    },
  });
};

// Hook mới để kiểm tra trạng thái yêu cầu nâng cấp tài khoản của người dùng hiện tại
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
