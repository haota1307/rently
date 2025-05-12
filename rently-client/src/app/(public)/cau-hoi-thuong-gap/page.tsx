import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp | Rently",
  description: "Các câu hỏi và trả lời thường gặp về nền tảng Rently",
};

// Dữ liệu FAQ được phân loại theo nhóm
const faqData = [
  {
    category: "Chung",
    items: [
      {
        question: "Rently là gì?",
        answer:
          "Rently là nền tảng kết nối chủ nhà và người thuê nhà, giúp quá trình tìm kiếm và cho thuê nhà trở nên đơn giản và hiệu quả hơn. Chúng tôi cung cấp một thị trường trực tuyến nơi người thuê có thể tìm kiếm, đặt lịch xem và liên hệ trực tiếp với chủ nhà.",
      },
      {
        question: "Làm thế nào để tạo tài khoản trên Rently?",
        answer:
          'Bạn có thể dễ dàng tạo tài khoản bằng cách nhấp vào nút "Đăng ký" trên trang chủ. Điền thông tin cá nhân của bạn, xác minh email, và bạn đã sẵn sàng sử dụng Rently. Quá trình này mất khoảng 2 phút và hoàn toàn miễn phí.',
      },
      {
        question: "Rently có tính phí sử dụng không?",
        answer:
          "Rently miễn phí cho người thuê khi tìm kiếm, xem và liên hệ với chủ nhà. Đối với chủ nhà, chúng tôi có các gói dịch vụ khác nhau, bao gồm cả lựa chọn miễn phí với các tính năng cơ bản và các gói cao cấp với nhiều tính năng nâng cao hơn.",
      },
      {
        question: "Làm thế nào để liên hệ với đội hỗ trợ?",
        answer:
          "Bạn có thể liên hệ với đội hỗ trợ của chúng tôi qua email support@rently.vn hoặc qua trang 'Liên hệ' trên trang web. Thời gian phản hồi thông thường là trong vòng 24 giờ làm việc.",
      },
    ],
  },
  {
    category: "Người thuê nhà",
    items: [
      {
        question: "Làm thế nào để tìm kiếm nhà trọ trên Rently?",
        answer:
          "Bạn có thể tìm kiếm nhà trọ bằng cách sử dụng trang tìm kiếm chính với các bộ lọc như vị trí, giá cả, diện tích, và tiện nghi. Bạn cũng có thể sử dụng tính năng tìm kiếm trên bản đồ để xem các lựa chọn trong khu vực cụ thể.",
      },
      {
        question: "Làm thế nào để đặt lịch xem nhà?",
        answer:
          "Sau khi tìm thấy nhà trọ phù hợp, bạn có thể đặt lịch xem nhà bằng cách nhấp vào nút 'Đặt lịch xem' trên trang chi tiết của nhà trọ đó. Chọn ngày và giờ phù hợp, và chủ nhà sẽ xác nhận lịch hẹn của bạn.",
      },
      {
        question: "Tôi có thể hủy lịch xem nhà đã đặt không?",
        answer:
          "Có, bạn có thể hủy lịch xem nhà đã đặt bất cứ lúc nào trước thời điểm hẹn. Đơn giản chỉ cần vào mục 'Lịch xem phòng' trong tài khoản của bạn, tìm lịch hẹn cần hủy và nhấp vào nút 'Hủy lịch'. Chúng tôi khuyến khích bạn hủy sớm nếu không thể tham dự để chủ nhà có thể sắp xếp kế hoạch khác.",
      },
      {
        question: "Làm thế nào để liên hệ với chủ nhà?",
        answer:
          "Bạn có thể liên hệ trực tiếp với chủ nhà thông qua hệ thống tin nhắn của Rently sau khi đăng nhập. Điều này đảm bảo tất cả các cuộc trò chuyện được lưu trữ và bảo mật.",
      },
      {
        question: "Làm thế nào để báo cáo một vấn đề với nhà trọ hoặc chủ nhà?",
        answer:
          "Nếu bạn gặp vấn đề với nhà trọ hoặc chủ nhà, bạn có thể báo cáo bằng cách nhấp vào nút 'Báo cáo' trên trang chi tiết nhà trọ hoặc trong cuộc trò chuyện với chủ nhà. Đội ngũ của chúng tôi sẽ xem xét báo cáo của bạn và thực hiện các biện pháp thích hợp.",
      },
    ],
  },
  {
    category: "Chủ nhà",
    items: [
      {
        question: "Làm thế nào để đăng tin cho thuê trên Rently?",
        answer:
          "Để đăng tin cho thuê, bạn cần đăng ký tài khoản chủ nhà, xác minh danh tính, sau đó nhấp vào 'Đăng tin mới' trong phần quản lý. Điền đầy đủ thông tin về bất động sản, tải lên hình ảnh chất lượng cao, và đặt giá cả hợp lý. Sau khi gửi, tin đăng sẽ được duyệt trước khi xuất hiện trên trang web.",
      },
      {
        question: "Tôi có thể chỉnh sửa tin đăng sau khi đã đăng không?",
        answer:
          "Có, bạn có thể chỉnh sửa tin đăng bất cứ lúc nào. Đơn giản chỉ cần vào phần 'Quản lý tin đăng' trong tài khoản của bạn, tìm tin đăng cần chỉnh sửa và nhấp vào nút 'Chỉnh sửa'. Sau khi cập nhật, tin đăng có thể cần được duyệt lại trước khi thay đổi xuất hiện công khai.",
      },
      {
        question: "Làm thế nào để quản lý lịch xem nhà?",
        answer:
          "Bạn có thể quản lý tất cả các lịch hẹn xem nhà trong mục 'Lịch hẹn xem nhà' trong tài khoản chủ nhà. Tại đây, bạn có thể xem, chấp nhận, từ chối hoặc đề xuất thời gian khác cho các yêu cầu xem nhà. Bạn cũng sẽ nhận được thông báo qua email khi có yêu cầu mới.",
      },
      {
        question:
          "Làm thế nào để nâng cấp tin đăng của tôi để đạt hiệu quả tốt hơn?",
        answer:
          "Để tăng hiệu quả của tin đăng, bạn có thể sử dụng các dịch vụ nâng cấp như 'Tin đăng nổi bật' hoặc 'Tin đăng VIP'. Các tùy chọn này giúp tin đăng của bạn xuất hiện ở vị trí nổi bật hơn trong kết quả tìm kiếm và được nhiều người xem hơn. Bạn có thể mua các dịch vụ này trong phần 'Quảng cáo và nâng cấp' trong tài khoản của bạn.",
      },
      {
        question: "Tôi có thể đăng bao nhiêu tin trên Rently?",
        answer:
          "Số lượng tin đăng phụ thuộc vào loại tài khoản của bạn. Tài khoản miễn phí cho phép đăng 3 tin, trong khi các gói cao cấp cung cấp nhiều lựa chọn hơn. Bạn luôn có thể nâng cấp tài khoản của mình để đăng nhiều tin hơn nếu cần.",
      },
    ],
  },
  {
    category: "Thanh toán và phí",
    items: [
      {
        question: "Các phương thức thanh toán nào được chấp nhận?",
        answer:
          "Rently chấp nhận nhiều phương thức thanh toán khác nhau, bao gồm thẻ tín dụng/ghi nợ (Visa, MasterCard), chuyển khoản ngân hàng, và các ví điện tử phổ biến như MoMo, ZaloPay và VNPay.",
      },
      {
        question: "Phí dịch vụ được tính như thế nào?",
        answer:
          "Phí dịch vụ của Rently phụ thuộc vào gói dịch vụ bạn chọn và loại tài khoản của bạn. Chúng tôi cung cấp các gói từ miễn phí đến cao cấp với nhiều tính năng khác nhau. Bạn có thể xem chi tiết về các gói và phí tương ứng trong mục 'Báo giá' trên trang web của chúng tôi.",
      },
      {
        question: "Làm thế nào để yêu cầu hoàn tiền?",
        answer:
          "Nếu bạn cần yêu cầu hoàn tiền, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi qua email billing@rently.vn với số tham chiếu thanh toán của bạn và lý do yêu cầu hoàn tiền. Chúng tôi sẽ xem xét yêu cầu của bạn và phản hồi trong vòng 3-5 ngày làm việc. Lưu ý rằng không phải tất cả các dịch vụ đều đủ điều kiện để hoàn tiền.",
      },
    ],
  },
  {
    category: "Kỹ thuật và tài khoản",
    items: [
      {
        question: "Làm thế nào để đặt lại mật khẩu?",
        answer:
          "Để đặt lại mật khẩu, nhấp vào liên kết 'Quên mật khẩu' trên trang đăng nhập. Nhập địa chỉ email đã đăng ký của bạn, và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu. Liên kết này có hiệu lực trong 24 giờ.",
      },
      {
        question: "Tôi không nhận được email xác nhận. Tôi nên làm gì?",
        answer:
          "Nếu bạn không nhận được email xác nhận, vui lòng kiểm tra thư mục spam hoặc thư rác. Nếu vẫn không tìm thấy, bạn có thể yêu cầu gửi lại email xác nhận trong trang đăng nhập hoặc liên hệ với bộ phận hỗ trợ của chúng tôi để được trợ giúp.",
      },
      {
        question: "Làm thế nào để cập nhật thông tin cá nhân của tôi?",
        answer:
          "Bạn có thể cập nhật thông tin cá nhân của mình bằng cách đăng nhập và điều hướng đến trang 'Hồ sơ' hoặc 'Tài khoản'. Tại đây, bạn có thể chỉnh sửa thông tin như tên, số điện thoại, địa chỉ, và thông tin liên hệ khác. Đảm bảo nhấp vào 'Lưu' sau khi thực hiện thay đổi.",
      },
      {
        question: "Làm thế nào để xóa tài khoản của tôi?",
        answer:
          "Nếu bạn muốn xóa tài khoản, vui lòng đăng nhập và điều hướng đến phần 'Cài đặt tài khoản'. Ở cuối trang, bạn sẽ thấy tùy chọn 'Xóa tài khoản'. Nhấp vào đó và làm theo hướng dẫn để xác nhận việc xóa. Lưu ý rằng hành động này không thể hoàn tác và tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className=" mx-auto py-12 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Câu hỏi thường gặp
      </h1>

      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600 text-center mb-10">
          Tìm câu trả lời nhanh chóng cho các câu hỏi phổ biến về Rently. Không
          tìm thấy câu trả lời bạn cần? Hãy{" "}
          <a href="/lien-he" className="text-primary hover:underline">
            liên hệ với chúng tôi
          </a>
          .
        </p>

        {/* Danh mục FAQ */}
        <div className="space-y-10">
          {faqData.map((category, index) => (
            <div key={index}>
              <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem
                    key={itemIndex}
                    value={`item-${index}-${itemIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 text-gray-700">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Vẫn còn câu hỏi? */}
        <div className="mt-16 text-center p-6 bg-primary/5 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Vẫn còn câu hỏi?</h2>
          <p className="text-gray-700 mb-4">
            Nếu bạn không tìm thấy câu trả lời bạn đang tìm kiếm, vui lòng liên
            hệ với đội hỗ trợ của chúng tôi.
          </p>
          <a
            href="/lien-he"
            className="inline-block px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}
