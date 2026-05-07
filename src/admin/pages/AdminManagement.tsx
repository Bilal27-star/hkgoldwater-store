import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import AddAdminModal, { type AddAdminFormValues } from "../components/AddAdminModal";
import AdminTable from "../components/AdminTable";
import ConfirmModal from "../components/ConfirmModal";
import { useManagedAdmins } from "../hooks/useManagedAdmins";
import type { ManagedAdmin } from "../types/managedAdmin";

export default function AdminManagement() {
  const { admins, addAdmin, removeAdmin, fetchAdmins } = useManagedAdmins();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const mainAdminExists = useMemo(() => admins.some((a) => a.role === "main_admin"), [admins]);

  async function handleAddSubmit(values: AddAdminFormValues) {
    const result = await addAdmin(values);
    if (result.ok) {
      toast.success(`Administrator ${values.name || values.email} added`);
      setAddOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await removeAdmin(deleteTarget.id);
    await fetchAdmins();
    setDeleting(false);
    setDeleteTarget(null);
    if (result.ok) {
      toast.success("Administrator removed");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91]">Admin Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage administrators who can access the admin panel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1565C0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91]"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Add Admin
        </button>
      </div>

      <AdminTable admins={admins} onRequestDelete={setDeleteTarget} />

      <AddAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
        mainAdminExists={mainAdminExists}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Remove administrator?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name} (${deleteTarget.email}) from the admin directory? This cannot be undone from here without adding them again.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
