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
import ContactNotificationEmail from 'emails/contact-notification'
import ContactResponseEmail from 'emails/contact-response'
import RoomBillEmail from 'emails/room-bill'
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

  // Phương thức gửi thông báo có liên hệ mới cho admin
  async sendContactNotification(payload: {
    adminEmail: string
    fullName: string
    email: string
    phoneNumber?: string
    subject: string
    message: string
    adminDashboardUrl?: string
  }) {
    const subject = `Liên hệ mới: ${payload.subject}`
    const templateKey = 'email_contact_notification_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho thông báo liên hệ mới'
      )
      const html = this.renderTemplate(dbTemplate, {
        full_name: payload.fullName,
        email: payload.email,
        phone_number: payload.phoneNumber || 'Không cung cấp',
        subject: payload.subject,
        message: payload.message,
        admin_dashboard_url: payload.adminDashboardUrl || '/quan-ly/lien-he',
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.adminEmail],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log(
      '[EmailService] Sử dụng React component từ file cho thông báo liên hệ mới'
    )
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.adminEmail],
      subject,
      react: (
        <ContactNotificationEmail
          fullName={payload.fullName}
          email={payload.email}
          phoneNumber={payload.phoneNumber}
          subject={payload.subject}
          message={payload.message}
          adminDashboardUrl={payload.adminDashboardUrl}
        />
      ),
    })
  }

  // Phương thức gửi phản hồi liên hệ cho người dùng
  async sendContactResponse(payload: {
    to: string
    userName: string
    subject: string
    originalMessage: string
    responseMessage: string
    websiteUrl?: string
  }) {
    const subject = `Phản hồi: ${payload.subject}`
    const templateKey = 'email_contact_response_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho phản hồi liên hệ'
      )
      const html = this.renderTemplate(dbTemplate, {
        user_name: payload.userName,
        subject: payload.subject,
        original_message: payload.originalMessage,
        response_message: payload.responseMessage,
        website_url: payload.websiteUrl || 'https://rently.top',
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.to],
        subject,
        html,
      })
    }

    // Nếu không có hoặc là template React thì dùng React Component
    console.log(
      '[EmailService] Sử dụng React component từ file cho phản hồi liên hệ'
    )
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.to],
      subject,
      react: (
        <ContactResponseEmail
          userName={payload.userName}
          subject={payload.subject}
          originalMessage={payload.originalMessage}
          responseMessage={payload.responseMessage}
          websiteUrl={payload.websiteUrl}
        />
      ),
    })
  }

  // Phương thức gửi email hóa đơn tiền phòng
  async sendRoomBill(payload: {
    email: string
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
  }) {
    const subject = `Hóa đơn tiền phòng ${payload.roomTitle} - ${payload.billingMonth}`
    const templateKey = 'email_room_bill_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho hóa đơn tiền phòng'
      )
      const html = this.renderTemplate(dbTemplate, {
        tenant_name: payload.tenantName,
        room_title: payload.roomTitle,
        billing_month: payload.billingMonth,
        due_date: payload.dueDate,
        electricity_old: payload.electricityOld,
        electricity_new: payload.electricityNew,
        electricity_usage: payload.electricityUsage,
        electricity_price: payload.electricityPrice,
        electricity_amount: payload.electricityAmount,
        water_old: payload.waterOld,
        water_new: payload.waterNew,
        water_usage: payload.waterUsage,
        water_price: payload.waterPrice,
        water_amount: payload.waterAmount,
        other_fees: payload.otherFees,
        total_amount: payload.totalAmount,
        note: payload.note || '',
        payment_url: payload.paymentUrl || 'https://rently.top/nap-tien',
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
      '[EmailService] Sử dụng React component từ file cho hóa đơn tiền phòng'
    )
    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      react: (
        <RoomBillEmail
          tenantName={payload.tenantName}
          roomTitle={payload.roomTitle}
          billingMonth={payload.billingMonth}
          dueDate={payload.dueDate}
          electricityOld={payload.electricityOld}
          electricityNew={payload.electricityNew}
          electricityUsage={payload.electricityUsage}
          electricityPrice={payload.electricityPrice}
          electricityAmount={payload.electricityAmount}
          waterOld={payload.waterOld}
          waterNew={payload.waterNew}
          waterUsage={payload.waterUsage}
          waterPrice={payload.waterPrice}
          waterAmount={payload.waterAmount}
          otherFees={payload.otherFees}
          totalAmount={payload.totalAmount}
          note={payload.note}
          paymentUrl={payload.paymentUrl}
        />
      ),
    })
  }

  async sendAutoRenewNotification(payload: {
    email: string
    userName: string
    planName: string
    amount: number
    newEndDate: Date
    autoRenewStatus: boolean
    balance: number
  }) {
    const subject = `Thông báo gia hạn tự động gói ${payload.planName}`

    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">Rently</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Nền tảng cho thuê nhà trọ</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Thông báo gia hạn tự động</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">Xin chào <strong>${payload.userName}</strong>,</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #374151; margin: 0 0 10px 0;"><strong>Gói dịch vụ:</strong> ${payload.planName}</p>
              <p style="color: #374151; margin: 0 0 10px 0;"><strong>Số tiền:</strong> ${payload.amount.toLocaleString()} VND</p>
              <p style="color: #374151; margin: 0 0 10px 0;"><strong>Ngày hết hạn mới:</strong> ${payload.newEndDate.toLocaleDateString('vi-VN')}</p>
              <p style="color: #374151; margin: 0 0 10px 0;"><strong>Số dư hiện tại:</strong> ${payload.balance.toLocaleString()} VND</p>
              <p style="color: #374151; margin: 0;"><strong>Trạng thái gia hạn tự động:</strong> ${payload.autoRenewStatus ? 'Đã bật' : 'Đã tắt'}</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              ${
                payload.autoRenewStatus
                  ? 'Gói dịch vụ của bạn đã được gia hạn tự động thành công. Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi!'
                  : 'Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng dịch vụ.'
              }
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Truy cập Dashboard
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">Đây là email tự động, vui lòng không phản hồi.</p>
              <p style="margin: 5px 0 0 0;">© 2024 Rently. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </div>
      `,
    })
  }

  /**
   * Admin gửi email trực tiếp đến user
   */
  async sendAdminDirectEmail(payload: {
    to: string
    userName: string
    subject: string
    message: string
    adminName: string
    adminEmail: string
  }) {
    const subject = `[Rently Admin] ${payload.subject}`
    const templateKey = 'email_admin_direct_template'

    // Thử lấy template từ database trước
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template HTML trong database thì dùng
    if (dbTemplate) {
      console.log(
        '[EmailService] Sử dụng HTML template từ database cho admin direct email'
      )
      const html = this.renderTemplate(dbTemplate, {
        user_name: payload.userName,
        subject: payload.subject,
        message: payload.message,
        admin_name: payload.adminName,
        admin_email: payload.adminEmail,
      })
      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.to],
        subject,
        html,
        replyTo: payload.adminEmail, // Cho phép user reply trực tiếp về admin
      })
    }

    // Nếu không có template trong database thì dùng HTML mặc định
    console.log(
      '[EmailService] Sử dụng HTML template mặc định cho admin direct email'
    )

    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.to],
      subject,
      replyTo: payload.adminEmail, // Cho phép user reply trực tiếp về admin
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tin nhắn từ Rently Admin</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa;">
            <tr>
              <td align="center" style="padding: 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: white; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 30px 0 30px; text-align: center;">
                      <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">Rently</h1>
                      <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Nền tảng cho thuê nhà trọ</p>
                    </td>
                  </tr>
                  
                  <!-- Alert Banner -->
                  <tr>
                    <td style="padding: 30px 30px 0 30px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px;">
                        <tr>
                          <td style="padding: 15px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td width="30" style="vertical-align: middle;">
                                  <div style="background-color: #f59e0b; color: white; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 12px; font-weight: bold;">!</div>
                                </td>
                                <td style="vertical-align: middle;">
                                  <span style="color: #92400e; font-weight: 500; font-size: 14px;">Tin nhắn từ quản trị viên Rently</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Subject -->
                  <tr>
                    <td style="padding: 25px 30px 0 30px;">
                      <h2 style="color: #1f2937; margin: 0; font-size: 20px; font-weight: bold;">${payload.subject}</h2>
                    </td>
                  </tr>
                  
                  <!-- Greeting -->
                  <tr>
                    <td style="padding: 20px 30px 0 30px;">
                      <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 16px;">Xin chào <strong>${payload.userName}</strong>,</p>
                    </td>
                  </tr>
                  
                  <!-- Message Content -->
                  <tr>
                    <td style="padding: 25px 30px 0 30px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <tr>
                          <td style="padding: 20px;">
                            <div style="color: #374151; line-height: 1.6; font-size: 16px; white-space: pre-wrap; word-wrap: break-word;">${payload.message}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Sender Info -->
                  <tr>
                    <td style="padding: 25px 30px 0 30px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 6px;">
                        <tr>
                          <td style="padding: 15px;">
                            <p style="color: #6b7280; margin: 0; font-size: 14px;">
                              <strong>Người gửi:</strong> ${payload.adminName}<br>
                              <strong>Email:</strong> ${payload.adminEmail}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Instructions -->
                  <tr>
                    <td style="padding: 25px 30px 0 30px;">
                      <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                        Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng phản hồi trực tiếp email này hoặc liên hệ với chúng tôi qua các kênh hỗ trợ khác.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 30px; text-align: center;">
                      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background-color: #2563eb; border-radius: 6px;">
                            <a href="${process.env.FRONTEND_URL || 'https://rently.top'}" 
                               style="display: inline-block; color: white; padding: 12px 24px; text-decoration: none; font-weight: 500; font-size: 16px;">
                              Truy cập Rently
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding-top: 20px; text-align: center;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">Bạn có thể phản hồi email này để liên hệ trực tiếp với quản trị viên.</p>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">© 2024 Rently. Tất cả quyền được bảo lưu.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })
  }
}
