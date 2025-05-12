import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
  Row,
  Column,
} from '@react-email/components'
import React from 'react'

interface RentalRequestEmailProps {
  landlordName: string
  tenantName: string
  postTitle: string
  startDate: string
  duration: number
  note?: string
  postUrl?: string
}

export const RentalRequestEmail = ({
  landlordName,
  tenantName,
  postTitle,
  startDate,
  duration,
  note,
  postUrl,
}: RentalRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Yêu cầu thuê mới cho bài đăng "{postTitle}"</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rently - Yêu cầu thuê mới</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào {landlordName},</Text>
            <Text style={text}>
              Bạn có một yêu cầu thuê mới từ {tenantName} cho bài đăng "
              {postTitle}".
            </Text>

            <Section style={cardContainer}>
              <Heading as="h2" style={cardTitle}>
                Chi tiết yêu cầu
              </Heading>

              <Section style={detailsContainer}>
                <Row>
                  <Column>
                    <Text style={labelText}>Người thuê:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{tenantName}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Bài đăng:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{postTitle}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Ngày bắt đầu:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{startDate}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Thời hạn:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{duration} tháng</Text>
                  </Column>
                </Row>

                {note && (
                  <Row>
                    <Column>
                      <Text style={labelText}>Ghi chú:</Text>
                    </Column>
                    <Column>
                      <Text style={valueText}>{note}</Text>
                    </Column>
                  </Row>
                )}
              </Section>
            </Section>

            <Text style={text}>
              Vui lòng đăng nhập vào hệ thống để xem chi tiết và phản hồi yêu
              cầu.
            </Text>

            <Section style={buttonContainer}>
              <Button
                href={
                  postUrl || 'https://rently.example.com/quan-ly/yeu-cau-thue'
                }
                style={button}
              >
                Xem chi tiết và phản hồi
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
RentalRequestEmail.PreviewProps = {
  landlordName: 'Nguyễn Văn A',
  tenantName: 'Trần Thị B',
  postTitle: 'Căn hộ 2 phòng ngủ quận 2',
  startDate: '01/06/2024',
  duration: 6,
  note: 'Tôi muốn thuê căn hộ này dài hạn và có thể chuyển vào ngay đầu tháng 6',
} as RentalRequestEmailProps

export default RentalRequestEmail

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
