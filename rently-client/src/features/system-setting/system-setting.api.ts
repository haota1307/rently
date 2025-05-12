import http from "@/lib/http";
import queryString from "query-string";

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
  updatedById: number | null;
}

export interface EmailTemplate {
  name: string;
  fileName: string;
  key: string;
  content: string;
}

export const SystemSettingAPI = {
  getAll: async (): Promise<SystemSetting[]> => {
    const res = await http.get("/system-settings");
    return res.payload as SystemSetting[];
  },

  getByKey: async (key: string): Promise<SystemSetting> => {
    const res = await http.get(`/system-settings/key/${key}`);
    return res.payload as SystemSetting;
  },

  getByGroup: async (group: string): Promise<SystemSetting[]> => {
    const res = await http.get(
      `/system-settings/group?${queryString.stringify({ group })}`
    );
    return res.payload as SystemSetting[];
  },

  getEmailTemplates: async (): Promise<{
    success: boolean;
    templates: EmailTemplate[];
    error?: string;
  }> => {
    const res = await http.get("/system-settings/email-templates");
    return res.payload as {
      success: boolean;
      templates: EmailTemplate[];
      error?: string;
    };
  },

  create: async (data: {
    key: string;
    value: string;
    type: string;
    group: string;
    description?: string;
  }): Promise<SystemSetting> => {
    const res = await http.post("/system-settings", data);
    return res.payload as SystemSetting;
  },

  update: async (
    key: string,
    data: {
      value?: string;
      type?: string;
      group?: string;
      description?: string;
    }
  ): Promise<SystemSetting> => {
    const res = await http.put(`/system-settings/${key}`, data);
    return res.payload as SystemSetting;
  },

  delete: async (key: string): Promise<SystemSetting> => {
    const res = await http.delete(`/system-settings/${key}`);
    return res.payload as SystemSetting;
  },
};
