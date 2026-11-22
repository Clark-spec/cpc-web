export const BSIT_SIGNATURE_SECTIONS = [
  "BSIT-2A",
  "BSIT-2B",
  "BSIT-3A",
  "BSIT-3B",
  "BSIT-3C",
  "BSIT-3D",
] as const;

export function normalizeBsitSignatureSection(section: unknown): string {
  const normalized = String(section ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^BSIT-?([23])-?([A-D])$/);
  return match ? `BSIT-${match[1]}${match[2]}` : normalized;
}

export function isBsitSignatureSection(section: unknown): boolean {
  return BSIT_SIGNATURE_SECTIONS.includes(
    normalizeBsitSignatureSection(section) as (typeof BSIT_SIGNATURE_SECTIONS)[number],
  );
}
