import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import envConfig from 'src/shared/config';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Hoặc dùng SMTP khác
      auth: {
        user: envConfig.GMAIL_USER,
        pass: envConfig.GMAIL_APP_PASSWORD,
      },
    });
  }

  private generateVerifyEmailTemplate(name: string, otpCode: string): string {
    return `
      <div style="font-family: Arial, sans-serif; text-align: center; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #007bff;">Xác thực tài khoản</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Rently</strong>.</p>
        <p>Mã xác thực của bạn là:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff;">${otpCode}</p>
        <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        <hr>
        <p style="font-size: 12px; color: #777;">© 2025 Rently. All rights reserved.</p>
      </div>
    `;
  }

  async sendVerificationEmail(to: string, name: string, otpCode: string) {
    const htmlContent = this.generateVerifyEmailTemplate(name, otpCode);

    try {
      const info = await this.transporter.sendMail({
        from: `"Rently App" <${envConfig.GMAIL_USER}>`,
        to,
        subject: 'Xác thực tài khoản của bạn',
        html: htmlContent,
      });

      console.log('Email sent:', info.response);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
