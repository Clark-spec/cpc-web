/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
/**
 * The feature uses the portal-wide toast provider. This re-export keeps the
 * profile feature's imports local (`./Toast`) without duplicating behaviour.
 */
export { ToastProvider, useToast } from "@/components/ui/toast";
