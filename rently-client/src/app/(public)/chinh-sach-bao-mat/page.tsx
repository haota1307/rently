import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Rently",
  description: "Chính sách bảo mật và xử lý dữ liệu của Rently",
};

export default function PrivacyPolicyPage() {
  return (
    <div className=" mx-auto py-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Chính sách bảo mật
      </h1>

      <div className="max-w-3xl mx-auto space-y-10">
        <p className="text-gray-600 italic">Cập nhật lần cuối: 16/04/2025</p>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Giới thiệu</h2>
          <p className="text-gray-700">
            Rently ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư
            của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập,
            sử dụng, tiết lộ, và bảo vệ thông tin cá nhân của bạn khi bạn sử
            dụng nền tảng trực tuyến của chúng tôi. Bằng cách sử dụng Rently,
            bạn đồng ý với việc thu thập và sử dụng thông tin theo chính sách
            này.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            2. Thông tin chúng tôi thu thập
          </h2>
          <p className="text-gray-700 mb-3">
            Chúng tôi thu thập một số thông tin để cung cấp và cải thiện dịch vụ
            của mình:
          </p>
          <h3 className="text-xl font-medium mb-2">2.1 Thông tin cá nhân</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Thông tin nhận dạng (họ tên, email, số điện thoại)</li>
            <li>Thông tin hồ sơ (ảnh đại diện, thông tin giới thiệu)</li>
            <li>Thông tin liên lạc (địa chỉ, thành phố, quốc gia)</li>
            <li>Thông tin xác thực (mật khẩu, câu hỏi bảo mật)</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.2 Thông tin sử dụng</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Dữ liệu tương tác (tìm kiếm, lượt xem, lưu trữ)</li>
            <li>Dữ liệu thiết bị (loại thiết bị, hệ điều hành, trình duyệt)</li>
            <li>Dữ liệu nhật ký (IP, thời gian truy cập, hoạt động)</li>
            <li>Dữ liệu vị trí (nếu bạn cho phép)</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.3 Với chủ nhà</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Thông tin bất động sản (địa chỉ, hình ảnh, tiện nghi)</li>
            <li>Thông tin giá cả và điều kiện cho thuê</li>
            <li>Thông tin thanh toán (để xử lý giao dịch)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. Cách chúng tôi sử dụng thông tin
          </h2>
          <p className="text-gray-700 mb-3">
            Chúng tôi sử dụng thông tin thu thập được để:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Cung cấp, duy trì và cải thiện dịch vụ của chúng tôi</li>
            <li>Xử lý và hoàn tất các đặt lịch xem nhà và giao dịch</li>
            <li>Tùy chỉnh trải nghiệm người dùng và nội dung bạn thấy</li>
            <li>Gửi thông báo, cập nhật và thông tin liên quan đến dịch vụ</li>
            <li>Phân tích và hiểu cách người dùng tương tác với dịch vụ</li>
            <li>
              Phát hiện, ngăn chặn và giải quyết các vấn đề kỹ thuật và bảo mật
            </li>
            <li>Tuân thủ nghĩa vụ pháp lý và giải quyết tranh chấp</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Chia sẻ thông tin</h2>
          <p className="text-gray-700 mb-3">
            Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba. Tuy
            nhiên, chúng tôi có thể chia sẻ thông tin trong những trường hợp
            sau:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Với người dùng khác:</span> Khi bạn
              là chủ nhà, thông tin căn hộ và thông tin liên hệ sẽ được hiển thị
              cho người thuê tiềm năng.
            </li>
            <li>
              <span className="font-medium">Với nhà cung cấp dịch vụ:</span>{" "}
              Chúng tôi hợp tác với các nhà cung cấp dịch vụ thứ ba để hỗ trợ
              cung cấp dịch vụ (như xử lý thanh toán, lưu trữ đám mây).
            </li>
            <li>
              <span className="font-medium">Vì lý do pháp lý:</span> Khi cần
              thiết để tuân thủ luật pháp, quy định, quy trình pháp lý hoặc yêu
              cầu của chính phủ.
            </li>
            <li>
              <span className="font-medium">
                Trong trường hợp chuyển giao kinh doanh:
              </span>{" "}
              Trong trường hợp sáp nhập, mua lại hoặc bán tài sản, thông tin
              người dùng có thể được chuyển giao.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Bảo mật dữ liệu</h2>
          <p className="text-gray-700">
            Chúng tôi thực hiện các biện pháp bảo mật hợp lý để bảo vệ thông tin
            cá nhân của bạn khỏi mất mát, sử dụng sai mục đích, truy cập trái
            phép, tiết lộ, thay đổi và phá hủy. Tuy nhiên, không có phương pháp
            truyền dẫn qua internet hoặc phương pháp lưu trữ điện tử nào là 100%
            an toàn. Do đó, chúng tôi không thể đảm bảo an ninh tuyệt đối.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            6. Cookie và công nghệ theo dõi
          </h2>
          <p className="text-gray-700 mb-3">
            Chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự để thu
            thập và lưu trữ thông tin khi bạn sử dụng dịch vụ của chúng tôi.
            Cookies giúp chúng tôi nhận diện bạn khi bạn đăng nhập, ghi nhớ tùy
            chọn của bạn, và cung cấp trải nghiệm cá nhân hóa.
          </p>
          <p className="text-gray-700">
            Bạn có thể hướng dẫn trình duyệt từ chối tất cả cookie hoặc thông
            báo khi cookie được gửi. Tuy nhiên, nếu bạn không chấp nhận cookie,
            một số tính năng của trang web có thể không hoạt động đúng.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            7. Quyền riêng tư của bạn
          </h2>
          <p className="text-gray-700 mb-3">
            Tùy thuộc vào khu vực của bạn, bạn có thể có các quyền sau liên quan
            đến thông tin cá nhân:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Quyền truy cập và nhận bản sao thông tin cá nhân của bạn</li>
            <li>Quyền yêu cầu sửa đổi thông tin không chính xác</li>
            <li>Quyền yêu cầu xóa thông tin (trong một số trường hợp)</li>
            <li>Quyền phản đối hoặc hạn chế xử lý thông tin</li>
            <li>Quyền rút lại sự đồng ý của bạn</li>
            <li>Quyền khiếu nại với cơ quan bảo vệ dữ liệu</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Để thực hiện quyền của bạn, vui lòng liên hệ với chúng tôi qua thông
            tin ở phần cuối chính sách này.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            8. Thay đổi chính sách
          </h2>
          <p className="text-gray-700">
            Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian.
            Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào bằng cách đăng
            chính sách mới trên trang web và thông báo cho bạn qua email hoặc
            thông báo trên nền tảng của chúng tôi. Bạn nên kiểm tra chính sách
            này định kỳ để cập nhật những thay đổi mới nhất.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Liên hệ</h2>
          <p className="text-gray-700">
            Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng
            liên hệ với chúng tôi qua:
            <a
              href="mailto:privacy@rently.vn"
              className="text-primary hover:underline"
            >
              {" "}
              privacy@rently.vn
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
