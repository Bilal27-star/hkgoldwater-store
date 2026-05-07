import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";
import { Bold, CornerDownLeft, List } from "lucide-react";

type Props = {
  editor: Editor | null;
};

export default function CmsEditorToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
      <ToolbarBtn
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Line break"
        active={false}
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        <CornerDownLeft className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({
  label,
  active,
  onClick,
  children
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md p-2 transition hover:bg-slate-200/80 ${
        active ? "bg-blue-100 text-[#1565C0]" : "text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
