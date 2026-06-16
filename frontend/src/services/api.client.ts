import { API_URLS } from '../constants';
import type { ApiError } from '../types';

export class ApiClientError extends Error {
  status: number;
  isServiceUnavailable: boolean;

  constructor(message: string, status = 500, isServiceUnavailable = false) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.isServiceUnavailable = isServiceUnavailable;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  };

  if (token) {
    (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiClientError('Service unavailable. Please try again later.', 503, true);
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const data = (await response.json()) as ApiError;
      message = data.error || message;
    } catch {
      message = response.statusText || message;
    }

    throw new ApiClientError(message, response.status, response.status === 503);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function checkServiceHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export { API_URLS };
