import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "@/features/profile/components/profile-tab";
import SecurityTab from "@/features/profile/components/security-tab";
import { UseFormReturn } from "react-hook-form";
import { UpdateMeBodyType } from "@/schemas/profile.model";
import { RentalHistoryTab } from "@/features/profile/components/rental-history-tab";
import { ViewingScheduleTab } from "@/features/profile/components/viewing-schedule-tab";
import { Dispatch, SetStateAction } from "react";
import { WalletTab } from "@/features/profile/components/wallet-tab";

interface AccountTabsProps {
  form: UseFormReturn<UpdateMeBodyType>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  landlordStatus: "ACTIVE" | "PENDING" | "REJECTED" | "none";
  setLandlordStatus: (
    status: "ACTIVE" | "PENDING" | "REJECTED" | "none"
  ) => void;
}

export function AccountTabs({
  form,
  isLoading,
  setIsLoading,
  landlordStatus,
  setLandlordStatus,
}: AccountTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 md:grid-cols-3 lg:grid-cols-5 mb-4 sm:mb-6 overflow-x-auto">
        <TabsTrigger
          value="profile"
          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          Thông tin cá nhân
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          Bảo mật
        </TabsTrigger>
        <TabsTrigger
          value="wallet"
          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          Tài chính
        </TabsTrigger>
        <TabsTrigger
          value="rentals"
          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          Phòng đã thuê
        </TabsTrigger>
        <TabsTrigger
          value="schedule"
          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          Lịch xem phòng
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab
          form={form}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          landlordStatus={landlordStatus}
          setLandlordStatus={setLandlordStatus}
        />
      </TabsContent>

      <TabsContent value="wallet">
        <WalletTab />
      </TabsContent>

      <TabsContent value="rentals">
        <RentalHistoryTab />
      </TabsContent>

      <TabsContent value="schedule">
        <ViewingScheduleTab />
      </TabsContent>
    </Tabs>
  );
}
