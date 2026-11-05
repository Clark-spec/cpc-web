import { createBrowserRouter, type RouteObject } from "react-router";

/**
 * Creates the app's data router from the route tree that `@/app/routes` composes.
 * The route tree is passed in, so `lib` never imports from `admin/` or `student/`.
 */
export function createAppRouter(routes: RouteObject[]) {
  return createBrowserRouter(routes);
}

let navigateFn: (path: string, options?: { replace?: boolean }) => void = () => {};

export function setNavigate(fn: typeof navigateFn) {
  navigateFn = fn;
}

export function navigate(path: string, options?: { replace?: boolean }) {
  navigateFn(path, options);
}
