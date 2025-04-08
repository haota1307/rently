import { useAppStore } from "@/components/app-provider";

export const useAuth = () => {
  const { isAuth, role, setRole } = useAppStore();

  return {
    isAuthenticated: isAuth,
    userRole: role,
    logout: () => setRole(undefined),
  };
};
