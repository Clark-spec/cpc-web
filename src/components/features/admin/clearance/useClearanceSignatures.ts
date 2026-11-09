import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import type { NewSignatureInput } from "./types";
import { useSavedSignatures } from "./useSavedSignatures";
import {
  addSavedSignature,
  deleteSavedSignature,
  updateSavedSignature,
} from "@/services/clearanceAdmin";

export function useClearanceSignatures(staffId: string) {
  const { toast } = useToast();
  const signatures = useSavedSignatures(staffId);
  const { reload: reloadSignatures } = signatures;

  const addSignature = useCallback(
    async (input: NewSignatureInput) => {
      try {
        const saved = await addSavedSignature(staffId, input);
        reloadSignatures();
        toast(`Signature "${saved.label}" saved.`, "success");
        return saved;
      } catch {
        toast("We couldn't save that signature.", "error");
        return null;
      }
    },
    [reloadSignatures, staffId, toast],
  );

  const renameSignature = useCallback(
    async (id: string, label: string) => {
      await updateSavedSignature(staffId, id, { label });
      reloadSignatures();
    },
    [reloadSignatures, staffId],
  );

  const deleteSignature = useCallback(
    async (id: string) => {
      await deleteSavedSignature(staffId, id);
      reloadSignatures();
      toast("Signature removed.", "info");
    },
    [reloadSignatures, staffId, toast],
  );

  const makeDefaultSignature = useCallback(
    async (id: string) => {
      await updateSavedSignature(staffId, id, { isDefault: true });
      reloadSignatures();
    },
    [reloadSignatures, staffId],
  );

  return {
    savedSignatures: signatures.signatures,
    defaultSignature: signatures.defaultSignature,
    addSignature,
    renameSignature,
    deleteSignature,
    makeDefaultSignature,
  };
}

