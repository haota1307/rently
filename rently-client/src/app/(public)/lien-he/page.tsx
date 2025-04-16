import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPinned, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Liên hệ | Rently",
  description: "Liên hệ với Rently - Chúng tôi luôn sẵn sàng hỗ trợ bạn",
};

const contactInfo = [
  {
    icon: MapPinned,
    title: "Địa chỉ",
    content: "Cần Thơ, Việt Nam",
    detail: "3/2 Street, Ninh Kieu District, Can Tho City",
  },
  {
    icon: Phone,
    title: "Số điện thoại",
    content: "+84 947 055 644",
    detail: "Thứ 2 - Thứ 7, 8:00 AM - 5:30 PM",
  },
  {
    icon: Mail,
    title: "Email",
    content: "trananhhao1307@gmail.com",
    detail: "Gửi email cho chúng tôi bất cứ lúc nào!",
  },
  {
    icon: Clock,
    title: "Giờ làm việc",
    content: "Thứ 2 - Thứ 7: 8:00 AM - 17:30 PM",
    detail: "Nghỉ Chủ nhật & các ngày lễ",
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Liên hệ với chúng tôi
      </h1>

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Thông tin liên hệ */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Thông tin liên hệ</h2>
              <p className="text-gray-600 mb-6">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với
                chúng tôi qua các kênh dưới đây hoặc gửi tin nhắn trực tiếp qua
                form.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-all"
                >
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <item.icon />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <p className="text-gray-700 font-medium">{item.content}</p>
                    <p className="text-gray-500 text-sm">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form liên hệ */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Họ và tên
                  </label>
                  <Input id="name" placeholder="Nhập họ tên của bạn" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium">
                  Chủ đề
                </label>
                <Input id="subject" placeholder="Tiêu đề tin nhắn" />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium">
                  Tin nhắn
                </label>
                <Textarea
                  id="message"
                  placeholder="Nhập nội dung tin nhắn của bạn..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full">
                Gửi tin nhắn
              </Button>
            </form>
          </div>
        </div>

        {/* Bản đồ */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Vị trí của chúng tôi</h2>
          <div className="w-full h-[400px] bg-gray-200 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15715.367526252408!2d105.77299344069378!3d10.031076865793616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0629f6de3edb7%3A0x527f09dbfb20b659!2zQ8OibiBUaMahLCBOaW5oIEtp4buBdSwgQ-G6p24gVGjGoSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1681810345279!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
