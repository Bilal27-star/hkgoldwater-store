import type { CmsPageKey } from "../../types/cmsPages";
import { CMS_PAGE_ORDER } from "../../types/cmsPages";

type Props = {
  selected: CmsPageKey;
  onSelect: (key: CmsPageKey) => void;
};

export default function PageSelector({ selected, onSelect }: Props) {
  return (
    <nav
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-label="Select page"
    >
      <ul className="divide-y divide-slate-100">
        {CMS_PAGE_ORDER.map(({ key, label }) => {
          const isActive = selected === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={`w-full px-4 py-3.5 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1565C0] text-white shadow-inner"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#0B3D91]"
                }`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
