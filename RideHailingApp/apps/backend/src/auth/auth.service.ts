import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { RegisterPassengerDto } from './dto/register-passenger.dto';
import { JwtPayload, PasswordResetTokenPayload } from './jwt-payload.interface';
import { OtpService } from './otp.service';

const SIGNUP_OTP_PURPOSE = 'signup';
const PASSWORD_RESET_OTP_PURPOSE = 'password-reset';
const PASSWORD_RESET_TOKEN_EXPIRES_IN = 600; // 10 minutes -- long enough to type a new password,
// short enough that a leaked reset token isn't useful for long.

// Seconds, not a duration string ("15m") -- jsonwebtoken's `expiresIn` types itself against a
// template-literal union for strings, which a plain env-var string can't satisfy without an
// unsafe cast. A number of seconds is valid and needs no cast.
const ACCESS_EXPIRES_IN = Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900); // 15 min
const REFRESH_EXPIRES_IN = Number(
  process.env.JWT_REFRESH_EXPIRES_IN ?? 2592000,
); // 30 days

@Injectable()
export class AuthService {
  // A reset token is a self-contained JWT, so nothing stops it being replayed for a second
  // password change within its own 10-minute validity window unless something outside the token
  // itself remembers "this one's already been spent." Tracks consumed reset-token IDs (`jti`) in
  // memory, same MVP1-stub reasoning as OtpService's in-memory codes: fine for a single instance,
  // lost on restart, which only matters for tokens that were about to expire anyway.
  private readonly consumedResetTokenIds = new Map<string, number>(); // jti -> expiresAt (ms)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
  ) {}

  async registerDriver(dto: RegisterDriverDto) {
    const passwordHash = await argon2.hash(dto.password);
    try {
      const driver = await this.prisma.driver.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
        },
      });
      return this.omitPasswordHash(driver);
    } catch (error) {
      throw this.toConflictIfDuplicate(error);
    }
  }

  async registerPassenger(dto: RegisterPassengerDto) {
    const passwordHash = await argon2.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
        },
      });
      return this.omitPasswordHash(user);
    } catch (error) {
      throw this.toConflictIfDuplicate(error);
    }
  }

  requestOtp(dto: OtpRequestDto) {
    this.otp.request(SIGNUP_OTP_PURPOSE, dto.phone);
    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const valid = this.otp.verify(SIGNUP_OTP_PURPOSE, dto.phone, dto.code);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // A phone can belong to a Driver row, a User row, both, or neither (e.g. verifying before
    // registration exists yet) -- mark verified on whichever record(s) already exist.
    await this.prisma.driver.updateMany({
      where: { phone: dto.phone },
      data: { phoneVerified: true },
    });
    await this.prisma.user.updateMany({
      where: { phone: dto.phone },
      data: { phoneVerified: true },
    });

    return { verified: true };
  }

  async login(dto: LoginDto) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ phone: dto.identifier }, { email: dto.identifier }] },
    });
    if (driver && (await argon2.verify(driver.passwordHash, dto.password))) {
      // A driver's account can exist (and legitimately log in) before their documents are
      // reviewed -- the client needs `verificationStatus` to route pending/rejected drivers to
      // verification-status.tsx instead of the dashboard, rather than assuming every successful
      // login means "cleared to drive".
      return {
        ...this.issueTokens({ sub: driver.id, role: 'driver' }),
        role: 'driver' as const,
        verificationStatus: driver.verificationStatus,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.identifier }, { email: dto.identifier }] },
    });
    if (user && (await argon2.verify(user.passwordHash, dto.password))) {
      return {
        ...this.issueTokens({ sub: user.id, role: 'passenger' }),
        role: 'passenger' as const,
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const account = await this.findAccountByIdentifier(dto.identifier);
    // Same response whether or not the account exists -- otherwise this endpoint would let anyone
    // check which phones/emails have accounts just by watching which response they get back.
    if (account) {
      this.otp.request(PASSWORD_RESET_OTP_PURPOSE, dto.identifier);
    }
    return { message: 'If that account exists, a reset code has been sent.' };
  }

  async verifyPasswordReset(dto: PasswordResetVerifyDto) {
    const valid = this.otp.verify(
      PASSWORD_RESET_OTP_PURPOSE,
      dto.identifier,
      dto.code,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const resetToken = this.jwt.sign(
      {
        sub: dto.identifier,
        purpose: 'password-reset',
        jti: randomUUID(),
      } satisfies PasswordResetTokenPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: PASSWORD_RESET_TOKEN_EXPIRES_IN,
      },
    );
    return { resetToken };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    let payload: PasswordResetTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<PasswordResetTokenPayload>(
        dto.resetToken,
        { secret: process.env.JWT_ACCESS_SECRET },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    this.purgeExpiredResetTokenIds();
    if (this.consumedResetTokenIds.has(payload.jti)) {
      throw new UnauthorizedException('This reset code has already been used');
    }
    this.consumedResetTokenIds.set(
      payload.jti,
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_IN * 1000,
    );

    const passwordHash = await argon2.hash(dto.password);
    const identifier = payload.sub;

    // Same "whichever record(s) already exist" convention as verifyOtp above -- an identifier
    // could in principle match both a Driver and a User row.
    await this.prisma.driver.updateMany({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
      data: { passwordHash },
    });
    await this.prisma.user.updateMany({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
      data: { passwordHash },
    });

    return { message: 'Password updated' };
  }

  // Keeps consumedResetTokenIds from growing forever -- an entry only needs to outlive its
  // token's own expiry, since an expired token is already rejected by `jwt.verifyAsync` above
  // before this map is even consulted.
  private purgeExpiredResetTokenIds() {
    const now = Date.now();
    for (const [jti, expiresAt] of this.consumedResetTokenIds) {
      if (expiresAt <= now) this.consumedResetTokenIds.delete(jti);
    }
  }

  private async findAccountByIdentifier(identifier: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });
    if (driver) return driver;
    return this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.signAccessToken({
      sub: payload.sub,
      role: payload.role,
    });
    return { accessToken };
  }

  private issueTokens(payload: JwtPayload) {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_EXPIRES_IN,
    });
  }

  private signRefreshToken(payload: JwtPayload) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_EXPIRES_IN,
    });
  }

  private omitPasswordHash<T extends { passwordHash: string }>(
    record: T,
  ): Omit<T, 'passwordHash'> {
    const { passwordHash, ...rest } = record;
    void passwordHash;
    return rest;
  }

  private toConflictIfDuplicate(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('Phone or email already registered');
    }
    return error;
  }
}
