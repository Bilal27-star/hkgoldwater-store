import { Loader2, Save } from "lucide-react";

type Props = {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
};

export default function SocialSaveBar({ isDirty, saving, onSave }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1565C0]">
            <Save className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Ready to update?</span> Social links will appear on your
            website after you save.
          </p>
        </div>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={onSave}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1565C0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Save all changes
        </button>
      </div>
    </div>
  );
}
