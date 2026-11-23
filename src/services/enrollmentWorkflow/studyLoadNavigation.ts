const STUDY_LOAD_OPENED_KEY = "cpc:study-load-opened:";

export function hasOpenedStudyLoadDraft(studentId: string) {
  try {
    return window.sessionStorage.getItem(`${STUDY_LOAD_OPENED_KEY}${studentId}`) === "true";
  } catch {
    return false;
  }
}

export function markStudyLoadDraftOpened(studentId: string) {
  try {
    window.sessionStorage.setItem(`${STUDY_LOAD_OPENED_KEY}${studentId}`, "true");
  } catch {
    // The current page can still continue if session storage is unavailable.
  }
}
