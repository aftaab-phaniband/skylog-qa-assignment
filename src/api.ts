import { getToken } from './auth';
import type { Booking, FieldErrors } from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: FieldErrors;

  constructor(status: number, code: string, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.');
  }

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? 'UNKNOWN',
      body?.message ?? 'Something went wrong. Please try again.',
      body?.errors,
    );
  }

  return body as T;
}

export function login(email: string, password: string) {
  return request<{ token: string; email: string }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchBookings() {
  return request<{ bookings: Booking[] }>('/api/bookings');
}

export function createBooking(payload: Omit<Booking, 'id' | 'status'>) {
  return request<{ booking: Booking }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelBooking(id: string) {
  return request<{ booking: Booking }>(`/api/bookings/${id}/cancel`, {
    method: 'PATCH',
  });
}
