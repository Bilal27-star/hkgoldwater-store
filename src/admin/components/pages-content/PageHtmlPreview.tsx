import { Eye } from "lucide-react";

type Props = {
  title: string;
  /** Trusted HTML from TipTap (admin-only) */
  contentHtml: string;
};

export default function PageHtmlPreview({ title, contentHtml }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/90 bg-white shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/95 px-5 py-3">
        <Eye className="h-5 w-5 text-emerald-700" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">Live preview</h2>
      </div>
      <div className="bg-slate-50 p-6 md:p-8">
        <article className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 md:p-10">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{title || "Untitled"}</h3>
          <hr className="my-6 border-slate-200" />
          <div
            className="cms-html-preview text-sm leading-relaxed text-slate-700 [&_li>p]:mb-0 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6"
            dangerouslySetInnerHTML={{ __html: contentHtml || "<p></p>" }}
          />
        </article>
      </div>
    </section>
  );
}
