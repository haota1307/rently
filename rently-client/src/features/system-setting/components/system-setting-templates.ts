import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";

export type SettingTemplate = {
  key: string;
  value: string;
  type: string;
  group: string;
  description: string;
  label: string;
};

// Các mẫu cho nhóm giao diện
export const interfaceTemplates: SettingTemplate[] = [
  {
    key: "site_logo",
    value: "https://example.com/logo.png",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.INTERFACE,
    description: "Logo chính của hệ thống",
    label: "Logo trang web",
  },
  {
    key: "site_favicon",
    value: "https://example.com/favicon.ico",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.INTERFACE,
    description: "Favicon của hệ thống",
    label: "Favicon",
  },
  {
    key: "primary_color",
    value: "#3b82f6",
    type: "string",
    group: SYSTEM_SETTING_GROUPS.INTERFACE,
    description: "Màu chính của hệ thống",
    label: "Màu chủ đạo",
  },
  {
    key: "footer_text",
    value: "© 2024 Rently. Đã đăng ký bản quyền.",
    type: "string",
    group: SYSTEM_SETTING_GROUPS.INTERFACE,
    description: "Văn bản hiển thị ở footer",
    label: "Văn bản chân trang",
  },
];

// Các mẫu cho nhóm email
export const emailTemplates: SettingTemplate[] = [
  {
    key: "email_welcome_template",
    value: `<h1>Chào mừng đến với Rently!</h1>
<p>Xin chào {{user_name}},</p>
<p>Chúng tôi rất vui mừng khi bạn đã đăng ký làm thành viên của Rently - Nền tảng kết nối chủ trọ và người thuê.</p>
<p>Với Rently, bạn có thể:</p>
<ul>
  <li>Tìm kiếm phòng trọ phù hợp</li>
  <li>Đặt lịch xem phòng</li>
  <li>Quản lý yêu cầu thuê</li>
</ul>
<p>Hãy bắt đầu với việc hoàn thiện hồ sơ của bạn.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`,
    type: "string",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description: "Mẫu email chào mừng người dùng mới",
    label: "Email chào mừng",
  },
  {
    key: "email_reset_password_template",
    value: `<h1>Đặt lại mật khẩu</h1>
<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác nhận sau: {{code}}</p>
<p>Mã xác nhận có hiệu lực trong vòng 10 phút.</p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`,
    type: "string",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description: "Mẫu email đặt lại mật khẩu",
    label: "Email đặt lại mật khẩu",
  },
  {
    key: "email_otp_template",
    value: "React Email Component",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description: "Mẫu email xác thực OTP (React Email Components)",
    label: "Email xác thực OTP",
  },
  {
    key: "email_viewing_reminder_template",
    value: "React Email Component",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description: "Mẫu email nhắc lịch xem phòng (React Email Components)",
    label: "Email nhắc lịch xem phòng",
  },
  {
    key: "email_new_rental_request_template",
    value: "React Email Component",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description:
      "Mẫu email thông báo yêu cầu thuê mới (React Email Components)",
    label: "Email thông báo yêu cầu thuê",
  },
  {
    key: "email_rental_request_status_update_template",
    value: "React Email Component",
    type: "file",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description:
      "Mẫu email thông báo cập nhật trạng thái yêu cầu thuê (React Email Components)",
    label: "Email cập nhật trạng thái thuê",
  },
  {
    key: "email_viewing_scheduled_template",
    value: `<h1>Lịch xem phòng mới</h1>
<p>Xin chào {{landlord_name}},</p>
<p>Bạn có lịch hẹn xem phòng mới từ {{tenant_name}} cho bài đăng "{{post_title}}".</p>
<p>Chi tiết lịch hẹn:</p>
<ul>
  <li>Ngày xem: {{viewing_date}}</li>
  <li>Giờ xem: {{viewing_time}}</li>
  <li>Ghi chú: {{note}}</li>
</ul>
<p>Vui lòng xác nhận lịch hẹn trong hệ thống.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`,
    type: "string",
    group: SYSTEM_SETTING_GROUPS.EMAIL,
    description: "Mẫu email thông báo lịch xem phòng mới",
    label: "Email thông báo lịch xem phòng",
  },
];

// Các mẫu cho nhóm giá dịch vụ
export const pricingTemplates: SettingTemplate[] = [
  {
    key: "post_price_normal",
    value: "50000",
    type: "number",
    group: SYSTEM_SETTING_GROUPS.PRICING,
    description: "Giá đăng bài thường (VND)",
    label: "Giá đăng bài thường",
  },
  {
    key: "post_price_vip",
    value: "100000",
    type: "number",
    group: SYSTEM_SETTING_GROUPS.PRICING,
    description: "Giá đăng bài VIP (VND)",
    label: "Giá đăng bài VIP",
  },
  {
    key: "post_duration",
    value: "30",
    type: "number",
    group: SYSTEM_SETTING_GROUPS.PRICING,
    description: "Thời gian hiển thị bài đăng (ngày)",
    label: "Thời hạn bài đăng",
  },
  {
    key: "commission_percentage",
    value: "5",
    type: "number",
    group: SYSTEM_SETTING_GROUPS.PRICING,
    description: "Tỷ lệ hoa hồng (%)",
    label: "Tỷ lệ hoa hồng",
  },
];

// Nhóm tất cả các mẫu theo nhóm
export const allTemplates = {
  [SYSTEM_SETTING_GROUPS.INTERFACE]: interfaceTemplates,
  [SYSTEM_SETTING_GROUPS.EMAIL]: emailTemplates,
  [SYSTEM_SETTING_GROUPS.PRICING]: pricingTemplates,
};

// Lấy tất cả các mẫu dưới dạng mảng phẳng
export const getAllTemplates = (): SettingTemplate[] => {
  return [...interfaceTemplates, ...emailTemplates, ...pricingTemplates];
};
