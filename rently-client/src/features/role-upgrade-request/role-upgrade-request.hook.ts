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
