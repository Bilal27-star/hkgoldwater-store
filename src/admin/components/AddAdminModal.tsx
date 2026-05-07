import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import type { ManagedAdminRole } from "../types/managedAdmin";

export type AddAdminFormValues = {
  name: string;
  email: string;
  password: string;
  role: ManagedAdminRole;
};

type AddAdminModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddAdminFormValues) => void;
  /** If true, hide assigning main_admin (single main admin policy) */
  mainAdminExists: boolean;
};

const defaultForm: AddAdminFormValues = {
  name: "",
  email: "",
  password: "",
  role: "admin"
};

export default function AddAdminModal({
  open,
  onClose,
  onSubmit,
  mainAdminExists
}: AddAdminModalProps) {
  const titleId = useId();
  const [form, setForm] = useState<AddAdminFormValues>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        role: mainAdminExists ? "admin" : defaultForm.role
      });
    }
  }, [open, mainAdminExists]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Add administrator
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Create a new account for accessing this panel.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="add-admin-name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="add-admin-name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1565C0] focus:ring-2"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="add-admin-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="add-admin-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1565C0] focus:ring-2"
              placeholder="name@company.dz"
            />
          </div>
          <div>
            <label htmlFor="add-admin-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="add-admin-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1565C0] focus:ring-2"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="add-admin-role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="add-admin-role"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as ManagedAdminRole }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1565C0] focus:ring-2"
            >
              <option value="admin">Admin</option>
              {!mainAdminExists && <option value="main_admin">Main Admin</option>}
            </select>
            {mainAdminExists && (
              <p className="mt-1.5 text-xs text-slate-500">
                Main admin role is already assigned. Add standard admins only.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1565C0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B3D91]"
            >
              Add admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
