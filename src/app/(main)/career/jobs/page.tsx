"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type JobListing = Tables<"job_listings"> & {
  companies: { id: string; name: string } | null;
};

const DEPARTMENTS = ["deck", "engine", "electro", "catering"] as const;
const VESSEL_TYPES = [
  "tanker", "bulk_carrier", "container", "general_cargo", "offshore",
  "passenger", "roro", "lng", "lpg", "chemical", "reefer", "tug", "fishing", "other",
] as const;

const DEPARTMENT_COLORS: Record<string, string> = {
  deck: "bg-blue-500/20 text-blue-400",
  engine: "bg-amber-500/20 text-amber-400",
  electro: "bg-cyan-500/20 text-cyan-400",
  catering: "bg-green-500/20 text-green-400",
};

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSalary(min: number | null, max: number | null, currency: string): string {
  if (!min && !max) return "";
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max!)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

type SortOption = "newest" | "salary_high" | "embarkation";

export default function JobsPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(searchParams.get("dept") || "");
  const [vesselType, setVesselType] = useState(searchParams.get("vessel") || "");
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) || "newest");

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      let query = supabase
        .from("job_listings")
        .select("*, companies(id, name)")
        .eq("status", "active");

      if (department) query = query.eq("department", department);
      if (vesselType) query = query.eq("vessel_type", vesselType);

      if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sort === "salary_high") {
        query = query.order("salary_max", { ascending: false, nullsFirst: false });
      } else if (sort === "embarkation") {
        query = query.order("embarkation_date", { ascending: true, nullsFirst: false });
      }

      const { data } = await query;
      setJobs((data as unknown as JobListing[]) || []);
      setLoading(false);
    }
    fetchJobs();
  }, [department, vesselType, sort]);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.companies?.name?.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Link
            href="/career/jobs/mine"
            className="px-4 py-2 text-sm bg-navy-800 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-700 transition-colors"
          >
            My Jobs
          </Link>
          <Link
            href="/career/jobs/new"
            className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium"
          >
            + Post a Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{formatEnum(d)}</option>
            ))}
          </select>
          <select
            value={vesselType}
            onChange={(e) => setVesselType(e.target.value)}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Vessel Types</option>
            {VESSEL_TYPES.map((v) => (
              <option key={v} value={v}>{formatEnum(v)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="newest">Newest First</option>
            <option value="salary_high">Salary: High to Low</option>
            <option value="embarkation">Embarkation Date</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-slate-400">Loading jobs...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No jobs found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Link
              key={job.id}
              href={`/career/jobs/${job.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-5 hover:border-teal-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-100 text-lg">{job.title}</h3>
                  {job.companies?.name && (
                    <p className="text-sm text-slate-400 mt-0.5">{job.companies.name}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {job.department && (
                      <span className={`text-xs px-2 py-0.5 rounded ${DEPARTMENT_COLORS[job.department] || "bg-navy-800 text-slate-400"}`}>
                        {formatEnum(job.department)}
                      </span>
                    )}
                    {job.vessel_type && (
                      <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-600">
                        {formatEnum(job.vessel_type)}
                      </span>
                    )}
                    {job.rank_required && (
                      <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-400">
                        {job.rank_required}
                      </span>
                    )}
                    {job.contract_months && (
                      <span className="text-xs text-slate-500">
                        {job.contract_months} months
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-emerald-400 font-mono font-semibold text-sm">
                      {formatSalary(job.salary_min as number | null, job.salary_max as number | null, job.currency ?? "USD")}
                    </p>
                  )}
                  {job.embarkation_port && (
                    <p className="text-xs text-slate-400 mt-1">{job.embarkation_port}</p>
                  )}
                  {job.embarkation_date && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Embark: {new Date(job.embarkation_date).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">{timeAgo(job.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
