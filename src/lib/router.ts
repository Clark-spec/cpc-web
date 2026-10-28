let navigateFn: (path: string, options?: { replace?: boolean }) => void = () => {};

export function setNavigate(fn: typeof navigateFn) {
  navigateFn = fn;
}

export function navigate(path: string, options?: { replace?: boolean }) {
  navigateFn(path, options);
}