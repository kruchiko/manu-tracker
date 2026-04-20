import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export interface CreateWrapperOptions {
  initialEntries?: readonly string[];
  /** Wrap children in `/jobs/:jobId?` so `JobsPage` can use `useParams`. */
  jobsOutlet?: boolean;
}

export function createWrapper(
  queryClient?: QueryClient,
  options?: CreateWrapperOptions,
) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });

  const initialEntries = [...(options?.initialEntries ?? ["/"])];
  const jobsOutlet = options?.jobsOutlet ?? false;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={client}>
          {jobsOutlet ? (
            <Routes>
              <Route path="/jobs/:jobId?" element={children} />
            </Routes>
          ) : (
            children
          )}
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return Wrapper;
}
