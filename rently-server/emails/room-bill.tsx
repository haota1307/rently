import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Button,
} from '@react-email/components'
import React from 'react'

interface RoomBillEmailProps {
  tenantName: string
  roomTitle: string
  billingMonth: string
  dueDate: string
  electricityOld: number
  electricityNew: number
  electricityUsage: number
  electricityPrice: number
  electricityAmount: number
  waterOld: number
  waterNew: number
  waterUsage: number
  waterPrice: number
  waterAmount: number
  otherFees: Array<{ name: string; amount: number }>
  totalAmount: number
  note?: string
  paymentUrl?: string
}

export const RoomBillEmail = ({
  tenantName,
  roomTitle,
  billingMonth,
  dueDate,
  electricityOld,
  electricityNew,
  electricityUsage,
  electricityPrice,
  electricityAmount,
  waterOld,
  waterNew,
  waterUsage,
  waterPrice,
  waterAmount,
  otherFees,
  totalAmount,
  note,
  paymentUrl = 'https://rently.top/nap-tien',
}: RoomBillEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Hóa đơn tiền phòng {roomTitle} - {billingMonth}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rently - Hóa đơn tiền phòng</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào {tenantName},</Text>
            <Text style={text}>
              Dưới đây là chi tiết hóa đơn tiền phòng của bạn:
            </Text>

            <Section style={cardContainer}>
              <Heading as="h2" style={cardTitle}>
                Thông tin hóa đơn
              </Heading>

              <Section style={detailsContainer}>
                <Row>
                  <Column>
                    <Text style={labelText}>Phòng:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{roomTitle}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Kỳ hóa đơn:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{billingMonth}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Ngày đến hạn:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{dueDate}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Section style={tableContainer}>
              <Heading as="h3" style={tableTitle}>
                Chi tiết hóa đơn
              </Heading>

              <Section style={tableHeader}>
                <Row>
                  <Column style={tableHeaderCell}>
                    <Text style={tableHeaderText}>Mục</Text>
                  </Column>
                  <Column style={tableHeaderCell}>
                    <Text style={tableHeaderText}>Chi tiết</Text>
                  </Column>
                  <Column style={tableHeaderCell}>
                    <Text style={tableHeaderText}>Thành tiền (VNĐ)</Text>
                  </Column>
                </Row>
              </Section>

              <Section style={tableBody}>
                {/* Tiền điện */}
                <Row style={tableRow}>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>Tiền điện</Text>
                  </Column>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>
                      {electricityOld} - {electricityNew} = {electricityUsage}{' '}
                      kWh x {electricityPrice.toLocaleString('vi-VN')}đ
                    </Text>
                  </Column>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>
                      {electricityAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  </Column>
                </Row>

                {/* Tiền nước */}
                <Row style={tableRow}>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>Tiền nước</Text>
                  </Column>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>
                      {waterOld} - {waterNew} = {waterUsage} m³ x{' '}
                      {waterPrice.toLocaleString('vi-VN')}đ
                    </Text>
                  </Column>
                  <Column style={tableCell}>
                    <Text style={tableCellText}>
                      {waterAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  </Column>
                </Row>

                {/* Các phí khác */}
                {otherFees.map((fee, index) => (
                  <Row key={index} style={tableRow}>
                    <Column style={tableCell}>
                      <Text style={tableCellText}>{fee.name}</Text>
                    </Column>
                    <Column style={tableCell}>
                      <Text style={tableCellText}></Text>
                    </Column>
                    <Column style={tableCell}>
                      <Text style={tableCellText}>
                        {fee.amount.toLocaleString('vi-VN')}đ
                      </Text>
                    </Column>
                  </Row>
                ))}

                {/* Tổng cộng */}
                <Row style={totalRow}>
                  <Column style={totalCell}>
                    <Text style={totalText}>Tổng cộng</Text>
                  </Column>
                  <Column style={totalCell}>
                    <Text style={totalText}></Text>
                  </Column>
                  <Column style={totalCell}>
                    <Text style={totalText}>
                      {totalAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {note && (
              <Section style={noteContainer}>
                <Text style={noteTitle}>Ghi chú:</Text>
                <Text style={noteText}>{note}</Text>
              </Section>
            )}

            <Text style={text}>
              Vui lòng thanh toán trước ngày {dueDate}. Xin cảm ơn!
            </Text>

            <Section style={buttonContainer}>
              <Button href={paymentUrl} style={button}>
                Thanh toán ngay
              </Button>
            </Section>

            <Text style={text}>
              Trân trọng,
              <br />
              Đội ngũ Rently
            </Text>
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} Rently. Tất cả các quyền được bảo lưu.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Props mặc định cho xem trước email
RoomBillEmail.PreviewProps = {
  tenantName: 'Nguyễn Văn A',
  roomTitle: 'Phòng 101 - Nhà trọ Minh Tâm',
  billingMonth: 'Tháng 6/2024',
  dueDate: '15/06/2024',
  electricityOld: 450,
  electricityNew: 530,
  electricityUsage: 80,
  electricityPrice: 3500,
  electricityAmount: 280000,
  waterOld: 35,
  waterNew: 39,
  waterUsage: 4,
  waterPrice: 15000,
  waterAmount: 60000,
  otherFees: [
    { name: 'Phí dịch vụ', amount: 100000 },
    { name: 'Phí Internet', amount: 150000 },
    { name: 'Phí gửi xe', amount: 100000 },
  ],
  totalAmount: 690000,
  note: 'Do giá điện tăng nên tháng này tiền điện có chút thay đổi. Mong bạn thông cảm.',
} as RoomBillEmailProps

export default RoomBillEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '5px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
  textAlign: 'center' as const,
}

const section = {
  padding: '0 20px',
}

const text = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  marginBottom: '20px',
}

const cardContainer = {
  backgroundColor: '#f9f9f9',
  borderRadius: '5px',
  padding: '15px',
  marginBottom: '20px',
  border: '1px solid #e0e0e0',
}

const cardTitle = {
  fontSize: '18px',
  color: '#1a73e8',
  margin: '0 0 15px 0',
}

const detailsContainer = {
  marginTop: '10px',
}

const labelText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '5px 0',
}

