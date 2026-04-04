"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";

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

export default function NewVesselPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState("");
  const [imo, setImo] = useState("");
  const [vesselType, setVesselType] = useState<Enums<"vessel_type">>("tanker");
  const [flagState, setFlagState] = useState("");
  const [dwt, setDwt] = useState("");
  const [builtYear, setBuiltYear] = useState("");
  const [ownerCompanyId, setOwnerCompanyId] = useState("");

  useEffect(() => {
    supabase
      .from("companies")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCompanies((data ?? []).map(c => ({ id: c.id, name: c.name }))));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imo.trim()) {
      setError("Vessel name and IMO number are required.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("vessels").insert({
      name: name.trim(),
      imo_number: imo.trim(),
      vessel_type: vesselType,
      flag_state: flagState.trim() || null,
      dwt: dwt ? Number(dwt) : null,
      built_year: builtYear ? Number(builtYear) : null,
      owner_company_id: ownerCompanyId || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
    } else {
      router.push("/admin/vessels");
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/vessels"
          className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
        >
          &larr; Vessels
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add New Vessel</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Vessel Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">IMO Number *</label>
          <input
            type="text"
            value={imo}
            onChange={(e) => setImo(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="e.g. 9876543"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Vessel Type *</label>
          <select
            value={vesselType}
            onChange={(e) => setVesselType(e.target.value as Enums<"vessel_type">)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            {vesselTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Flag State</label>
          <input
            type="text"
            value={flagState}
            onChange={(e) => setFlagState(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="e.g. Panama, Marshall Islands"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">DWT</label>
            <input
              type="number"
              value={dwt}
              onChange={(e) => setDwt(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Built Year</label>
            <input
              type="number"
              value={builtYear}
              onChange={(e) => setBuiltYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="e.g. 2015"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Owner Company</label>
          <select
            value={ownerCompanyId}
            onChange={(e) => setOwnerCompanyId(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">None</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium text-sm rounded transition-colors"
          >
            {saving ? "Saving..." : "Add Vessel"}
          </button>
          <Link
            href="/admin/vessels"
            className="px-4 py-2.5 bg-navy-800 border border-navy-600 text-slate-300 text-sm rounded hover:bg-navy-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
