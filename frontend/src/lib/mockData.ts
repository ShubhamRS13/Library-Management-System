import type { Book, Member, Loan, BookRelation, LibraryAccount } from "@/types";

// Two demo libraries to show tenant isolation. All existing catalog/member/
// loan mock data below belongs to library_id 1 ("Demo Public Library").
// Register a new library in the app to see an empty, isolated account.
export const mockLibraryAccounts: LibraryAccount[] = [
  {
    id: 1,
    name: "Demo Public Library",
    email: "demo@library.com",
    password: "demo1234",
    address: "1 Main Street",
    created_at: "2026-01-01",
  },
  {
    id: 2,
    name: "Riverside Community Library",
    email: "riverside@library.com",
    password: "riverside123",
    address: "22 River Road",
    created_at: "2026-03-15",
  },
];

export const mockBooks: Book[] = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    summary: "A handbook of agile software craftsmanship.",
    tags: "programming, software-engineering",
    library_id: 1,
    copies: [
      { id: 101, book_id: 1, is_available: false, condition: "good" },
      { id: 102, book_id: 1, is_available: true, condition: "good" },
    ],
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    isbn: "9780135957059",
    summary: "Classic guide to becoming a better software developer.",
    tags: "programming, software-engineering",
    library_id: 1,
    copies: [
      { id: 103, book_id: 2, is_available: true, condition: "good" },
      { id: 104, book_id: 2, is_available: true, condition: "worn" },
    ],
  },
  {
    id: 3,
    title: "Gone Girl",
    author: "Gillian Flynn",
    isbn: "9780307588364",
    summary: "A psychological thriller about a marriage gone wrong.",
    tags: "fiction, thriller",
    library_id: 1,
    copies: [{ id: 105, book_id: 3, is_available: false, condition: "good" }],
  },
  {
    id: 4,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    summary: "A brief history of humankind.",
    tags: "non-fiction, history",
    library_id: 1,
    copies: [
      { id: 106, book_id: 4, is_available: true, condition: "good" },
      { id: 107, book_id: 4, is_available: true, condition: "good" },
    ],
  },
  {
    id: 5,
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    summary: "A science fiction epic set on the desert planet Arrakis.",
    tags: "fiction, sci-fi",
    library_id: 1,
    copies: [{ id: 108, book_id: 5, is_available: true, condition: "damaged" }],
  },
];

export const mockBookRelations: BookRelation[] = [
  { id: 1, book_id: 1, related_book_ids: [2] },
  { id: 2, book_id: 2, related_book_ids: [1] },
  { id: 3, book_id: 3, related_book_ids: [] },
  { id: 4, book_id: 5, related_book_ids: [] },
];

export const mockMembers: Member[] = [
  {
    id: 1,
    first_name: "Shubham",
    last_name: "Rao",
    email: "shubham@example.com",
    phone_number: "9876500001",
    membership_status: "active",
    join_date: "2026-01-10",
    last_activity_date: "2026-07-01",
    total_loan_count: 4,
    library_id: 1,
  },
  {
    id: 2,
    first_name: "Vishal",
    last_name: "Mehta",
    email: "vishal@example.com",
    phone_number: "9876500002",
    membership_status: "active",
    join_date: "2026-02-15",
    last_activity_date: "2026-06-28",
    total_loan_count: 2,
    library_id: 1,
  },
  {
    id: 3,
    first_name: "Priya",
    last_name: "Nair",
    email: "priya@example.com",
    phone_number: "9876500003",
    membership_status: "suspended",
    join_date: "2025-11-20",
    last_activity_date: "2026-05-10",
    total_loan_count: 7,
    library_id: 1,
  },
];

export const mockLoans: Loan[] = [
  {
    id: 1,
    book_id: 1,
    member_id: 1,
    copy_id: 101,
    load_date: "2026-06-25",
    return_date: null,
    library_id: 1,
  },
  {
    id: 2,
    book_id: 3,
    member_id: 2,
    copy_id: 105,
    load_date: "2026-06-20",
    return_date: null,
    library_id: 1,
  },
  {
    id: 3,
    book_id: 4,
    member_id: 1,
    copy_id: 106,
    load_date: "2026-05-01",
    return_date: "2026-05-15",
    library_id: 1,
  },
];
