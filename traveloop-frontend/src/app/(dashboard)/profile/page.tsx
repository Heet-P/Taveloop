"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Edit2, Check, X, MapPin, Briefcase, Globe } from "lucide-react";
import { getMe, updateMe, getTrips, getSavedDestinations } from "@/lib/api";
import type { User, Trip, City } from "@/lib/types";
import PageWrapper from "@/components/layout/PageWrapper";
import Skeleton from "react-loading-skeleton";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [saved, setSaved] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const [me, myTrips, myDests] = await Promise.all([
          getMe(token),
          getTrips({}, token),
          getSavedDestinations(token),
        ]);
        setProfile(me);
        setTrips(myTrips);
        setSaved(myDests);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await updateMe({ name: editName, bio: editBio }, token);
      setProfile(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setEditName(profile?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setEditing(true);
  }

  const stats = [
    { label: "Total Trips", value: trips.length },
    { label: "Completed", value: trips.filter((t) => t.status === "completed").length },
    { label: "Upcoming", value: trips.filter((t) => t.status === "upcoming").length },
    { label: "Public", value: trips.filter((t) => t.isPublic).length },
  ];

  if (loading) return (
    <PageWrapper title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton circle width={80} height={80} />
          <div>
            <Skeleton width={160} height={24} />
            <Skeleton width={120} height={16} className="mt-1" />
          </div>
        </div>
        <Skeleton height={60} borderRadius={12} />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={64} borderRadius={12} />)}
        </div>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar + name */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6">
          <div className="flex items-start gap-4">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt={profile?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border)] shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-2xl font-bold text-[var(--primary)] shrink-0">
                {profile?.name?.[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] bg-[var(--bg-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                    placeholder="Your name"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] bg-[var(--bg-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
                    placeholder="Write a short bio…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={12} /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-muted)]"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <h2
                    className="text-xl font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
                  >
                    {profile?.name}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{profile?.email}</p>
                  {profile?.bio ? (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] italic mt-2">No bio yet.</p>
                  )}
                  <button
                    onClick={startEdit}
                    className="absolute top-0 right-0 p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-muted)] rounded-[var(--radius-sm)] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Edit profile"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 text-center"
            >
              <p className="text-2xl font-bold text-[var(--primary)]">{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Saved destinations */}
        {saved.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
            <h3
              className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              <MapPin size={16} className="text-[var(--primary)]" />
              Saved Destinations
            </h3>
            <div className="flex flex-wrap gap-2">
              {saved.map((city) => (
                <span
                  key={city.id}
                  className="px-3 py-1.5 bg-[var(--bg-muted)] rounded-full text-sm text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <Globe size={12} className="text-[var(--accent-teal)]" />
                  {city.name}, {city.country}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent trips */}
        {trips.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
            <h3
              className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              <Briefcase size={16} className="text-[var(--primary)]" />
              My Trips
            </h3>
            <ul className="space-y-2">
              {trips.slice(0, 5).map((trip) => (
                <li key={trip.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--text-primary)] font-medium">{trip.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    trip.status === "ongoing" ? "bg-green-100 text-green-700" :
                    trip.status === "upcoming" ? "bg-blue-100 text-blue-700" :
                    "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                  }`}>
                    {trip.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
