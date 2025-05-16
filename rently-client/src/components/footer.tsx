"use client";
import {
  Clock,
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPinned,
  Phone,
  Youtube,
  Home,
  BarChart2,
  Building,
  FileText,
  Bookmark,
  User,
  Settings,
  MessageCircle,
  CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FooterContactForm } from "@/features/contact/components/contact-form";

// Import động cho bản đồ để tránh lỗi SSR
const RentalsMap = dynamic(() => import("@/features/map/rentals-map"), {
  ssr: false,
});

const contactInfo = [
  { icon: MapPinned, title: "Địa chỉ", content: "Cần Thơ, Việt Nam" },
  { icon: Phone, title: "Liên hệ", content: "+84 947 055 644" },
  {
    icon: Clock,
    title: "Giờ làm việc",
    content: "Thứ 2 - Thứ 7: 8:00 AM - 17:30 PM",
  },
  { icon: Mail, title: "Email", content: "trananhhao1307@gmail.com" },
];

// Dữ liệu liên kết Footer - Đồng bộ với header
const footerLinks = [
  {
    title: "Chung",
    links: [
      { name: "Trang chủ", href: "/", icon: Home },
      { name: "Nhà trọ", href: "/nha-tro", icon: Building },
      { name: "Bài đăng", href: "/bai-dang", icon: FileText },
      { name: "So sánh phòng trọ", href: "/so-sanh", icon: BarChart2 },
    ],
  },
  {
    title: "Cá nhân",
    links: [
      { name: "Tin nhắn", href: "/tin-nhan", icon: MessageCircle },
      { name: "Yêu thích", href: "/tin-da-luu", icon: Bookmark },
      { name: "Lịch xem phòng", href: "/lich-xem-phong", icon: CalendarIcon },
      { name: "Phòng đã thuê", href: "/phong-da-thue", icon: Building },
    ],
  },
  {
    title: "Công ty",
    links: [
      { name: "Về chúng tôi", href: "/ve-chung-toi" },
      { name: "Liên hệ", href: "/lien-he" },
      { name: "Điều khoản và điều kiện", href: "/dieu-khoan-va-dieu-kien" },
      { name: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { name: "Câu hỏi thường gặp", href: "/cau-hoi-thuong-gap" },
    ],
  },
];

// Dữ liệu mạng xã hội
const socialLinks = [
  { icon: Youtube, href: "/" },
  { icon: Facebook, href: "/" },
  { icon: Instagram, href: "/" },
  { icon: Github, href: "/" },
];

// Component hiển thị từng nhóm liên kết
const FooterLinkSection = ({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string; icon?: React.ComponentType<any> }[];
}) => (
  <div>
    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-base">
      {title}
    </h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.name}>
          <Link
            href={link.href}
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm flex items-center gap-2"
          >
            {link.icon && <link.icon className="h-3.5 w-3.5" />}
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t dark:border-gray-800">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Thông tin liên hệ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 border-b dark:border-gray-800 py-4">
          {contactInfo.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-900 p-3 sm:p-4 transition-colors rounded-lg"
            >
              <item.icon className="text-gray-700 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary transition-colors h-5 w-5 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary transition-colors text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-0.5 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bản đồ nhà trọ */}
        {/* <div className="pt-8 pb-4 border-b dark:border-gray-800">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Khám phá nhà trọ trên bản đồ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Tìm kiếm nhà trọ phù hợp tại các vị trí bạn mong muốn
            </p>
          </div>
          <RentalsMap />
        </div> */}

        {/* Nội dung chính của Footer */}
        <div className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột trái: Liên kết và thông tin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Logo & Mạng xã hội */}
            <div className="space-y-4">
              <Link href={"/"}>
                <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-gray-900 dark:text-gray-100">
                  Rently
                </h2>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của chúng tôi.
                Chúng tôi sẽ cố gắng hoàn thiện tốt hơn.
              </p>
              <div className="flex items-center gap-3 text-muted-foreground">
                {socialLinks.map(({ icon: Icon, href }, index) => (
                  <Link
                    key={index}
                    href={href}
                    className="border p-1.5 sm:p-2 rounded-full border-black/40 dark:border-white/40 bg-transparent hover:bg-muted dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                ))}
              </div>
            </div>
            {/* Các liên kết */}
            {footerLinks.map(({ title, links }) => (
              <FooterLinkSection key={title} title={title} links={links} />
            ))}
          </div>

          {/* Cột phải: Form liên hệ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Gửi thông tin liên hệ của bạn, chúng tôi sẽ phản hồi sớm nhất có
              thể.
            </p>
            <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-800">
              <FooterContactForm />
            </div>
          </div>
        </div>

        {/* Footer cuối */}
        <div className="py-4 sm:py-6 border-t dark:border-gray-800 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 Rently. Mọi quyền được bảo lưu.</p>
          <p className="mt-1">
            Website này được tạo với mục đích học tập, không vì mục đích kinh
            doanh.
          </p>
        </div>
      </div>
    </footer>
  );
};
