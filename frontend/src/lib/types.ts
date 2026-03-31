export type UserRole = "ADMIN" | "USER";
export type ReservationStatus = "RESERVED" | "CANCELLED";
export type ReservationAction = "RESERVE" | "CANCEL";

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}

export interface ConcertItem {
  id: number;
  name: string;
  description: string;
  totalSeats: number;
  reservedSeats: number;
  cancelledSeats: number;
  availableSeats: number;
  isSoldOut: boolean;
  userReservationStatus: ReservationStatus | null;
}

export interface DashboardStats {
  totalSeats: number;
  reservedSeats: number;
  cancelledReservations: number;
}

export interface HistoryRecord {
  id: number;
  action: ReservationAction;
  createdAt: string;
  concert: {
    id: number;
    name: string;
  };
  user?: SessionUser;
}

export interface JwtSessionPayload {
  sub: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}