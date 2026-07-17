"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RequirePortalAccess({ children }: { children: React.ReactNode }) {
  const { account, publicLibrary, checking } = useAuth();
  const router = useRouter();

  const hasAccess = Boolean(account || publicLibrary);

  useEffect(() => {
    if (!checking && !hasAccess) {
      router.replace("/portal");
    }
  }, [checking, hasAccess, router]);

  if (checking) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  if (!hasAccess) {
    // Redirect is in flight — render nothing rather than flash portal content.
    return null;
  }

  return <>{children}</>;
}
