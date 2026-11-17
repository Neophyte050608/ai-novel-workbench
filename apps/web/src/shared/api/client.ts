const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error?: { message?: string }; message?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function normalizePayload<T>(payload: unknown): T {
  if (!isRecord(payload)) return payload as T;

  if (payload.success === true && 'data' in payload) {
    return payload.data as T;
  }

  if (!('success' in payload) && 'data' in payload && Object.keys(payload).length <= 2) {
    return payload.data as T;
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown, status: number) {
  if (isRecord(payload)) {
    const envelope = payload as ApiEnvelope<unknown>;
    if (envelope.success === false) {
      return envelope.error?.message ?? envelope.message ?? `请求失败（${status}）`;
    }
    if (typeof payload.message === 'string') return payload.message;
  }
  return `请求失败（${status}）`;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status));
  }
  return normalizePayload<T>(payload);
}

export async function apiGet<T>(path: string): Promise<T> {
  return parseResponse(await fetch(`${API_BASE}${path}`));
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return parseResponse(
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

export async function apiDelete<T>(path: string): Promise<T> {
  return parseResponse(
    await fetch(`${API_BASE}${path}`, { method: 'DELETE' }),
  );
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return parseResponse(
    await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}
