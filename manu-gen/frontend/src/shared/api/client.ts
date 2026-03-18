const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface ApiError {
  message: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...initHeaders },
    ...restInit,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      message: response.statusText,
    }))) as ApiError;
    throw new Error(body.message ?? response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { ...initHeaders },
    ...restInit,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      message: response.statusText,
    }))) as ApiError;
    throw new Error(body.message ?? response.statusText);
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
  deleteNoContent: (path: string) =>
    requestNoContent(path, { method: "DELETE" }),
};
