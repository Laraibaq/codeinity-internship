import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Permissive for now: the mobile app is tested from whatever LAN IP/port a physical device or
  // emulator happens to be on, which isn't a fixed origin to allowlist yet. Auth uses a Bearer
  // token, not cookies, so this doesn't expose credentialed cross-origin requests. Scope this down
  // to real origins before any production deployment.
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
