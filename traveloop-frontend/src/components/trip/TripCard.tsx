"use client";

import Link from "next/link";
import { MoreHorizontal, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

interface TripCardProps {
  trip: Trip;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const statusVariant: Record<string, "ongoing" | "upcoming" | "completed"> = {
  ongoing: "ongoing",
  upcoming: "upcoming",
  completed: "completed",
};

const postcardPatterns = [
  "M0 0 Q50 30 100 0 Q50 -30 0 0Z",
  "M0 50 Q30 0 60 50 Q90 100 100 50",
];

export default function TripCard({ trip, onDelete, onEdit }: TripCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const patternIndex = parseInt(trip.id) % postcardPatterns.length;
  const patternColors = ["#fbe9e2", "#e0f4f7", "#f5f0e8"];
  const patternColor = patternColors[parseInt(trip.id) % patternColors.length];

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 4px 20px rgba(30, 26, 22, 0.1)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-card)]"
    >
      {/* Cover */}
      <Link href={`/trips/${trip.id}`} aria-label={`View trip: ${trip.name}`}>
        <div
          className="h-40 relative flex items-center justify-center"
          style={{ background: patternColor }}
        >
          {trip.coverPhoto ? (
            <img
              src={trip.coverPhoto}
              alt={trip.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true" className="opacity-40">
              <ellipse cx="60" cy="40" rx="50" ry="28" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
              <circle cx="60" cy="40" r="8" fill="var(--primary)" fillOpacity="0.3" />
              <path d="M60 30 L60 20 M60 50 L60 60 M50 40 L38 40 M70 40 L82 40" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.4" />
              <path d="M30 55 Q60 20 90 55" stroke="var(--accent-teal)" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
            </svg>
          )}
          {/* Stop count badge */}
          {trip.stops && trip.stops.length > 0 && (
            <div className="absolute bottom-2 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <MapPin size={11} className="text-[var(--primary)]" />
              <span className="text-xs font-medium text-[var(--text-primary)]">{trip.stops.length} {trip.stops.length === 1 ? "stop" : "stops"}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/trips/${trip.id}`}>
            <h3
              className="font-semibold text-[var(--text-primary)] text-base leading-snug hover:text-[var(--primary)] transition-colors line-clamp-1"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              {trip.name}
            </h3>
          </Link>

          {/* Three-dot menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Trip options"
              className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 bg-white border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1 w-36">
                <Link
                  href={`/trips/${trip.id}`}
                  className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => setMenuOpen(false)}
                >
                  View
                </Link>
                {onEdit && (
                  <button
                    onClick={() => { onEdit(trip.id); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(trip.id); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--text-muted)]">
          <Calendar size={11} />
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant={statusVariant[trip.status] ?? "default"}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </Badge>
          {trip.isPublic && (
            <Badge variant="category">Public</Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
