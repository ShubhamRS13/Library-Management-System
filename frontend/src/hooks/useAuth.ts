"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setIsAuthenticated(Boolean(getToken()));
    setChecking(false);
  }, []);

  return { isAuthenticated, checking };
}
