import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // Registered with the access-token secret/expiry as defaults; sign()/verify() calls for
    // refresh tokens pass their own secret/expiresIn to override these per-call (see
    // auth.service.ts) rather than standing up a second JwtModule.
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900), // seconds
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, EmailService, JwtStrategy],
})
export class AuthModule {}
