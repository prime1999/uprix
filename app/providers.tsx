"use client";

/**
 * React Query provider for the Uprix application.
 *
 * This creates one QueryClient for the browser session.
 *
 * Individual queries are responsible for deciding how long
 * their own data should remain fresh.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  /**
   * Create the QueryClient only once.
   *
   * If we created it directly during every render, React Query
   * could lose its cache whenever this component re-renders.
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * These are sensible application-wide defaults.
             *
             * Individual queries can override them when their
             * data requires different freshness.
             */
            retry: 2,

            /**
             * Don't automatically refetch every query whenever
             * the browser window receives focus.
             *
             * Dynamic features can explicitly opt into this later.
             */
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
