import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    console.log('✅ SendGrid configurado. API Key:', process.env.SENDGRID_API_KEY ? '✓' : '✗');
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const msg = {
        to: to,
        from: process.env.SENDGRID_FROM_EMAIL || 'resendez515@gmail.com', // Puede ser cualquier email
        subject: subject,
        html: html,
      };

      console.log('📧 Enviando email via SendGrid a:', to);
      
      await sgMail.send(msg);
      console.log('✅ Email enviado exitosamente via SendGrid');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error SendGrid:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.body);
      }
      throw error;
    }
  }
}