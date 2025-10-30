import { IsEmail } from 'class-validator';

export class ResendEmailDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email!: string;
}

