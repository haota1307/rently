import React from 'react'

import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import { SystemSettingRepository } from '../repositories/system-setting.repo'

import OTPEmail from 'emails/otp'
import ViewingReminderEmail from 'emails/viewing-reminder'
import RentalRequestEmail from 'emails/rental-request'
import RentalStatusUpdateEmail from 'emails/rental-status-update'
import ResetPasswordEmail from 'emails/reset-password'
import Handlebars from 'handlebars'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor(private readonly systemSettingRepo: SystemSettingRepository) {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  // Phương thức lấy template email từ database
  private async getEmailTemplateFromDB(key: string): Promise<string | null> {
    try {
      const template = await this.systemSettingRepo.findByKey(key)
      const hasTemplate = template?.value && template.value.length > 0

      console.log(
        `[EmailService] Template "${key}": ${
          hasTemplate ? 'TÌM THẤY TRONG DB' : 'KHÔNG TÌM THẤY TRONG DB'
        }`
      )

      // Kiểm tra nếu template không phải là React component (không chứa import hoặc JSX)
      if (
        hasTemplate &&
        !template.value.includes('import') &&
        !template.value.includes('export default')
      ) {
        console.log(`[EmailService] Template "${key}" là HTML thuần`)
        return template.value
      } else if (hasTemplate) {
        console.log(
          `[EmailService] Template "${key}" có vẻ là React component, sẽ dùng component mặc định`
        )
      }

      return null
    } catch (error) {
      console.error(
        `[EmailService] Lỗi khi lấy template email "${key}" từ database:`,
        error
      )
      return null
    }
  }

  // Phương thức render template với dữ liệu
  private renderTemplate(template: string, data: Record<string, any>): string {
    try {
      console.log('[EmailService] Đang render template với dữ liệu:', data)
      const compiledTemplate = Handlebars.compile(template)
      return compiledTemplate(data)
    } catch (error) {
      console.error('[EmailService] Lỗi khi render template:', error)
      return template // Trả về template gốc nếu có lỗi
    }
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    const templateKey = 'email_otp_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)
    console.log('Using OTP template from database:', dbTemplate ? 'YES' : 'NO')

    // Nếu có template trong database và là chuỗi HTML thì dùng
    if (dbTemplate && !dbTemplate.includes('import')) {
      console.log('Using HTML template from database')
      const html = this.renderTemplate(dbTemplate, { code: payload.code })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log('Using React component template from file')
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }

  async sendViewingReminder(payload: {
    email: string
    scheduledTime: Date
    propertyName: string
    propertyAddress: string
    landlordName: string
    landlordPhone?: string
    tenantName: string
  }) {
    const subject = `Nhắc lịch hẹn xem nhà - ${payload.propertyName}`
    const templateKey = 'email_viewing_reminder_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template trong database và là chuỗi HTML thì dùng
    if (dbTemplate && !dbTemplate.includes('import')) {
      const html = this.renderTemplate(dbTemplate, {
        tenantName: payload.tenantName,
        propertyName: payload.propertyName,
        propertyAddress: payload.propertyAddress,
        landlordName: payload.landlordName,
        landlordPhone: payload.landlordPhone,
        viewing_date: new Date(payload.scheduledTime).toLocaleDateString(
          'vi-VN'
        ),
        viewing_time: new Date(payload.scheduledTime).toLocaleTimeString(
          'vi-VN'
        ),
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
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

  // Phương thức gửi thông báo yêu cầu thuê mới
  async sendRentalRequest(payload: {
    email: string
    landlordName: string
    tenantName: string
    postTitle: string
    startDate: string
    duration: number
    note?: string
    postUrl?: string
  }) {
    const subject = `Yêu cầu thuê mới - ${payload.postTitle}`
    const templateKey = 'email_rental_request_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho yêu cầu thuê mới'
      )
      const html = this.renderTemplate(dbTemplate, {
        landlord_name: payload.landlordName,
        tenant_name: payload.tenantName,
        post_title: payload.postTitle,
        start_date: payload.startDate,
        duration: payload.duration,
        note: payload.note || '',
        post_url: payload.postUrl || '',
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log(
      '[EmailService] Sử dụng React component từ file cho yêu cầu thuê mới'
    )
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: (
        <RentalRequestEmail
          landlordName={payload.landlordName}
          tenantName={payload.tenantName}
          postTitle={payload.postTitle}
          startDate={payload.startDate}
          duration={payload.duration}
          note={payload.note}
          postUrl={payload.postUrl}
        />
      ),
    })
  }

  // Phương thức gửi thông báo cập nhật trạng thái yêu cầu thuê
  async sendRentalStatusUpdate(payload: {
    email: string
    receiverName: string
    senderName: string
    postTitle: string
    statusMessage: string
    statusColor: string
    rejectionReason?: string
    requestUrl?: string
  }) {
    const subject = `Cập nhật trạng thái yêu cầu thuê - ${payload.postTitle}`
    const templateKey = 'email_rental_status_update_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho cập nhật trạng thái'
      )
      const html = this.renderTemplate(dbTemplate, {
        receiver_name: payload.receiverName,
        sender_name: payload.senderName,
        post_title: payload.postTitle,
        status_message: payload.statusMessage,
        status_color: payload.statusColor,
        rejection_reason: payload.rejectionReason || '',
        request_url: payload.requestUrl || '',
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log(
      '[EmailService] Sử dụng React component từ file cho cập nhật trạng thái'
    )
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: (
        <RentalStatusUpdateEmail
          receiverName={payload.receiverName}
          senderName={payload.senderName}
          postTitle={payload.postTitle}
          statusMessage={payload.statusMessage}
          statusColor={payload.statusColor}
          rejectionReason={payload.rejectionReason}
          requestUrl={payload.requestUrl}
        />
      ),
    })
  }

  // Phương thức gửi email dạng HTML thông thường
  send(payload: { to: string; subject: string; html: string }) {
    console.log('[EmailService] Gửi email HTML thông thường')
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    })
  }

  // Phương thức gửi email đặt lại mật khẩu
  async sendResetPassword(payload: {
    email: string
    code: string
    expiry: number
  }) {
    const subject = 'Đặt lại mật khẩu'
    const templateKey = 'email_reset_password_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho đặt lại mật khẩu'
      )
      const html = this.renderTemplate(dbTemplate, {
        code: payload.code,
        expiry: payload.expiry,
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log('[EmailService] Sử dụng React component cho đặt lại mật khẩu')
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: <ResetPasswordEmail code={payload.code} expiry={payload.expiry} />,
    })
  }
}
