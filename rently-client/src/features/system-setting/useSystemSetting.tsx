import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SystemSetting,
  SystemSettingAPI,
  EmailTemplate,
} from "@/features/system-setting/system-setting.api";
import { toast } from "sonner";

export const SYSTEM_SETTINGS_CACHE_TIME = 1000 * 60 * 10; // 10 phút
export const SYSTEM_SETTINGS_STALE_TIME = 1000 * 60 * 5; // 5 phút

export const useGetAllSettings = () => {
  return useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      try {
        return await SystemSettingAPI.getAll();
      } catch (error) {
        console.error("Lỗi khi tải cài đặt hệ thống:", error);
        throw new Error(
          "Không thể tải cài đặt hệ thống. Vui lòng thử lại sau."
        );
      }
    },
    retry: 2,
  });
};

export const useGetSettingByKey = (
  key: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["systemSetting", key],
    queryFn: async () => {
      try {
        return await SystemSettingAPI.getByKey(key);
      } catch (error) {
        console.error(`Lỗi khi tải cài đặt ${key}:`, error);
        throw new Error(`Không thể tải cài đặt ${key}. Vui lòng thử lại sau.`);
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!key,
    retry: 1,
  });
};

export const useGetSettingsByGroup = (
  group: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["systemSettings", "group", group],
    queryFn: async () => {
      try {
        return await SystemSettingAPI.getByGroup(group);
      } catch (error) {
        console.error(`Lỗi khi tải cài đặt nhóm ${group}:`, error);
        throw new Error(
          `Không thể tải cài đặt nhóm ${group}. Vui lòng thử lại sau.`
        );
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!group,
    retry: 1,
  });
};

export const useCreateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      key: string;
      value: string;
      type: string;
      group: string;
      description?: string;
    }) => {
      try {
        return await SystemSettingAPI.create(data);
      } catch (error: any) {
        console.error("Lỗi khi tạo cài đặt:", error);
        const errorMessage =
          error?.response?.data?.message ||
          "Không thể tạo cài đặt. Vui lòng thử lại sau.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      queryClient.invalidateQueries({
        queryKey: ["systemSettings", "group", data.group],
      });
      toast.success(`Đã tạo cài đặt ${data.key} thành công`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      data,
    }: {
      key: string;
      data: {
        value?: string;
        type?: string;
        group?: string;
        description?: string;
      };
    }) => {
      try {
        return await SystemSettingAPI.update(key, data);
      } catch (error: any) {
        console.error(`Lỗi khi cập nhật cài đặt ${key}:`, error);
        const errorMessage =
          error?.response?.data?.message ||
          `Không thể cập nhật cài đặt ${key}. Vui lòng thử lại sau.`;
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data, variables) => {
      // Cập nhật cache cho cài đặt cụ thể
      queryClient.invalidateQueries({
        queryKey: ["systemSetting", variables.key],
      });

      // Cập nhật cache cho danh sách cài đặt
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });

      // Nếu update setting thuộc một nhóm, cũng làm mới query cho nhóm đó
      if (variables.data.group) {
        queryClient.invalidateQueries({
          queryKey: ["systemSettings", "group", variables.data.group],
        });
      }

      // Cập nhật cache cho nhóm cũ nếu có thay đổi nhóm
      const oldSetting = queryClient.getQueryData<SystemSetting>([
        "systemSetting",
        variables.key,
      ]);
      if (
        oldSetting &&
        variables.data.group &&
        oldSetting.group !== variables.data.group
      ) {
        queryClient.invalidateQueries({
          queryKey: ["systemSettings", "group", oldSetting.group],
        });
      }

      toast.success(`Đã cập nhật cài đặt ${data.key} thành công`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      try {
        return await SystemSettingAPI.delete(key);
      } catch (error: any) {
        console.error(`Lỗi khi xóa cài đặt ${key}:`, error);
        const errorMessage =
          error?.response?.data?.message ||
          `Không thể xóa cài đặt ${key}. Vui lòng thử lại sau.`;
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      // Cập nhật cache cho danh sách cài đặt
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });

      // Cập nhật cache cho nhóm cài đặt
      queryClient.invalidateQueries({
        queryKey: ["systemSettings", "group", data.group],
      });

      // Xóa cache cho cài đặt cụ thể
      queryClient.removeQueries({ queryKey: ["systemSetting", data.key] });

      toast.success(`Đã xóa cài đặt ${data.key} thành công`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useGetEmailTemplates = () => {
  return useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      try {
        const result = await SystemSettingAPI.getEmailTemplates();
        if (!result.success) {
          throw new Error(result.error || "Không thể lấy mẫu email từ server");
        }
        return result.templates;
      } catch (error) {
        console.error("Lỗi khi tải mẫu email:", error);
        throw new Error(
          "Không thể tải mẫu email từ server. Vui lòng thử lại sau."
        );
      }
    },
    retry: 1,
  });
};

// Hook tiện ích để lấy một cài đặt theo khóa và chuyển đổi giá trị
export const useSystemSetting = <T = string,>(
  key: string,
  defaultValue?: T
) => {
  const { data, isLoading, error } = useGetSettingByKey(key);

  const getValue = (): T => {
    if (!data) return defaultValue as T;

    try {
      if (data.type === "number") {
        return Number(data.value) as unknown as T;
      } else if (data.type === "boolean") {
        return (data.value === "true") as unknown as T;
      } else if (data.type === "json") {
        return JSON.parse(data.value) as T;
      } else {
        return data.value as unknown as T;
      }
    } catch (e) {
      console.error(`Lỗi khi chuyển đổi giá trị cài đặt ${key}:`, e);
      return defaultValue as T;
    }
  };

  return {
    value: getValue(),
    setting: data,
    isLoading,
    error,
  };
};
