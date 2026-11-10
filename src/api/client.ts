import { Platform } from 'react-native';
import { AZURE_API_BASE_URL, API_BASE_URL } from '../lib/config';
import { clearSession, getAccessToken, getSession, saveSession } from '../lib/auth-storage';
import type { ApiError } from '../types/api';

const DEFAULT_TIMEOUT_MS = 30000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
  formData?: FormData;
  /**
   * Internal flag to avoid infinite loops while retrying a request after refresh-token.
   * Not intended to be passed by app code.
   */
  _authRetryAfterRefresh?: boolean;
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * Multipart uploads: hit Azure directly on native (Metro proxy can break FormData).
 * On web, keep using the CORS proxy base URL.
 */
function resolveRequestBaseUrl(isMultipart: boolean) {
  if (isMultipart && Platform.OS !== 'web' && __DEV__) {
    return AZURE_API_BASE_URL;
  }
  return API_BASE_URL;
}

function friendlyMessage(status: number, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback;
  switch (status) {
    case 400:
      return 'Invalid request. Please check your details.';
    case 401:
      return 'Session expired. Please sign in again.';
    case 403:
      return 'You do not have permission for this action.';
    case 404:
      return 'Not found.';
    case 409:
      return 'This conflicts with an existing record.';
    case 422:
      return 'Validation failed. Please review your input.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return `Request failed (${status}).`;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.title === 'string') return data.title;
    if (typeof data?.detail === 'string') return data.detail;
  } catch {
    // ignore
  }
  return friendlyMessage(res.status);
}

function parseErrorText(status: number, text: string): string {
  try {
    const data = JSON.parse(text);
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.title === 'string') return data.title;
    if (typeof data?.detail === 'string') return data.detail;
  } catch {
    // ignore
  }
  return friendlyMessage(status);
}

