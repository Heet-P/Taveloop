import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

const baseClasses =
  "w-full border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg-base)] " +
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)] " +
  "focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--primary)]/20 " +
  "transition-colors duration-150";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(baseClasses, "px-3 py-2 text-sm", error && "border-red-400 focus:ring-red-200", className)}
          {...props}
        />
        {error && <span className="text-xs text-[var(--primary)] font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(baseClasses, "px-3 py-2 text-sm resize-none", error && "border-red-400 focus:ring-red-200", className)}
          {...props}
        />
        {error && <span className="text-xs text-[var(--primary)] font-medium">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
