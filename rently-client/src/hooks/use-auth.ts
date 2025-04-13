import { useAppStore } from "@/components/app-provider";
import { decodeAccessToken, getAccessTokenFromLocalStorage } from "@/lib/utils";

export const useAuth = () => {
  const { isAuth, role, setRole } = useAppStore();

  // Lấy userId từ token
  const getUserId = (): number | undefined => {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      const decoded = decodeAccessToken(accessToken);
      return decoded.userId;
    }
    return undefined;
  };

  return {
    isAuthenticated: isAuth,
    userRole: role,
    userId: getUserId(),
    logout: () => setRole(undefined),
  };
};
