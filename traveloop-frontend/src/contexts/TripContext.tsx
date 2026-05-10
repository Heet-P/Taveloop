"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { getTripById } from "@/lib/api";
import type { Trip } from "@/lib/types";

interface TripContextValue {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TripContext = createContext<TripContextValue>({
  trip: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export const useTripContext = () => useContext(TripContext);

export function TripProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  const refetch = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getTripById(id, token);
        if (!cancelled) setTrip(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load trip");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, getToken, rev]);

  return (
    <TripContext.Provider value={{ trip, loading, error, refetch }}>
      {children}
    </TripContext.Provider>
  );
}
