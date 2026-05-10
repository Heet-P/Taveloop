"use client";

import { use, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, Globe, Share2 } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { TripProvider, useTripContext } from "@/contexts/TripContext";
import { formatDateRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { publishTrip } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

const tabs = [
  { label: "Itinerary", key: "itinerary" },
  { label: "Budget", key: "budget" },
  { label: "Checklist", key: "checklist" },
  { label: "Notes", key: "notes" },
  { label: "Invoice", key: "invoice" },
];

function TripShell({ id, children }: { id: string; children: React.ReactNode }) {
  const { trip, loading, refetch } = useTripContext();
  const pathname = usePathname();
  const { getToken } = useAuth();
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!trip) return;
    try {
      setPublishing(true);
      const token = await getToken();
      if (!token) return;
      await publishTrip(trip.id, token);
      refetch();
    } catch (e) {
      alert("Failed to update trip visibility.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      {/* Hero header */}
      <div className="relative h-48 md:h-60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-teal)]" />
        {trip?.coverPhoto && (
          <img
            src={trip.coverPhoto}
            alt={trip.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8">
          <div className="flex justify-between items-start">
            <Link
              href="/trips"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors w-fit"
            >
              <ArrowLeft size={15} />
              My Trips
            </Link>

            {!loading && trip && (
              <Button 
                onClick={handlePublish} 
                loading={publishing}
                variant={trip.isPublic ? "secondary" : "primary"} 
                size="sm" 
                className="gap-2 shadow-md hidden sm:flex"
              >
                {trip.isPublic ? <Globe size={14} /> : <Share2 size={14} />}
                {trip.isPublic ? "Make Private" : "Publish to Community"}
              </Button>
            )}
          </div>

          <div>
            {loading ? (
              <>
                <Skeleton width={220} height={28} baseColor="rgba(255,255,255,0.15)" highlightColor="rgba(255,255,255,0.25)" />
                <Skeleton width={160} height={16} className="mt-1" baseColor="rgba(255,255,255,0.15)" highlightColor="rgba(255,255,255,0.25)" />
              </>
            ) : (
              <>
                <h1
                  className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-sm leading-snug"
                  style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
                >
                  {trip?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-white/75 text-sm">
                  {trip && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </span>
                  )}
                  {(trip?.stops?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {trip!.stops.length} {trip!.stops.length === 1 ? "stop" : "stops"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-14 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex overflow-x-auto">
          {tabs.map(({ label, key }) => {
            const href = `/trips/${id}/${key}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">{children}</div>
    </div>
  );
}

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <TripProvider id={id}>
      <TripShell id={id}>{children}</TripShell>
    </TripProvider>
  );
}
