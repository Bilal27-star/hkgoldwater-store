type Props = {
  lastUpdatedIso: string;
  characterCount: number;
};

function formatUpdated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function PageInfoCard({ lastUpdatedIso, characterCount }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Page info</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Last updated</dt>
          <dd className="font-medium text-slate-900">{formatUpdated(lastUpdatedIso)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Characters</dt>
          <dd className="tabular-nums font-medium text-slate-900">{characterCount}</dd>
        </div>
      </dl>
    </div>
  );
}
