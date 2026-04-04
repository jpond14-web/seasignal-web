"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";

interface ReviewRow {
  id: string;
  review_type: Enums<"review_type">;
  status: Enums<"review_status">;
  is_anonymous: boolean;
  narrative: string | null;
  ratings: unknown;
  created_at: string;
  company_id: string | null;
  vessel_id: string | null;
  profile_id: string;
}

export default function AdminReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setReviews((data as ReviewRow[]) ?? []);
    setLoading(false);
  }

  async function toggleFlag(review: ReviewRow) {
    setActionLoading(review.id);
    const newStatus: Enums<"review_status"> =
      review.status === "flagged" ? "published" : "flagged";
    await supabase
      .from("reviews")
      .update({ status: newStatus })
      .eq("id", review.id);
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
    );
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await supabase.from("reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirm(null);
    setActionLoading(null);
  }

  function statusBadge(status: Enums<"review_status">) {
    const styles: Record<string, string> = {
      published: "bg-green-500/10 text-green-400 border-green-500/30",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      flagged: "bg-red-500/10 text-red-400 border-red-500/30",
      removed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${
          styles[status] ?? styles.pending
        }`}
      >
        {status}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400 capitalize">
                      {review.review_type.replace(/_/g, " ")}
                    </span>
                    {statusBadge(review.status)}
                    {review.is_anonymous && (
                      <span className="text-xs text-slate-500 italic">anonymous</span>
                    )}
                  </div>
                  {review.narrative && (
                    <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                      {review.narrative}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString()} -- ID:{" "}
                    {review.id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleFlag(review)}
                    disabled={actionLoading === review.id}
                    className={`text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${
                      review.status === "flagged"
                        ? "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    {actionLoading === review.id
                      ? "..."
                      : review.status === "flagged"
                      ? "Unflag"
                      : "Flag"}
                  </button>
                  {deleteConfirm === review.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoading === review.id}
                        className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === review.id ? "..." : "Confirm"}
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
                      onClick={() => setDeleteConfirm(review.id)}
                      className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
