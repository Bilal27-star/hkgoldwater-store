import { Loader2, Save } from "lucide-react";

type Props = {
  isDirty: boolean;
  disabled: boolean;
  saving: boolean;
  onSave: () => void;
};

export default function CmsSaveBar({ isDirty, disabled, saving, onSave }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 lg:left-[260px]">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md md:px-6">
        <p className="min-w-0 flex-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">
            {isDirty ? "You have unsaved changes." : "Ready to publish?"}
          </span>{" "}
          Changes will appear on the website after you save.
        </p>
        <button
          type="button"
          disabled={disabled || saving}
          onClick={onSave}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1565C0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}
