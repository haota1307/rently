import { useMutation } from "@tanstack/react-query";
import authApiRequest from "@/features/auth/auth.api";

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.login,
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.register,
  });
};

export const useSendOTPCodeMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.sendOTPCode,
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.logout,
  });
};

export const useSetTokenToCookieMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.setTokenToCookie,
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: authApiRequest.changePassword,
  });
};
