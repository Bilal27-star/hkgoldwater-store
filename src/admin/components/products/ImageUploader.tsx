import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Trash2, Upload } from "lucide-react";

const DEFAULT_MAX_MB = 2;

export type RemoteImageUpload = {
  /** e.g. `${import.meta.env.VITE_API_URL}/products/upload` */
  uploadUrl: string;
  getToken: () => string | null;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  maxSizeMb?: number;
  /** When set, selected images upload immediately with XHR progress; `onChange` receives public `/uploads/...` URL. */
  remoteUpload?: RemoteImageUpload;
  /** Fires when the user selects or clears a local file (before/after remote upload). */
  onPickFile?: (file: File | null) => void;
};

export default function ImageUploader({
  value,
  onChange,
  disabled = false,
  maxSizeMb = DEFAULT_MAX_MB,
  remoteUpload,
  onPickFile
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (value.startsWith("blob:")) URL.revokeObjectURL(value);
    };
  }, [value]);

  const uploadRemote = useCallback(
    (file: File) => {
      if (!remoteUpload) return;
      const token = remoteUpload.getToken();
      if (!token) {
        toast.error("Not signed in to API — set sessionStorage dz_api_jwt after login.");
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", remoteUpload.uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((100 * e.loaded) / e.total));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setUploadProgress(null);
        if (value.startsWith("blob:")) URL.revokeObjectURL(value);
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText) as { url?: string };
            if (data.url) {
              onChange(data.url);
              onPickFile?.(null);
              toast.success("Image uploaded");
            } else {
              toast.error("Upload response missing url");
            }
          } else {
            const err = JSON.parse(xhr.responseText || "{}") as { error?: string; message?: string };
            toast.error(err.error || err.message || `Upload failed (${xhr.status})`);
          }
        } catch {
          toast.error("Upload failed");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(null);
        toast.error("Network error during upload");
      };

      const fd = new FormData();
      fd.append("image", file);
      setUploading(true);
      setUploadProgress(0);
      xhr.send(fd);
    },
    [remoteUpload, onChange, onPickFile, value]
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast.error(`Image must be ${maxSizeMb}MB or smaller.`);
        return;
      }

      onPickFile?.(file);

      if (remoteUpload) {
        if (value.startsWith("blob:")) URL.revokeObjectURL(value);
        const preview = URL.createObjectURL(file);
        onChange(preview);
        uploadRemote(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result;
        if (typeof r === "string") onChange(r);
      };
      reader.readAsDataURL(file);
    },
    [maxSizeMb, onChange, onPickFile, remoteUpload, uploadRemote, value]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  function handleRemove() {
    if (value.startsWith("blob:")) URL.revokeObjectURL(value);
    onChange("");
    onPickFile?.(null);
    setUploadProgress(null);
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-700">Product image *</span>
      {uploadProgress !== null && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-1 flex justify-between text-xs text-slate-600">
            <span>{uploading ? "Uploading…" : "Upload"}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#1565C0] transition-[width] duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition ${
          disabled || uploading
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : dragOver
              ? "border-[#1565C0] bg-blue-50/80"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) processFile(f);
          }}
        />

        {value ? (
          <div className="relative p-4">
            <div className="relative mx-auto max-h-56 max-w-full overflow-hidden rounded-lg bg-white shadow-inner ring-1 ring-slate-200">
              <img
                src={value}
                alt=""
                className="mx-auto max-h-52 w-auto max-w-full object-contain transition-transform duration-300"
              />
            </div>
            {!disabled && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#1565C0] hover:text-[#1565C0] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Replace image
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 px-6 py-12 text-center transition disabled:cursor-not-allowed"
          >
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
          </button>
        )}
      </div>
    </div>
  );
}
