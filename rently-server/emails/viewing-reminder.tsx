import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Row,
  Column,
  Section,
  Button,
} from '@react-email/components'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import React from 'react'

interface ViewingReminderEmailProps {
  scheduledTime: Date
  propertyName: string
  propertyAddress: string
  landlordName: string
  landlordPhone?: string
  tenantName: string
}

export const ViewingReminderEmail = ({
  scheduledTime,
  propertyName,
  propertyAddress,
  landlordName,
  landlordPhone,
  tenantName,
}: ViewingReminderEmailProps) => {
  const formattedDate = format(new Date(scheduledTime), 'PPPP', {
    locale: vi,
  })
  const formattedTime = format(new Date(scheduledTime), 'HH:mm', {
    locale: vi,
  })

  return (
    <Html>
      <Head />
      <Preview>Nhắc lịch hẹn xem nhà - {propertyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rently - Nhắc lịch xem nhà</Heading>

          <Section style={section}>
            <Text style={text}>Xin chào {tenantName},</Text>
            <Text style={text}>
              Chúng tôi xin nhắc bạn về lịch hẹn xem nhà sắp tới:
            </Text>

            <Section style={cardContainer}>
              <Heading as="h2" style={cardTitle}>
                {propertyName}
              </Heading>

              <Section style={detailsContainer}>
                <Row>
                  <Column>
                    <Text style={labelText}>Thời gian:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>
                      {formattedTime} - {formattedDate}
                    </Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Địa chỉ:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{propertyAddress}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text style={labelText}>Chủ nhà:</Text>
                  </Column>
                  <Column>
                    <Text style={valueText}>{landlordName}</Text>
                  </Column>
                </Row>

                {landlordPhone && (
                  <Row>
                    <Column>
                      <Text style={labelText}>Liên hệ:</Text>
                    </Column>
                    <Column>
                      <Text style={valueText}>{landlordPhone}</Text>
                    </Column>
                  </Row>
                )}
              </Section>
            </Section>

            <Text style={text}>
              Vui lòng đến đúng giờ. Nếu có thay đổi, hãy thông báo cho chủ nhà
              hoặc cập nhật trên hệ thống Rently.
            </Text>

            <Section style={buttonContainer}>
              <Button href="https://rently.example.com/lich-hen" style={button}>
                Xem chi tiết lịch hẹn
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

export default ViewingReminderEmail

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
