"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PostWithProfile = {
  id: string;
  category_id: string;
  title: string | null;
  body: string;
  is_anonymous: boolean;
  is_pinned: boolean;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  profile_id: string;
  profiles?: { display_name: string } | null;
};

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const [replies, setReplies] = useState<PostWithProfile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<number>(0);
  const [replyBody, setReplyBody] = useState("");
  const [replyAnon, setReplyAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const [categorySlug, setCategorySlug] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (profile) {
        setProfileId(profile.id);
        const { data: vote } = await supabase.from("post_votes").select("value").eq("post_id", id).eq("profile_id", profile.id).single();
        if (vote) setUserVote(vote.value);
      }
    }

    const { data: p } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (p) {
      setPost(p as unknown as PostWithProfile);
      const { data: cat } = await supabase.from("forum_categories").select("slug").eq("id", p.category_id).single();
      if (cat) setCategorySlug(cat.slug);
    }

    const { data: r } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("parent_id", id)
      .order("created_at", { ascending: true });
    setReplies((r as unknown as PostWithProfile[]) || []);
  }

  async function handleVote(value: number) {
    if (!profileId) return;
    const newValue = userVote === value ? 0 : value;

    if (userVote !== 0) {
      await supabase.from("post_votes").delete().eq("post_id", id).eq("profile_id", profileId);
    }
    if (newValue !== 0) {
      await supabase.from("post_votes").insert({ post_id: id, profile_id: profileId, value: newValue });
    }
    setUserVote(newValue);
    load();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || !post || !replyBody.trim()) return;
    setPosting(true);
    await supabase.from("forum_posts").insert({
      category_id: post.category_id,
      profile_id: profileId,
      body: replyBody.trim(),
      parent_id: id,
      is_anonymous: replyAnon,
    });
    setReplyBody("");
    setReplyAnon(false);
    setPosting(false);
    load();
  }

  if (!post) return <div className="max-w-3xl mx-auto"><p className="text-slate-400">Loading...</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={categorySlug ? `/community/forums/${categorySlug}` : "/community/forums"} className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">&larr; Back</Link>

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button onClick={() => handleVote(1)}
              className={`text-sm ${userVote === 1 ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}>&#9650;</button>
            <span className="text-sm font-mono font-bold text-slate-100">{post.upvote_count}</span>
            <button onClick={() => handleVote(-1)}
              className={`text-sm ${userVote === -1 ? "text-red-400" : "text-slate-500 hover:text-slate-300"}`}>&#9660;</button>
          </div>
          <div>
            {post.title && <h1 className="text-xl font-bold text-slate-100">{post.title}</h1>}
            <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{post.body}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
              <span>{post.is_anonymous ? "Anonymous" : post.profiles?.display_name || "Unknown"}</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h2>

      <div className="space-y-3 mb-6">
        {replies.map((r) => (
          <div key={r.id} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{r.body}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>{r.is_anonymous ? "Anonymous" : r.profiles?.display_name || "Unknown"}</span>
              <span>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="bg-navy-900 border border-navy-700 rounded-lg p-4 space-y-3">
        <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} required rows={3} placeholder="Write a reply..."
          className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={replyAnon} onChange={(e) => setReplyAnon(e.target.checked)} className="w-4 h-4 rounded border-navy-600 bg-navy-800" />
            <span className="text-sm text-slate-400">Reply anonymously</span>
          </label>
          <button type="submit" disabled={posting || !replyBody.trim()}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
            {posting ? "Posting..." : "Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
