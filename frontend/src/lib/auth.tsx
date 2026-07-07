"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { LibraryAccount } from "@/types";
import { mockLibraryAccounts } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// MOCK AUTH LAYER. The real backend has no auth or library/tenant concept
// yet (see the note at the top of types/index.ts and connect.md). This
// provider fakes registration/login/session using localStorage so the app
// is fully clickable today. Passwords are compared in plaintext here purely
// for the mock — the real backend must hash passwords (e.g. bcrypt/argon2)
// and issue a real session token (JWT) instead of the fake token below.
// ---------------------------------------------------------------------------

const ACCOUNTS_KEY = "lms_accounts";
const SESSION_KEY = "lms_current_account_id";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  address?: string;
}

interface AuthContextValue {
  account: LibraryAccount | null;
  accounts: LibraryAccount[];
  checking: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (input: RegisterInput) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<LibraryAccount[]>(mockLibraryAccounts);
  const [account, setAccount] = useState<LibraryAccount | null>(null);
  const [checking, setChecking] = useState(true);

  // Rehydrate accounts list + current session from localStorage on mount.
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      const parsedAccounts: LibraryAccount[] = storedAccounts
        ? JSON.parse(storedAccounts)
        : mockLibraryAccounts;
      setAccounts(parsedAccounts);

      const storedSessionId = localStorage.getItem(SESSION_KEY);
      if (storedSessionId) {
        const found = parsedAccounts.find((a) => a.id === Number(storedSessionId));
        if (found) setAccount(found);
      }
    } catch {
      // ignore malformed localStorage, fall back to defaults
    }
    setChecking(false);
  }, []);

  function persistAccounts(next: LibraryAccount[]) {
    setAccounts(next);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  }

  function login(email: string, password: string) {
    const found = accounts.find((a) => a.email === email && a.password === password);
    if (!found) return { success: false, error: "Incorrect email or password." };
    setAccount(found);
    localStorage.setItem(SESSION_KEY, String(found.id));
    return { success: true };
  }

  function register(input: RegisterInput) {
    if (accounts.some((a) => a.email === input.email)) {
      return { success: false, error: "A library with this email is already registered." };
    }
    const newAccount: LibraryAccount = {
      id: Math.max(0, ...accounts.map((a) => a.id)) + 1,
      name: input.name,
      email: input.email,
      password: input.password,
      address: input.address || null,
      created_at: new Date().toISOString().slice(0, 10),
    };
    persistAccounts([...accounts, newAccount]);
    setAccount(newAccount);
    localStorage.setItem(SESSION_KEY, String(newAccount.id));
    return { success: true };
  }

  function logout() {
    setAccount(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ account, accounts, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
