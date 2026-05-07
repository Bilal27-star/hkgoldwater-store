import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateManagedAdminInput, ManagedAdmin, ManagedAdminRole } from "../types/managedAdmin";
import { createAdminApi, deleteAdminApi, getAdminsApi } from "../../api";

export type AddAdminResult = { ok: true } | { ok: false; error: string };

function mapApiAdmin(row: any): ManagedAdmin {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    email: String(row.email || ""),
    role: (row.role === "main_admin" ? "main_admin" : "admin") as ManagedAdminRole,
    createdAt: String(row.created_at || "").slice(0, 10)
  };
}

/**
 * Admin directory backed by API.
 */
export function useManagedAdmins() {
  const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
  const adminsRef = useRef<ManagedAdmin[]>([]);
  adminsRef.current = admins;

  const fetchAdmins = useCallback(async () => {
    const data = await getAdminsApi();
    const rows = Array.isArray(data) ? data : [];
    const mapped = rows.map(mapApiAdmin);
    setAdmins(mapped);
    adminsRef.current = mapped;
  }, []);

  useEffect(() => {
    fetchAdmins().catch((error) => {
      console.error("[admin.hook] failed to fetch admins", error);
      setAdmins([]);
      adminsRef.current = [];
    });
  }, [fetchAdmins]);

  const addAdmin = useCallback(async (input: CreateManagedAdminInput): Promise<AddAdminResult> => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const role = input.role as ManagedAdminRole;

    if (!name || !email || !password) {
      return { ok: false, error: "Name, email and password are required." };
    }
    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }

    const prev = adminsRef.current;

    if (prev.some((a) => a.email.toLowerCase() === email)) {
      return { ok: false, error: "An admin with this email already exists." };
    }
    if (role === "main_admin" && prev.some((a) => a.role === "main_admin")) {
      return { ok: false, error: "A main admin already exists." };
    }

    try {
      await createAdminApi({ name, email, password, role });
      await fetchAdmins();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to add admin." };
    }
  }, [fetchAdmins]);

  const removeAdmin = useCallback(async (id: string): Promise<AddAdminResult> => {
    const prev = adminsRef.current;
    const target = prev.find((a) => a.id === id);
    if (!target) {
      return { ok: false, error: "Admin not found." };
    }
    if (target.role === "main_admin") {
      return { ok: false, error: "The main administrator cannot be deleted." };
    }

    // Optimistic update for responsive UI.
    const next = prev.filter((a) => a.id !== id);
    setAdmins(next);
    adminsRef.current = next;

    try {
      await deleteAdminApi(id);
      await fetchAdmins();
      return { ok: true };
    } catch (error) {
      setAdmins(prev);
      adminsRef.current = prev;
      return { ok: false, error: error instanceof Error ? error.message : "Failed to delete admin." };
    }
  }, [fetchAdmins]);

  return { admins, addAdmin, removeAdmin, fetchAdmins };
}
