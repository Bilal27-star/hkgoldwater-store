import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AdminCategory } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => AdminCategory;
  /** Called after category is created so parent can select it in filters/forms */
  onCreated?: (category: AdminCategory) => void;
};

export default function CategoryModal({ open, onClose, onSave, onCreated }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }
    const created = onSave(trimmed);
    onCreated?.(created);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 animate-modalOverlayIn bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="relative z-10 w-full max-w-md animate-modalPanelIn rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="category-modal-title" className="text-lg font-bold text-[#0B3D91]">
              New category
            </h2>
            <p className="mt-1 text-sm text-slate-500">Add a category for your products.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">
          <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700">
            Category name
          </label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            autoFocus
            placeholder="e.g. Bottles"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-[#1565C0] focus:ring-2"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-[#1565C0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
