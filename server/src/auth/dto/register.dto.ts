import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Nombre inválido' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'La contraseña debe incluir 1 mayúscula, 1 número y 1 caracter especial',
  })
  password!: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/u, { message: 'Teléfono debe estar en formato E.164 (ej. +5215512345678)' })
  phone?: string;
}
