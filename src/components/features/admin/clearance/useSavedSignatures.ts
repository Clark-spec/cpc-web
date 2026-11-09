import { useCallback, useState } from "react";
import {
  addSavedSignature,
  deleteSavedSignature,
  readSavedSignatures,
  updateSavedSignature,
} from "@/services/clearanceAdmin";
import type { NewSignatureInput, SavedSignature } from "@/components/features/admin/clearance/types";

/**
 * The staff member's own signature library.
 *
 * Namespaced per user (`cpc:clearance:signatures:{staffId}`) so a saved
 * signature is never offered to another office.
 */
export function useSavedSignatures(staffId: string): {
  signatures: SavedSignature[];
  defaultSignature: SavedSignature | null;
  add: (input: NewSignatureInput) => Promise<SavedSignature | null>;
  rename: (id: string, label: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  makeDefault: (id: string) => Promise<void>;
  reload: () => void;
} {
  const [signatures, setSignatures] = useState<SavedSignature[]>(() =>
    readSavedSignatures(staffId),
  );
  /** A demo role switch changes the owner, so the library is re-read inline. */
  const [owner, setOwner] = useState(staffId);

  if (owner !== staffId) {
    setOwner(staffId);
    setSignatures(readSavedSignatures(staffId));
  }

  const reload = useCallback(() => {
    setSignatures(readSavedSignatures(staffId));
  }, [staffId]);

  const add = useCallback(
    async (input: NewSignatureInput) => {
      if (!input.imageBase64) return null;
      const saved = await addSavedSignature(staffId, input);
      setSignatures(readSavedSignatures(staffId));
      return saved;
    },
    [staffId],
  );

  const rename = useCallback(
    async (id: string, label: string) => {
      setSignatures(await updateSavedSignature(staffId, id, { label }));
    },
    [staffId],
  );

  const makeDefault = useCallback(
    async (id: string) => {
      setSignatures(await updateSavedSignature(staffId, id, { isDefault: true }));
    },
    [staffId],
  );

  const remove = useCallback(
    async (id: string) => {
      setSignatures(await deleteSavedSignature(staffId, id));
    },
    [staffId],
  );

  const defaultSignature =
    signatures.find((signature) => signature.isDefault) ?? signatures[0] ?? null;

  return { signatures, defaultSignature, add, rename, remove, makeDefault, reload };
}
