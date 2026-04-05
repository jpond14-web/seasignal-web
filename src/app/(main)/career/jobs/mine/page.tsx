"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type JobListing = Tables<"job_listings"> & {
  companies: { id: string; name: string } | null;
};

type JobApplication = Tables<"job_applications"> & {
  job_listings: { id: string; title: string; companies: { name: string } | null } | null;
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

function formatEnum(val: string): string {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MyJobsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<"listings" | "applications">("listings");
  const [listings, setListings] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [{ data: myJobs }, { data: myApps }] = await Promise.all([
        supabase
          .from("job_listings")
          .select("*, companies(id, name)")
          .eq("posted_by", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("*, job_listings(id, title, companies(name))")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setListings((myJobs as unknown as JobListing[]) || []);
      setApplications((myApps as unknown as JobApplication[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCloseJob(jobId: string) {
    await supabase.from("job_listings").update({ status: "closed" }).eq("id", jobId);
    setListings((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j))
    );
  }

  async function handleActivateJob(jobId: string) {
    await supabase.from("job_listings").update({ status: "active" }).eq("id", jobId);
    setListings((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "active" } : j))
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link
          href="/career/jobs/new"
          className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium"
        >
          + Post a Job
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("listings")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === "listings"
              ? "bg-navy-700 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          My Listings ({listings.length})
        </button>
        <button
          onClick={() => setTab("applications")}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === "applications"
              ? "bg-navy-700 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          My Applications ({applications.length})
        </button>
      </div>

      {tab === "listings" && (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-3">You haven&apos;t posted any jobs yet.</p>
              <Link
                href="/career/jobs/new"
                className="text-teal-400 hover:text-teal-300 text-sm"
              >
                Post your first job
              </Link>
            </div>
          ) : (
            listings.map((job) => (
              <div
                key={job.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-5 hover:border-teal-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/career/jobs/${job.id}`}
                        className="font-semibold text-slate-100 hover:text-teal-400 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[job.status ?? "active"] || "bg-navy-800 text-slate-400"}`}>
                        {formatEnum(job.status ?? "active")}
                      </span>
                    </div>
                    {job.companies?.name && (
                      <p className="text-sm text-slate-400 mt-0.5">{job.companies.name}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Posted {new Date(job.created_at).toLocaleDateString()} &middot; {job.applications_count} application{job.applications_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/career/jobs/${job.id}`}
                      className="px-3 py-1.5 text-xs bg-navy-800 border border-navy-600 text-slate-300 rounded hover:bg-navy-700 transition-colors"
                    >
                      View
                    </Link>
                    {job.status === "active" ? (
                      <button
                        onClick={() => handleCloseJob(job.id)}
                        className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                      >
                        Close
                      </button>
                    ) : job.status === "draft" || job.status === "closed" ? (
                      <button
                        onClick={() => handleActivateJob(job.id)}
                        className="px-3 py-1.5 text-xs bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                      >
                        Activate
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "applications" && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-3">You haven&apos;t applied to any jobs yet.</p>
              <Link
                href="/career/jobs"
                className="text-teal-400 hover:text-teal-300 text-sm"
              >
                Browse the job board
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/career/jobs/${app.job_id}`}
                        className="font-semibold text-slate-100 hover:text-teal-400 transition-colors"
                      >
                        {app.job_listings?.title || "Unknown Job"}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[app.status ?? "pending"] || "bg-navy-800 text-slate-400"}`}>
                        {formatEnum(app.status ?? "pending")}
                      </span>
                    </div>
                    {app.job_listings?.companies?.name && (
                      <p className="text-sm text-slate-400 mt-0.5">{app.job_listings.companies.name}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    {app.cover_message && (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{app.cover_message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
