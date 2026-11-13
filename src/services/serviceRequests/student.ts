/**
 * Service Requests data source facade.
 *
 * `VITE_USE_DEMO_DATA=false` switches every function to the real HTTP adapter
 * in `api.ts`; otherwise the localStorage demo adapter in `demo.ts` is used.
 */
import * as demoSource from "./demo";
import * as apiSource from "./api";

export * from "./types";
export {
  getErrorMessage,
  applyRequestUpdate,
  parseServiceRequestUpdate,
} from "./shared";

const useDemoData = import.meta.env.VITE_USE_DEMO_DATA !== "false";

const source = useDemoData ? demoSource : apiSource;

export const getCatalog = source.getCatalog;
export const getServiceRequests = source.getServiceRequests;
export const getServiceRequest = source.getServiceRequest;
export const createServiceRequest = source.createServiceRequest;
export const getCurrentDraft = source.getCurrentDraft;
export const saveDraft = source.saveDraft;
export const deleteDraft = source.deleteDraft;
export const getNotifications = source.getNotifications;
export const markNotificationsRead = source.markNotificationsRead;
export const downloadDocument = source.downloadDocument;

/** True when the page is running on demo data instead of the CPC API. */
export const isDemoData = useDemoData;

