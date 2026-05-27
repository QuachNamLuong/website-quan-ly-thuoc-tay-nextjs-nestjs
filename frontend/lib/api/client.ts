const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'pharmacy_access_token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  get(): string | null {
    if (globalThis.window === undefined) return null;
    return globalThis.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.removeItem(TOKEN_KEY);
  },
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!opts.skipAuth) {
    const token = tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | {
        success?: false;
        statusCode: number;
        message: string | string[];
        error?: string;
      }
    | null;

  if (!response.ok) {
    if (json && 'message' in json) {
      const message = Array.isArray(json.message)
        ? json.message[0]
        : json.message;
      const details = Array.isArray(json.message) ? json.message : undefined;
      throw new ApiError(response.status, message ?? 'Request failed', details);
    }
    throw new ApiError(response.status, 'Request failed');
  }

  if (json && 'success' in json && json.success && 'data' in json) {
    return json.data;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
