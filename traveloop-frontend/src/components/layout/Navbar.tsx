"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/trips", label: "My Trips" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/home" className="flex items-center gap-2 shrink-0" aria-label="Traveloop home">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" fill="var(--primary)" />
            <path d="M8 14 Q14 7 20 14 Q14 21 8 14Z" fill="white" opacity="0.9" />
            <circle cx="14" cy="14" r="2.5" fill="white" />
          </svg>
          <span className="font-semibold text-[var(--text-primary)] text-lg hidden sm:block" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
            Traveloop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-[var(--primary)] bg-[var(--primary-light)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="p-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            <Search size={18} />
          </button>
          <button
            aria-label="Notifications"
            className="p-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            <Bell size={18} />
          </button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
