import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private async sendWithSendGrid(to: string, subject: string, html: string) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return null;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) throw new Error('SENDGRID: falta FROM (SMTP_FROM o SMTP_USER)');
    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SendGrid error ${resp.status}: ${text}`);
    }
    return { messageId: resp.headers.get('x-message-id') || 'sendgrid' } as any;
  }

  private async sendWithResend(to: string, subject: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    const from = process.env.SMTP_FROM || 'onboarding@resend.dev';
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend error ${resp.status}: ${text}`);
    }
    const json: any = await resp.json();
    return { messageId: json?.id || 'resend' } as any;
  }

  private buildTransport(preferStartTls = false) {
    const useService = String(process.env.SMTP_SERVICE || '').toLowerCase();
    const hasExplicitHost = Boolean(process.env.SMTP_HOST);
    const common: any = {
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      logger: String(process.env.SMTP_DEBUG || 'false') === 'true',
      debug: String(process.env.SMTP_DEBUG || 'false') === 'true',
    };

    // Preferencia explícita por host/puerto si están configurados
    if (hasExplicitHost) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        ...common,
      } as any);
    }

    // Gmail: probar 465 (TLS) por defecto o 587 (STARTTLS) si preferStartTls
    if (useService === 'gmail') {
      if (preferStartTls) {
        return nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, ...common } as any);
      }
      return nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, ...common } as any);
    }

    // Otros servicios soportados por nodemailer
    if (useService) {
      return nodemailer.createTransport({ service: process.env.SMTP_SERVICE, ...common } as any);
    }

    // Predeterminado: 587 STARTTLS
    return nodemailer.createTransport({ host: 'localhost', port: 587, secure: false, ...common } as any);
  }

  private isConnError(err: any) {
    const code = err?.code || '';
    const msg = String(err?.message || '').toLowerCase();
    return (
      code === 'ETIMEDOUT' ||
      code === 'ECONNECTION' ||
      msg.includes('timed out') ||
      msg.includes('getaddrinfo enotfound') ||
      msg.includes('connection timeout')
    );
  }

  async sendMail(to: string, subject: string, html: string) {
    const debug = String(process.env.SMTP_DEBUG || 'false') === 'true';
    // 1) Preferir API por HTTP si está disponible
    if (process.env.SENDGRID_API_KEY) {
      try {
        if (debug) console.log('[Email] Intentando SendGrid API');
        const info = await this.sendWithSendGrid(to, subject, html);
        if (debug) console.log('[Email] SendGrid OK:', info?.messageId || 'ok');
        return info;
      } catch (e: any) {
        console.error('[Email] SendGrid fallo:', e?.message || e);
        // Si SendGrid está configurado, no intentes SMTP (evita puertos bloqueados en PaaS)
        throw e;
      }
    }
    if (process.env.RESEND_API_KEY) {
      try {
        if (debug) console.log('[Email] Intentando Resend API');
        const info = await this.sendWithResend(to, subject, html);
        if (debug) console.log('[Email] Resend OK:', info?.messageId || 'ok');
        return info;
      } catch (e: any) {
        console.error('[Email] Resend fallo:', e?.message || e);
        // Si Resend está configurado, no intentes SMTP
        throw e;
      }
    }

    // 2) SMTP (con fallback 465 -> 587 para Gmail)
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) {
      console.error('SMTP_FROM/SMTP_USER no configurado. Imposible enviar correo.');
      throw new Error('Email no configurado');
    }
    let transporter = this.buildTransport(false);
    try {
      const info = await transporter.sendMail({ from, to, subject, html });
      if (debug) console.log('Email sent:', info.messageId);
      return info;
    } catch (err: any) {
      if (debug) console.error('SMTP intento 1 falló:', err?.code || '', err?.message || err);
      const useService = String(process.env.SMTP_SERVICE || '').toLowerCase();
      const hasExplicitHost = Boolean(process.env.SMTP_HOST);
      const canFallback = !hasExplicitHost && useService === 'gmail' && this.isConnError(err);
      if (canFallback) {
        try {
          if (debug) console.warn('Reintentando SMTP por STARTTLS (587) para Gmail...');
          transporter = this.buildTransport(true);
          const info = await transporter.sendMail({ from, to, subject, html });
          if (debug) console.log('Email sent (fallback 587):', info.messageId);
          return info;
        } catch (err2: any) {
          if (debug) console.error('SMTP intento 2 (587) falló:', err2?.code || '', err2?.message || err2);
          throw err2;
        }
      }
      throw err;
    }
  }
}
