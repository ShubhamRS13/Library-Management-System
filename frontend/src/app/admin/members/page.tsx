const mockMembers = [
  { id: "1", name: "Shubham", email: "shubham@example.com", role: "admin" },
  { id: "2", name: "Vishal", email: "vishal@example.com", role: "member" },
  { id: "3", name: "Om", email: "om@example.com", role: "member" },
  { id: "4", name: "Sanket", email: "sanket@example.com", role: "member" },
];

export default function AdminMembersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Manage members</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {mockMembers.map((member) => (
              <tr key={member.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-800">{member.name}</td>
                <td className="px-4 py-3 text-gray-500">{member.email}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{member.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
