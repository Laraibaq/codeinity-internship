export type AuthRole = 'driver' | 'passenger';

export interface JwtPayload {
  sub: string;
  role: AuthRole;
}
