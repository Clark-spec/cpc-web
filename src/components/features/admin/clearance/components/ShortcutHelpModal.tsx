import { Modal } from "@/components/ui/modal";

type ShortcutHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["J"], label: "Previous request in the queue" },
  { keys: ["K"], label: "Next request in the queue" },
  { keys: ["A"], label: "Approve and sign the selected request" },
  { keys: ["R"], label: "Reject the selected request" },
  { keys: ["/"], label: "Focus the search box" },
  { keys: ["↑", "↓"], label: "Move between table rows" },
  { keys: ["Enter"], label: "Open the highlighted row" },
  { keys: ["Space"], label: "Select the highlighted row" },
  { keys: ["?"], label: "Open this shortcut list" },
  { keys: ["Esc"], label: "Close a dialog or the review panel" },
  { keys: ["Ctrl", "Shift", "D"], label: "Toggle demo mode" },
];

const KBD =
  "rounded border border-cpc-tile-border bg-cpc-section-light px-1.5 py-0.5 font-poppins text-[11px] font-bold text-cpc-navy-text";

/** Keyboard reference opened with `?` (spec §11). */
export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="shortcut-help-title" className="sm:max-w-lg">
      <div className="p-5 sm:p-6">
        <h2 id="shortcut-help-title" className="font-poppins text-lg font-semibold text-cpc-navy-text">
          Keyboard shortcuts
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Shortcuts pause while you are typing in a field.
        </p>

        <dl className="mt-4 divide-y divide-cpc-tile-border/50">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <dt className="font-poppins text-sm text-cpc-heading-soft">{shortcut.label}</dt>
              <dd className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className={KBD}>
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
