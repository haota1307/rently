"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useEffect, useRef } from "react";
import {
  decodeAccessToken,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage,
} from "@/lib/utils";

import { create } from "zustand";
import RefreshToken from "@/components/refresh-token";
import { RoleType } from "@/constants/type";
import { LoginResType } from "@/features/auth/schema/auth.schema";
import { GetMeResType } from "@/features/users/schema/account.schema";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

type AppStoreType = {
  isAuth: boolean;
  role: RoleType | undefined;
  setRole: (role?: RoleType | undefined) => void;
};

export const useAppStore = create<AppStoreType>((set) => ({
  isAuth: false,
  role: undefined as RoleType | undefined,

  setRole: (role?: RoleType | undefined) => {
    set({ role, isAuth: Boolean(role) });
    if (!role) {
      removeTokensFromLocalStorage();
    }
  },
}));

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setRole = useAppStore((state) => state.setRole);
  const count = useRef(0);

  useEffect(() => {
    if (count.current === 0) {
      const accessToken = getAccessTokenFromLocalStorage();
      if (accessToken) {
        const role = decodeAccessToken(accessToken).roleName;
        setRole(role as RoleType);
      }
      count.current++;
    }
  }, [setRole]);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <RefreshToken />
    </QueryClientProvider>
  );
}