function isApiError(e: unknown): e is ApiError {
  return (
    !!e &&
    typeof e === 'object' &&
    'status' in e &&
    typeof (e as ApiError).status === 'number' &&
    'message' in e
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject({
        status: 0,
        message: `Request timed out talking to ${url}`,
        isNetworkError: true,
      } satisfies ApiError);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * RN's global fetch cannot serialize { uri, name, type } FormData parts
 * ("Unsupported FormDataPart implementation"). XMLHttpRequest can.
 */
function xhrFormDataRequest(
  url: string,
  method: string,
  formData: FormData,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = timeoutMs;

    Object.entries(headers).forEach(([key, value]) => {
      if (key.toLowerCase() === 'content-type') return;
      xhr.setRequestHeader(key, value);
    });

    xhr.onload = () => {
      resolve({ status: xhr.status, text: xhr.responseText ?? '' });
    };
    xhr.onerror = () => {
      reject(new Error('Network request failed'));
    };
    xhr.ontimeout = () => {
      reject(new Error(`Request timed out talking to ${url}`));
    };

    xhr.send(formData);
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    formData,
    _authRetryAfterRefresh = false,
  } = options;

  const baseUrl = resolveRequestBaseUrl(!!formData);
  const url = `${baseUrl}${path}`;

  try {
    const requestHeaders: Record<string, string> = { ...headers };

    if (!formData) {
      requestHeaders.Accept = 'application/json';
      if (body !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    } else {
      // Boundary is set automatically — never set Content-Type manually.
      requestHeaders.Accept = 'application/json';
    }

    if (auth) {
      const token = await getAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    async function handleUnauthorized(): Promise<never> {
      if (auth) {
        await clearSession();
        onUnauthorized?.();
      }
      const err: ApiError = {
        status: 401,
        message: friendlyMessage(401),
        isUnauthorized: auth,
      };
      throw err;
    }

    async function handleResponse(res: Response): Promise<T> {
      if (res.status === 401) return handleUnauthorized();

      if (!res.ok) {
        const message = await parseError(res);
        const err: ApiError = {
          status: res.status,
          message: friendlyMessage(res.status, message),
        };
        throw err;
      }

      if (res.status === 204) {
        return undefined as T;
      }

      const text = await res.text();
      if (!text) return undefined as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        const err: ApiError = {
          status: res.status,
          message: 'Invalid JSON response from server.',
        };
        throw err;
      }
    }

    async function handleXhrResult(result: { status: number; text: string }): Promise<T> {
      if (result.status === 401) return handleUnauthorized();

      if (result.status < 200 || result.status >= 300) {
        const message = parseErrorText(result.status, result.text);
        const err: ApiError = {
          status: result.status,
          message: friendlyMessage(result.status, message),
        };
        throw err;
      }

      if (result.status === 204 || !result.text) {
        return undefined as T;
      }

      try {
        return JSON.parse(result.text) as T;
      } catch {
        const err: ApiError = {
          status: result.status,
          message: 'Invalid JSON response from server.',
        };
        throw err;
      }
    }

    // ---- Multipart: prefer XHR on native ----
    if (formData && Platform.OS !== 'web') {
      const send = (hdrs: Record<string, string>) =>
        xhrFormDataRequest(url, method, formData, hdrs, timeoutMs);

      let result = await send(requestHeaders);

      if (result.status === 401 && auth && !_authRetryAfterRefresh) {
        const stored = await getSession();
        try {
          const refreshRes = await withTimeout(
            fetch(`${baseUrl}/api/auth/refresh-token`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken: stored?.refreshToken ?? null }),
            }),
            timeoutMs,
            baseUrl,
          );

          if (refreshRes.ok) {
            const refreshJson = (await refreshRes.json()) as {
              isSuccess?: boolean;
              data?: {
                accessToken?: string | null;
                refreshToken?: string | null;
                accessTokenExpiresOn?: string;
              };
            };

            if (refreshJson?.isSuccess && refreshJson.data?.accessToken) {
              await saveSession({
                ...stored,
                accessToken: refreshJson.data.accessToken,
                refreshToken:
                  refreshJson.data.refreshToken ?? stored?.refreshToken ?? null,
                accessTokenExpiresOn:
                  refreshJson.data.accessTokenExpiresOn ??
                  stored?.accessTokenExpiresOn ??
                  null,
              });

              result = await send({
                ...requestHeaders,
                Authorization: `Bearer ${refreshJson.data.accessToken}`,
              });
            }
          }
        } catch {
          // fall through
        }
      }

      return await handleXhrResult(result);
    }

    // ---- JSON / web multipart: fetch ----
    const requestBody = formData
      ? formData
      : body !== undefined
        ? JSON.stringify(body)
        : undefined;

    const doFetch = async (overrideHeaders?: Record<string, string>) =>
      withTimeout(
        fetch(url, {
          method,
          headers: overrideHeaders ?? requestHeaders,
          body: requestBody,
        }),
        timeoutMs,
        baseUrl,
      );

    const res = await doFetch();

    if (res.status === 401 && auth && !_authRetryAfterRefresh) {
      const stored = await getSession();
      const refreshToken = stored?.refreshToken ?? null;

      try {
        const refreshRes = await withTimeout(
          fetch(`${baseUrl}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          }),
          timeoutMs,
          baseUrl,
        );

        if (refreshRes.ok) {
          const refreshJson = (await refreshRes.json()) as {
            isSuccess?: boolean;
            data?: {
              accessToken?: string | null;
              refreshToken?: string | null;
              accessTokenExpiresOn?: string;
            };
          };

          if (refreshJson?.isSuccess && refreshJson.data?.accessToken) {
            const next = {
              ...stored,
              accessToken: refreshJson.data.accessToken,
              refreshToken:
                refreshJson.data.refreshToken ?? stored?.refreshToken ?? null,
              accessTokenExpiresOn:
                refreshJson.data.accessTokenExpiresOn ??
                stored?.accessTokenExpiresOn ??
                null,
            };

            await saveSession(next);

            const retryHeaders = {
              ...requestHeaders,
              Authorization: `Bearer ${refreshJson.data.accessToken}`,
            };

            const retryRes = await doFetch(retryHeaders);
            if (retryRes.status === 401) {
              return handleUnauthorized();
            }

            return await handleResponse(retryRes);
          }
        }
      } catch {
        // ignore and fall back
      }
    }

    return await handleResponse(res);
  } catch (e) {
    if (isApiError(e)) throw e;

    const detail = e instanceof Error ? e.message : String(e);
    const err: ApiError = {
      status: 0,
      message: `Network error. Cannot reach API (${baseUrl}). ${detail}`,
      isNetworkError: true,
    };
    throw err;
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as ApiError).message || fallback);
  }
  return fallback;
}
