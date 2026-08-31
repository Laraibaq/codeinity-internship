import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// MVP1 stub, same "no real provider account exists yet" situation as OtpService's SMS TODO.
// Nodemailer's Ethereal test account needs no signup/API key at all -- it hands back a real SMTP
// account on first use and actually accepts the send, but delivers nowhere; every sent message
// gets a public preview URL instead, logged to the console the same way OtpService logs the raw
// code. That's enough to genuinely test the email-verification flow end-to-end (open the link, see
// the real rendered email, read the code) without needing anyone's SMTP credentials.
// TODO: swap the transporter below for a real provider (SMTP/Resend/SES) once one is wired up --
// nothing else in this file would need to change, sendOtpEmail's signature stays the same.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporterPromise: Promise<nodemailer.Transporter> | null = null;

  private getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporterPromise) {
      this.transporterPromise = nodemailer.createTestAccount().then((account) =>
        nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        }),
      );
    }
    return this.transporterPromise;
  }

  async sendOtpCode(to: string, code: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Indigo Motion" <no-reply@indigomotion.test>',
        to,
        subject: `Your verification code: ${code}`,
        text: `Your Indigo Motion verification code is ${code}. It expires in 5 minutes.`,
        html: `<p>Your Indigo Motion verification code is <strong style="font-size:20px">${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(
        `[email] sent verification code to ${to}${previewUrl ? ` -- preview: ${previewUrl}` : ''}`,
      );
    } catch (error) {
      // Never let a broken test-inbox connection fail the OTP request itself -- the code is still
      // valid and still logged by OtpService's own console line, so the flow stays testable even
      // if this particular send fails (e.g. no network reachability to Ethereal from this
      // machine).
      this.logger.error(
        `[email] failed to send verification code to ${to}: ${(error as Error).message}`,
      );
    }
  }
}
