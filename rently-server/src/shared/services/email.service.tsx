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
    const subject = `Gói subscription của bạn đã được tự động gia hạn`
    const templateKey = 'email_auto_renew_notification_template'

    // Định dạng số tiền
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(
      payload.amount
    )
    const formattedBalance = new Intl.NumberFormat('vi-VN').format(
      payload.balance
    )
    const formattedEndDate = new Date(payload.newEndDate).toLocaleDateString(
      'vi-VN'
    )

    // Thử lấy template từ database
    const dbTemplate = await this.getEmailTemplateFromDB(templateKey)

    // Nếu có template trong database thì dùng
    if (dbTemplate) {
      const html = this.renderTemplate(dbTemplate, {
        user_name: payload.userName,
        plan_name: payload.planName,
        amount: formattedAmount,
        new_end_date: formattedEndDate,
        auto_renew_status: payload.autoRenewStatus ? 'Bật' : 'Tắt',
        balance: formattedBalance,
      })

      return this.resend.emails.send({
        from: 'Rently <no-reply@rently.top>',
        to: [payload.email],
        subject,
        html,
      })
    }

    // Nếu không có template trong database, dùng template mặc định
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4F46E5;">Thông báo tự động gia hạn gói subscription</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <p>Xin chào <strong>${payload.userName}</strong>,</p>
          
          <p>Gói subscription <strong>${payload.planName}</strong> của bạn đã được tự động gia hạn thành công.</p>
          
          <ul style="line-height: 1.6;">
            <li>Số tiền thanh toán: <strong>${formattedAmount} VND</strong></li>
            <li>Ngày hết hạn mới: <strong>${formattedEndDate}</strong></li>
            <li>Trạng thái tự động gia hạn: <strong>${payload.autoRenewStatus ? 'Bật' : 'Tắt'}</strong></li>
            <li>Số dư hiện tại: <strong>${formattedBalance} VND</strong></li>
          </ul>
          
          <p>Nếu bạn muốn thay đổi trạng thái tự động gia hạn, vui lòng truy cập vào phần quản lý tài khoản trên hệ thống Rently.</p>
        </div>
        
        <div style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
          <p>Email này được gửi tự động, vui lòng không trả lời. Nếu có thắc mắc, hãy liên hệ với chúng tôi qua phần Liên hệ trên website.</p>
          <p>&copy; 2023 Rently. Đã đăng ký bản quyền.</p>
        </div>
      </div>
    `

    return this.resend.emails.send({
      from: 'Rently <no-reply@rently.top>',
      to: [payload.email],
      subject,
      html: defaultHtml,
    })
  }
}
