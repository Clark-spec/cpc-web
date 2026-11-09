import { Ban, Inbox, KeyRound, LockOpen, Power, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/display/EmptyState";
import { TablePagination } from "@/components/features/admin/student-accounts/TablePagination";
import { AccountStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import {
  CELL,
  CARD_SHELL,
  HEADER_CELL,
  ROW_ACTION,
  initialsOf,
} from "@/components/features/admin/student-accounts/shared";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type {
  AccountActionKind,
  StudentAccount,
} from "@/components/features/admin/student-accounts/types";

type AccountSettingsTableProps = {
  rows: StudentAccount[];
  totalRows: number;
  page: number;
  pageSize: number;
  hasActiveFilters: boolean;
  onAction: (account: StudentAccount, action: AccountActionKind) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters: () => void;
};

/** Student login table; every destructive action opens the confirmation modal. */
export function AccountSettingsTable({
  rows,
  totalRows,
  page,
  pageSize,
  hasActiveFilters,
  onAction,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: AccountSettingsTableProps) {
  return (
    <section aria-label="Student accounts" className={CARD_SHELL}>
      {totalRows === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? SearchX : Inbox}
          title={hasActiveFilters ? "No accounts match these filters" : "No accounts found"}
          description={
            hasActiveFilters
              ? "Try a different name, student ID, status or course."
              : "Student login accounts appear here after their enrollment is approved."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Clear filters
              </button>
            ) : undefined
          }
          className="py-14"
        />
      ) : (
        <>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <caption className="sr-only">
                Student login accounts. {totalRows} matching accounts, {rows.length} shown
                on this page.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60">
                  <th scope="col" className={HEADER_CELL}>
                    Student ID
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Name
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Email
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Account Status
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Last Login
                  </th>
                  <th scope="col" className={`${HEADER_CELL} text-right`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {rows.map((account) => {
                  const disabling = account.status !== "disabled";
                  const unlockable = account.status === "locked";

                  return (
                    <tr
                      key={account.id}
                      className="transition-colors hover:bg-cpc-section-light/30"
                    >
                      <td className={CELL}>
                        <span className="font-poppins text-[11px] font-bold text-cpc-navy-text whitespace-nowrap">
                          {account.studentId}
                        </span>
                      </td>

                      <td className={CELL}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white"
                          >
                            {initialsOf(account.name)}
                          </span>
                          <p
                            className="max-w-[15rem] truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                            title={account.name}
                          >
                            {account.name}
                          </p>
                        </div>
                      </td>

                      <td className={CELL}>
                        <span
                          className="block max-w-[16rem] truncate font-poppins text-[11px] text-cpc-navy-text"
                          title={account.email}
                        >
                          {account.email}
                        </span>
                      </td>

                      <td className={CELL}>
                        <AccountStatusBadge status={account.status} />
                      </td>

                      <td className={CELL}>
                        <time
                          dateTime={account.lastLogin}
                          className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap"
                        >
                          {formatDateTime(account.lastLogin)}
                        </time>
                      </td>

                      <td className={`${CELL} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAction(account, "reset")}
                            aria-label={`Reset password for ${account.name}`}
                            className={ROW_ACTION}
                          >
                            <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => onAction(account, "toggle")}
                            aria-label={`${disabling ? "Disable" : "Enable"} account for ${account.name}`}
                            className={cn(
                              ROW_ACTION,
                              disabling
                                ? "text-rose-600 hover:bg-rose-50"
                                : "text-emerald-700 hover:bg-emerald-50",
                            )}
                          >
                            {disabling ? (
                              <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            ) : (
                              <Power className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            )}
                            {disabling ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onAction(account, "unlock")}
                            disabled={!unlockable}
                            aria-label={`Unlock account for ${account.name}`}
                            title={
                              unlockable
                                ? undefined
                                : "Only locked accounts can be unlocked"
                            }
                            className={ROW_ACTION}
                          >
                            <LockOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Unlock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            idPrefix="account"
            totalRows={totalRows}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </section>
  );
}
