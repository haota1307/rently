import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OTPEmailProps {
  otpCode: string;
  title: string;
}

const logoUrl = '';

export const OTPEmail = ({ otpCode, title }: OTPEmailProps) => (
  <Html>
    <Head>
      <title>{title}</title>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        `}
      </style>
    </Head>
    <Body style={main}>
      <Container style={container}>
        {/* Nếu có logo, bỏ comment dòng bên dưới */}
        {/* <Img src={logoUrl} width="100" height="100" alt="Logo" style={logo} /> */}
        <Text style={introText}>Mã xác thực OTP</Text>
        <Heading style={heading}>Xác nhận tài khoản của bạn</Heading>
        <Section style={codeSection}>
          <Text style={otpCodeStyle}>{otpCode}</Text>
        </Section>
        <Text style={instruction}>
          Nhập mã OTP bên trên để xác thực và hoàn tất đăng ký tài khoản của
          bạn.
        </Text>
        <Text style={note}>
          Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.
        </Text>
      </Container>
      <Text style={footer}>Từ Rently.top</Text>
    </Body>
  </Html>
);

OTPEmail.PreviewProps = {
  otpCode: '144833',
  title: 'Mã OTP',
} as OTPEmailProps;

export default OTPEmail;

const main = {
  background: 'linear-gradient(135deg, #f0f4ff, #d9e4ff)',
  fontFamily: "'Poppins', sans-serif",
  padding: '20px',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
  margin: '0 auto',
  maxWidth: '450px',
  padding: '40px 30px',
  textAlign: 'center' as const,
};

const introText = {
  color: '#3498db',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  marginBottom: '10px',
};

const heading = {
  color: '#2c3e50',
  fontSize: '26px',
  fontWeight: 700,
  marginBottom: '25px',
};

const codeSection = {
  background: 'linear-gradient(90deg, #ff9a9e, #fad0c4)',
  borderRadius: '10px',
  margin: '20px auto',
  padding: '20px',
  width: '320px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
};

const otpCodeStyle = {
  color: '#ffffff',
  fontFamily: 'monospace',
  fontSize: '42px',
  fontWeight: 700,
  letterSpacing: '10px',
  margin: 0,
};

const instruction = {
  color: '#7f8c8d',
  fontSize: '16px',
  lineHeight: '1.5',
  marginTop: '20px',
};

const note = {
  color: '#95a5a6',
  fontSize: '14px',
  lineHeight: '1.4',
  marginTop: '10px',
};

const footer = {
  color: '#bdc3c7',
  fontSize: '12px',
  marginTop: '30px',
  textAlign: 'center' as const,
};

// Nếu sử dụng logo, có thể định nghĩa style cho logo như sau:
// const logo = {
//   margin: '0 auto 20px',
//   width: '80px',
//   height: '80px',
//   borderRadius: '50%',
// };
