"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/store";
import type { Member } from "@/types";
import EditMemberModal from "@/components/admin/EditMemberModal";

export default function AdminMembersPage() {
  const { members, addMember, updateMemberStatus, deleteMember } = useLibrary();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.phone_number) return;
    setSubmitting(true);
    setFormError("");
    try {
      await addMember(form);
      setForm({ first_name: "", last_name: "", email: "", phone_number: "", address: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save this member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Remove ${member.first_name} ${member.last_name} from your members?`)) return;
    try {
      await deleteMember(member.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete this member.");
    }
  }

  async function handleStatusChange(memberId: number, status: Member["membership_status"]) {
    try {
      await updateMemberStatus(memberId, status);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update member status.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Manage members</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "Add member"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white shadow-sm p-6 sm:grid-cols-2"
        >
          <input
            required
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            required
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            placeholder="Address (optional)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="col-span-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          {formError && <p className="col-span-full text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="col-span-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "Saving..." : "Save member"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Total loans</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                <td className="px-4 py-3 text-gray-800">
                  {member.first_name} {member.last_name}
                </td>
                <td className="px-4 py-3 text-gray-500">{member.email}</td>
                <td className="px-4 py-3 text-gray-500">{member.phone_number}</td>
                <td className="px-4 py-3 text-gray-500">{member.total_loan_count}</td>
                <td className="px-4 py-3">
                  <select
                    value={member.membership_status}
                    onChange={(e) =>
                      handleStatusChange(member.id, e.target.value as Member["membership_status"])
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    <option value="expired">expired</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="flex items-center gap-1 text-gray-600 hover:text-brand-700"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No members yet — add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}
    </div>
  );
}
