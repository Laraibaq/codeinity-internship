import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;

// Matches the mobile OTP-verify screen's own MAX_ATTEMPTS constant
// (apps/mobile/src/app/(passenger-auth)/otp-verify.tsx) -- keep them in sync. Once a code's
// attempts reach this, the row is deleted so the same code can no longer be guessed against at
// all; the user must request a new one (the frontend already shows "Please resend a new code."
// once its own local counter hits zero, so this makes that copy actually true instead of
// aspirational).
const MAX_VERIFY_ATTEMPTS = 3;

// `purpose` namespaces the key (e.g. "signup" vs "password-reset") so a code sent for one flow
// can't be replayed to satisfy the other -- both flows key by the same phone/email identifier, and
// without this a code texted for signup verification would also happily verify a password reset
// on that same identifier.
@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async request(purpose: string, identifier: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpCode.upsert({
      where: { purpose_identifier: { purpose, identifier } },
      create: {
        purpose,
        identifier,
        codeHash: this.hash(code),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      update: {
        codeHash: this.hash(code),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    // In production, never leak plaintext OTP codes to logs.
    if (process.env.NODE_ENV === 'production') {
      const maskedId =
        identifier.length > 5
          ? `${identifier.slice(0, 3)}***${identifier.slice(-2)}`
          : '***';
      console.log(`[otp:${purpose}] OTP code dispatched to ${maskedId} (code redacted in production)`);
    } else {
      console.log(`[otp:${purpose}] code for ${identifier}: ${code} (expires in 5 min)`);
    }

    return code;
  }

  async verify(purpose: string, identifier: string, code: string): Promise<boolean> {
    const where = { purpose_identifier: { purpose, identifier } };
    const stored = await this.prisma.otpCode.findUnique({ where });
    if (!stored) return false;

    if (stored.expiresAt.getTime() < Date.now()) {
      await this.prisma.otpCode.delete({ where }).catch(() => undefined);
      return false;
    }

    if (stored.codeHash !== this.hash(code)) {
      const attempts = stored.attempts + 1;
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        // Exhausted -- force a resend instead of leaving a guessable code around.
        await this.prisma.otpCode.delete({ where }).catch(() => undefined);
      } else {
        await this.prisma.otpCode.update({ where, data: { attempts } });
      }
      return false;
    }

    await this.prisma.otpCode.delete({ where }).catch(() => undefined);
    return true;
  }
}
