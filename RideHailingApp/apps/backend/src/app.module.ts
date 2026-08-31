import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // App-wide default (any endpoint not carrying its own @Throttle override, e.g. registration):
    // 20 requests per minute per IP. Auth endpoints prone to credential-guessing or spam (login,
    // OTP/password-reset requests) set a tighter 5/min override directly on themselves -- see
    // auth.controller.ts.
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 20, ttl: 60_000 }],
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
