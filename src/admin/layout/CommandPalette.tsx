import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CornerDownLeft,
  FileText,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { flattenNavigation, ROLE_LABELS, type FlatNavLink } from "@/config/navigation";
import { StatusBadge } from "../components/StatusBadge";
import type { ClearanceRequest } from "@/types/admin";

type CommandPaletteProps = {
  onClose: () => void;
};

type Result =
  | { kind: "page"; link: FlatNavLink }
  | { kind: "student"; request: ClearanceRequest }
  | { kind: "request"; request: ClearanceRequest };

type Group = { id: string; label: string; items: Result[] };
type RenderedGroup = Group & { start: number };

const STATUS_WORDS: Record<ClearanceRequest["status"], string> = {
  pending: "pending",
  signed: "signed",
  rejected: "rejected",
};

const MAX_PAGES = 6;
const MAX_STUDENTS = 4;
const MAX_REQUESTS = 4;

/**
 * Ctrl+K command palette. Results come back in three groups — students,
 * clearance requests and navigation pages — but keyboard focus walks one flat
 * list, so ↑/↓/Enter behave the way people expect.
 */
export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { user } = useAdminAuth();
  const { requests } = useAdminData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const links = useMemo(() => (user ? flattenNavigation(user.role) : []), [user]);

  const groups = useMemo<Group[]>(() => {
    const term = query.trim().toLowerCase();

    const pageMatches = links
      .filter((link) =>
        term.length === 0
          ? true
          : `${link.label} ${link.group}`.toLowerCase().includes(term),
      )
      .slice(0, MAX_PAGES)
      .map<Result>((link) => ({ kind: "page", link }));

    if (term.length === 0) {
      return pageMatches.length > 0 ? [{ id: "pages", label: "Pages", items: pageMatches }] : [];
    }

    const matched = requests.filter((request) =>
      `${request.studentName} ${request.studentId} ${request.office} ${request.program} ${request.section} ${STATUS_WORDS[request.status]} ${request.studentNote ?? ""}`
        .toLowerCase()
        .includes(term),
    );

    // Students match on who they are; requests match on what is outstanding.
    const seenStudents = new Set<string>();
    const studentItems: Result[] = [];
    for (const request of matched) {
      if (seenStudents.has(request.studentId)) continue;
      seenStudents.add(request.studentId);
      studentItems.push({ kind: "student", request });
      if (studentItems.length >= MAX_STUDENTS) break;
    }

    const requestItems: Result[] = [];
    for (const request of matched) {
      const aboutStatusOrOffice =
        request.office.toLowerCase().includes(term) ||
        STATUS_WORDS[request.status].includes(term) ||
        (request.studentNote ?? "").toLowerCase().includes(term);
      if (!aboutStatusOrOffice) continue;
      requestItems.push({ kind: "request", request });
      if (requestItems.length >= MAX_REQUESTS) break;
    }

    const next: Group[] = [];
    if (studentItems.length > 0) next.push({ id: "students", label: "Students", items: studentItems });
    if (requestItems.length > 0)
      next.push({ id: "requests", label: "Clearance requests", items: requestItems });
    if (pageMatches.length > 0) next.push({ id: "pages", label: "Pages", items: pageMatches });
    return next;
  }, [links, query, requests]);

  const results = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  // Each group keeps its offset into the flat list so ↑/↓/Enter can walk every
  // option while the headers stay unselectable.
  const renderedGroups = useMemo<RenderedGroup[]>(() => {
    let start = 0;
    return groups.map((group) => {
      const rendered = { ...group, start };
      start += group.items.length;
      return rendered;
    });
  }, [groups]);

  const openResult = useCallback(
    (result: Result) => {
      if (result.kind === "page") {
        navigate(result.link.to);
        return;
      }
      navigate(
        `/admin/clearance-requests?student=${encodeURIComponent(result.request.studentId)}`,
      );
    },
    [navigate],
  );

  // Restore focus to the trigger when the palette unmounts.
  useEffect(() => {
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused.current?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) =>
          results.length === 0 ? 0 : (current + 1) % results.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
        );
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const result = results[activeIndex];
        if (!result) return;
        openResult(result);
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, onClose, openResult, results]);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!user) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-cpc-navy-deep/60 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin portal"
        className="admin-fade-in w-full max-w-xl overflow-hidden rounded-2xl border border-cpc-tile-border bg-white shadow-[0_24px_80px_rgba(15,36,104,0.35)]"
      >
        <div className="flex items-center gap-2 border-b border-cpc-tile-border/70 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-cpc-heading-soft" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search pages, students, requests..."
            aria-label="Search pages, students and requests"
            aria-controls="admin-command-results"
            aria-activedescendant={
              results.length > 0 ? `admin-command-result-${activeIndex}` : undefined
            }
            className="min-w-0 flex-1 bg-transparent font-poppins text-sm text-cpc-navy-text outline-none placeholder:text-cpc-heading-soft/70"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="border-b border-cpc-tile-border/60 bg-cpc-section-light/30 px-4 py-1.5">
          <p className="font-poppins text-[10px] font-semibold tracking-[0.12em] text-cpc-heading-soft uppercase">
            {ROLE_LABELS[user.role]} · {results.length} result
            {results.length === 1 ? "" : "s"}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
              No matches for “{query.trim()}”
            </p>
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
              Try a student name, a student ID, or a page like “clearance”.
            </p>
          </div>
        ) : (
          <ul
            ref={listRef}
            id="admin-command-results"
            role="listbox"
            aria-label="Search results"
            className="admin-scrollbar max-h-[min(24rem,50vh)] overflow-y-auto p-1.5"
          >
            {renderedGroups.map((group) => (
              <Fragment key={group.id}>
                <li role="presentation" className="px-2.5 pb-1 pt-2">
                  <span
                    aria-hidden
                    className="block font-poppins text-[10px] font-semibold tracking-[0.12em] text-cpc-heading-soft uppercase"
                  >
                    {group.label}
                  </span>
                </li>

                {group.items.map((result, itemIndex) => {
                  const index = group.start + itemIndex;
                  const active = index === activeIndex;
                  const key =
                    result.kind === "page"
                      ? `page-${result.link.to}`
                      : `${result.kind}-${result.request.id}`;

                  return (
                    <li key={key}>
                      <button
                        type="button"
                        id={`admin-command-result-${index}`}
                        role="option"
                        aria-selected={active}
                        data-active={active}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          openResult(result);
                          onClose();
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                          active ? "bg-cpc-section-light" : "hover:bg-cpc-section-light/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            result.kind === "page" &&
                              "bg-cpc-section-light text-cpc-blue-accent",
                            result.kind === "student" && "bg-rose-50 text-rose-600",
                            result.kind === "request" &&
                              "bg-cpc-navy/5 text-cpc-navy",
                          )}
                        >
                          {result.kind === "page" ? (
                            <result.link.icon className="h-4 w-4" aria-hidden />
                          ) : result.kind === "student" ? (
                            <UserRound className="h-4 w-4" aria-hidden />
                          ) : (
                            <FileText className="h-4 w-4" aria-hidden />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                            {result.kind === "page"
                              ? result.link.label
                              : result.request.studentName}
                          </span>
                          <span className="block truncate font-poppins text-[10px] text-cpc-heading-soft">
                            {result.kind === "page"
                              ? result.link.group
                              : result.kind === "student"
                                ? `${result.request.studentId} · ${result.request.program}`
                                : `${result.request.studentId} · ${result.request.office}`}
                          </span>
                        </span>

                        {result.kind === "student" && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 font-poppins text-[9px] font-semibold text-rose-700">
                            <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                            Clearance
                          </span>
                        )}

                        {result.kind === "request" && (
                          <StatusBadge
                            status={result.request.status}
                            className="shrink-0 border-0 px-1.5 py-0.5 text-[9px]"
                          />
                        )}

                        {active && (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </Fragment>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-cpc-tile-border/70 bg-cpc-section-light/30 px-4 py-2">
          <span className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
            <kbd className="rounded border border-cpc-tile-border bg-white px-1 py-0.5 font-semibold">
              ↑↓
            </kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
            <kbd className="rounded border border-cpc-tile-border bg-white px-1 py-0.5 font-semibold">
              <CornerDownLeft className="h-2.5 w-2.5" aria-hidden />
            </kbd>
            to open
          </span>
          <span className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
            <kbd className="rounded border border-cpc-tile-border bg-white px-1 py-0.5 font-semibold">
              Esc
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
