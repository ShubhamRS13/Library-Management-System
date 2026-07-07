"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import { useState } from "react";
import { useLibrary } from "@/lib/store";
import type { Member } from "@/types";

function AdminMembersPageContent() {
  const { members, addMember, updateMemberStatus } = useLibrary();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.phone_number) return;
    addMember(form);
    setForm({ first_name: "", last_name: "", email: "", phone_number: "", address: "" });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Manage members</h1>
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
          className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2"
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
          <button
            type="submit"
            className="col-span-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Save member
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Total loans</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-100">
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
                      updateMemberStatus(member.id, e.target.value as Member["membership_status"])
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    <option value="expired">expired</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminMembersPage() {
  return (
    <RequireAuth>
      <AdminMembersPageContent />
    </RequireAuth>
  );
}
