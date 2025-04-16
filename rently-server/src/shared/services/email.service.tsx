import React from 'react'

import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'

import OTPEmail from 'emails/otp'
import ViewingReminderEmail from 'emails/viewing-reminder'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'

    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject: 'Mã OTP',
      react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }

  sendViewingReminder(payload: {
    email: string
    scheduledTime: Date
    propertyName: string
    propertyAddress: string
    landlordName: string
    landlordPhone?: string
    tenantName: string
  }) {
    const subject = `Nhắc lịch hẹn xem nhà - ${payload.propertyName}`

    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: (
        <ViewingReminderEmail
          scheduledTime={payload.scheduledTime}
          propertyName={payload.propertyName}
          propertyAddress={payload.propertyAddress}
          landlordName={payload.landlordName}
          landlordPhone={payload.landlordPhone}
          tenantName={payload.tenantName}
        />
      ),
    })
  }
}
