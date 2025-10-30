import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport((() => {
    const useService = process.env.SMTP_SERVICE; // e.g., 'gmail'
    const common: any = {
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      logger: String(process.env.SMTP_DEBUG || 'false') === 'true',
      debug: String(process.env.SMTP_DEBUG || 'false') === 'true',
    };
    if (useService) {
      return { service: useService, ...common } as any;
    }
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      ...common,
    } as any;
  })());

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    // eslint-disable-next-line no-console
    if (String(process.env.SMTP_DEBUG || 'false') === 'true') console.log('Email sent:', info.messageId);
    return info;
  }
}
