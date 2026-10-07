import { AuthService } from './auth.service';

// Focused on the specific bug this suite guards against: verifyOtp must verify phone ownership
// only, and must never be the thing that approves a driver to actually drive. Approval is an
// admin-only action (see admin.service.spec.ts for approveDriver's own tests).
describe('AuthService.verifyOtp (phone-verification / driver-approval decoupling)', () => {
  let prisma: any;
  let otp: any;
  let email: any;
  let jwt: any;
  let auth: AuthService;

  beforeEach(() => {
    prisma = {
      driver: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    otp = { verify: jest.fn().mockResolvedValue(true) };
    email = { sendOtpCode: jest.fn() };
    jwt = {};
    auth = new AuthService(prisma, jwt, otp, email);
  });

  it('sets phoneVerified but never touches verificationStatus on the driver row', async () => {
    await auth.verifyOtp({ phone: '+15551234567', code: '123456' });

    expect(prisma.driver.updateMany).toHaveBeenCalledWith({
      where: { phone: '+15551234567' },
      data: { phoneVerified: true },
    });
    const driverCallData = prisma.driver.updateMany.mock.calls[0][0].data;
    expect(driverCallData).not.toHaveProperty('verificationStatus');
  });

  it('sets phoneVerified on the passenger (User) row the same way', async () => {
    await auth.verifyOtp({ phone: '+15551234567', code: '123456' });

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { phone: '+15551234567' },
      data: { phoneVerified: true },
    });
  });

  it('throws and touches nothing when the code is invalid', async () => {
    otp.verify.mockResolvedValue(false);

    await expect(
      auth.verifyOtp({ phone: '+15551234567', code: '000000' }),
    ).rejects.toThrow();
    expect(prisma.driver.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
