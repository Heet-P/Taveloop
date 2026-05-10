"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import TripCard from "@/components/trip/TripCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getTrips, searchCities, createCuratedTrip } from "@/lib/api";
import type { Trip, City } from "@/lib/types";
import { costIndexLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";

function HeroBanner({ firstName }: { firstName: string }) {
  return (
    <div className="relative rounded-[var(--radius-xl)] overflow-hidden bg-[var(--primary)] px-8 py-10 md:px-12 md:py-14">
      {/* Dot-grid bg */}
      <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>
      {/* Decorative path */}
      <svg className="absolute right-10 bottom-0 opacity-15 hidden md:block" width="200" height="120" viewBox="0 0 200 120" fill="none" aria-hidden="true">
        <path d="M20 100 Q80 20 180 60" stroke="white" strokeWidth="2" strokeDasharray="6 4" fill="none" />
        <path d="M175 55 L185 62 L173 64 L175 55Z" fill="white" />
        <ellipse cx="30" cy="95" rx="12" ry="12" fill="white" fillOpacity="0.5" />
        <path d="M30 83 L30 73" stroke="white" strokeWidth="2" />
        <circle cx="30" cy="73" r="3" fill="white" />
      </svg>
      <div className="relative z-10 max-w-xl">
        <p className="text-white/70 text-sm font-medium mb-2">Ready for your next adventure?</p>
        <h1 className="text-3xl md:text-4xl font-semibold italic text-white leading-tight mb-4" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
          Where to next,<br />{firstName}?
        </h1>
        <p className="text-white/75 text-sm mb-6">Plan your trip, build your itinerary, and make memories that last.</p>
        <Link href="/trips/new">
          <Button variant="secondary" size="lg" className="gap-2 font-semibold">
            <Plus size={18} />
            Plan New Trip
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CityPin({ city, onClick, loading }: { city: City; onClick: () => void; loading: boolean }) {
  return (
    <motion.div
      onClick={loading ? undefined : onClick}
      whileHover={!loading ? { y: -3, boxShadow: "0 4px 20px rgba(30,26,22,0.1)" } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] transition-colors ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-[var(--primary)]"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {loading ? (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        ) : (
          <svg width="28" height="35" viewBox="0 0 28 35" fill="none" aria-hidden="true">
            <ellipse cx="14" cy="13" rx="11" ry="11" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.5" />
            <path d="M14 24 Q6 30 14 35 Q22 30 14 24Z" fill="var(--primary)" fillOpacity="0.6" />
            <circle cx="14" cy="13" r="4" fill="var(--primary)" />
          </svg>
        )}
        <Badge variant="cost">{costIndexLabel(city.costIndex)}</Badge>
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>{city.name}</h3>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{city.country}</p>
      <div className="flex items-center gap-1 mt-2">
        {"★★★★★".split("").map((_, i) => (
          <span key={i} className={`text-xs ${i < Math.round(Number(city.popularityScore)) ? "text-[var(--accent-yellow)]" : "text-[var(--border)]"}`}>★</span>
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-1">{Number(city.popularityScore).toFixed(1)}</span>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingForCity, setCreatingForCity] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [tripsData, citiesData] = await Promise.all([
          getTrips({}, token),
          searchCities({}, token),
        ]);
        setTrips(tripsData.slice(0, 4));
        setCities(citiesData.slice(0, 6));
      } catch {
        // error handled silently; page shows empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  const handleCreateCurated = async (cityId: string) => {
    setCreatingForCity(cityId);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await createCuratedTrip(cityId, token);
      if (res?.id) {
        router.push(`/trips/${res.id}/itinerary`);
      }
    } catch (e) {
      alert("Failed to create curated trip.");
      setCreatingForCity(null);
    }
  };

  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "Traveller";

  if (loading) {
    return (
      <PageWrapper>
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-10">
        <HeroBanner firstName={firstName} />

        {/* Recent Trips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
              Recent Trips
            </h2>
            <Link href="/trips" className="flex items-center gap-1 text-sm text-[var(--primary)] font-medium hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {trips.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] p-10 text-center">
              <svg className="mx-auto mb-3 opacity-40" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="8" y="14" width="32" height="24" rx="4" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
                <path d="M16 14 L16 10 Q16 8 18 8 L30 8 Q32 8 32 10 L32 14" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
                <circle cx="24" cy="26" r="4" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
              </svg>
              <p className="text-[var(--text-secondary)] text-sm font-medium">No trips yet — start planning!</p>
              <Link href="/trips/new" className="inline-block mt-3">
                <Button size="sm">Plan your first trip</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        {/* Wavy divider */}
        <svg width="100%" height="20" viewBox="0 0 800 20" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M0 10 Q100 0 200 10 Q300 20 400 10 Q500 0 600 10 Q700 20 800 10" stroke="var(--border)" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Top Destinations */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
              Top Destinations
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Click any destination to instantly generate a fully curated trip template!</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city) => (
              <CityPin 
                key={city.id} 
                city={city} 
                loading={creatingForCity === city.id}
                onClick={() => handleCreateCurated(city.id)} 
              />
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
