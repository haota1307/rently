import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Format tiền tệ
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format ngày
const formatDateString = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return format(dateObj, 'dd/MM/yyyy', { locale: vi })
}

// Tính số tháng giữa 2 ngày
const getDurationInMonths = (
  startDate: Date | string,
  endDate: Date | string
): number => {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  )
}

interface TemplateData {
  contract: {
    id: number
    contractNumber: string
    startDate: Date
    endDate: Date
    monthlyRent: number
    deposit: number
    paymentDueDate: number
    status: string
    landlordSignedAt: Date | null
    tenantSignedAt: Date | null
    room: {
      title: string
      area: number
      price: number
    }
  }
  landlord: {
    name: string
    email: string
    phoneNumber: string | null
    identityCard?: string
    address?: string
    identityCardIssuedDate?: string
    identityCardIssuedPlace?: string
  }
  tenant: {
    name: string
    email: string
    phoneNumber: string | null
    identityCard?: string
    address?: string
    identityCardIssuedDate?: string
    identityCardIssuedPlace?: string
  }
  currentDate: string
  signatures?: {
    landlordSignatureUrl?: string
    tenantSignatureUrl?: string
  }
}

export function getContractHTML(data: TemplateData): string {
  const { contract, landlord, tenant, currentDate, signatures } = data

  // Điều chỉnh giá nếu cần (nếu giá được lưu theo đơn vị nghìn đồng)
  const monthlyRent = contract.monthlyRent
  const deposit = contract.deposit

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hợp đồng thuê phòng trọ</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      line-height: 1.5;
      margin: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-weight: bold;
      font-size: 18px;
      text-transform: uppercase;
      margin: 10px 0;
    }
    .subtitle {
      font-weight: bold;
      margin: 5px 0;
    }
    .content {
      text-align: justify;
    }
    .signature {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      margin-top: 70px;
      border-top: 1px dotted #000;
    }
    p {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="title">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p class="subtitle">Độc Lập - Tự Do - Hạnh Phúc</p>
    <p>—oOo—</p>
    <p class="title">HỢP ĐỒNG THUÊ PHÒNG TRỌ</p>
    <p>Số: ${contract.contractNumber}</p>
  </div>

  <div class="content">
    <p>Hôm nay, ngày ${currentDate}, tại địa chỉ phòng ${contract.room.title}, chúng tôi gồm:</p>

    <p><strong>BÊN A: BÊN CHO THUÊ</strong></p>
    <p>Họ và Tên: ${landlord.name}</p>
    <p>CMND/CCCD: ${landlord.identityCard || '......................'} Ngày cấp: ${landlord.identityCardIssuedDate || '......................'} Nơi cấp: ${landlord.identityCardIssuedPlace || '......................'}</p>
    <p>Thường Trú: ${landlord.address || '......................'}</p>
    <p>Điện thoại: ${landlord.phoneNumber || '......................'}</p>
    <p>Email: ${landlord.email || '......................'}</p>

    <p><strong>BÊN B: BÊN THUÊ NHÀ</strong></p>
    <p>Họ và Tên: ${tenant.name}</p>
    <p>CMND/CCCD: ${tenant.identityCard || '......................'} Ngày cấp: ${tenant.identityCardIssuedDate || '......................'} Nơi cấp: ${tenant.identityCardIssuedPlace || '......................'}</p>
    <p>Thường Trú: ${tenant.address || '......................'}</p>
    <p>Điện thoại: ${tenant.phoneNumber || '......................'}</p>
    <p>Email: ${tenant.email || '......................'}</p>

    <p>Hai bên cùng thỏa thuận và đồng ý với nội dung sau:</p>

    <p><strong>Điều 1:</strong></p>
    <p>Bên A đồng ý cho bên B thuê một phòng thuộc phòng ${contract.room.title}, diện tích ${contract.room.area} m²</p>
    <p>Thời hạn thuê nhà là ${getDurationInMonths(contract.startDate, contract.endDate)} tháng kể từ ngày ${formatDateString(contract.startDate)} đến ngày ${formatDateString(contract.endDate)}</p>

    <p><strong>Điều 2:</strong></p>
    <p>Giá tiền thuê nhà là ${formatCurrency(monthlyRent)} đồng/tháng</p>
    <p>Tiền thuê nhà bên B thanh toán cho bên A vào ngày ${contract.paymentDueDate} hàng tháng.</p>
    <p>Bên B đặt tiền thế chân trước ${formatCurrency(deposit)} đồng cho bên A. 
       Tiền thế chân sẽ được trả lại đầy đủ cho bên thuê khi hết hợp đồng thuê căn hộ và thanh toán đầy đủ 
       tiền điện, nước, phí dịch vụ và các khoản khác liên quan.</p>

    <p>Bên B ngưng hợp đồng trước thời hạn thì phải chịu mất tiền thế chân.</p>
    <p>Bên A ngưng hợp đồng (lấy lại nhà) trước thời hạn thì bồi thường gấp đôi số tiền bên B đã thế chân.</p>

    <p><strong>Điều 3: Trách nhiệm bên A.</strong></p>
    <p>Giao nhà, trang thiết bị trong nhà cho bên B đúng ngày ký hợp đồng.</p>
    <p>Hướng dẫn bên B chấp hành đúng các quy định của địa phương, hoàn tất mọi thủ tục giấy tờ đăng ký tạm trú cho bên B.</p>

    <p><strong>Điều 4: Trách nhiệm bên B.</strong></p>
    <p>Trả tiền thuê nhà hàng tháng theo hợp đồng.</p>
    <p>Sử dụng đúng mục đích thuê nhà, khi cần sữa chữa, cải tạo theo yêu cầu sử dụng riêng phải được sự đồng ý của bên A.</p>
    <p>Đồ đạt trang thiết bị trong nhà phải có trách nhiệm bảo quản cẩn thận không làm hư hỏng mất mát.</p>

    <p><strong>Điều 5: Điều khoản chung.</strong></p>
    <p>Bên A và bên B thực hiện đúng các điều khoản ghi trong hợp đồng.</p>
    <p>Trường hợp có tranh chấp hoặc một bên vi phạm hợp đồng thì hai bên cùng nhau bàn bạc giải quyết, 
       nếu không giải quyết được thì yêu cầu cơ quan có thẩm quyền giải quyết.</p>
    <p>Hợp đồng được lập thành 02 bản có giá trị ngang nhau, mỗi bên giữ 01 bản.</p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p><strong>BÊN A</strong></p>
      <p>(Ký tên)</p>
      ${signatures?.landlordSignatureUrl ? `<img src="${signatures.landlordSignatureUrl}" alt="Chữ ký chủ nhà" style="max-width: 120px; max-height: 60px;" />` : contract.landlordSignedAt ? '<p><em>Đã ký điện tử</em></p>' : '<div class="signature-line"></div>'}
      <p>${landlord.name}</p>
    </div>

    <div class="signature-box">
      <p><strong>BÊN B</strong></p>
      <p>(Ký tên)</p>
      ${signatures?.tenantSignatureUrl ? `<img src="${signatures.tenantSignatureUrl}" alt="Chữ ký người thuê" style="max-width: 120px; max-height: 60px;" />` : contract.tenantSignedAt ? '<p><em>Đã ký điện tử</em></p>' : '<div class="signature-line"></div>'}
      <p>${tenant.name}</p>
    </div>
  </div>
</body>
</html>
  `
}