const valueText = {
  fontSize: '16px',
  color: '#484848',
  margin: '5px 0',
}

const tableContainer = {
  marginBottom: '20px',
  width: '100%',
}

const tableTitle = {
  fontSize: '18px',
  color: '#1a73e8',
  margin: '0 0 15px 0',
}

const tableHeader = {
  backgroundColor: '#4a5568',
  borderRadius: '5px 5px 0 0',
  padding: '8px',
}

const tableHeaderCell = {
  padding: '8px',
}

const tableHeaderText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const tableBody = {
  border: '1px solid #e0e0e0',
  borderTop: 'none',
  borderRadius: '0 0 5px 5px',
}

const tableRow = {
  borderBottom: '1px solid #e0e0e0',
}

const tableCell = {
  padding: '10px',
}

const tableCellText = {
  fontSize: '15px',
  color: '#333333',
  margin: '0',
}

const totalRow = {
  backgroundColor: '#f5f5f5',
}

const totalCell = {
  padding: '12px 10px',
}

const totalText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a73e8',
  margin: '0',
}

const noteContainer = {
  backgroundColor: '#fff8e5',
  borderRadius: '5px',
  padding: '12px',
  marginBottom: '20px',
  border: '1px solid #ffeeba',
}

const noteTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#856404',
  margin: '0 0 5px 0',
}

const noteText = {
  fontSize: '15px',
  color: '#856404',
  margin: '0',
}

const buttonContainer = {
  marginTop: '30px',
  marginBottom: '30px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#1a73e8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
}

const footer = {
  color: '#9ca299',
  fontSize: '14px',
  marginTop: '20px',
  textAlign: 'center' as const,
}
