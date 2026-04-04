"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

type Profile = Tables<"profiles">;

const departments: { value: Enums<"department_type">; label: string }[] = [
  { value: "deck", label: "Deck" },
  { value: "engine", label: "Engine" },
  { value: "electro", label: "Electro" },
  { value: "catering", label: "Catering" },
];

const ranks: { value: Enums<"rank_category">; label: string }[] = [
  { value: "officer", label: "Officer" },
  { value: "rating", label: "Rating" },
  { value: "cadet", label: "Cadet" },
];

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("display_name", `%${search}%`);
      }
      if (deptFilter) {
        query = query.eq("department_tag", deptFilter as Enums<"department_type">);
      }
      if (rankFilter) {
        query = query.eq("rank_range", rankFilter as Enums<"rank_category">);
      }
      if (verifiedFilter === "true") {
        query = query.eq("is_verified", true);
      } else if (verifiedFilter === "false") {
        query = query.eq("is_verified", false);
      }

      const { data } = await query.limit(200);
      setUsers(data ?? []);
      setLoading(false);
    }
    load();
  }, [search, deptFilter, rankFilter, verifiedFilter]);

  async function toggleVerify(userId: string, currentlyVerified: boolean) {
    setActionLoading(userId);
    await supabase
      .from("profiles")
      .update({ is_verified: !currentlyVerified })
      .eq("id", userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_verified: !currentlyVerified } : u
      )
    );
    setActionLoading(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Ranks</option>
          {ranks.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading users...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Name</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Department</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Rank</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Experience</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-navy-700/50 bg-navy-900 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold text-teal-400 shrink-0">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-100 font-medium truncate max-w-[200px]">{user.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">
                    {user.department_tag?.replace(/_/g, " ") ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">
                    {user.rank_range ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                    {user.experience_band?.replace(/_/g, " ").replace("y", "yr") ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        user.is_verified
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {user.is_verified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                    {new Date(user.created_at!).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVerify(user.id, !!user.is_verified)}
                        disabled={actionLoading === user.id}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          user.is_verified
                            ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                            : "bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === user.id
                          ? "..."
                          : user.is_verified
                          ? "Unverify"
                          : "Verify"}
                      </button>
                      <Link
                        href={`/profile?id=${user.id}`}
                        className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No users found matching filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
