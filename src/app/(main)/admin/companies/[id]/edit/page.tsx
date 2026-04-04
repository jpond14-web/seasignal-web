"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

const companyTypes: { value: Enums<"company_type">; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" },
  { value: "manager", label: "Manager" },
  { value: "manning_agency", label: "Manning Agency" },
];

export default function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [companyType, setCompanyType] = useState<Enums<"company_type">>("owner");
  const [country, setCountry] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setName(data.name);
        setCompanyType(data.company_type);
        setCountry(data.country ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name: name.trim(),
        company_type: companyType,
        country: country.trim() || null,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      router.push("/admin/companies");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading company...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/companies"
          className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
        >
          &larr; Companies
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Company</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Company Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Company Type *</label>
          <select
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value as Enums<"company_type">)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            {companyTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="e.g. Greece, Singapore"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium text-sm rounded transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/companies"
            className="px-4 py-2.5 bg-navy-800 border border-navy-600 text-slate-300 text-sm rounded hover:bg-navy-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
