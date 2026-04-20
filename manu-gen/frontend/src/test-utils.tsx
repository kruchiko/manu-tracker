import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router-dom";
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

/** Renders `element` at `/jobs/:jobId?` with RouterProvider (for assertions on `router.state`). */
export function renderJobsPageAtPath(
  element: ReactElement,
  initialPath: string,
  queryClient?: QueryClient,
) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
  const router = createMemoryRouter([{ path: "/jobs/:jobId?", element }], {
    initialEntries: [initialPath],
  });
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, router, queryClient: client };
}
