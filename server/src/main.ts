import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilita CORS para permitir llamadas desde el frontend
  app.enableCors({ origin: true, credentials: true });
  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false },
      stopAtFirstError: true,
    }),
  );
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  const url = await app.getUrl();
  // eslint-disable-next-line no-console
  console.log(`API escuchando en ${url} (host=${host})`);
}
bootstrap();
