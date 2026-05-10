import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Trash2, Upload } from "lucide-react";

const DEBUG = "[ImageUploader]";
const DEFAULT_MAX_MB = 2;
const DEFAULT_MAX_FILES = 4;

type Props = {
  onChange: (files: File[]) => void;
  existingImageUrl?: string;
  maxFiles?: number;
  disabled?: boolean;
  maxSizeMb?: number;
};

export default function ImageUploader({
  onChange,
  existingImageUrl = "",
  maxFiles = DEFAULT_MAX_FILES,
  disabled = false,
  maxSizeMb = DEFAULT_MAX_MB
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Latest selected files (for append); not in React state because UI uses `previews` only. */
  const filesRef = useRef<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const existing = existingImageUrl.trim();
  const hasBlobPreviews = previews.length > 0;
  const renderUrls = hasBlobPreviews ? previews : existing ? [existing] : [];
  const emptyUi = renderUrls.length === 0;

  function revokePreviewUrls(urls: string[]) {
    urls.forEach((u) => {
      if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
  }


  function validateAndCollect(raw: File[]): File[] {
    const out: File[] = [];
    for (const file of raw) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose image files only.");
        console.warn(DEBUG, "rejected non-image", file.name, file.type);
        return [];
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast.error(`Each image must be ${maxSizeMb}MB or smaller.`);
        console.warn(DEBUG, "rejected large file", file.name, file.size);
        return [];
      }
      out.push(file);
    }
    return out;
  }

  /** Append incoming images after current selection, capped at maxFiles. */
  function appendIncoming(raw: FileList | File[], from: string) {
    const selected = Array.from(raw);
    console.log("INPUT:", selected.length);
    console.log(DEBUG, "appendIncoming", from, { selected: selected.length, maxFiles });

    if (!selected.length) return;

    const incoming = validateAndCollect(selected);
    if (!incoming.length) return;

    const merged = [...filesRef.current, ...incoming].slice(0, maxFiles);
    filesRef.current = merged;

    console.log(
      "FILES_SELECTED",
      merged.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    setPreviews((prevPreviews) => {
      revokePreviewUrls(prevPreviews);
      return merged.map((f) => URL.createObjectURL(f));
    });

    onChange(merged);
    console.log("FILES STATE:", merged);
  }

  function triggerFileDialog(source: string) {
    const el = fileInputRef.current;
    console.log(DEBUG, "triggerFileDialog", source, { hasInput: !!el, disabled });
    if (!el || disabled) return;
    try {
      el.click();
      console.log(DEBUG, "triggerFileDialog click() invoked");
    } catch (err) {
      console.error(DEBUG, "triggerFileDialog failed", err);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    console.log(DEBUG, "input change", { fileCount: list?.length ?? 0 });
    if (list?.length) {
      appendIncoming(list, "input");
    }
    // clear AFTER processing to avoid losing multi-select in some browsers
    try {
      e.target.value = "";
    } catch {}
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    console.log(DEBUG, "drop", { count: e.dataTransfer.files?.length });
    if (e.dataTransfer.files?.length) appendIncoming(e.dataTransfer.files, "drop");
  };

  function handleRemove() {
    console.log(DEBUG, "remove all images");
    revokePreviewUrls(previews);
    filesRef.current = [];
    setPreviews([]);
    onChange([]);
    console.log("FILES STATE:", []);
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-700">Product image *</span>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : dragOver
              ? "border-[#1565C0] bg-blue-50/80"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
          multiple
          disabled={disabled}
          tabIndex={-1}
          className={
            emptyUi
              ? "absolute inset-0 z-10 block min-h-[220px] w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              : "sr-only"
          }
          onChange={handleInputChange}
        />

        {!emptyUi ? (
          <div className="relative z-0 p-4">
            <div className="relative mx-auto max-h-56 max-w-full overflow-hidden rounded-lg bg-white shadow-inner ring-1 ring-slate-200">
              {renderUrls.map((src, i) => (
                <img
                  key={`${i}-${src}`}
                  src={src}
                  alt=""
                  className="mx-auto max-h-52 w-auto max-w-full object-contain transition-transform duration-300"
                />
              ))}
            </div>
            {!disabled && (
              <div className="relative z-20 mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerFileDialog("replace-button");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#1565C0] hover:text-[#1565C0]"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Replace image
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pointer-events-none relative z-0 flex min-h-[220px] w-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ImageIcon className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700">Drag & drop an image here</p>
              <p className="mt-1 text-xs text-slate-500">or upload from your device</p>
            </div>
            <span className="rounded-lg bg-[#1565C0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91]">
              Upload from your device
            </span>
            <p className="text-xs text-slate-400">PNG, JPG, WebP — max {maxSizeMb}MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
