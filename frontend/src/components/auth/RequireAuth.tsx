"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { account, checking } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checking && !account) {
      router.replace("/login");
    }
  }, [checking, account, router]);

  if (checking) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  if (!account) {
    // Redirect is in flight — render nothing rather than flash protected content.
    return null;
  }

  return <>{children}</>;
}
