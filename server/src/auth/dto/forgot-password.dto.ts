import { IsEmail, IsIn } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;

  @IsIn(['email', 'sms'], { message: 'method debe ser "email" o "sms"' })
  method!: 'email' | 'sms';
}

