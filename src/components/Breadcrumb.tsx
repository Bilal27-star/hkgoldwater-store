import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type Crumb = { label: string; to?: string };

type BreadcrumbProps = {
  items: Crumb[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            ) : null}
            {item.to && i < items.length - 1 ? (
              <Link
                to={item.to}
                className="text-gray-500 transition hover:text-[#0B3D91]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  i === items.length - 1 ? "font-medium text-gray-700" : undefined
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
