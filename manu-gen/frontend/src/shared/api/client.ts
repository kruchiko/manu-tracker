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

  // Unvalidated cast — production code should run a Zod safeParse here.
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
