import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  // Ensure the date string is treated as local time by adding a midday time if it's just a date
  const parsedStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  return new Date(parsedStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start.includes('T') ? start : `${start}T12:00:00`);
  const e = new Date(end.includes('T') ? end : `${end}T12:00:00`);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function costIndexLabel(index: 1 | 2 | 3): string {
  return ["$", "$$", "$$$"][index - 1];
}

export function tripStatusColor(status: string): string {
  const map: Record<string, string> = {
    upcoming: "bg-[var(--accent-teal-light)] text-[var(--accent-teal)]",
    ongoing: "bg-[var(--primary-light)] text-[var(--primary)]",
    completed: "bg-green-50 text-[var(--accent-green)]",
  };
  return map[status] ?? "bg-[var(--bg-muted)] text-[var(--text-secondary)]";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
}
