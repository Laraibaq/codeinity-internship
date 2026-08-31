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
//
// `purpose` namespaces the key (e.g. "signup" vs "password-reset") so a code sent for one flow
// can't be replayed to satisfy the other -- both flows key by the same phone/email identifier, and
// without this a code texted for signup verification would also happily verify a password reset
// on that same identifier.
@Injectable()
export class OtpService {
  private readonly codes = new Map<string, StoredOtp>();

  request(purpose: string, identifier: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(`${purpose}:${identifier}`, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    // TODO: replace with a real SMS/email send (Twilio or a local gateway) once one is wired up.
    console.log(`[otp:${purpose}] code for ${identifier}: ${code} (expires in 5 min)`);

    return code;
  }

  verify(purpose: string, identifier: string, code: string): boolean {
    const key = `${purpose}:${identifier}`;
    const stored = this.codes.get(key);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.codes.delete(key);
      return false;
    }
    if (stored.code !== code) return false;

    this.codes.delete(key);
    return true;
  }
}
