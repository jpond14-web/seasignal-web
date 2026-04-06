"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Question = Tables<"forum_posts"> & {
  profiles: { display_name: string } | null;
};

export default function AskFleetPage() {
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAnonymous, setFormAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(
    async (catId: string) => {
      const { data } = await supabase
        .from("forum_posts")
        .select("*, profiles(display_name)")
        .eq("category_id", catId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setQuestions(data as unknown as Question[]);
    },
    [supabase]
  );

  useEffect(() => {
    (async () => {
      // Resolve the ask-the-fleet category
      const { data: cat } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", "ask-the-fleet")
        .single();

      if (cat) {
        setCategoryId(cat.id);
      } else {
        // Fallback: use the first available category
        const { data: anyCat } = await supabase
          .from("forum_categories")
          .select("id")
          .limit(1)
          .single();
        if (anyCat) setCategoryId(anyCat.id);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (profile) setProfileId(profile.id);
      }

      if (cat) {
        await fetchQuestions(cat.id);
      } else {
        // Use fallback cat ID if resolved
        const fallbackId = categoryId;
        if (fallbackId) await fetchQuestions(fallbackId);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Refetch when categoryId is set asynchronously
  useEffect(() => {
    if (categoryId && !loading) {
      fetchQuestions(categoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleSubmit = async () => {
    if (!profileId || !categoryId) return;
    if (formTitle.length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (formBody.length < 10) {
      setError("Question body must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertErr } = await supabase.from("forum_posts").insert({
      title: formTitle,
      body: formBody,
      category_id: categoryId,
      profile_id: formAnonymous ? null : profileId,
      is_anonymous: formAnonymous,
    });

    if (insertErr) {
      setError(insertErr.message);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormAnonymous(false);
      setShowForm(false);
      await fetchQuestions(categoryId);
    }
    setSubmitting(false);
  };

  const handleUpvote = async (postId: string) => {
    if (!profileId) return;

    if (upvotedIds.has(postId)) return;

    // Optimistic update
    setUpvotedIds((prev) => new Set(prev).add(postId));
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === postId
          ? { ...q, upvote_count: (q.upvote_count ?? 0) + 1 }
          : q
      )
    );

    await supabase
      .from("forum_posts")
      .update({ upvote_count: questions.find((q) => q.id === postId)?.upvote_count ?? 0 + 1 } as never)
      .eq("id", postId);
  };

  const formatTime = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">
          Loading questions...
        </div>
      </div>
    );
  }

  if (!categoryId) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-slate-500 text-sm">
          No &quot;ask-the-fleet&quot; forum category found. Please create one in the forum
          settings first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">
          Quick questions, answered by the community.
        </p>
        {profileId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Ask a Question
          </button>
        )}
      </div>

      {/* Ask Form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">
            Ask the Fleet
          </h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="What's your question?"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="Add more detail to your question..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAnonymous}
                  onChange={(e) => setFormAnonymous(e.target.checked)}
                  className="rounded border-navy-600 bg-navy-800 text-teal-500 focus:ring-teal-500"
                />
                Ask anonymously
              </label>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm ml-auto"
              >
                {submitting ? "Posting..." : "Post Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Feed */}
      {questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">
            No questions yet. Be the first to ask the fleet!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-5"
            >
              <div className="flex gap-4">
                {/* Upvote */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <button
                    onClick={() => handleUpvote(q.id)}
                    disabled={!profileId || upvotedIds.has(q.id)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors text-sm ${
                      upvotedIds.has(q.id)
                        ? "bg-teal-500/20 text-teal-400"
                        : "bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-slate-200"
                    }`}
                    title="Upvote"
                  >
                    &#9650;
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    {q.upvote_count ?? 0}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/community/forums/post/${q.id}`}
                    className="hover:underline"
                  >
                    <h3 className="text-slate-100 font-semibold text-sm mb-1">
                      {q.title ?? "Untitled Question"}
                    </h3>
                  </Link>
                  <p className="text-slate-400 text-xs leading-relaxed mb-2">
                    {(q.body ?? "").length > 100
                      ? (q.body ?? "").slice(0, 100) + "..."
                      : q.body}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {q.is_anonymous ? (
                      <span className="px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                        Anonymous
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {(q as Question).profiles?.display_name ?? "Unknown"}
                      </span>
                    )}
                    <span>{q.reply_count ?? 0} replies</span>
                    <span>{formatTime(q.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
