import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { RatingsModule } from './ratings/ratings.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RidesModule } from './rides/rides.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SupportModule } from './support/support.module';
import { NegotiationModule } from './negotiation/negotiation.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // App-wide default (any endpoint not carrying its own @Throttle override, e.g. registration):
    // 20 requests per minute per IP. Auth endpoints prone to credential-guessing or spam (login,
    // OTP/password-reset requests) set a tighter 5/min override directly on themselves -- see
    // auth.controller.ts.
    ThrottlerModule.forRoot({
      throttlers: [{ limit: Number(process.env.THROTTLE_LIMIT || 120), ttl: 60_000 }],
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    DriversModule,
    RidesModule,
    RealtimeModule,
    RatingsModule,
    SupportModule,
    NotificationsModule,
    PaymentsModule,
    NegotiationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
