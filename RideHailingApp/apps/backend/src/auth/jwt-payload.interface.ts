export type AuthRole = 'driver' | 'passenger';

export interface JwtPayload {
  sub: string;
  role: AuthRole;
}

// Issued by /auth/password-reset/verify and consumed by /auth/password-reset/confirm -- a
// short-lived, single-purpose token so "confirm" doesn't need the identifier/code sent alongside
// the new password (which would let anyone who saw the identifier+code pair to guess reuse it
// indefinitely). `purpose` prevents an access/refresh token from being replayed here instead.
export interface PasswordResetTokenPayload {
  sub: string; // the identifier (phone or email) the code was verified against
  purpose: 'password-reset';
  jti: string; // lets confirmPasswordReset mark this specific token as spent -- see its comment
}
