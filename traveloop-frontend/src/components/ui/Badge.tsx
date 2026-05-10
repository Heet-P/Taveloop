import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant = "ongoing" | "upcoming" | "completed" | "category" | "cost" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  ongoing: "bg-[var(--primary-light)] text-[var(--primary)]",
  upcoming: "bg-[var(--accent-teal-light)] text-[var(--accent-teal)]",
  completed: "bg-green-50 text-[var(--accent-green)]",
  category: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
  cost: "bg-amber-50 text-amber-700",
  default: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
};

export default function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantMap[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
