import type { ZodType } from "zod";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  path: string,
  init?: RequestInit,
  schema?: ZodType<T>,
): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...initHeaders },
    ...restInit,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const msg =
      (body as Record<string, unknown>)?.error ??
      (body as Record<string, unknown>)?.message ??
      response.statusText;
    throw new Error(String(msg));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();
  return schema ? schema.parse(data) : (data as T);
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { ...initHeaders },
    ...restInit,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const msg =
      (body as Record<string, unknown>)?.error ??
      (body as Record<string, unknown>)?.message ??
      response.statusText;
    throw new Error(String(msg));
  }
}

export const apiClient = {
  get: <T>(path: string, schema?: ZodType<T>) =>
    request<T>(path, undefined, schema),
  post: <T>(path: string, body: unknown, schema?: ZodType<T>) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, schema),
  put: <T>(path: string, body: unknown, schema?: ZodType<T>) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, schema),
  patch: <T>(path: string, body: unknown, schema?: ZodType<T>) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, schema),
  delete: <T>(path: string, schema?: ZodType<T>) =>
    request<T>(path, { method: "DELETE" }, schema),
  deleteNoContent: (path: string) =>
    requestNoContent(path, { method: "DELETE" }),
};
