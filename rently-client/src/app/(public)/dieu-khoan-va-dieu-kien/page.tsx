import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản và điều kiện | Rently",
  description: "Điều khoản và điều kiện sử dụng nền tảng Rently",
};

export default function TermsPage() {
  return (
    <div className=" mx-auto py-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Điều khoản và điều kiện
      </h1>

      <div className="max-w-3xl mx-auto space-y-10">
        <p className="text-gray-600 italic">Cập nhật lần cuối: 16/04/2025</p>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Giới thiệu</h2>
          <p className="text-gray-700 mb-3">
            Chào mừng bạn đến với Rently. Các điều khoản và điều kiện này điều
            chỉnh việc sử dụng trang web Rently và tất cả các dịch vụ liên quan
            do Rently cung cấp.
          </p>
          <p className="text-gray-700">
            Bằng cách truy cập trang web hoặc sử dụng các dịch vụ của chúng tôi,
            bạn đồng ý tuân theo và bị ràng buộc bởi các điều khoản và điều kiện
            này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản
            này, vui lòng không sử dụng trang web hoặc dịch vụ của chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            2. Tài khoản người dùng
          </h2>
          <p className="text-gray-700 mb-3">
            Khi bạn tạo tài khoản với chúng tôi, bạn phải cung cấp thông tin
            chính xác, đầy đủ và cập nhật. Bạn hoàn toàn chịu trách nhiệm về
            việc bảo mật tài khoản của mình, bao gồm mật khẩu, và tất cả các
            hoạt động diễn ra trên tài khoản của bạn.
          </p>
          <p className="text-gray-700">
            Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu phát
            hiện bất kỳ vi phạm nào đối với các điều khoản này hoặc các hoạt
            động đáng ngờ khác.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. Quyền và trách nhiệm
          </h2>
          <h3 className="text-xl font-medium mb-2">3.1 Người dùng</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Cung cấp thông tin chính xác và đầy đủ khi sử dụng dịch vụ.</li>
            <li>
              Không sử dụng dịch vụ cho mục đích bất hợp pháp hoặc trái phép.
            </li>
            <li>
              Không đăng tải nội dung xúc phạm, lừa đảo, hoặc vi phạm quyền của
              người khác.
            </li>
            <li>
              Không cố gắng can thiệp vào hoạt động bình thường của trang web
              hoặc dịch vụ.
            </li>
          </ul>

          <h3 className="text-xl font-medium mb-2">3.2 Chủ nhà</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Cung cấp thông tin chính xác và đầy đủ về bất động sản.</li>
            <li>
              Chịu trách nhiệm về tính chính xác của mọi hình ảnh và mô tả được
              đăng tải.
            </li>
            <li>
              Tuân thủ tất cả các luật và quy định liên quan đến cho thuê bất
              động sản.
            </li>
            <li>
              Không phân biệt đối xử đối với người thuê tiềm năng dựa trên chủng
              tộc, tôn giáo, giới tính, hoặc bất kỳ đặc điểm được bảo vệ nào
              khác.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            4. Nội dung người dùng
          </h2>
          <p className="text-gray-700 mb-3">
            Bằng cách đăng tải nội dung lên trang web của chúng tôi, bạn cấp cho
            Rently quyền không độc quyền, có thể chuyển nhượng, không thu phí
            bản quyền, có thể cấp phép lại để sử dụng, sao chép, sửa đổi, xuất
            bản và hiển thị công khai nội dung đó trên trang web của chúng tôi.
          </p>
          <p className="text-gray-700">
            Chúng tôi có quyền, nhưng không có nghĩa vụ, giám sát và chỉnh sửa
            hoặc xóa bất kỳ nội dung nào mà chúng tôi xác định, theo quyết định
            riêng của mình, là vi phạm các điều khoản này hoặc gây hại cho danh
            tiếng của trang web.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Thanh toán và phí</h2>
          <p className="text-gray-700 mb-3">
            Rently có thể tính phí cho một số dịch vụ. Thông tin về các khoản
            phí của chúng tôi sẽ được hiển thị rõ ràng trước khi bạn hoàn tất
            giao dịch. Bằng cách tiếp tục với giao dịch, bạn đồng ý thanh toán
            tất cả các khoản phí.
          </p>
          <p className="text-gray-700">
            Chúng tôi có thể thay đổi cấu trúc phí bất kỳ lúc nào, và những thay
            đổi như vậy sẽ có hiệu lực ngay sau khi đăng lên trang web hoặc
            thông báo cho bạn.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            6. Giới hạn trách nhiệm
          </h2>
          <p className="text-gray-700 mb-3">
            Rently không đảm bảo tính chính xác, đầy đủ hoặc hữu ích của bất kỳ
            thông tin nào trên trang web hoặc trong dịch vụ của chúng tôi. Trong
            phạm vi tối đa được pháp luật cho phép, Rently sẽ không chịu trách
            nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không
            thể sử dụng dịch vụ hoặc nội dung của chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Sửa đổi điều khoản</h2>
          <p className="text-gray-700">
            Chúng tôi có thể sửa đổi các điều khoản này bất kỳ lúc nào bằng cách
            đăng các điều khoản đã cập nhật lên trang web của chúng tôi. Việc
            bạn tiếp tục sử dụng trang web hoặc dịch vụ sau khi đăng các điều
            khoản mới đồng nghĩa với việc bạn chấp nhận các điều khoản đã sửa
            đổi.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Liên hệ</h2>
          <p className="text-gray-700">
            Nếu bạn có bất kỳ câu hỏi nào về các điều khoản và điều kiện này,
            vui lòng liên hệ với chúng tôi tại:
            <a
              href="mailto:legal@rently.vn"
              className="text-primary hover:underline"
            >
              {" "}
              legal@rently.vn
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
