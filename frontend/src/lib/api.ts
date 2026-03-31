import type {
  AuthResponse,
  ConcertItem,
  DashboardStats,
  HistoryRecord,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = "Unable to connect to the server. Please check your internet connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

type RequestConfig = RequestInit & {
  token?: string | null;
};

async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { token, headers, ...rest } = config;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new NetworkError();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = getApiErrorMessage(payload) ?? response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getApiErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    Array.isArray((payload as { message: unknown }).message)
  ) {
    return ((payload as { message: string[] }).message).join(" ");
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return null;
}

export function extractFieldErrors(error: unknown) {
  if (!(error instanceof ApiError)) {
    return {} as Record<string, string>;
  }

  const details = error.details as { message?: string[] | string } | undefined;
  const messages = Array.isArray(details?.message)
    ? details?.message
    : typeof details?.message === "string"
      ? [details.message]
      : [error.message];

  const fieldErrors: Record<string, string> = {};

  for (const message of messages) {
    if (message.toLowerCase().includes("name")) {
      fieldErrors.name = message;
    } else if (message.toLowerCase().includes("description")) {
      fieldErrors.description = message;
    } else if (message.toLowerCase().includes("seat")) {
      fieldErrors.totalSeats = message;
    } else if (message.toLowerCase().includes("username")) {
      fieldErrors.username = message;
    } else if (message.toLowerCase().includes("password")) {
      fieldErrors.password = message;
    } else {
      fieldErrors.general = message;
    }
  }

  return fieldErrors;
}

export const api = {
  register(username: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  login(username: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  me(token: string) {
    return request<{ id: number; username: string; role: "ADMIN" | "USER" }>(
      "/auth/me",
      { token },
    );
  },

  concerts(token: string) {
    return request<ConcertItem[]>("/concerts", { token });
  },

  stats(token: string) {
    return request<DashboardStats>("/concerts/stats", { token });
  },

  createConcert(
    token: string,
    payload: { name: string; description: string; totalSeats: number },
  ) {
    return request<ConcertItem>("/concerts", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  deleteConcert(token: string, id: number) {
    return request<{ deleted: true; id: number }>(`/concerts/${id}`, {
      method: "DELETE",
      token,
    });
  },

  reserve(token: string, concertId: number) {
    return request("/reservations", {
      method: "POST",
      token,
      body: JSON.stringify({ concertId }),
    });
  },

  cancel(token: string, concertId: number) {
    return request(`/reservations/${concertId}`, {
      method: "DELETE",
      token,
    });
  },

  userHistory(token: string) {
    return request<HistoryRecord[]>("/reservations/history", { token });
  },

  allHistory(token: string) {
    return request<HistoryRecord[]>("/reservations/history/all", { token });
  },
};