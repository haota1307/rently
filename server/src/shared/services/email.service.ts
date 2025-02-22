import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import envConfig from 'src/shared/config';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY);
  }

  sendOTP(payload: { email: string; code: string }) {
    return this.resend.emails.send({
      from: 'Rently <onboarding@resend.dev>',
      to: [payload.email],
      subject: 'Mã OTP',
      html: `
      <div style="font-family: Arial, sans-serif; text-align: center; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #007bff;">Xác thực tài khoản</h2>
        <p>Xin chào <strong>${payload.email}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Rently</strong>.</p>
        <p>Mã xác thực của bạn là:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff;">${payload.code}</p>
        <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        <hr>
        <p style="font-size: 12px; color: #777;">© 2025 Rently. All rights reserved.</p>
      </div>
    `,
    });
  }
}
