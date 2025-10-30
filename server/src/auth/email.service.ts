import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport((() => {
    const useService = String(process.env.SMTP_SERVICE || '').toLowerCase();
    const common: any = {
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      logger: String(process.env.SMTP_DEBUG || 'false') === 'true',
      debug: String(process.env.SMTP_DEBUG || 'false') === 'true',
    };

    // Forzar configuración estable para Gmail (App Password requerido)
    if (useService === 'gmail') {
      return {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        ...common,
      } as any;
    }
    // Otras plataformas que soporta nodemailer por "service"
    if (useService) {
      return { service: process.env.SMTP_SERVICE, ...common } as any;
    }
    // Configuración genérica por host/puerto
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      ...common,
    } as any;
  })());

  async sendMail(to: string, subject: string, html: string) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) {
      // eslint-disable-next-line no-console
      console.error('SMTP_FROM/SMTP_USER no configurado. Imposible enviar correo.');
      throw new Error('Email no configurado');
    }
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      // eslint-disable-next-line no-console
      if (String(process.env.SMTP_DEBUG || 'false') === 'true') console.log('Email sent:', info.messageId);
      return info;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Fallo al enviar correo (SMTP):', err?.message || err);
      throw err;
    }
  }
}
