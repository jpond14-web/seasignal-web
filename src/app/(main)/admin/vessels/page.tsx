"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

type Vessel = Tables<"vessels">;

const vesselTypes: { value: Enums<"vessel_type">; label: string }[] = [
  { value: "tanker", label: "Tanker" },
  { value: "bulk_carrier", label: "Bulk Carrier" },
  { value: "container", label: "Container" },
  { value: "general_cargo", label: "General Cargo" },
  { value: "offshore", label: "Offshore" },
  { value: "passenger", label: "Passenger" },
  { value: "roro", label: "RoRo" },
  { value: "lng", label: "LNG" },
  { value: "lpg", label: "LPG" },
  { value: "chemical", label: "Chemical" },
  { value: "reefer", label: "Reefer" },
  { value: "tug", label: "Tug" },
  { value: "fishing", label: "Fishing" },
  { value: "other", label: "Other" },
];

export default function AdminVesselsPage() {
  const supabase = createClient();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("vessels")
        .select("*")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,imo_number.ilike.%${search}%`);
      }
      if (typeFilter) {
        query = query.eq("vessel_type", typeFilter as Enums<"vessel_type">);
      }

      const { data } = await query;
      setVessels(data ?? []);
      setLoading(false);
    }
    load();
  }, [search, typeFilter]);

  async function handleDelete(id: string) {
    setActionLoading(id);
    await supabase.from("vessels").delete().eq("id", id);
    setVessels((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);
    setActionLoading(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vessel Management</h1>
        <Link
          href="/admin/vessels/new"
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium text-sm rounded transition-colors"
        >
          Add Vessel
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or IMO..."
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
          {vesselTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading vessels...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Name</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">IMO</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Type</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Flag</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">DWT</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Built</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((v) => (
                <tr key={v.id} className="border-b border-navy-700/50 bg-navy-900 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3 text-slate-100 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{v.imo_number}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400 capitalize">
                      {v.vessel_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{v.flag_state ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono hidden lg:table-cell">
                    {v.dwt ? v.dwt.toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{v.built_year ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/vessels/${v.id}/edit`}
                        className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                      >
                        Edit
                      </Link>
                      {deleteConfirm === v.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={actionLoading === v.id}
                            className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === v.id ? "..." : "Confirm"}
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
                          onClick={() => setDeleteConfirm(v.id)}
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
          {vessels.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No vessels found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
