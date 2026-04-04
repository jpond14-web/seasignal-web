"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Channel = {
  id: string;
  name: string | null;
  type: string;
  description: string | null;
  access_mode: string | null;
  max_members: number | null;
  created_at: string;
  member_count: number;
  message_count: number;
};

type Member = {
  id: string;
  profile_id: string;
  display_name: string;
  role: string | null;
  joined_at: string | null;
};

export default function AdminChannelsPage() {
  const supabase = createClient();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  // Edit modal state
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAccessMode, setEditAccessMode] = useState("");
  const [editMaxMembers, setEditMaxMembers] = useState("");

  // Members panel state
  const [viewingMembers, setViewingMembers] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadChannels = useCallback(async () => {
    setLoading(true);

    const { data: convos } = await supabase
      .from("conversations")
      .select("id, name, type, description, access_mode, max_members, created_at")
      .order("created_at", { ascending: false });

    if (!convos) {
      setChannels([]);
      setLoading(false);
      return;
    }

    // Batch-fetch member and message counts in two queries instead of 2*N
    const convoIds = convos.map((c) => c.id);

    const [{ data: memberRows }, { data: messageRows }] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id")
        .in("conversation_id", convoIds),
      supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convoIds),
    ]);

    const memberCounts = new Map<string, number>();
    for (const row of memberRows ?? []) {
      memberCounts.set(row.conversation_id, (memberCounts.get(row.conversation_id) || 0) + 1);
    }

    const messageCounts = new Map<string, number>();
    for (const row of messageRows ?? []) {
      messageCounts.set(row.conversation_id, (messageCounts.get(row.conversation_id) || 0) + 1);
    }

    const enriched: Channel[] = convos.map((c) => ({
      ...c,
      member_count: memberCounts.get(c.id) ?? 0,
      message_count: messageCounts.get(c.id) ?? 0,
    }));

    setChannels(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const filteredChannels = channels.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  });

  async function deleteChannel(channelId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this channel? This will remove all messages and members. This action cannot be undone."
    );
    if (!confirmed) return;

    setActing(channelId);

    // Delete members, messages, then the conversation
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", channelId);
    await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", channelId);
    await supabase.from("conversations").delete().eq("id", channelId);

    await loadChannels();
    setActing(null);
  }

  function openEdit(channel: Channel) {
    setEditingChannel(channel);
    setEditName(channel.name || "");
    setEditDescription(channel.description || "");
    setEditAccessMode(channel.access_mode || "open");
    setEditMaxMembers(channel.max_members ? String(channel.max_members) : "");
  }

  async function saveEdit() {
    if (!editingChannel) return;
    setActing(editingChannel.id);

    await supabase
      .from("conversations")
      .update({
        name: editName || null,
        description: editDescription || null,
        access_mode: editAccessMode || null,
        max_members: editMaxMembers ? parseInt(editMaxMembers, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingChannel.id);

    setEditingChannel(null);
    await loadChannels();
    setActing(null);
  }

  async function loadMembers(channelId: string) {
    setViewingMembers(channelId);
    setLoadingMembers(true);

    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("id, profile_id, role, joined_at")
      .eq("conversation_id", channelId);

    if (!memberRows || memberRows.length === 0) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const profileIds = memberRows.map((m) => m.profile_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", profileIds);

    const nameMap = new Map(
      (profiles || []).map((p) => [p.id, p.display_name])
    );

    setMembers(
      memberRows.map((m) => ({
        ...m,
        display_name: nameMap.get(m.profile_id) || "Unknown",
      }))
    );
    setLoadingMembers(false);
  }

  async function kickMember(membershipId: string, channelId: string) {
    const confirmed = window.confirm("Remove this member from the channel?");
    if (!confirmed) return;

    await supabase.from("conversation_members").delete().eq("id", membershipId);
    await loadMembers(channelId);
    await loadChannels();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Channel Moderation</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search channels by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="h-4 w-48 bg-navy-800 animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-navy-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            {search ? "No channels match your search." : "No channels found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {channel.name || "(unnamed)"}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-navy-800 text-slate-400 border border-navy-600">
                      {channel.type}
                    </span>
                    {channel.access_mode && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-navy-800 text-slate-500 border border-navy-600">
                        {channel.access_mode}
                      </span>
                    )}
                  </div>

                  {channel.description && (
                    <p className="text-xs text-slate-400 mb-2 truncate">
                      {channel.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      <span className="font-mono text-teal-400">
                        {channel.member_count}
                      </span>{" "}
                      members
                    </span>
                    <span>
                      <span className="font-mono text-blue-400">
                        {channel.message_count}
                      </span>{" "}
                      messages
                    </span>
                    {channel.max_members && (
                      <span>
                        max:{" "}
                        <span className="font-mono">{channel.max_members}</span>
                      </span>
                    )}
                    <span>
                      {new Date(channel.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => loadMembers(channel.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-600 text-slate-300 rounded hover:bg-navy-700 transition-colors"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => openEdit(channel)}
                    className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-600 text-teal-400 rounded hover:bg-navy-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteChannel(channel.id)}
                    disabled={acting === channel.id}
                    className="px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Members panel (inline) */}
              {viewingMembers === channel.id && (
                <div className="mt-4 pt-4 border-t border-navy-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-200">
                      Members ({members.length})
                    </h4>
                    <button
                      onClick={() => setViewingMembers(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  {loadingMembers ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 bg-navy-800 animate-pulse rounded"
                        />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-xs text-slate-500">No members.</p>
                  ) : (
                    <div className="space-y-1">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-navy-800 rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-slate-200 truncate">
                              {member.display_name}
                            </span>
                            {member.role && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-navy-700 text-slate-400">
                                {member.role}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              kickMember(member.id, channel.id)
                            }
                            className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
                          >
                            Kick
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-slate-100 mb-4">
              Edit Channel
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Access Mode
                </label>
                <select
                  value={editAccessMode}
                  onChange={(e) => setEditAccessMode(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="invite">Invite Only</option>
                  <option value="request">Request to Join</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Max Members (leave blank for unlimited)
                </label>
                <input
                  type="number"
                  value={editMaxMembers}
                  onChange={(e) => setEditMaxMembers(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingChannel(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={acting === editingChannel.id}
                className="px-4 py-2 text-sm font-medium bg-teal-500 text-navy-900 rounded hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
