import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { CmsPageKey } from "../../types/cmsPages";
import CmsEditorToolbar from "./CmsEditorToolbar";

type Props = {
  pageKey: CmsPageKey;
  contentHtml: string;
  onHtmlChange: (html: string) => void;
  /** Character count for footer of editor area */
  charCount: number;
};

export default function PageRichEditor({ pageKey, contentHtml, onHtmlChange, charCount }: Props) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false
        }),
        Placeholder.configure({
          placeholder: "Write page content… Use the toolbar for bold and lists. Shift+Enter for a line break."
        })
      ],
      content: contentHtml,
      editorProps: {
        attributes: {
          class:
            "min-h-[280px] px-4 py-3 text-sm text-slate-900 outline-none focus:outline-none md:min-h-[320px] prose-p:my-0"
        }
      },
      onUpdate: ({ editor: ed }) => {
        onHtmlChange(ed.getHTML());
      }
    },
    [pageKey]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
      <CmsEditorToolbar editor={editor} />
      <div className="relative bg-white">
        {!editor ? (
          <div className="min-h-[280px] animate-pulse bg-slate-100 md:min-h-[320px]" aria-hidden />
        ) : (
          <EditorContent
            editor={editor}
            className="cms-tiptap [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:md:min-h-[320px]"
          />
        )}
        <div className="flex justify-end border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
          <span className="tabular-nums">{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
