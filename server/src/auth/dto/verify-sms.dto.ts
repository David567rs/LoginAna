import { IsEmail, Matches } from 'class-validator';

export class VerifySmsDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;

  @Matches(/^\d{6}$/u, { message: 'El código debe ser de 6 dígitos' })
  code!: string;
}

