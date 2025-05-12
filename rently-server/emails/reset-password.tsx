import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from '@react-email/components'
import React from 'react'

interface ResetPasswordEmailProps {
  code: string
  expiry: number
}

export const ResetPasswordEmail = ({
  code,
  expiry,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Đặt lại mật khẩu - Mã xác nhận</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Đặt lại mật khẩu</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào!</Text>
            <Text style={text}>
              Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác nhận sau:
            </Text>

            <Section style={codeSection}>
              <Text style={otpCodeStyle}>{code}</Text>
            </Section>

            <Text style={text}>
              Mã xác nhận có hiệu lực trong vòng {expiry} phút.
            </Text>

            <Text style={text}>
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </Text>

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
ResetPasswordEmail.PreviewProps = {
  code: '123456',
  expiry: 10,
} as ResetPasswordEmailProps

export default ResetPasswordEmail

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

const codeSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  margin: '20px auto',
  padding: '20px',
  width: '280px',
  textAlign: 'center' as const,
}

const otpCodeStyle = {
  color: '#333333',
  fontFamily: 'monospace',
  fontSize: '38px',
  fontWeight: 700,
  letterSpacing: '8px',
  margin: 0,
}

const footer = {
  color: '#9ca299',
  fontSize: '14px',
  marginTop: '20px',
  textAlign: 'center' as const,
}
