import { IsEmail } from 'class-validator';

export class ResendSmsDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;
}

