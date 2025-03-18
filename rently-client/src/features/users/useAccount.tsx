import accountApiRequest from "@/features/users/account.api";
import {
  GetUsersQueryType,
  UpdateUserBodyType,
} from "@/features/users/schema/account.schema";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAccountMe = () => {
  return useQuery({
    queryKey: ["account-me"],
    queryFn: accountApiRequest.getMe,
  });
};

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();
  const accessToken = getAccessTokenFromLocalStorage();
  const userId = accessToken ? decodeAccessToken(accessToken).userId : null;

  return useMutation({
    mutationFn: async (body: UpdateUserBodyType) => {
      if (!userId) {
        return;
      }
      return accountApiRequest.updateUser(userId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account-me"],
        exact: true,
      });
    },
  });
};

export const useGetUserQuery = (id: number) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => accountApiRequest.getUser({ id }),
  });
};

export const useGetUsersQuery = (queryParams: GetUsersQueryType) => {
  return useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => accountApiRequest.getUsers(queryParams),
  });
};

export const useUpdateUserMutation = () => {
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserBodyType }) =>
      accountApiRequest.updateUser(id, body),
  });
};

export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.deleteUser,
  });
};
