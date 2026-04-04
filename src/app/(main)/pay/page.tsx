"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
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

type PayPercentiles = {
  count: number;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
};

export default function PayPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"explore" | "submit">("explore");

  // Explorer state
  const [rank, setRank] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [flagState, setFlagState] = useState("");
  const [percentiles, setPercentiles] = useState<PayPercentiles | null>(null);
  const [searching, setSearching] = useState(false);

  // Submit state
  const [form, setForm] = useState({
    rank: "",
    vessel_type: "" as Enums<"vessel_type"> | "",
    flag_state: "",
    company_id: "",
    monthly_base_usd: "",
    overtime_structure: "",
    leave_pay: "",
    contract_duration_months: "",
    year: new Date().getFullYear().toString(),
  });
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSearch() {
    if (!rank) return;
    setSearching(true);
    const { data } = await supabase.rpc("get_pay_percentiles", {
      p_rank: rank,
      ...(vesselType ? { p_vessel_type: vesselType as Enums<"vessel_type"> } : {}),
      ...(flagState ? { p_flag_state: flagState } : {}),
    });
    setPercentiles(data as PayPercentiles | null);
    setSearching(false);
  }

  async function loadCompanies() {
    if (companies.length > 0) return;
    const { data } = await supabase.from("companies").select("id, name").order("name");
    setCompanies(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitMsg({ type: "error", text: "Not authenticated" }); setSubmitting(false); return; }

    const { data: profile } = await supabase
      .from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) { setSubmitMsg({ type: "error", text: "Profile not found" }); setSubmitting(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("pay_reports") as any).insert({
      profile_id: profile.id,
      rank: form.rank,
      vessel_type: form.vessel_type,
      flag_state: form.flag_state || null,
      company_id: form.company_id || null,
      monthly_base_usd: Number(form.monthly_base_usd),
      overtime_structure: form.overtime_structure || null,
      leave_pay: form.leave_pay || null,
      contract_duration_months: form.contract_duration_months ? Number(form.contract_duration_months) : null,
      year: Number(form.year),
    });

    setSubmitting(false);
    if (error) {
      setSubmitMsg({ type: "error", text: error.message });
      showToast(error.message, "error");
    } else {
      setSubmitMsg({ type: "success", text: "Pay report submitted. Thank you!" });
      showToast("Pay report submitted. Thank you!");
      setForm({ ...form, monthly_base_usd: "", overtime_structure: "", leave_pay: "", contract_duration_months: "" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pay Transparency</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("explore")}
          className={`flex-1 py-2 px-3 text-sm rounded border transition-colors ${
            tab === "explore" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"
          }`}
        >
          Pay Explorer
        </button>
        <button
          onClick={() => { setTab("submit"); loadCompanies(); }}
          className={`flex-1 py-2 px-3 text-sm rounded border transition-colors ${
            tab === "submit" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"
          }`}
        >
          Report Pay
        </button>
      </div>

      {tab === "explore" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="explore-rank" className="block text-sm text-slate-300 mb-1.5">Rank *</label>
            <input
              id="explore-rank"
              type="text"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="e.g. Chief Officer, 2nd Engineer"
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="explore-vessel-type" className="block text-sm text-slate-300 mb-1.5">Vessel Type</label>
              <select
                id="explore-vessel-type"
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="">Any</option>
                {vesselTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="explore-flag-state" className="block text-sm text-slate-300 mb-1.5">Flag State</label>
              <input
                id="explore-flag-state"
                type="text"
                value={flagState}
                onChange={(e) => setFlagState(e.target.value)}
                placeholder="e.g. Panama"
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={!rank || searching}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {searching ? "Searching..." : "Search Pay Data"}
          </button>

          {percentiles && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mt-4">
              {percentiles.count === 0 ? (
                <p className="text-slate-400 text-center">No pay data found for this criteria.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-4">
                    Based on {percentiles.count} report{percentiles.count !== 1 ? "s" : ""} &middot; Monthly base USD
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500">25th %ile</p>
                      <p className="text-xl font-mono font-bold text-slate-300">${percentiles.p25?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-400">Median</p>
                      <p className="text-2xl font-mono font-bold text-teal-400">${percentiles.p50?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">75th %ile</p>
                      <p className="text-xl font-mono font-bold text-slate-300">${percentiles.p75?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t border-navy-700 text-xs text-slate-500">
                    <span>Min: ${percentiles.min?.toLocaleString()}</span>
                    <span>Max: ${percentiles.max?.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="report-rank" className="block text-sm text-slate-300 mb-1.5">Rank *</label>
              <input id="report-rank" type="text" required value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="report-vessel-type" className="block text-sm text-slate-300 mb-1.5">Vessel Type *</label>
              <select id="report-vessel-type" required value={form.vessel_type} onChange={(e) => setForm({ ...form, vessel_type: e.target.value as Enums<"vessel_type"> })}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none">
                <option value="">Select</option>
                {vesselTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="report-flag-state" className="block text-sm text-slate-300 mb-1.5">Flag State</label>
              <input id="report-flag-state" type="text" value={form.flag_state} onChange={(e) => setForm({ ...form, flag_state: e.target.value })} placeholder="e.g. Panama"
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="report-company" className="block text-sm text-slate-300 mb-1.5">Company</label>
              <select id="report-company" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none">
                <option value="">Select</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="report-base-pay" className="block text-sm text-slate-300 mb-1.5">Monthly Base (USD) *</label>
            <input id="report-base-pay" type="number" required min="0" value={form.monthly_base_usd} onChange={(e) => setForm({ ...form, monthly_base_usd: e.target.value })}
              placeholder="e.g. 4500"
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="report-overtime" className="block text-sm text-slate-300 mb-1.5">Overtime Structure</label>
              <input id="report-overtime" type="text" value={form.overtime_structure} onChange={(e) => setForm({ ...form, overtime_structure: e.target.value })} placeholder="e.g. Fixed OT included"
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="report-leave" className="block text-sm text-slate-300 mb-1.5">Leave Pay</label>
              <input id="report-leave" type="text" value={form.leave_pay} onChange={(e) => setForm({ ...form, leave_pay: e.target.value })} placeholder="e.g. 8 days/month"
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="report-contract" className="block text-sm text-slate-300 mb-1.5">Contract (months)</label>
              <input id="report-contract" type="number" min="1" max="24" value={form.contract_duration_months} onChange={(e) => setForm({ ...form, contract_duration_months: e.target.value })}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="report-year" className="block text-sm text-slate-300 mb-1.5">Year *</label>
              <input id="report-year" type="number" required min="2020" max="2030" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
          </div>

          {submitMsg && (
            <p className={`text-sm ${submitMsg.type === "error" ? "text-red-400" : "text-green-400"}`}>{submitMsg.text}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
            {submitting ? "Submitting..." : "Submit Pay Report"}
          </button>
        </form>
      )}
    </div>
  );
}
