import { useGetSettingsByGroup } from "../useSystemSetting";

export type UiSettings = {
  siteLogo: string;
  siteFavicon: string;
  heroImage: string;
  primaryColor: string;
  siteName: string;
  siteDescription: string;
  footerCopyright: string;
};

// Giá trị mặc định cho các cài đặt giao diện
const defaultUiSettings: UiSettings = {
  siteLogo: "/logo.jpg",
  siteFavicon: "/favicon.ico",
  heroImage: "/hero_img.jpg?height=600&width=1200",
  primaryColor: "#1890ff",
  siteName: "Rently",
  siteDescription: "Nền tảng kết nối chủ trọ và người thuê",
  footerCopyright: "© 2024 Rently. Đã đăng ký bản quyền.",
};

export function useUiSettings() {
  const { data: interfaceSettings, isLoading } =
    useGetSettingsByGroup("interface");

  // Nếu đang loading, trả về undefined cho tất cả các giá trị
  // Component sử dụng hook có thể kiểm tra isLoading để hiển thị skeleton
  const settings: UiSettings = isLoading
    ? {
        siteLogo: "",
        siteFavicon: "",
        heroImage: "",
        primaryColor: "",
        siteName: "",
        siteDescription: "",
        footerCopyright: "",
      }
    : {
        siteLogo:
          interfaceSettings?.find((setting) => setting.key === "site_logo")
            ?.value || defaultUiSettings.siteLogo,
        siteFavicon:
          interfaceSettings?.find((setting) => setting.key === "site_favicon")
            ?.value || defaultUiSettings.siteFavicon,
        heroImage:
          interfaceSettings?.find((setting) => setting.key === "hero_image")
            ?.value || defaultUiSettings.heroImage,
        primaryColor:
          interfaceSettings?.find((setting) => setting.key === "primary_color")
            ?.value || defaultUiSettings.primaryColor,
        siteName:
          interfaceSettings?.find((setting) => setting.key === "site_name")
            ?.value || defaultUiSettings.siteName,
        siteDescription:
          interfaceSettings?.find(
            (setting) => setting.key === "site_description"
          )?.value || defaultUiSettings.siteDescription,
        footerCopyright:
          interfaceSettings?.find(
            (setting) => setting.key === "footer_copyright"
          )?.value || defaultUiSettings.footerCopyright,
      };

  return {
    settings,
    defaultSettings: defaultUiSettings,
    isLoading,
  };
}
