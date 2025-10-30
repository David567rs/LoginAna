import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { ResendSmsDto } from './dto/resend-sms.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const { email, password, method } = body ?? ({} as LoginDto);
    return this.auth.login(email, password, method);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    const { name, email, password, phone } = body ?? ({} as RegisterDto);
    return this.auth.register(name, email, password, phone);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: Verify2faDto) {
    const { challengeId, code, email } = body ?? ({} as Verify2faDto);
    return this.auth.verify2faFull2(challengeId, code, email);
  }

  // Verificación de correo por enlace
  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Query('json') json?: string,
    @Query('debug') debug?: string,
    @Res() res?: Response,
  ) {
    const ok = token ? await this.auth.verifyEmailToken(token) : false;
    if (json === '1') {
      if (debug === '1') {
        // Devuelve información adicional para depuración
        const details = token ? await this.users.debugVerifyEmailToken(token) : null;
        return res?.json({ ok, details }) as any;
      }
      return res?.json({ ok }) as any;
    }
    const client = process.env.CLIENT_URL || 'http://localhost:5173';
    const to = `${client}/?emailVerified=${ok ? '1' : '0'}`;
    return res?.redirect(to);
  }

  // Endpoint de ping para verificar conectividad desde dispositivos en LAN
  @Get('ping')
  ping() {
    return {
      ok: true,
      now: Date.now(),
      msg: 'Auth API alive',
    };
  }

  // Verificación de SMS mediante código
  @Post('verify-sms')
  @HttpCode(HttpStatus.OK)
  async verifySms(@Body() body: VerifySmsDto) {
    const ok = await this.auth.verifyPhoneCode(body.email, body.code);
    return { ok };
  }

  @Get('debug-user')
  async debugUser(@Query('email') email: string) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'disabled' };
    }
    if (!email) return { error: 'email required' };
    return this.users.statusByEmail(email);
  }

  @Post('resend-email')
  @HttpCode(HttpStatus.OK)
  async resendEmail(@Body() body: ResendEmailDto) {
    return this.auth.resendEmail(body.email);
  }

  @Post('resend-sms')
  @HttpCode(HttpStatus.OK)
  async resendSms(@Body() body: ResendSmsDto) {
    return this.auth.resendSms(body.email);
  }

  // Password recovery
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email, body.method);
  }

  @Post('password/verify')
  @HttpCode(HttpStatus.OK)
  async verifyReset(@Body() body: VerifyResetDto) {
    return this.auth.verifyResetCode(body.challengeId, body.code);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }
}
