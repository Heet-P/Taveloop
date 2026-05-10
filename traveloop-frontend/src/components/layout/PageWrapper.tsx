"use client";

import { motion } from "framer-motion";

interface PageWrapperProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function PageWrapper({ title, subtitle, children, action }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 w-full"
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            {title && (
              <h1
                className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </motion.main>
  );
}
