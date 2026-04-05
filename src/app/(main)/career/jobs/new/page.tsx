"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const DEPARTMENTS = ["deck", "engine", "electro", "catering"] as const;
const VESSEL_TYPES = [
  "tanker", "bulk_carrier", "container", "general_cargo", "offshore",
  "passenger", "roro", "lng", "lpg", "chemical", "reefer", "tug", "fishing", "other",
] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "NOK"] as const;

const DEPARTMENT_COLORS: Record<string, string> = {
  deck: "bg-blue-500/20 text-blue-400",
  engine: "bg-amber-500/20 text-amber-400",
  electro: "bg-cyan-500/20 text-cyan-400",
  catering: "bg-green-500/20 text-green-400",
};

function formatEnum(val: string): string {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSalary(min: string, max: string, currency: string): string {
  const minN = parseFloat(min);
  const maxN = parseFloat(max);
  if (!minN && !maxN) return "";
  const fmt = (n: number) => n.toLocaleString();
  if (minN && maxN) return `${currency} ${fmt(minN)} - ${fmt(maxN)}`;
  if (minN) return `${currency} ${fmt(minN)}+`;
  return `Up to ${currency} ${fmt(maxN)}`;
}

type Company = { id: string; name: string };

export default function PostJobPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [department, setDepartment] = useState("");
  const [rankRequired, setRankRequired] = useState("");
  const [contractMonths, setContractMonths] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [embarkationPort, setEmbarkationPort] = useState("");
  const [embarkationDate, setEmbarkationDate] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      setCompanies(data || []);
      setLoading(false);
    }
    init();
  }, []);

  function addRequirement() {
    const val = requirementInput.trim();
    if (val && !requirements.includes(val)) {
      setRequirements([...requirements, val]);
      setRequirementInput("");
    }
  }

  function addBenefit() {
    const val = benefitInput.trim();
    if (val && !benefits.includes(val)) {
      setBenefits([...benefits, val]);
      setBenefitInput("");
    }
  }

  async function handleSubmit(status: "active" | "draft") {
    if (!userId) return;
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: err } = await supabase.from("job_listings").insert({
      posted_by: userId,
      company_id: companyId || null,
      title: title.trim(),
      description: description.trim(),
      vessel_type: vesselType || null,
      department: department || null,
      rank_required: rankRequired.trim() || null,
      contract_months: contractMonths ? parseInt(contractMonths) : null,
      salary_min: salaryMin ? parseFloat(salaryMin) : null,
      salary_max: salaryMax ? parseFloat(salaryMax) : null,
      currency,
      embarkation_port: embarkationPort.trim() || null,
      embarkation_date: embarkationDate || null,
      requirements: requirements.length > 0 ? requirements : null,
      benefits: benefits.length > 0 ? benefits : null,
      status,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }

    router.push("/career/jobs/mine");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setPreview(false)}
          className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block"
        >
          &larr; Back to Edit
        </button>
        <h1 className="text-2xl font-bold mb-6">Preview</h1>

        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">{title || "Untitled"}</h2>
          {companyId && (
            <p className="text-sm text-teal-400">
              {companies.find((c) => c.id === companyId)?.name || "Unknown Company"}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {department && (
              <span className={`text-xs px-2 py-0.5 rounded ${DEPARTMENT_COLORS[department] || "bg-navy-800 text-slate-400"}`}>
                {formatEnum(department)}
              </span>
            )}
            {vesselType && (
              <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-600">
                {formatEnum(vesselType)}
              </span>
            )}
            {rankRequired && (
              <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-400">
                {rankRequired}
              </span>
            )}
          </div>

          {(salaryMin || salaryMax) && (
            <p className="text-emerald-400 font-mono font-semibold text-lg">
              {formatSalary(salaryMin, salaryMax, currency)}
              <span className="text-slate-500 text-sm font-normal ml-1">/month</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {contractMonths && (
              <div><p className="text-slate-500">Contract</p><p className="text-slate-200">{contractMonths} months</p></div>
            )}
            {embarkationPort && (
              <div><p className="text-slate-500">Embarkation Port</p><p className="text-slate-200">{embarkationPort}</p></div>
            )}
            {embarkationDate && (
              <div><p className="text-slate-500">Embarkation Date</p><p className="text-slate-200">{new Date(embarkationDate).toLocaleDateString()}</p></div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-100 mb-2">Description</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{description}</p>
          </div>

          {requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Requirements</h3>
              <ul className="space-y-1">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-teal-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefits.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Benefits</h3>
              <ul className="space-y-1">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleSubmit("active")}
            disabled={submitting}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Job"}
          </button>
          <button
            onClick={() => handleSubmit("draft")}
            disabled={submitting}
            className="px-5 py-2.5 bg-navy-800 border border-navy-600 text-slate-300 rounded-lg font-medium text-sm hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/career/jobs" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">
        &larr; Job Board
      </Link>
      <h1 className="text-2xl font-bold mb-6">Post a Job</h1>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Basic Information</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chief Officer - Tanker"
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and expectations..."
              rows={6}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="">Select a company (optional)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Position details */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Position Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{formatEnum(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Vessel Type</label>
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="">Select vessel type</option>
                {VESSEL_TYPES.map((v) => (
                  <option key={v} value={v}>{formatEnum(v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Rank Required</label>
              <input
                type="text"
                value={rankRequired}
                onChange={(e) => setRankRequired(e.target.value)}
                placeholder="e.g. Chief Officer, 2nd Engineer"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Contract Length (months)</label>
              <input
                type="number"
                value={contractMonths}
                onChange={(e) => setContractMonths(e.target.value)}
                placeholder="e.g. 6"
                min={1}
                max={24}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Compensation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Salary Min</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Salary Max</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Embarkation */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Embarkation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Port</label>
              <input
                type="text"
                value={embarkationPort}
                onChange={(e) => setEmbarkationPort(e.target.value)}
                placeholder="e.g. Singapore, Rotterdam"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={embarkationDate}
                onChange={(e) => setEmbarkationDate(e.target.value)}
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Requirements</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addRequirement(); }
              }}
              placeholder="e.g. Valid COC, STCW certificates"
              className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={addRequirement}
              className="px-3 py-2 bg-navy-800 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-700 text-sm transition-colors"
            >
              Add
            </button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirements.map((r, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs bg-navy-800 border border-navy-600 rounded px-2 py-1 text-slate-300"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => setRequirements(requirements.filter((_, j) => j !== i))}
                    className="text-slate-500 hover:text-red-400 ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Benefits</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addBenefit(); }
              }}
              placeholder="e.g. Flight tickets provided, Medical insurance"
              className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={addBenefit}
              className="px-3 py-2 bg-navy-800 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-700 text-sm transition-colors"
            >
              Add
            </button>
          </div>
          {benefits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {benefits.map((b, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs bg-navy-800 border border-navy-600 rounded px-2 py-1 text-slate-300"
                >
                  {b}
                  <button
                    type="button"
                    onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                    className="text-slate-500 hover:text-red-400 ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setPreview(true)}
            className="px-5 py-2.5 bg-navy-800 border border-navy-600 text-slate-300 rounded-lg font-medium text-sm hover:bg-navy-700 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => handleSubmit("active")}
            disabled={submitting}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Job"}
          </button>
          <button
            onClick={() => handleSubmit("draft")}
            disabled={submitting}
            className="px-5 py-2.5 bg-navy-800 border border-navy-600 text-slate-300 rounded-lg font-medium text-sm hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
