export function formatDa(value: number) {
  return `${value.toLocaleString("fr-DZ")} DA`;
}

export function orderStatusStyles(status: string | null | undefined): string {
  const s = (status ?? "pending").toLowerCase();
  if (s.includes("deliver") || s === "completed") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  }
  if (s.includes("ship") || s.includes("dispatch")) {
    return "bg-blue-50 text-[#0B3D91] ring-blue-200/80";
  }
  if (s.includes("cancel")) {
    return "bg-red-50 text-red-800 ring-red-200/80";
  }
  if (s.includes("process") || s.includes("pending")) {
    return "bg-amber-50 text-amber-900 ring-amber-200/80";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200/80";
}

export function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const n = (name ?? "").trim();
  if (n.length >= 2) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = (email ?? "").trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "GW";
}
