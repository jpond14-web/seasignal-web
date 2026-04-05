"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GuideCategory = "safety" | "navigation" | "engineering" | "regulations" | "career" | "wellness" | "finance" | "other";

type Guide = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: GuideCategory;
  tags: string[];
  vote_count: number;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles: { display_name: string } | null;
};

const CATEGORIES: GuideCategory[] = ["safety", "navigation", "engineering", "regulations", "career", "wellness", "finance", "other"];

const CATEGORY_STYLES: Record<GuideCategory, string> = {
  safety: "bg-red-500/10 border-red-500/30 text-red-400",
  navigation: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  engineering: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  regulations: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  career: "bg-teal-500/10 border-teal-500/30 text-teal-400",
  wellness: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  finance: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  other: "bg-slate-500/10 border-slate-500/30 text-slate-400",
};

type SortMode = "newest" | "top";

export default function GuidesPage() {
  const supabase = createClient();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({}); // guideId -> value

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<GuideCategory | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState<GuideCategory>("other");
  const [formTags, setFormTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const fetchGuides = useCallback(async () => {
    const orderCol = sortMode === "top" ? "vote_count" : "created_at";
    const { data } = await supabase
      .from("guides")
      .select("id, author_id, title, body, category, tags, vote_count, view_count, is_pinned, created_at, profiles(display_name)")
      .order("is_pinned", { ascending: false })
      .order(orderCol, { ascending: false })
      .limit(50);
    if (data) setGuides(data as unknown as Guide[]);
    setLoading(false);
  }, [supabase, sortMode]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (profile) {
          setProfileId(profile.id);
          const { data: votes } = await supabase
            .from("guide_votes")
            .select("guide_id, value")
            .eq("profile_id", profile.id);
          if (votes) {
            const voteMap: Record<string, number> = {};
            votes.forEach((v) => { voteMap[v.guide_id] = v.value; });
            setMyVotes(voteMap);
          }
        }
      }
      await fetchGuides();
    })();
  }, [supabase, fetchGuides]);

  const filtered = guides.filter((g) => {
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        (g.profiles?.display_name ?? "").toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)) ||
        g.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = async () => {
    if (!profileId) return;
    if (formTitle.length < 3 || formBody.length < 20) {
      setError("Title must be at least 3 characters and body at least 20.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const { error: insertErr } = await supabase.from("guides").insert({
      author_id: profileId,
      title: formTitle,
      body: formBody,
      category: formCategory,
      tags,
    });
    if (insertErr) {
      setError(insertErr.message);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormCategory("other");
      setFormTags("");
      setShowForm(false);
      await fetchGuides();
    }
    setSubmitting(false);
  };

  const handleVote = async (guideId: string, value: 1 | -1) => {
    if (!profileId) return;
    const currentVote = myVotes[guideId];

    if (currentVote === value) {
      // Remove vote
      await supabase.from("guide_votes").delete().eq("guide_id", guideId).eq("profile_id", profileId);
      setMyVotes((prev) => { const n = { ...prev }; delete n[guideId]; return n; });
      setGuides((prev) => prev.map((g) => g.id === guideId ? { ...g, vote_count: g.vote_count - value } : g));
    } else if (currentVote) {
      // Change vote
      await supabase.from("guide_votes").update({ value }).eq("guide_id", guideId).eq("profile_id", profileId);
      setMyVotes((prev) => ({ ...prev, [guideId]: value }));
      setGuides((prev) => prev.map((g) => g.id === guideId ? { ...g, vote_count: g.vote_count - currentVote + value } : g));
    } else {
      // New vote
      await supabase.from("guide_votes").insert({ guide_id: guideId, profile_id: profileId, value });
      setMyVotes((prev) => ({ ...prev, [guideId]: value }));
      setGuides((prev) => prev.map((g) => g.id === guideId ? { ...g, vote_count: g.vote_count + value } : g));
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("guides").delete().eq("id", id);
    setGuides((prev) => prev.filter((g) => g.id !== id));
    if (selectedGuide?.id === id) setSelectedGuide(null);
  };

  const openGuide = async (guide: Guide) => {
    setSelectedGuide(guide);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading guides...</div>
      </div>
    );
  }

  // Detail view
  if (selectedGuide) {
    const isOwner = selectedGuide.author_id === profileId;
    const myVote = myVotes[selectedGuide.id];
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedGuide(null)}
          className="text-sm text-teal-400 hover:text-teal-300 mb-4 inline-flex items-center gap-1"
        >
          &larr; Back to guides
        </button>
        <article className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded border capitalize ${CATEGORY_STYLES[selectedGuide.category]}`}>
              {selectedGuide.category}
            </span>
            {selectedGuide.is_pinned && (
              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/40 text-teal-400">Pinned</span>
            )}
            {selectedGuide.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">{selectedGuide.title}</h2>
          <div className="flex items-center gap-3 mb-6 text-xs text-slate-500">
            <span>by {selectedGuide.profiles?.display_name ?? "Anonymous"}</span>
            <span>{new Date(selectedGuide.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            {isOwner && (
              <button onClick={() => handleDelete(selectedGuide.id)} className="text-red-400 hover:text-red-300">Delete</button>
            )}
          </div>
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
            {selectedGuide.body}
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-navy-700">
            <button
              onClick={() => handleVote(selectedGuide.id, 1)}
              className={`p-1.5 rounded transition-colors ${myVote === 1 ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-semibold ${selectedGuide.vote_count > 0 ? "text-teal-400" : selectedGuide.vote_count < 0 ? "text-red-400" : "text-slate-400"}`}>
              {selectedGuide.vote_count}
            </span>
            <button
              onClick={() => handleVote(selectedGuide.id, -1)}
              className={`p-1.5 rounded transition-colors ${myVote === -1 ? "text-red-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-slate-400 text-sm">
          Practical guides written by seafarers, for seafarers.
        </p>
        {profileId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Write a Guide
          </button>
        )}
      </div>

      {/* Write guide form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">Write a Guide</h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Guide title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={300}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="Write your guide here. Share practical knowledge, real experience, and things the textbooks don't cover..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={10}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-y"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as GuideCategory)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {submitting ? "Publishing..." : "Publish Guide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search, filters, sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search guides..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSortMode("newest")}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
              sortMode === "newest" ? "bg-teal-500/15 border-teal-500/40 text-teal-400" : "bg-navy-800 border-navy-600 text-slate-400"
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortMode("top")}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
              sortMode === "top" ? "bg-teal-500/15 border-teal-500/40 text-teal-400" : "bg-navy-800 border-navy-600 text-slate-400"
            }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium capitalize ${
              categoryFilter === cat
                ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guides grid */}
      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          No guides match your search. Try different keywords.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guide) => {
            const myVote = myVotes[guide.id];
            return (
              <article
                key={guide.id}
                onClick={() => openGuide(guide)}
                className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col hover:border-teal-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${CATEGORY_STYLES[guide.category]}`}>
                    {guide.category}
                  </span>
                  {guide.is_pinned && (
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/40 text-teal-400">Pinned</span>
                  )}
                  {guide.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="text-slate-100 font-semibold text-sm mb-2 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-3 line-clamp-3">
                  {guide.body}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-navy-700">
                  <span className="text-xs text-slate-500">
                    by {guide.profiles?.display_name ?? "Anonymous"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVote(guide.id, 1); }}
                      className={`p-0.5 transition-colors ${myVote === 1 ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className={`text-xs font-semibold ${guide.vote_count > 0 ? "text-teal-400" : guide.vote_count < 0 ? "text-red-400" : "text-slate-400"}`}>
                      {guide.vote_count}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVote(guide.id, -1); }}
                      className={`p-0.5 transition-colors ${myVote === -1 ? "text-red-400" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
