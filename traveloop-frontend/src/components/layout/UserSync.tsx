"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { syncUser } from "@/lib/api";

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || synced.current) return;
    synced.current = true;

    const run = async () => {
      const token = await getToken();
      if (!token) return;
      await syncUser(
        {
          clerkId: user.id,
          name: user.fullName ?? user.firstName ?? "User",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          avatarUrl: user.imageUrl,
          role: user.publicMetadata?.role as string | undefined,
        },
        token
      ).catch(() => {});
    };

    run();
  }, [user, isLoaded, getToken]);

  return null;
}
