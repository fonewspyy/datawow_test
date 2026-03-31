export type UserRole = 'ADMIN' | 'USER';

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}
