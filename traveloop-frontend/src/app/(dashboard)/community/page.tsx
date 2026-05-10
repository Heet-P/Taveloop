"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Copy, Search, Globe, MapPin, Calendar, ArrowRight } from "lucide-react";
import { getCommunityFeed, likeTrip, unlikeTrip, copyPublicTrip } from "@/lib/api";
import type { CommunityTrip } from "@/lib/types";
import Skeleton from "react-loading-skeleton";
import { formatDateRange } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

function CommunityCard({
  trip,
  onLike,
  onCopy,
}: {
  trip: CommunityTrip;
  onLike: (id: string, liked: boolean) => void;
  onCopy: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(trip.like_count ?? 0);
  const [copying, setCopying] = useState(false);

  async function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    onLike(trip.id, next);
  }

  async function handleCopy() {
    setCopying(true);
    await onCopy(trip.id);
    setCopying(false);
  }

  const cities = trip.cities ? trip.cities.split(",").map((c: string) => c.trim()).filter(Boolean) : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col md:flex-row gap-4 md:gap-6 group mb-10"
    >
      {/* Left Column: Author Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center pt-2 w-full md:w-[100px]">
        {trip.avatar_url ? (
          <img 
            src={trip.avatar_url} 
            alt={trip.author_name} 
            className="w-16 h-16 rounded-full object-cover border-4 border-[var(--bg-base)] shadow-sm" 
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 border-2 border-[var(--primary)]/20 flex items-center justify-center text-xl font-bold text-[var(--primary)] shadow-sm">
            {trip.author_name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <div className="mt-2 flex flex-col items-center text-center">
          <span className="text-sm font-semibold text-[var(--text-primary)] px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-sm line-clamp-1 w-full max-w-[120px]">
            {trip.author_name || "Anonymous"}
          </span>
        </div>
      </div>

      {/* Right Column: Trip Content Card */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300">
        
        {/* Card Header (Cover Image) */}
        <div className="h-48 md:h-56 bg-[var(--bg-muted)] relative group-hover:scale-[1.02] transition-transform duration-500">
          {trip.cover_photo ? (
            <img src={trip.cover_photo} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/40 to-[var(--accent-teal)]/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute bottom-4 left-5 right-5">
            <h3 
              className="font-bold text-white text-2xl md:text-3xl leading-tight drop-shadow-md line-clamp-1"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              {trip.name}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {cities.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs text-white bg-black/40 border border-white/10 rounded-full px-2.5 py-1 backdrop-blur-md"
                >
                  <MapPin size={10} />{c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Trip Details */}
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--primary)]" />
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
            {trip.description && (
              <p className="text-[15px] text-[var(--text-secondary)] line-clamp-2 mt-2">
                {trip.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border)]">
            <button
              onClick={handleLike}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border transition-all ${
                liked 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)] hover:border-red-200 hover:text-red-500"
              }`}
              aria-label="Like trip"
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            <Button
              onClick={handleCopy}
              loading={copying}
              className="gap-2 rounded-full shadow-sm hover:shadow-md"
            >
              <Copy size={16} />
              Use Template
            </Button>
          </div>

        </div>
      </div>
    </motion.article>
  );
}

export default function CommunityPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState<CommunityTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  
  // To match wireframe, we implement pill buttons
  const [activeSort, setActiveSort] = useState("latest");

  const load = useCallback(async (s: string, q: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getCommunityFeed({ sort: s, search: q || undefined }, token);
      setTrips(res);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(activeSort, query); }, [activeSort, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  async function handleLike(tripId: string, liked: boolean) {
    const token = await getToken();
    if (!token) return;
    if (liked) await likeTrip(tripId, token);
    else await unlikeTrip(tripId, token);
  }

  async function handleCopy(tripId: string) {
    const token = await getToken();
    if (!token) return;
    try {
      const newTrip = await copyPublicTrip(tripId, token);
      router.push(`/trips/${newTrip.id}/itinerary`);
    } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-20 px-4 md:px-8">
      
      <div className="text-center mb-10">
        <h1 
          className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]" 
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Community Tab
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Discover curated experiences shared by fellow travelers.
        </p>
      </div>

      {/* Controls Row (Wireframe style) */}
      <div className="flex flex-wrap gap-3 items-center mb-12 bg-[var(--bg-card)] p-3 border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-full text-sm bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
          />
        </form>
        <div className="flex gap-2">
          <button className="px-5 py-2 border border-[var(--border)] rounded-full text-sm font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors">
            Group by
          </button>
          <button className="px-5 py-2 border border-[var(--border)] rounded-full text-sm font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors">
            Filter
          </button>
          <select 
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="px-5 py-2 border border-[var(--border)] rounded-full text-sm font-medium bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors appearance-none cursor-pointer focus:outline-none"
          >
            <option value="latest">Sort by: Latest</option>
            <option value="liked">Sort by: Most Liked</option>
            <option value="copied">Sort by: Most Copied</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-6 mb-10">
                <div className="w-full md:w-[100px] flex flex-col items-center">
                  <Skeleton circle height={64} width={64} />
                  <Skeleton width={80} height={20} className="mt-2 rounded-full" />
                </div>
                <div className="flex-1">
                  <Skeleton height={260} borderRadius={16} />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-24 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xl)]">
            <Globe size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="font-semibold text-lg text-[var(--text-primary)]">No public trips found</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <AnimatePresence>
            {trips.map((trip) => (
              <CommunityCard
                key={trip.id}
                trip={trip}
                onLike={handleLike}
                onCopy={handleCopy}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
      
    </div>
  );
}
