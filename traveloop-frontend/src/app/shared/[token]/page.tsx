"use client";

import { use, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, DollarSign, Clock, Copy, Globe, ArrowLeft } from "lucide-react";
import { getSharedTrip, copySharedTrip } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import Skeleton from "react-loading-skeleton";

const CATEGORY_EMOJI: Record<string, string> = {
  sightseeing: "🏛️",
  food: "🍜",
  adventure: "🧗",
  shopping: "🛍️",
  culture: "🎭",
};

export default function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: shareToken } = use(params);
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSharedTrip(shareToken);
        setTrip(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [shareToken]);

  async function handleCopy() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setCopying(true);
    try {
      const authToken = await getToken();
      if (!authToken) return;
      const newTrip = await copySharedTrip(shareToken, authToken);
      router.push(`/trips/${newTrip.id}/itinerary`);
    } catch {
      setCopying(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6 max-w-3xl mx-auto">
      <Skeleton height={240} borderRadius={20} />
      <Skeleton height={28} width="60%" className="mt-4" />
      <Skeleton height={16} width="40%" className="mt-2" />
      <Skeleton count={3} height={100} borderRadius={12} className="mt-4" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-center px-4">
      <div>
        <Globe size={56} className="mx-auto text-[var(--text-muted)] mb-4" />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
          Trip not found
        </h1>
        <p className="text-[var(--text-muted)] mt-2 mb-6">This trip may have been made private or the link is incorrect.</p>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );

  const stops = [...(trip?.stops ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-teal)]" />
        {trip?.coverPhoto && (
          <img src={trip.coverPhoto} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 max-w-3xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm w-fit transition-colors"
          >
            <ArrowLeft size={15} /> Community
          </Link>
          <div>
            <h1
              className="text-3xl font-semibold text-white drop-shadow-sm"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              {trip?.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-white/75 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {trip && formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {stops.length} {stops.length === 1 ? "stop" : "stops"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Copy banner */}
        <div className="bg-[var(--primary-light)] border border-[var(--primary)]/20 rounded-[var(--radius-lg)] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Like this trip?</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Copy it to your account and start customising.</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={copying}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-60 shrink-0 transition-opacity"
          >
            <Copy size={14} />
            {copying ? "Copying…" : "Use this trip"}
          </button>
        </div>

        {/* Stops */}
        {stops.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No stops in this itinerary.</p>
        ) : (
          <div className="space-y-5">
            {stops.map((stop, idx) => (
              <div
                key={stop.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3 p-4 bg-[var(--bg-base)] border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{stop.city?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{stop.city?.country}</p>
                  </div>
                  {stop.startDate && stop.endDate && (
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      {stop.startDate} → {stop.endDate}
                    </span>
                  )}
                </div>

                {(stop.activities?.length ?? 0) > 0 ? (
                  <ul className="divide-y divide-[var(--border)]">
                    {stop.activities.map((act) => (
                      <li key={act.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-lg" aria-hidden="true">{CATEGORY_EMOJI[act.category] ?? "📍"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{act.name}</p>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                            {act.cost > 0 && (
                              <span className="flex items-center gap-0.5"><DollarSign size={10} />{act.cost}</span>
                            )}
                            {act.durationMinutes && (
                              <span className="flex items-center gap-0.5"><Clock size={10} />{act.durationMinutes}min</span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-xs text-[var(--text-muted)] italic">No activities listed.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
