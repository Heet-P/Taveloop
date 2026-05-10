import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "postcard";
  hoverable?: boolean;
}

export default function Card({ className, variant = "default", hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-card)] transition-all duration-200",
        hoverable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        variant === "postcard" && "ring-1 ring-inset ring-[var(--border)] ring-offset-2 ring-offset-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
