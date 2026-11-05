/**
 * Service Requests data source facade.
 *
 * `VITE_USE_DEMO_DATA=false` switches every function to the real HTTP adapter
 * in `serviceRequests.api.ts`; otherwise the localStorage demo adapter is used
 * so the page remains fully reviewable before the backend is deployed.
 *
 * Both adapters implement the same contract and return the same UI model, so
 * no component needs to know which one is active.
 */
import * as demoSource from "./serviceRequests.demo";
import * as apiSource from "./serviceRequests.api";

export * from "./serviceRequests.types";
export { getErrorMessage } from "./serviceRequests.shared";

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
