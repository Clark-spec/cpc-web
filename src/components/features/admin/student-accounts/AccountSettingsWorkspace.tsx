import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { useToast } from "@/components/ui/toast";
import { AccountActionModal } from "@/components/features/admin/student-accounts/AccountActionModal";
import { AccountSecurityCard } from "@/components/features/admin/student-accounts/AccountSecurityCard";
import { AccountSettingsTable } from "@/components/features/admin/student-accounts/AccountSettingsTable";
import { AccountSettingsToolbar } from "@/components/features/admin/student-accounts/AccountSettingsToolbar";
import { STUDENT_ACCOUNTS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import type {
  AccountActionKind,
  AccountFilters,
  StudentAccount,
} from "@/components/features/admin/student-accounts/types";

const DEFAULT_FILTERS: AccountFilters = {
  query: "",
  status: "all",
  course: "all",
  page: 1,
  pageSize: 10,
};

type PendingAction = {
  accountId: string;
  action: AccountActionKind;
};

/** Route: /admin/students/account-settings — login access management. */
export function AccountSettingsWorkspace() {
  const { toast } = useToast();
  const [rows, setRows] = useState<StudentAccount[]>(STUDENT_ACCOUNTS);
  const [filters, setFilters] = useState<AccountFilters>(DEFAULT_FILTERS);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return rows
      .filter((account) => {
        const matchesQuery =
          !query ||
          [account.name, account.studentId, account.email].some((value) =>
            value.toLowerCase().includes(query),
          );
        const matchesStatus =
          filters.status === "all" || account.status === filters.status;
        const matchesCourse =
          filters.course === "all" || account.course === filters.course;

        return matchesQuery && matchesStatus && matchesCourse;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const pageRows = filteredRows.slice(
    (page - 1) * filters.pageSize,
    page * filters.pageSize,
  );

  const hasActiveFilters =
    filters.query.trim() !== "" || filters.status !== "all" || filters.course !== "all";

  const activeCount = rows.filter((account) => account.status === "active").length;
  const actionAccount =
    rows.find((account) => account.id === pendingAction?.accountId) ?? null;

  function setFilter<K extends keyof AccountFilters>(key: K, value: AccountFilters[K]) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "page" ? {} : { page: 1 }),
    }));
  }

  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, pageSize: prev.pageSize }));
  }

  function confirmAction() {
    if (!pendingAction || !actionAccount) return;
    const { action } = pendingAction;
    const account = actionAccount;

    if (action === "reset") {
      toast(
        `Password reset for ${account.name}. Temporary credentials were sent to ${account.email}.`,
        "success",
      );
    } else if (action === "unlock") {
      setRows((current) =>
        current.map((row) =>
          row.id === account.id ? { ...row, status: "active" as const } : row,
        ),
      );
      toast(`${account.name}'s account has been unlocked.`, "success");
    } else if (account.status === "disabled") {
      setRows((current) =>
        current.map((row) =>
          row.id === account.id ? { ...row, status: "active" as const } : row,
        ),
      );
      toast(`Account enabled for ${account.name}.`, "success");
    } else {
      setRows((current) =>
        current.map((row) =>
          row.id === account.id ? { ...row, status: "disabled" as const } : row,
        ),
      );
      toast(`Account disabled for ${account.name}.`, "success");
    }

    setPendingAction(null);
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Account Settings"
        subtitle="Manage student login access, password resets and account security"
        right={
          <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,36,104,0.08)] backdrop-blur">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent"
            >
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
                Active accounts
              </p>
              <p className="font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">
                {activeCount}
              </p>
            </div>
          </div>
        }
      />

      <AccountSettingsToolbar
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <AccountSettingsTable
        rows={pageRows}
        totalRows={filteredRows.length}
        page={page}
        pageSize={filters.pageSize}
        hasActiveFilters={hasActiveFilters}
        onAction={(account, action) =>
          setPendingAction({ accountId: account.id, action })
        }
        onPageChange={(nextPage) => setFilter("page", nextPage)}
        onPageSizeChange={(size) => setFilter("pageSize", size)}
        onClearFilters={resetFilters}
      />

      <AccountSecurityCard />

      {pendingAction && actionAccount && (
        <AccountActionModal
          key={`${actionAccount.id}-${pendingAction.action}`}
          account={actionAccount}
          action={pendingAction.action}
          onClose={() => setPendingAction(null)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}
