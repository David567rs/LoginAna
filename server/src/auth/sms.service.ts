import { Injectable } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private client = twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || '',
  );
  private svcSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  async sendSms(to: string, body: string) {
    const debug = String(process.env.SMS_DEBUG || 'false') === 'true';
    if (!this.svcSid && !process.env.TWILIO_FROM) {
      throw new Error('Configura TWILIO_MESSAGING_SERVICE_SID o TWILIO_FROM');
    }
    if (!to.startsWith('+') && debug) {
      // eslint-disable-next-line no-console
      console.warn('[SMS] El número destino no está en formato E.164 (+NNNN).', to);
    }
    const params: any = this.svcSid
      ? { messagingServiceSid: this.svcSid, to, body }
      : { from: process.env.TWILIO_FROM!, to, body };
    const msg = await this.client.messages.create(params);
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[SMS] Enviado:', { sid: msg.sid, status: msg.status, to: msg.to });
    }
    return msg;
  }
}
