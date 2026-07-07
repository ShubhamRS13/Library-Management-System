"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, Download, CheckCircle2, XCircle } from "lucide-react";
import { useLibrary, type NewBookInput } from "@/lib/store";

interface ParsedRow {
  title: string;
  author: string;
  isbn: string;
  summary: string;
  tags: string;
  copies: string;
  valid: boolean;
  error?: string;
}

const SAMPLE_CSV = `title,author,isbn,summary,tags,copies
The Hobbit,J.R.R. Tolkien,9780547928227,A hobbit's unexpected journey.,"fiction, fantasy",2
1984,George Orwell,9780451524935,A dystopian vision of the future.,"fiction, classic",3
`;

function validateRow(row: Record<string, string>): ParsedRow {
  const title = (row.title || "").trim();
  const author = (row.author || "").trim();
  const isbn = (row.isbn || "").trim();
  const summary = (row.summary || "").trim();
  const tags = (row.tags || "").trim();
  const copiesRaw = (row.copies || "").trim();

  const missing = [!title && "title", !author && "author", !isbn && "isbn"].filter(Boolean);

  return {
    title,
    author,
    isbn,
    summary,
    tags,
    copies: copiesRaw || "1",
    valid: missing.length === 0,
    error: missing.length > 0 ? `Missing ${missing.join(", ")}` : undefined,
  };
}

export default function BulkUploadCsv({ onDone }: { onDone?: () => void }) {
  const { bulkAddBooks } = useLibrary();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploaded, setUploaded] = useState(0);

  function handleFile(file: File) {
    setFileName(file.name);
    setUploaded(0);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        setRows(results.data.map(validateRow));
      },
    });
  }

  function handleDownloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-books.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const validRows = rows.filter((r) => r.valid);

  function handleUpload() {
    const inputs: NewBookInput[] = validRows.map((r) => ({
      title: r.title,
      author: r.author,
      isbn: r.isbn,
      summary: r.summary,
      tags: r.tags,
      initialCopies: Math.max(1, parseInt(r.copies, 10) || 1),
    }));
    bulkAddBooks(inputs);
    setUploaded(inputs.length);
    setRows([]);
    setFileName("");
    onDone?.();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Upload a CSV of books</p>
          <p className="mt-1 text-xs text-gray-500">
            Columns: <code className="text-gray-600">title, author, isbn, summary, tags, copies</code>{" "}
            — summary, tags, and copies are optional (copies defaults to 1).
          </p>
        </div>
        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={14} />
          Download sample CSV
        </button>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center hover:border-brand-400 hover:bg-brand-50/40">
        <UploadCloud size={28} className="text-gray-400" />
        <span className="text-sm text-gray-600">
          {fileName ? fileName : "Click to choose a CSV file, or drag one here"}
        </span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {uploaded > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle2 size={16} />
          Added {uploaded} book{uploaded === 1 ? "" : "s"} to the catalog.
        </p>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {validRows.length} of {rows.length} rows look valid
            </p>
            <button
              onClick={handleUpload}
              disabled={validRows.length === 0}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Upload {validRows.length} book{validRows.length === 1 ? "" : "s"}
            </button>
          </div>

          <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium"></th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Author</th>
                  <th className="px-3 py-2 font-medium">ISBN</th>
                  <th className="px-3 py-2 font-medium">Copies</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${!row.valid ? "bg-red-50/50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <CheckCircle2 size={14} className="text-green-600" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-800">{row.title || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{row.author || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{row.isbn || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{row.copies}</td>
                    <td className="px-3 py-2 text-red-600">{row.error || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
