import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi | Rently",
  description: "Tìm hiểu về Rently - Nền tảng tìm nhà trọ hàng đầu Việt Nam",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">Về Rently</h1>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Tầm nhìn của chúng tôi
          </h2>
          <p className="text-gray-700">
            Rently ra đời với sứ mệnh kết nối chủ nhà và người thuê nhà một cách
            hiệu quả và minh bạch. Chúng tôi tin rằng mọi người đều xứng đáng có
            được một ngôi nhà phù hợp với nhu cầu và khả năng tài chính của
            mình.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Giá trị cốt lõi</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Minh bạch:</span> Chúng tôi cam kết
              cung cấp thông tin chính xác về các căn hộ, giá cả và điều kiện
              thuê nhà.
            </li>
            <li>
              <span className="font-medium">Đơn giản:</span> Quy trình tìm kiếm
              và đặt lịch xem nhà được thiết kế đơn giản, dễ sử dụng.
            </li>
            <li>
              <span className="font-medium">Kết nối:</span> Chúng tôi tạo ra một
              nền tảng kết nối trực tiếp giữa chủ nhà và người thuê.
            </li>
            <li>
              <span className="font-medium">Sáng tạo:</span> Liên tục cải tiến
              để mang lại trải nghiệm tốt nhất cho người dùng.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Đội ngũ của chúng tôi</h2>
          <p className="text-gray-700">
            Đội ngũ Rently bao gồm những chuyên gia trong lĩnh vực công nghệ và
            bất động sản, với niềm đam mê chung là tạo ra một nền tảng đơn giản
            và hiệu quả cho việc tìm kiếm nhà trọ. Chúng tôi luôn lắng nghe phản
            hồi từ người dùng để không ngừng cải thiện dịch vụ.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Lịch sử phát triển</h2>
          <p className="text-gray-700">
            Rently được thành lập vào năm 2023, bắt đầu từ nhận thức về những
            khó khăn mà sinh viên và người lao động phải đối mặt khi tìm kiếm
            nhà trọ. Từ đó, chúng tôi đã phát triển một nền tảng nhằm giải quyết
            những vấn đề này và mang lại trải nghiệm tìm nhà dễ dàng và thuận
            tiện hơn.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Thông tin liên hệ</h2>
          <p className="text-gray-700">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua
            email:
            <a
              href="mailto:info@rently.vn"
              className="text-primary hover:underline"
            >
              {" "}
              info@rently.vn
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
