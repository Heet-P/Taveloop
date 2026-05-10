"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import TripCardSkeleton from "@/components/skeletons/TripCardSkeleton";
import TripCard from "@/components/trip/TripCard";
import Button from "@/components/ui/Button";
import { getTrips, deleteTrip } from "@/lib/api";
import type { Trip, TripStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
];

export default function TripsPage() {
  const { getToken } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getTrips(status ? { status } : {}, token);
      setTrips(data);
    } catch {
      setError("Failed to load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteTrip(id, token);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Failed to delete trip.");
    }
  };

  const filtered = trips.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper
      title="My Trips"
      subtitle="All your adventures in one place"
      action={
        <Link href="/trips/new">
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            New Trip
          </Button>
        </Link>
      }
    >
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-md)] w-fit mb-6 relative">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors z-10",
              activeTab === tab.value
                ? "text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-white rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)]"
                style={{ zIndex: -1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search trips…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search trips"
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-[var(--radius-md)] text-sm text-red-600">
          {error}{" "}
          <button onClick={() => load(activeTab)} className="underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <TripCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-[var(--radius-xl)] p-16 text-center">
          <svg className="mx-auto mb-4 opacity-40" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <rect x="10" y="18" width="36" height="28" rx="5" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
            <path d="M18 18 L18 12 Q18 9 21 9 L35 9 Q38 9 38 12 L38 18" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
            <circle cx="28" cy="32" r="5" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
            <path d="M24 36 L32 28" stroke="var(--text-muted)" strokeWidth="1" />
          </svg>
          <p className="text-[var(--text-secondary)] font-medium mb-3">
            {search ? `No trips matching "${search}"` : "No trips yet — start planning!"}
          </p>
          {!search && (
            <Link href="/trips/new">
              <Button size="sm">Plan your first trip</Button>
            </Link>
          )}
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" }}
              >
                <TripCard
                  trip={trip}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </PageWrapper>
  );
}
