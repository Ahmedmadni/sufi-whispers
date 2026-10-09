import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // In Android, keep deep links after a WebView restart inside index.html.
    // Web SSR still uses its regular pathname-based history.
    ...(import.meta.env.VITE_MOBILE === "true" &&
      typeof window !== "undefined"
      ? { history: createHashHistory() }
      : {}),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
