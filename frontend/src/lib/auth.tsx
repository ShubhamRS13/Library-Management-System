"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { LibraryAccount, PublicLibrarySession } from "@/types";
import { mockLibraryAccounts } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// MOCK AUTH LAYER supporting TWO access modes:
//
// 1. Admin access — full login (email + password), unchanged from before.
//    Grants access to the whole dashboard (books, members, loans, AI).
//
// 2. Public access — no password, just the library's name. Grants access
//    only to that library's public portal (browse catalog, view book
//    availability, AI assistant) — never members, loans, or admin actions.
//    This is enforced in two places: route guards (RequirePortalAccess vs
//    RequireAuth) hide the UI, and src/lib/store.tsx additionally refuses
//    to fetch member/loan data or run any mutating action unless an admin
//    `account` is present — so even a bug in the UI can't leak or change
//    admin-only data from the public portal.
//
// The real backend has no auth or library/tenant concept yet (see the note
// at the top of types/index.ts and connect.md). This provider fakes both
// flows using localStorage so the app is fully clickable today. Passwords
// are compared in plaintext here purely for the mock — the real backend
// must hash passwords and issue a real session token (JWT) instead.
// ---------------------------------------------------------------------------

const ACCOUNTS_KEY = "lms_accounts";
const SESSION_KEY = "lms_current_account_id";
const PUBLIC_SESSION_KEY = "lms_public_library_id";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  address?: string;
}

interface AuthContextValue {
  account: LibraryAccount | null;
  accounts: LibraryAccount[];
  publicLibrary: PublicLibrarySession | null;
  role: "admin" | "public" | null;
  checking: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (input: RegisterInput) => { success: boolean; error?: string };
  logout: () => void;
  enterPublicPortal: (libraryName: string) => { success: boolean; error?: string };
  exitPublicPortal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<LibraryAccount[]>(mockLibraryAccounts);
  const [account, setAccount] = useState<LibraryAccount | null>(null);
  const [publicLibrary, setPublicLibrary] = useState<PublicLibrarySession | null>(null);
  const [checking, setChecking] = useState(true);

  // Rehydrate accounts list + whichever session (admin or public) was active.
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

      const storedPublicId = localStorage.getItem(PUBLIC_SESSION_KEY);
      if (storedPublicId) {
        const found = parsedAccounts.find((a) => a.id === Number(storedPublicId));
        if (found) {
          setPublicLibrary({
            id: found.id,
            name: found.name,
            email: found.email,
            address: found.address,
          });
        }
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

  function enterPublicPortal(libraryName: string) {
    const query = libraryName.trim().toLowerCase();
    if (!query) return { success: false, error: "Enter a library name." };

    const found = accounts.find((a) => a.name.trim().toLowerCase() === query);
    if (!found) {
      return {
        success: false,
        error: "No library found with that name. Check the spelling, or ask your library for their exact registered name.",
      };
    }

    setPublicLibrary({ id: found.id, name: found.name, email: found.email, address: found.address });
    localStorage.setItem(PUBLIC_SESSION_KEY, String(found.id));
    return { success: true };
  }

  function exitPublicPortal() {
    setPublicLibrary(null);
    localStorage.removeItem(PUBLIC_SESSION_KEY);
  }

  const role: "admin" | "public" | null = account ? "admin" : publicLibrary ? "public" : null;

  return (
    <AuthContext.Provider
      value={{
        account,
        accounts,
        publicLibrary,
        role,
        checking,
        login,
        register,
        logout,
        enterPublicPortal,
        exitPublicPortal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
