"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  title: string | null;
  body: string;
  is_anonymous: boolean;
  is_pinned: boolean;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  profiles?: { display_name: string } | null;
};

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  useEffect(() => { load(); }, [categorySlug, sort]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (profile) setProfileId(profile.id);
    }

    const { data: cat } = await supabase.from("forum_categories").select("id, name").eq("slug", categorySlug).single();
    if (!cat) { setLoading(false); return; }
    setCategoryName(cat.name);
    setCategoryId(cat.id);

    let query = supabase
      .from("forum_posts")
      .select("*")
      .eq("category_id", cat.id)
      .is("parent_id", null);

    if (sort === "popular") {
      query = query.order("upvote_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    setPosts((data as unknown as Post[]) || []);
    setLoading(false);
  }

  async function handleNewPost(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || !categoryId) return;
    setPosting(true);

    await supabase.from("forum_posts").insert({
      category_id: categoryId,
      profile_id: profileId,
      title: newTitle.trim() || null,
      body: newBody.trim(),
      is_anonymous: isAnon,
    });

    setPosting(false);
    setShowNew(false);
    setNewTitle("");
    setNewBody("");
    setIsAnon(false);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/community/forums" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">&larr; Forums</Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold capitalize">{categoryName || categorySlug}</h2>
        <button onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors">
          + New Post
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleNewPost} className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6 space-y-3">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Post title (optional)"
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} required rows={4} placeholder="What's on your mind?"
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)}
                className="w-4 h-4 rounded border-navy-600 bg-navy-800" />
              <span className="text-sm text-slate-400">Post anonymously</span>
            </label>
            <button type="submit" disabled={posting || !newBody.trim()}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setSort("recent")}
          className={`text-sm px-3 py-1 rounded ${sort === "recent" ? "text-teal-400 bg-teal-500/10" : "text-slate-400 hover:text-slate-300"}`}>
          Recent
        </button>
        <button onClick={() => setSort("popular")}
          className={`text-sm px-3 py-1 rounded ${sort === "popular" ? "text-teal-400 bg-teal-500/10" : "text-slate-400 hover:text-slate-300"}`}>
          Popular
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No posts yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/forums/post/${post.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors">
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-0.5 text-slate-500 shrink-0">
                  <span className="text-sm font-mono font-bold text-teal-400">{post.upvote_count}</span>
                  <span className="text-[10px]">votes</span>
                </div>
                <div className="min-w-0">
                  {post.is_pinned && <span className="text-xs text-amber-400 mr-2">Pinned</span>}
                  {post.title && <h3 className="font-semibold text-slate-100">{post.title}</h3>}
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{post.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{post.is_anonymous ? "Anonymous" : post.profiles?.display_name || "Unknown"}</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>{post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
