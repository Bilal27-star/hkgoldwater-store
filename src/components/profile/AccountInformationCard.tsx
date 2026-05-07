import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, MapPin, Pencil, Phone, User } from "lucide-react";
import type { AuthUser } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-[#f8fbff] px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1565C0] focus:ring-2 focus:ring-[#0B3D91]/20";

type Props = {
  user: AuthUser | null;
};

export default function AccountInformationCard({ user }: Props) {
  const { patchProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || editing) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setWilaya(user.wilaya ?? "");
    setCommune(user.commune ?? "");
    setAddress(user.address ?? "");
  }, [user, editing]);

  function resetDraftFromUser() {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setWilaya(user.wilaya ?? "");
    setCommune(user.commune ?? "");
    setAddress(user.address ?? "");
    setFieldErrors({});
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 2) next.name = "Please enter your full name (at least 2 characters).";
    if (phone.trim().length > 0 && phone.replace(/\D/g, "").length < 8) {
      next.phone = "Enter a valid phone number or leave blank.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await patchProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        wilaya: wilaya.trim() || null,
        commune: commune.trim() || null,
        address: address.trim() || null
      });
      toast.success("Your account details were saved.");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetDraftFromUser();
    setEditing(false);
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_-8px_rgba(11,61,145,0.12)] ring-1 ring-gray-100 transition hover:shadow-[0_8px_32px_-8px_rgba(11,61,145,0.14)] md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B3D91] md:text-xl">Account information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your personal details and delivery preferences.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4ebf4] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B3D91] shadow-sm transition hover:border-[#0B3D91]/25 hover:bg-[#f8fbff]"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            Edit
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-[1.03] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
              ) : null}
              Save changes
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4 text-[#0B3D91]" strokeWidth={2} aria-hidden />
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600`}
            autoComplete="name"
          />
          {fieldErrors.name ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="h-4 w-4 text-[#0B3D91]" strokeWidth={2} aria-hidden />
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!editing}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-50`}
            autoComplete="tel"
          />
          {fieldErrors.phone ? <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phone}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Wilaya</label>
            <input
              type="text"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              disabled={!editing}
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-50`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Commune</label>
            <input
              type="text"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              disabled={!editing}
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-50`}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4 text-[#0B3D91]" strokeWidth={2} aria-hidden />
            Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!editing}
            rows={3}
            className={`${inputClass} resize-none disabled:cursor-not-allowed disabled:bg-gray-50`}
          />
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3">
          <p className="text-xs font-medium text-gray-500">Email</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">{user?.email ?? "—"}</p>
          <p className="mt-2 text-xs text-gray-500">Contact support to change your email address.</p>
        </div>
      </div>
    </section>
  );
}
