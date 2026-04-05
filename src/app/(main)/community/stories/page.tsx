"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SECTORS = [
  "Offshore",
  "Tanker",
  "Container",
  "Bulk Carrier",
  "Fishing",
  "Cruise",
  "Tug & Salvage",
  "LNG/LPG",
];

type Story = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  tags: string[];
  like_count: number;
  created_at: string;
  profiles: { display_name: string } | null;
};

export default function SeaStoriesPage() {
  const supabase = createClient();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formSector, setFormSector] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    const { data } = await supabase
      .from("sea_stories")
      .select("id, author_id, title, body, tags, like_count, created_at, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setStories(data as unknown as Story[]);
    setLoading(false);
  }, [supabase]);

  // Load user profile + liked stories
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) {
        setProfileId(profile.id);
        const { data: reactions } = await supabase
          .from("story_reactions")
          .select("story_id")
          .eq("profile_id", profile.id);
        if (reactions) setLikedIds(new Set(reactions.map((r) => r.story_id)));
      }
      await fetchStories();
    })();
  }, [supabase, fetchStories]);

  const handleSubmit = async () => {
    if (!profileId) return;
    if (formTitle.length < 3 || formBody.length < 10) {
      setError("Title must be at least 3 characters and story at least 10.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const tags = formSector ? [formSector] : [];
    const { error: insertErr } = await supabase.from("sea_stories").insert({
      author_id: profileId,
      title: formTitle,
      body: formBody,
      tags,
    });
    if (insertErr) {
      setError(insertErr.message);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormSector("");
      setShowForm(false);
      await fetchStories();
    }
    setSubmitting(false);
  };

  const toggleLike = async (storyId: string) => {
    if (!profileId) return;
    const liked = likedIds.has(storyId);
    if (liked) {
      await supabase
        .from("story_reactions")
        .delete()
        .eq("story_id", storyId)
        .eq("profile_id", profileId);
      setLikedIds((prev) => { const s = new Set(prev); s.delete(storyId); return s; });
      setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, like_count: s.like_count - 1 } : s));
    } else {
      await supabase.from("story_reactions").insert({ story_id: storyId, profile_id: profileId });
      setLikedIds((prev) => new Set(prev).add(storyId));
      setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, like_count: s.like_count + 1 } : s));
    }
  };

  const handleDelete = async (storyId: string) => {
    await supabase.from("sea_stories").delete().eq("id", storyId);
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">
          Real stories from life at sea. The good, the hard, and everything in between.
        </p>
        {profileId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Share Your Story
          </button>
        )}
      </div>

      {/* Story form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">Tell Us Your Story</h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Give your story a title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="What happened? Share as much or as little as you like..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={5}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={formSector}
                onChange={(e) => setFormSector(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
              >
                <option value="">Select sector (optional)</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {submitting ? "Publishing..." : "Publish Story"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stories feed */}
      {stories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No stories yet. Be the first to share yours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => {
            const isOwner = story.author_id === profileId;
            const liked = likedIds.has(story.id);
            return (
              <article
                key={story.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-sm">
                    {(story.profiles?.display_name ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-200 text-sm font-medium">
                      {story.profiles?.display_name ?? "Anonymous"}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <time>
                        {new Date(story.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(story.id)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete story"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <h3 className="text-slate-100 font-semibold text-base mb-2">
                  {story.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {story.body}
                </p>

                {/* Like button */}
                <button
                  onClick={() => toggleLike(story.id)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    liked
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                      : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
                  }`}
                >
                  <span>{liked ? "\u2764\uFE0F" : "\uD83E\uDD0D"}</span>
                  <span>{story.like_count}</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
