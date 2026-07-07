// These interfaces mirror app/models.py in the backend field-for-field.
// If the backend schema changes, update here first — every mock and
// component in this app is typed against this file.
//
// NOTE ON MULTI-TENANCY: the real backend currently has no concept of
// separate libraries registering/logging in — it's a single-tenant schema.
// `LibraryAccount` and every `library_id` field below are a MOCK-ONLY
// addition so this frontend can demonstrate multiple libraries each seeing
// only their own data. See connect.md for what the backend needs to add to
// support this for real (a `library` table, auth, and a `library_id`
// foreign key on `book`, `member`, and `loan`).

export interface LibraryAccount {
  id: number;
  name: string;
  email: string;
  password: string; // mock only — plaintext here, backend must hash this
  address?: string | null;
  created_at: string; // ISO date
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  summary?: string | null;
  tags?: string | null; // plain string in the backend, not an array
  copies: BookCopy[];
  library_id: number; // mock-only tenant scoping, see note above
}

export interface BookCopy {
  id: number;
  book_id: number;
  is_available: boolean;
  condition: string; // e.g. "good", "worn", "damaged"
}

export interface BookRelation {
  id: number;
  book_id: number;
  related_book_ids: number[];
}

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string | null;
  membership_status: "active" | "suspended" | "expired";
  join_date: string; // ISO date
  last_activity_date?: string | null;
  total_loan_count: number;
  library_id: number; // mock-only tenant scoping, see note above
}

export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  load_date: string; // ISO date — spelled "load_date" in the backend, kept as-is
  return_date?: string | null;
  // NOTE: copy_id is NOT part of the real backend schema yet — the backend's
  // Loan table only links to book_id, not a specific BookCopy. It's added
  // here so this mock UI can show/return a *specific* physical copy.
  // See connect.md for how to handle this gap when wiring up the real API.
  copy_id?: number;
  library_id: number; // mock-only tenant scoping, see note above
}
