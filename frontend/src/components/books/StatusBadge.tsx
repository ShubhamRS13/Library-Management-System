export default function StatusBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        available ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {available ? "Available" : "Borrowed"}
    </span>
  );
}
