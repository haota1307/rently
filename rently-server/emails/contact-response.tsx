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
} from '@react-email/components'
import React from 'react'

interface ContactResponseEmailProps {
  userName: string
  subject: string
  originalMessage: string
  responseMessage: string
  websiteUrl?: string
}

export const ContactResponseEmail = ({
  userName,
  subject,
  originalMessage,
  responseMessage,
  websiteUrl = 'https://rently.top',
}: ContactResponseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Phản hồi: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rently - Phản hồi liên hệ</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào {userName},</Text>
            <Text style={text}>
              Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi cho câu
              hỏi của bạn:
            </Text>

            <Section style={cardContainer}>
              <Heading as="h2" style={cardTitle}>
                {subject}
              </Heading>

              <Text style={labelText}>Câu hỏi của bạn:</Text>
              <Text style={originalMessageStyle}>{originalMessage}</Text>

              <Text style={labelText}>Phản hồi của chúng tôi:</Text>
              <Text style={responseMessageStyle}>{responseMessage}</Text>
            </Section>

            <Text style={text}>
              Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi.
            </Text>

            <Section style={buttonContainer}>
              <Button href={websiteUrl} style={button}>
                Truy cập website
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
ContactResponseEmail.PreviewProps = {
  userName: 'Nguyễn Văn A',
  subject: 'Hỏi về chính sách cho thuê',
  originalMessage:
    'Tôi muốn hỏi về chính sách cho thuê và cách thức đăng ký làm chủ trọ trên hệ thống của bạn. Làm thế nào để tôi có thể đăng ký và bắt đầu cho thuê phòng trọ của mình?',
  responseMessage:
    'Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi. Để đăng ký làm chủ trọ, bạn cần tạo một tài khoản trên hệ thống Rently và gửi yêu cầu nâng cấp tài khoản lên chủ trọ. Sau khi được phê duyệt, bạn có thể bắt đầu đăng tin cho thuê phòng trọ của mình. Để biết thêm chi tiết, vui lòng tham khảo hướng dẫn trên website của chúng tôi.',
} as ContactResponseEmailProps

export default ContactResponseEmail

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
  padding: '20px',
  marginBottom: '20px',
  border: '1px solid #e0e0e0',
}

const cardTitle = {
  fontSize: '18px',
  color: '#1a73e8',
  margin: '0 0 20px 0',
}

const labelText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '10px 0 5px',
}

const originalMessageStyle = {
  fontSize: '16px',
  color: '#555555',
  margin: '0 0 20px',
  padding: '12px',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
  whiteSpace: 'pre-line' as const,
}

const responseMessageStyle = {
  fontSize: '16px',
  color: '#484848',
  margin: '0 0 10px',
  padding: '12px',
  backgroundColor: '#e6f7ff',
  borderRadius: '4px',
  border: '1px solid #91d5ff',
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
