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
  is_encrypted?: boolean;
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
  const [newEncrypted, setNewEncrypted] = useState(false);

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
      is_encrypted: newEncrypted,
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
    setNewEncrypted(false);
    load();
  }

  function formatType(t: string) {
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
          aria-label="New conversation"
        >
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
                  <button onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))} className="text-slate-500 hover:text-red-400" aria-label={`Remove ${u.display_name}`}>&times;</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4 mb-1">
            <label htmlFor="encrypt-toggle" className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 ${newEncrypted ? "text-teal-400" : "text-slate-500"}`}>
                <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
              </svg>
              End-to-end encrypted
            </label>
            <button
              id="encrypt-toggle"
              type="button"
              role="switch"
              aria-checked={newEncrypted}
              onClick={() => setNewEncrypted((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${newEncrypted ? "bg-teal-500" : "bg-navy-600"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${newEncrypted ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
            </button>
          </div>
          <button onClick={createConversation} disabled={creating || selectedUsers.length === 0}
            className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
            {creating ? "Creating..." : "Start Conversation"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-5 w-32 bg-navy-800 animate-pulse rounded mb-1" />
                  <div className="h-3 w-20 bg-navy-800 animate-pulse rounded" />
                </div>
                <div className="h-3 w-16 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-300 font-medium">No conversations yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Connect with other seafarers through direct or group messages.</p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            Start a Conversation
          </button>
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
                <div className="flex items-center gap-2">
                  {c.is_encrypted && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-teal-400" aria-label="Encrypted">
                      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
