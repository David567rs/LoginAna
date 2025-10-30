import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class Verify2faDto {
  @IsString({ message: 'challengeId inválido' })
  @MinLength(4)
  challengeId!: string;

  @Matches(/^\d{6}$/u, { message: 'El código debe ser de 6 dígitos' })
  code!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo inválido' })
  email?: string;
}
