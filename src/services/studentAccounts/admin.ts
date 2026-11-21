import type { AdminRole } from "@/types/admin";
import { apiClient } from "@/lib/apiClient";
import { ensureAdminSession } from "@/services/complaints/admin-session";
import { getCsrfToken } from "@/services/auth";

export type RegistrarStudentAccount = {
  id: string;
  name: string;
  studentNumber: string;
  section: string | null;
  course: string | null;
  yearLevel: number | null;
};

type Envelope<T> = { data?: T; message?: string };

export async function listRegistrarStudentAccounts(role: AdminRole): Promise<RegistrarStudentAccount[]> {
  const token = await ensureAdminSession(role);
  const response = await apiClient.get<Envelope<{ students: RegistrarStudentAccount[] }>>(
    "/students/v1/accounts",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data?.data?.students ?? [];
}

export async function deleteRegistrarStudentAccount(role: AdminRole, id: string): Promise<void> {
  const [token, csrf] = await Promise.all([ensureAdminSession(role), getCsrfToken()]);
  await apiClient.delete<Envelope<unknown>>(
    `/students/v1/accounts/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf } },
  );
}
