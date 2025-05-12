import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SystemSetting,
  SystemSettingAPI,
  EmailTemplate,
} from "@/features/system-setting/system-setting.api";

export const useGetAllSettings = () => {
  return useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      return await SystemSettingAPI.getAll();
    },
  });
};

export const useGetSettingByKey = (
  key: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["systemSetting", key],
    queryFn: async () => {
      return await SystemSettingAPI.getByKey(key);
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!key,
  });
};

export const useGetSettingsByGroup = (
  group: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["systemSettings", "group", group],
    queryFn: async () => {
      return await SystemSettingAPI.getByGroup(group);
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!group,
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
      return await SystemSettingAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
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
      return await SystemSettingAPI.update(key, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["systemSetting", variables.key],
      });
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });

      // Nếu update setting thuộc một nhóm, cũng làm mới query cho nhóm đó
      if (variables.data.group) {
        queryClient.invalidateQueries({
          queryKey: ["systemSettings", "group", variables.data.group],
        });
      }
    },
  });
};

export const useDeleteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      return await SystemSettingAPI.delete(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    },
  });
};

export const useGetEmailTemplates = () => {
  return useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const result = await SystemSettingAPI.getEmailTemplates();
      if (!result.success) {
        throw new Error(result.error || "Không thể lấy mẫu email từ server");
      }
      return result.templates;
    },
  });
};
