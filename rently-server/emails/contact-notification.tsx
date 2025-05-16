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

interface ContactNotificationEmailProps {
  fullName: string
  email: string
  phoneNumber?: string
  subject: string
  message: string
  adminDashboardUrl?: string
}

export const ContactNotificationEmail = ({
  fullName,
  email,
  phoneNumber,
  subject,
  message,
  adminDashboardUrl = 'https://rently.top/quan-ly/lien-he',
}: ContactNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Liên hệ mới từ {fullName}: {subject}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rently - Liên hệ mới</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào Admin,</Text>
            <Text style={text}>
              Bạn vừa nhận được một liên hệ mới từ người dùng:
            </Text>

            <Section style={cardContainer}>
              <Heading as="h2" style={cardTitle}>
                {subject}
              </Heading>

              <Section style={detailsContainer}>
                <Row>
                  <Column>
                    <Text style={labelText}>Họ tên:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{fullName}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Email:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{email}</Text>
                  </Column>
                </Row>

                {phoneNumber && (
                  <Row>
                    <Column>
                      <Text style={labelText}>Số điện thoại:</Text>
                    </Column>
                    <Column>
                      <Text style={valueText}>{phoneNumber}</Text>
                    </Column>
                  </Row>
                )}

                <Row>
                  <Column>
                    <Text style={labelText}>Nội dung:</Text>
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <Text style={messageContent}>{message}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Text style={text}>
              Vui lòng đăng nhập vào dashboard để phản hồi liên hệ này.
            </Text>

            <Section style={buttonContainer}>
              <Button href={adminDashboardUrl} style={button}>
                Phản hồi liên hệ
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
ContactNotificationEmail.PreviewProps = {
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phoneNumber: '0912345678',
  subject: 'Hỏi về chính sách cho thuê',
  message:
    'Tôi muốn hỏi về chính sách cho thuê và cách thức đăng ký làm chủ trọ trên hệ thống của bạn. Làm thế nào để tôi có thể đăng ký và bắt đầu cho thuê phòng trọ của mình?',
} as ContactNotificationEmailProps

export default ContactNotificationEmail

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

const messageContent = {
  fontSize: '16px',
  color: '#484848',
  margin: '5px 0',
  padding: '10px',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  border: '1px solid #eaeaea',
  whiteSpace: 'pre-line' as const,
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
