import { IsString, Matches, MinLength } from 'class-validator';

export class VerifyResetDto {
  @IsString()
  @MinLength(4)
  challengeId!: string;

  @Matches(/^\d{6}$/u, { message: 'El código debe ser de 6 dígitos' })
  code!: string;
}

