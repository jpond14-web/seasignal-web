"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ConversationWithMeta = {
  id: string;
  type: string;
  name: string | null;
  context_port: string | null;
  updated_at: string;
  last_message?: string | null;
  members?: string[];
};

export default function MessagesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group">("dm");
  const [newName, setNewName] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUsers, setFoundUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) return;
    setProfileId(profile.id);

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", profile.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const ids = memberships.map((m) => m.conversation_id);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    setConversations(convos || []);
    setLoading(false);
  }

  async function handleSearchUsers(q: string) {
    setSearchUser(q);
    if (q.length < 2) { setFoundUsers([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", `%${q}%`)
      .neq("id", profileId!)
      .limit(10);
    setFoundUsers(data || []);
  }

  async function createConversation() {
    if (!profileId || selectedUsers.length === 0) return;
    setCreating(true);

    const { data: convo, error } = await supabase.from("conversations").insert({
      type: newType,
      name: newType === "group" ? newName || null : null,
    }).select("id").single();

    if (error || !convo) { setCreating(false); return; }

    const members = [
      { conversation_id: convo.id, profile_id: profileId, role: "admin" },
      ...selectedUsers.map((u) => ({ conversation_id: convo.id, profile_id: u.id, role: "member" })),
    ];
    await supabase.from("conversation_members").insert(members);

    setCreating(false);
    setShowNew(false);
    setSelectedUsers([]);
    setNewName("");
    load();
  }

  function formatType(t: string) {
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors">
          + New
        </button>
      </div>

      {showNew && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setNewType("dm")}
              className={`flex-1 py-2 text-sm rounded border ${newType === "dm" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
              Direct Message
            </button>
            <button onClick={() => setNewType("group")}
              className={`flex-1 py-2 text-sm rounded border ${newType === "group" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
              Group Chat
            </button>
          </div>
          {newType === "group" && (
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name"
              className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          )}
          <input type="text" value={searchUser} onChange={(e) => handleSearchUsers(e.target.value)} placeholder="Search users..."
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          {foundUsers.length > 0 && (
            <div className="mt-2 space-y-1">
              {foundUsers.map((u) => (
                <button key={u.id} onClick={() => { setSelectedUsers((prev) => prev.find((p) => p.id === u.id) ? prev : [...prev, u]); setSearchUser(""); setFoundUsers([]); }}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-navy-800 rounded">
                  {u.display_name}
                </button>
              ))}
            </div>
          )}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedUsers.map((u) => (
                <span key={u.id} className="flex items-center gap-1 px-2 py-1 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300">
                  {u.display_name}
                  <button onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))} className="text-slate-500 hover:text-red-400">&times;</button>
                </span>
              ))}
            </div>
          )}
          <button onClick={createConversation} disabled={creating || selectedUsers.length === 0}
            className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
            {creating ? "Creating..." : "Start Conversation"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : conversations.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No conversations yet.</p>
          <p className="text-slate-500 text-sm mt-1">Start a new conversation above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-100">
                    {c.name || formatType(c.type)}
                  </p>
                  {c.context_port && <p className="text-xs text-slate-500">{c.context_port}</p>}
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
