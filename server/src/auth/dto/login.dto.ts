import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password!: string;

  // Método de segundo factor: 'email' o 'sms'. Opcional
  @IsOptional()
  @IsIn(['email', 'sms'], { message: 'method debe ser "email" o "sms"' })
  method?: 'email' | 'sms';
}
