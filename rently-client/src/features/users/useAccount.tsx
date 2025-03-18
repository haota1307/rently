import accountApiRequest from "@/features/users/account.api";
import { GetUsersQueryType } from "@/features/users/schema/account.schema";
import { useQuery, useMutation } from "@tanstack/react-query";

export const useAccountMe = () => {
  return useQuery({
    queryKey: ["account-me"],
    queryFn: accountApiRequest.getMe,
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
    mutationFn: accountApiRequest.updateUser,
  });
};

export const useDeleteUserMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.deleteUser,
  });
};
