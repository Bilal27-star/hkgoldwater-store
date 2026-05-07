import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Upload } from "lucide-react";

const MAX_BYTES = 2 * 1024 * 1024;

type Props = {
  logo: string;
  onLogoChange: (dataUrlOrUrl: string) => void;
};

export default function LogoUploadZone({ logo, onLogoChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const type = file.type.toLowerCase();
      const isSvg = type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
      const isRaster = type === "image/png" || type === "image/jpeg" || type === "image/jpg";
      if (!isSvg && !isRaster) {
        const msg = "Use PNG, JPG, or SVG.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_BYTES) {
        const msg = "File must be 2MB or smaller.";
        setError(msg);
        toast.error(msg);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          onLogoChange(result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    },
    [onLogoChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold text-slate-900">Store logo</h2>
      <p className="mt-1 text-sm text-slate-500">Appears in the preview and can be wired to the live site header.</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver
              ? "border-[#1565C0] bg-blue-50/50"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={onInputChange}
          />
          <Upload className="mb-2 h-8 w-8 text-slate-400" aria-hidden />
          <p className="text-sm font-medium text-slate-700">Drag & drop or click to upload</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-[#1565C0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3D91]"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Upload logo
          </button>
          <p className="mt-3 text-xs text-slate-500">PNG, JPG or SVG • Max 2MB • Recommended: 200×200px</p>
          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </div>

        <div className="flex w-full flex-col items-center gap-3 lg:w-56">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Preview</p>
          <div className="flex h-40 w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-inner">
            {logo ? (
              <img src={logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <ImageIcon className="h-12 w-12 text-slate-200" aria-hidden />
            )}
          </div>
          {logo && (
            <button
              type="button"
              onClick={() => {
                onLogoChange("");
                setError(null);
              }}
              className="text-sm text-red-600 underline-offset-2 hover:underline"
            >
              Remove logo
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
