"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type JobListing = Tables<"job_listings"> & {
  companies: { id: string; name: string; company_type: string; country: string | null } | null;
};
type JobApplication = Tables<"job_applications"> & {
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

const DEPARTMENT_COLORS: Record<string, string> = {
  deck: "bg-blue-500/20 text-blue-400",
  engine: "bg-amber-500/20 text-amber-400",
  electro: "bg-cyan-500/20 text-cyan-400",
  catering: "bg-green-500/20 text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  closed: "bg-red-500/20 text-red-400",
  draft: "bg-amber-500/20 text-amber-400",
  pending: "bg-amber-500/20 text-amber-400",
  reviewed: "bg-blue-500/20 text-blue-400",
  shortlisted: "bg-teal-500/20 text-teal-400",
  rejected: "bg-red-500/20 text-red-400",
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

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: jobData } = await supabase
        .from("job_listings")
        .select("*, companies(id, name, company_type, country)")
        .eq("id", params.id)
        .single();

      if (!jobData) {
        setLoading(false);
        return;
      }
      setJob(jobData as unknown as JobListing);

      if (user) {
        // Check if user has applied
        const { data: app } = await supabase
          .from("job_applications")
          .select("id")
          .eq("job_id", params.id)
          .eq("applicant_id", user.id)
          .maybeSingle();
        setHasApplied(!!app);

        // If user is the poster, load applications
        if (jobData.posted_by === user.id) {
          const { data: apps } = await supabase
            .from("job_applications")
            .select("*")
            .eq("job_id", params.id)
            .order("created_at", { ascending: false });
          setApplications((apps as JobApplication[]) || []);
        }
      }

      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError("");

    const { error: err } = await supabase.from("job_applications").insert({
      job_id: params.id,
      applicant_id: userId,
      cover_message: coverMessage || null,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }

    // Increment application count
    if (job) {
      await supabase
        .from("job_listings")
        .update({ applications_count: (job.applications_count ?? 0) + 1 })
        .eq("id", params.id);
    }

    setHasApplied(true);
    setShowApplyForm(false);
    setSubmitting(false);
  }

  async function handleUpdateAppStatus(appId: string, newStatus: string) {
    await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", appId);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-400">Job not found.</p>
        <Link href="/career/jobs" className="text-teal-400 hover:text-teal-300 text-sm mt-2 inline-block">
          Back to Job Board
        </Link>
      </div>
    );
  }

  const isOwner = userId === job.posted_by;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/career/jobs" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">
        &larr; Job Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{job.title}</h1>
                {job.companies?.name && (
                  <Link
                    href={`/intel/companies/${job.companies.id}`}
                    className="text-teal-400 hover:text-teal-300 text-sm mt-1 inline-block"
                  >
                    {job.companies.name}
                  </Link>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[job.status ?? "active"] || "bg-navy-800 text-slate-400"}`}>
                {formatEnum(job.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
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
            </div>

            {(job.salary_min || job.salary_max) && (
              <p className="text-emerald-400 font-mono font-semibold text-lg mt-4">
                {formatSalary(job.salary_min as number | null, job.salary_max as number | null, job.currency ?? "USD")}
                <span className="text-slate-500 text-sm font-normal ml-1">/month</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              {job.contract_months && (
                <div>
                  <p className="text-slate-500">Contract</p>
                  <p className="text-slate-200">{job.contract_months} months</p>
                </div>
              )}
              {job.embarkation_port && (
                <div>
                  <p className="text-slate-500">Embarkation Port</p>
                  <p className="text-slate-200">{job.embarkation_port}</p>
                </div>
              )}
              {job.embarkation_date && (
                <div>
                  <p className="text-slate-500">Embarkation Date</p>
                  <p className="text-slate-200">{new Date(job.embarkation_date).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Posted</p>
                <p className="text-slate-200">{new Date(job.created_at ?? "").toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Description</h2>
            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-3">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((ben, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {ben}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application form */}
          {!isOwner && job.status === "active" && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
              {hasApplied ? (
                <div className="flex items-center gap-2">
                  <span className="bg-teal-500/20 text-teal-400 text-sm px-3 py-1 rounded font-medium">
                    Already Applied
                  </span>
                  <span className="text-sm text-slate-400">Your application has been submitted.</span>
                </div>
              ) : showApplyForm ? (
                <form onSubmit={handleApply}>
                  <h2 className="text-lg font-semibold text-slate-100 mb-3">Apply for this Position</h2>
                  <textarea
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Write a cover message (optional)..."
                    rows={5}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="px-4 py-2 text-sm bg-navy-800 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    if (!userId) {
                      router.push("/login");
                      return;
                    }
                    setShowApplyForm(true);
                  }}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Apply Now
                </button>
              )}
            </div>
          )}

          {/* Applications (for job poster) */}
          {isOwner && applications.length > 0 && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">
                Applications ({applications.length})
              </h2>
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-navy-800 border border-navy-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 font-medium">
                          Applicant ID: {app.applicant_id.slice(0, 8)}...
                        </p>
                        {app.cover_message && (
                          <p className="text-sm text-slate-400 mt-2 whitespace-pre-wrap">
                            {app.cover_message}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          Applied {new Date(app.created_at ?? "").toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[app.status ?? "pending"] || "bg-navy-700 text-slate-400"}`}>
                          {formatEnum(app.status ?? "pending")}
                        </span>
                        <select
                          value={app.status ?? "pending"}
                          onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                          className="bg-navy-700 border border-navy-600 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-teal-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company info */}
          {job.companies && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Company</h3>
              <Link
                href={`/intel/companies/${job.companies.id}`}
                className="text-slate-100 font-medium hover:text-teal-400 transition-colors"
              >
                {job.companies.name}
              </Link>
              <p className="text-xs text-slate-400 mt-1">{formatEnum(job.companies.company_type)}</p>
              {job.companies.country && (
                <p className="text-xs text-slate-500 mt-0.5">{job.companies.country}</p>
              )}
            </div>
          )}

          {/* Quick info */}
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Applications</span>
                <span className="text-slate-200">{job.applications_count}</span>
              </div>
              {job.expires_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires</span>
                  <span className="text-slate-200">{new Date(job.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
