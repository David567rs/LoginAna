import { Injectable, NotFoundException } from '@nestjs/common';
export type OtpChannel = 'email' | 'sms';

interface OtpChallenge {
  id: string;
  userId: string;
  channel: OtpChannel;
  code: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class OtpService {
  private challenges = new Map<string, OtpChallenge>();

  create(userId: string, channel: OtpChannel, ttlMs = 5 * 60 * 1000) {
    const id = cryptoRandomId();
    const code = randomCode(6);
    const expiresAt = Date.now() + ttlMs;
    const challenge: OtpChallenge = { id, userId, channel, code, expiresAt };
    this.challenges.set(id, challenge);
    return challenge;
  }

  get(id: string) {
    const ch = this.challenges.get(id);
    if (!ch) throw new NotFoundException('Challenge no encontrado');
    return ch;
  }

  verify(id: string, code: string) {
    const ch = this.get(id);
    if (Date.now() > ch.expiresAt) {
      this.challenges.delete(id);
      throw new Error('Código expirado');
    }
    const ok = ch.code === code;
    if (!ok) return null;
    this.challenges.delete(id);
    return ch;
  }
}

function randomCode(length: number) {
  let s = '';
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function cryptoRandomId() {
  // Simple id aleatorio legible
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
