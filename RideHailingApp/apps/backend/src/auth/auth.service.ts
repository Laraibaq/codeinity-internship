import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { RegisterPassengerDto } from './dto/register-passenger.dto';
import { JwtPayload } from './jwt-payload.interface';
import { OtpService } from './otp.service';

// Seconds, not a duration string ("15m") -- jsonwebtoken's `expiresIn` types itself against a
// template-literal union for strings, which a plain env-var string can't satisfy without an
// unsafe cast. A number of seconds is valid and needs no cast.
const ACCESS_EXPIRES_IN = Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900); // 15 min
const REFRESH_EXPIRES_IN = Number(
  process.env.JWT_REFRESH_EXPIRES_IN ?? 2592000,
); // 30 days

@Injectable()
export class AuthService {
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
    this.otp.request(dto.phone);
    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const valid = this.otp.verify(dto.phone, dto.code);
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
      return this.issueTokens({ sub: driver.id, role: 'driver' });
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.identifier }, { email: dto.identifier }] },
    });
    if (user && (await argon2.verify(user.passwordHash, dto.password))) {
      return this.issueTokens({ sub: user.id, role: 'passenger' });
    }

    throw new UnauthorizedException('Invalid credentials');
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
