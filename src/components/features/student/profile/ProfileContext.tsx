/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getProfile,
  requestCorrection as sendCorrectionRequest,
  resetProfile,
  updateProfile,
} from "@/services/studentProfile";
import { useSSE } from "@/hooks/useSSE";
import type {
  CorrectionRequestInput,
  EditableField,
  ProfileUpdateInput,
  StudentProfile,
} from "@/components/features/student/profile/types";

export type ProfileStatus = "loading" | "ready" | "error";

export type SaveProfileResult = {
  profile: StudentProfile;
  /** Editable fields whose value actually changed. */
  changed: EditableField[];
};

type ProfileContextValue = {
  profile: StudentProfile | null;
  status: ProfileStatus;
  error: string | null;
  isEditing: boolean;
  beginEdit: () => void;
  endEdit: () => void;
  reload: () => void;
  /** Persists a patch through the service and refreshes the context. */
  save: (patch: ProfileUpdateInput) => Promise<SaveProfileResult>;
  resetDemo: () => Promise<void>;
  requestCorrection: (input: CorrectionRequestInput) => Promise<void>;
  /** Fields that should briefly flash after a save. */
  highlighted: EditableField[];
  highlight: (fields: EditableField[]) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const EDITABLE_FIELDS: EditableField[] = [
  "phone",
  "alternateContact",
  "address",
  "civilStatus",
  "religion",
  "nationality",
  "motherName",
  "fatherName",
  "guardianName",
  "guardianContact",
  "avatarUrl",
];

const HIGHLIGHT_MS = 2200;

function isSameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? "") === JSON.stringify(b ?? "");
}

function changedFields(current: StudentProfile, patch: ProfileUpdateInput): EditableField[] {
  return EDITABLE_FIELDS.filter(
    (field) => field in patch && !isSameValue(current[field], patch[field]),
  );
}

/**
 * Owns the loaded profile + edit mode. The form hook talks to `save()`, which
 * is the only place that writes through the service; the context then swaps in
 * the fresh profile so every card re-renders from one source of truth.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [highlighted, setHighlighted] = useState<EditableField[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const highlightTimer = useRef<number | null>(null);

  // Initial load and explicit retries. State is only updated from the promise
  // callbacks, so no cascading render happens inside the effect body.
  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setStatus("ready");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load your profile right now.",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // Real-time synchronization via Server-Sent Events (SSE)
  useSSE(
    useCallback((type) => {
      if (type === "profile_updated") {
        getProfile()
          .then((fresh) => {
            setProfile(fresh);
            setStatus("ready");
          })
          .catch(() => {});
      }
    }, []),
    status === "ready",
  );

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  const highlight = useCallback((fields: EditableField[]) => {
    setHighlighted(fields);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlighted([]), HIGHLIGHT_MS);
  }, []);

  const beginEdit = useCallback(() => setIsEditing(true), []);
  const endEdit = useCallback(() => setIsEditing(false), []);

  // Edit flow step 4: service write -> context swap -> every card refreshes.
  const save = useCallback(
    async (patch: ProfileUpdateInput): Promise<SaveProfileResult> => {
      if (!profile) throw new Error("Your profile is still loading.");
      const next = await updateProfile(patch);
      const changed = changedFields(profile, patch);
      setProfile(next);
      return { profile: next, changed };
    },
    [profile],
  );

  const resetDemo = useCallback(async () => {
    const next = await resetProfile();
    setProfile(next);
    setStatus("ready");
    setError(null);
    setIsEditing(false);
    setHighlighted([]);
  }, []);

  const requestCorrection = useCallback(async (input: CorrectionRequestInput) => {
    await sendCorrectionRequest(input);
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      status,
      error,
      isEditing,
      beginEdit,
      endEdit,
      reload,
      save,
      resetDemo,
      requestCorrection,
      highlighted,
      highlight,
    }),
    [
      profile,
      status,
      error,
      isEditing,
      beginEdit,
      endEdit,
      reload,
      save,
      resetDemo,
      requestCorrection,
      highlighted,
      highlight,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside a <ProfileProvider>.");
  }
  return context;
}
