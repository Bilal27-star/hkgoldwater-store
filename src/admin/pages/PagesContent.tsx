import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import CmsSaveBar from "../components/pages-content/CmsSaveBar";
import PageHtmlPreview from "../components/pages-content/PageHtmlPreview";
import PageInfoCard from "../components/pages-content/PageInfoCard";
import PageRichEditor from "../components/pages-content/PageRichEditor";
import PageSelector from "../components/pages-content/PageSelector";
import { htmlPlainTextLength, useCmsPages } from "../hooks/useCmsPages";
import type { CmsPageKey } from "../types/cmsPages";
import { CMS_PAGE_ORDER } from "../types/cmsPages";

export default function PagesContent() {
  const { pages, isDirty, setTitle, setContentHtml, flushSave } = useCmsPages();
  const [selectedPage, setSelectedPage] = useState<CmsPageKey>("about");
  const [saving, setSaving] = useState(false);

  const current = pages[selectedPage];
  const label = CMS_PAGE_ORDER.find((p) => p.key === selectedPage)?.label ?? current.title;

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  async function handleSave() {
    setSaving(true);
    try {
      await flushSave(selectedPage);
      toast.success("Page saved");
    } finally {
      setSaving(false);
    }
  }

  const charCount = htmlPlainTextLength(current.contentHtml);

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-28">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91]">Pages Content</h1>
        <p className="mt-1 text-sm text-slate-500">
          Edit static pages for your storefront. Preview updates live as you type.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 space-y-4 lg:w-[260px]">
          <PageSelector selected={selectedPage} onSelect={setSelectedPage} />
          <PageInfoCard lastUpdatedIso={current.updatedAt} characterCount={charCount} />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1565C0]">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
                <p className="text-sm text-slate-500">Edit page content below.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="cms-page-title" className="block text-sm font-medium text-slate-700">
                  Page title <span className="text-red-500">*</span>
                </label>
                <input
                  id="cms-page-title"
                  value={current.title}
                  onChange={(e) => setTitle(selectedPage, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20"
                  autoComplete="off"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700">
                  Page content <span className="text-red-500">*</span>
                </span>
                <p className="mt-1 text-xs text-slate-500">Use the toolbar for bold and bullet lists.</p>
                <div className="mt-3">
                  <PageRichEditor
                    pageKey={selectedPage}
                    contentHtml={current.contentHtml}
                    onHtmlChange={(html) => setContentHtml(selectedPage, html)}
                    charCount={charCount}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-lg border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-blue-900">
            <p className="font-medium">Formatting tips</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800/90">
              <li>Use double line breaks to create new paragraphs</li>
              <li>Create lists with the bullet button or type “- ” at the start of a line</li>
              <li>Keep content clear and easy to read for customers</li>
            </ul>
          </div>

          <PageHtmlPreview title={current.title} contentHtml={current.contentHtml} />
        </div>
      </div>

      <CmsSaveBar isDirty={isDirty} disabled={!isDirty} saving={saving} onSave={handleSave} />
    </div>
  );
}
