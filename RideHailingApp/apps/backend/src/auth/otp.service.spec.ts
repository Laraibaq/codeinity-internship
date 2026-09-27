import { OtpService } from './otp.service';

describe('OtpService (persisted, real verification -- Phase 2 fix)', () => {
  let prisma: any;
  let otp: OtpService;
  let store: Map<string, any>;

  const key = (purpose: string, identifier: string) => `${purpose}:${identifier}`;

  beforeEach(() => {
    store = new Map();
    prisma = {
      otpCode: {
        upsert: jest.fn(({ where, create, update }) => {
          const k = key(where.purpose_identifier.purpose, where.purpose_identifier.identifier);
          const existing = store.get(k);
          const row = existing ? { ...existing, ...update } : { id: 'row-id', ...create };
          store.set(k, row);
          return Promise.resolve(row);
        }),
        findUnique: jest.fn(({ where }) => {
          const k = key(where.purpose_identifier.purpose, where.purpose_identifier.identifier);
          return Promise.resolve(store.get(k) ?? null);
        }),
        update: jest.fn(({ where, data }) => {
          const k = key(where.purpose_identifier.purpose, where.purpose_identifier.identifier);
          const row = { ...store.get(k), ...data };
          store.set(k, row);
          return Promise.resolve(row);
        }),
        delete: jest.fn(({ where }) => {
          const k = key(where.purpose_identifier.purpose, where.purpose_identifier.identifier);
          store.delete(k);
          return Promise.resolve({});
        }),
      },
    };
    otp = new OtpService(prisma);
  });

  it('accepts the exact code just issued', async () => {
    const code = await otp.request('signup', '+15551234567');
    await expect(otp.verify('signup', '+15551234567', code)).resolves.toBe(true);
  });

  it('rejects a wrong code, and does not accept a wrong-but-6-digit code (the old dev bypass)', async () => {
    await otp.request('signup', '+15551234567');
    await expect(otp.verify('signup', '+15551234567', '000000')).resolves.toBe(false);
    await expect(otp.verify('signup', '+15551234567', '123456')).resolves.toBe(false);
  });

  it('rejects verification against an identifier that never requested a code', async () => {
    await expect(otp.verify('signup', '+15559999999', '123456')).resolves.toBe(false);
  });

  it('does not let a code requested for one purpose verify another purpose for the same identifier', async () => {
    const code = await otp.request('signup', '+15551234567');
    await expect(otp.verify('password-reset', '+15551234567', code)).resolves.toBe(false);
  });

  it('a code can only be used once', async () => {
    const code = await otp.request('signup', '+15551234567');
    await expect(otp.verify('signup', '+15551234567', code)).resolves.toBe(true);
    await expect(otp.verify('signup', '+15551234567', code)).resolves.toBe(false);
  });

  it('rejects an expired code', async () => {
    const code = await otp.request('signup', '+15551234567');
    const row = store.get(key('signup', '+15551234567'));
    row.expiresAt = new Date(Date.now() - 1000);
    await expect(otp.verify('signup', '+15551234567', code)).resolves.toBe(false);
  });

  it('deletes the code after 3 failed attempts, so even the correct code no longer verifies', async () => {
    const code = await otp.request('signup', '+15551234567');
    await expect(otp.verify('signup', '+15551234567', 'wrong1')).resolves.toBe(false);
    await expect(otp.verify('signup', '+15551234567', 'wrong2')).resolves.toBe(false);
    await expect(otp.verify('signup', '+15551234567', 'wrong3')).resolves.toBe(false);
    // 4th call, now with the *correct* code -- row was deleted on the 3rd failure.
    await expect(otp.verify('signup', '+15551234567', code)).resolves.toBe(false);
  });

  it('requesting a new code replaces the previous pending code for the same purpose+identifier', async () => {
    const first = await otp.request('signup', '+15551234567');
    const second = await otp.request('signup', '+15551234567');
    expect(first).not.toBe(second);
    await expect(otp.verify('signup', '+15551234567', first)).resolves.toBe(false);
    await expect(otp.verify('signup', '+15551234567', second)).resolves.toBe(true);
  });

  it('never stores the plaintext code', async () => {
    const code = await otp.request('signup', '+15551234567');
    const row = store.get(key('signup', '+15551234567'));
    expect(row.codeHash).not.toBe(code);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex digest
  });
});
