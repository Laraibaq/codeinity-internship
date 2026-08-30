import { Injectable } from '@nestjs/common';

const OTP_TTL_MS = 5 * 60 * 1000;

interface StoredOtp {
  code: string;
  expiresAt: number;
}

// MVP1 stub: codes live in an in-memory Map, not a DB table, so they're lost on every server
// restart. Fine for this phase since there's no real SMS delivery yet either -- once Twilio (or a
// local SMS gateway, per Dependencies.docx §4) is wired up, move this to a persisted store so
// codes survive across instances/restarts.
@Injectable()
export class OtpService {
  private readonly codes = new Map<string, StoredOtp>();

  request(phone: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });

    // TODO: replace with a real SMS send (Twilio or a local gateway) once one is wired up.
    console.log(`[otp] code for ${phone}: ${code} (expires in 5 min)`);

    return code;
  }

  verify(phone: string, code: string): boolean {
    const stored = this.codes.get(phone);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.codes.delete(phone);
      return false;
    }
    if (stored.code !== code) return false;

    this.codes.delete(phone);
    return true;
  }
}
