"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { useState } from "react";
import { store } from "@/store";

export function AppDataProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 70_000, refetchOnWindowFocus: false, retry: 1 },
    },
  }));
  return <Provider store={store}><QueryClientProvider client={queryClient}>{children}{process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}</QueryClientProvider></Provider>;
}
