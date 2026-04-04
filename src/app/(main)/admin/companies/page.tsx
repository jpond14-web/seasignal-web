"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

type Company = Tables<"companies">;

const companyTypes: { value: Enums<"company_type">; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" },
  { value: "manager", label: "Manager" },
  { value: "manning_agency", label: "Manning Agency" },
];

export default function AdminCompaniesPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("companies")
        .select("*")
        .order("name");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (typeFilter) {
        query = query.eq("company_type", typeFilter as Enums<"company_type">);
      }

      const { data } = await query;
      setCompanies(data ?? []);
      setLoading(false);
    }
    load();
  }, [search, typeFilter]);

  async function handleDelete(id: string) {
    setActionLoading(id);
    await supabase.from("companies").delete().eq("id", id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    setActionLoading(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Company Management</h1>
        <Link
          href="/admin/companies/new"
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium text-sm rounded transition-colors"
        >
          Add Company
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {companyTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading companies...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Name</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Type</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Country</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Rating</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Reviews</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-navy-700/50 bg-navy-900 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3 text-slate-100 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400 capitalize">
                      {c.company_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{c.country ?? "-"}</td>
                  <td className="px-4 py-3 text-teal-400 font-mono hidden md:table-cell">
                    {c.avg_rating ? Number(c.avg_rating).toFixed(1) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{c.review_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/companies/${c.id}/edit`}
                        className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                      >
                        Edit
                      </Link>
                      {deleteConfirm === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={actionLoading === c.id}
                            className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === c.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No companies found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
