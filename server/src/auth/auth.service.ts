import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { OtpService, OtpChannel } from './otp.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly emailer: EmailService,
    private readonly sms: SmsService,
  ) {}

  async register(name: string, email: string, password: string, phone?: string) {
    if (!name || name.trim().length < 2) throw new BadRequestException('Nombre requerido (min 2 caracteres)');
    if (!email || !password) throw new BadRequestException('Email y contraseña requeridos');
    if (!phone) throw new BadRequestException('Teléfono requerido para verificación por SMS');
    const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strong.test(password)) {
      throw new BadRequestException('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 número y 1 caracter especial');
    }
    const user = await this.users.create(name.trim(), email, password, phone);
    // Generar token de verificación de email y código SMS
    const emailToken = genToken(32);
    const emailExp = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await (await this.users.getInternalByEmail(email))?.updateOne({
      emailVerifyToken: emailToken,
      emailVerifyExpires: emailExp,
    });

    if (phone) {
      const smsCode = genNumericCode(6);
      const smsExp = new Date(Date.now() + 1000 * 60 * 10); // 10m
      await (await this.users.getInternalByEmail(email))?.updateOne({
        phoneVerifyCode: smsCode,
        phoneVerifyExpires: smsExp,
      });
      // Enviar SMS real
      try {
        await this.sms.sendSms(phone, `Tu código de verificación es: ${smsCode}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Fallo al enviar SMS:', e);
      }
    }

    // Enviar email real con link
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${client}/verify-email?token=${emailToken}`;
    if (String(process.env.SMTP_DEBUG || 'false') === 'true') {
      // eslint-disable-next-line no-console
      console.log('[EmailVerify] CLIENT_URL =', client, 'verifyUrl =', verifyUrl.replace(/token=.*/, 'token=***'));
    }
    try {
      await this.emailer.sendMail(
        email,
        'Confirma tu correo',
        `<p>Gracias por registrarte. Confirma tu correo dando clic en el siguiente enlace:</p>
         <p><a href="${verifyUrl}">Confirmar correo</a></p>
         <p>Si no solicitaste este registro, ignora este mensaje.</p>`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Fallo al enviar correo:', e);
    }
    return { ok: true, message: 'Registro creado. Revisa tu correo y SMS para verificar.' };
  }

  async login(email: string, password: string, method?: OtpChannel) {
    if (!email || !password) throw new UnauthorizedException('Credenciales inválidas');
    const user = await this.users.validatePassword(email, password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.emailVerified || !user.phoneVerified) {
      throw new UnauthorizedException('Cuenta no verificada. Confirma correo y SMS.');
    }

    if (method) {
      const ch = this.otp.create(user.id, method);
      try {
        if (method === 'email') {
          await this.emailer.sendMail(
            user.email,
            'Tu código de inicio de sesión',
            `<p>Tu código es: <b>${ch.code}</b> (válido 5 min)</p>`,
          );
        } else if (method === 'sms') {
          const doc = await this.users.getInternalByEmail(user.email);
          const phone = doc?.phone;
          if (!phone) throw new BadRequestException('Este usuario no tiene teléfono registrado');
          await this.sms.sendSms(phone, `Tu código de inicio de sesión es: ${ch.code}`);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Fallo al enviar OTP de login:', e);
      }
      return { two_factor_required: true, method, challengeId: ch.id };
    }

    const payload = { sub: user.id, email: user.email, name: (user as any).name };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }

  async verify2fa(challengeId: string, code: string) {
    const ch = this.otp.verify(challengeId, code);
    if (!ch) throw new UnauthorizedException('Código inválido');
    const payload = { sub: ch.userId };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }

  async verifyEmailToken(token: string) {
    return this.users.verifyEmail(token);
  }

  async verifyPhoneCode(email: string, code: string) {
    return this.users.verifyPhone(email, code);
  }

  async resendEmail(email: string) {
    const doc = await this.users.getInternalByEmail(email);
    if (!doc) return { ok: true }; // no revelamos existencia
    const emailToken = genToken(32);
    const emailExp = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await doc.updateOne({ emailVerifyToken: emailToken, emailVerifyExpires: emailExp });
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${client}/verify-email?token=${emailToken}`;
    if (String(process.env.SMTP_DEBUG || 'false') === 'true') {
      // eslint-disable-next-line no-console
      console.log('[EmailVerify][Resend] CLIENT_URL =', client, 'verifyUrl =', verifyUrl.replace(/token=.*/, 'token=***'));
    }
    try {
      await this.emailer.sendMail(
        doc.email,
        'Confirma tu correo (reenvío)',
        `<p>Confirma tu correo dando clic en el siguiente enlace:</p><p><a href="${verifyUrl}">Confirmar correo</a></p>`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Fallo al reenviar correo:', e);
    }
    return { ok: true };
  }

  async resendSms(email: string) {
    const doc = await this.users.getInternalByEmail(email);
    if (!doc || !doc.phone) return { ok: true };
    const smsCode = genNumericCode(6);
    const smsExp = new Date(Date.now() + 1000 * 60 * 10);
    await doc.updateOne({ phoneVerifyCode: smsCode, phoneVerifyExpires: smsExp });
    try {
      await this.sms.sendSms(doc.phone!, `Tu código de verificación es: ${smsCode}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Fallo al reenviar SMS:', e);
    }
    return { ok: true };
  }

  // Nuevo: verificación 2FA que arma JWT con name/email, con fallback por email
  async verify2faFull2(challengeId: string, code: string, email?: string) {
    const ch = this.otp.verify(challengeId, code);
    if (!ch) throw new UnauthorizedException('Código inválido');
    let u = ch.userId ? await this.users.findById(ch.userId) : null;
    if (!u && email) {
      u = await this.users.getInternalByEmail(email);
    }
    const payload = u && (u as any).email
      ? { sub: (u as any).id ?? ch.userId, email: (u as any).email, name: (u as any).name }
      : { sub: ch.userId };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }

  // Flujo de recuperación de contraseña
  async forgotPassword(email: string, method: OtpChannel) {
    const user = await this.users.getInternalByEmail(email);
    if (!user) return { ok: true };
    const ch = this.otp.create(String((user as any)._id ?? (user as any).id), method, 10 * 60 * 1000);
    try {
      if (method === 'email') {
        await this.emailer.sendMail(
          (user as any).email,
          'Recuperación de contraseña',
          `<p>Tu código para recuperar la contraseña es: <b>${ch.code}</b> (válido 10 min)</p>`,
        );
      } else if ((user as any).phone) {
        await this.sms.sendSms((user as any).phone, `Código para recuperar tu contraseña: ${ch.code}`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Fallo al enviar código de recuperación:', e);
    }
    return { ok: true, challengeId: ch.id };
  }

  async verifyResetCode(challengeId: string, code: string) {
    const ch = this.otp.verify(challengeId, code);
    if (!ch) throw new UnauthorizedException('Código inválido');
    const reset_token = await this.jwt.signAsync({ sub: ch.userId, type: 'reset' }, { expiresIn: '10m' });
    return { reset_token };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(resetToken);
    } catch {
      throw new UnauthorizedException('Token de recuperación inválido o expirado');
    }
    if (decoded?.type !== 'reset' || !decoded?.sub) throw new UnauthorizedException('Token de recuperación inválido');
    await this.users.updatePasswordById(decoded.sub, newPassword);
    return { ok: true };
  }
  async verify2faFull(challengeId: string, code: string, email?: string) {
    const ch = this.otp.verify(challengeId, code);
    if (!ch) throw new UnauthorizedException('Código inválido');
    const u = await this.users.findById(ch.userId);
    const payload = u ? { sub: ch.userId, email: (u as any).email, name: (u as any).name } : { sub: ch.userId };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}

function genToken(len = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function genNumericCode(len = 6) {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}
