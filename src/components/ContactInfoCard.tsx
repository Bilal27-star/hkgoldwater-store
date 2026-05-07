import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ContactInfoCardProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
};

export default function ContactInfoCard({
  icon: Icon,
  title,
  children
}: ContactInfoCardProps) {
  return (
    <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1565C0]">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="mt-2 space-y-1 text-sm">{children}</div>
        </div>
      </div>
    </article>
  );
}
