import {
  Clock,
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPinned,
  Phone,
  Youtube,
} from "lucide-react";
import Link from "next/link";

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

// Dữ liệu liên kết Footer
const footerLinks = [
  {
    title: "Liên kết",
    links: [
      { name: "Về chúng tôi", href: "/ve-chung-toi" },
      { name: "Liên hệ", href: "/lien-he" },
      { name: "Điều khoản và điều kiện", href: "/dieu-khoan-va-dieu-kien" },
      { name: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { name: "Câu hỏi thường gặp", href: "/cau-hoi-thuong-gap" },
    ],
  },
  {
    title: "Danh mục",
    links: [
      { name: "Nhà trọ", href: "/" },
      { name: "Mini House", href: "/" },
      { name: "Yêu thích", href: "/" },
      { name: "Đánh dấu", href: "/" },
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
  links: { name: string; href: string }[];
}) => (
  <div>
    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      {title}
    </h3>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.name}>
          <Link
            href={link.href}
            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
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
      <div className="mx-auto w-full px-8 sm:px-6 lg:px-8">
        {/* Thông tin liên hệ */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 border-b dark:border-gray-800">
          {contactInfo.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-900 p-4 transition-colors"
            >
              <item.icon className="text-gray-700 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary transition-colors" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Nội dung chính của Footer */}
        <div className="py-12 grid grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Logo & Mạng xã hội */}
          <div className="space-y-4">
            <Link href={"/"}>
              <h2 className="text-2xl font-black tracking-wider uppercase text-gray-900 dark:text-gray-100">
                Rently
              </h2>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Cảm ơn bạn đã tin tưởng và lựa chọn sản phẩm của chúng tôi. Chúng
              tôi sẽ cố gắng hoàn thiện tốt hơn.
            </p>
            <div className="flex items-center gap-3.5 text-muted-foreground">
              {socialLinks.map(({ icon: Icon, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  className="border p-2 rounded-full border-black/40 dark:border-white/40 bg-transparent hover:bg-muted dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <Icon />
                </Link>
              ))}
            </div>
          </div>
          {/* Các liên kết */}
          {footerLinks.map(({ title, links }) => (
            <FooterLinkSection key={title} title={title} links={links} />
          ))}
        </div>

        {/* Footer cuối */}
        <div className="py-6 border-t dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 Rently. Mọi quyền được bảo lưu.</p>
          <p>
            Website này được tạo với mục đích học tập, không vì mục đích kinh
            doanh.
          </p>
        </div>
      </div>
    </footer>
  );
};
