"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ConversationType = Database["public"]["Enums"]["conversation_type"];
type DepartmentType = Database["public"]["Enums"]["department_type"];
type RankCategory = Database["public"]["Enums"]["rank_category"];
type VesselType = Database["public"]["Enums"]["vessel_type"];

type ConversationWithMeta = {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  context_port: string | null;
  updated_at: string;
  is_encrypted: boolean;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_by: string | null;
  // joined from conversation_members
  is_pinned?: boolean;
  is_archived?: boolean;
  last_read_at?: string | null;
  unread_count?: number;
  // for DM partner display
  dm_partner_name?: string;
  dm_partner_online?: boolean;
  member_count?: number;
};

type FoundUser = {
  id: string;
  display_name: string;
  department_tag: DepartmentType | null;
  rank_range: RankCategory | null;
  vessel_type_tags: VesselType[] | null;
  last_seen_at: string | null;
};

type Tab = "direct" | "channels";

const CHANNEL_TYPES: ConversationType[] = ["channel", "vessel_channel", "company_channel", "port_channel"];

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000; // 5 min
}

function isChannel(type: ConversationType): boolean {
  return CHANNEL_TYPES.includes(type);
}

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [allChannels, setAllChannels] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("direct");
  const [showNew, setShowNew] = useState(false);
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group">("dm");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<FoundUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [newEncrypted, setNewEncrypted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Discovery filters
  const [filterDepartment, setFilterDepartment] = useState<DepartmentType | "">("");
  const [filterRank, setFilterRank] = useState<RankCategory | "">("");
  const [filterVesselType, setFilterVesselType] = useState<VesselType | "">("");

  // Channel creation
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelType, setNewChannelType] = useState<ConversationType>("channel");
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Heartbeat: update last_seen_at
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function heartbeat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
        if (profile) {
          await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
        }
      }
    }
    heartbeat();
    interval = setInterval(heartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { load(); }, []);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) return;
    setProfileId(profile.id);

    // Get user's memberships with pin/archive state
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at, is_pinned, is_archived")
      .eq("profile_id", profile.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const membershipMap = new Map(memberships.map(m => [m.conversation_id, m]));
    const ids = memberships.map((m) => m.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    // --- Batch query: unread counts ---
    // Find the earliest last_read_at to use as a floor for the messages query
    const earliestLastRead = memberships.reduce<string | null>((earliest, m) => {
      if (!m.last_read_at) return null; // null means "never read" -> need all
      if (earliest === null) return null;
      return m.last_read_at < earliest ? m.last_read_at : earliest;
    }, memberships[0]?.last_read_at ?? null);

    // Fetch all unread messages across all conversations in ONE query
    let unreadQuery = supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", ids)
      .neq("sender_id", profile.id);

    if (earliestLastRead) {
      unreadQuery = unreadQuery.gt("created_at", earliestLastRead);
    }

    const { data: unreadMessages } = await unreadQuery;

    // Count per conversation, respecting each conversation's own last_read_at
    const unreadCountMap = new Map<string, number>();
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const membership = membershipMap.get(msg.conversation_id);
        const lastRead = membership?.last_read_at;
        // If no lastRead, all messages are unread; otherwise only those after lastRead
        if (!lastRead || msg.created_at > lastRead) {
          unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
        }
      }
    }

    // --- Batch query: all conversation_members for all conversations ---
    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, profile_id")
      .in("conversation_id", ids);

    // Build member count map and DM partner ID map
    const memberCountMap = new Map<string, number>();
    const dmPartnerIdMap = new Map<string, string>();
    const dmConvoIds = new Set(convos.filter(c => c.type === "dm").map(c => c.id));
    const nonDmConvoIds = new Set(convos.filter(c => c.type !== "dm").map(c => c.id));

    if (allMembers) {
      for (const m of allMembers) {
        // Count members for non-DM conversations
        if (nonDmConvoIds.has(m.conversation_id)) {
          memberCountMap.set(m.conversation_id, (memberCountMap.get(m.conversation_id) || 0) + 1);
        }
        // Find DM partner (the member that isn't us)
        if (dmConvoIds.has(m.conversation_id) && m.profile_id !== profile.id) {
          dmPartnerIdMap.set(m.conversation_id, m.profile_id);
        }
      }
    }

    // --- Batch query: DM partner profiles ---
    const partnerIds = [...new Set(dmPartnerIdMap.values())];
    const partnerProfileMap = new Map<string, { display_name: string; last_seen_at: string | null }>();
    if (partnerIds.length > 0) {
      const { data: partnerProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, last_seen_at")
        .in("id", partnerIds);
      if (partnerProfiles) {
        for (const p of partnerProfiles) {
          partnerProfileMap.set(p.id, { display_name: p.display_name, last_seen_at: p.last_seen_at });
        }
      }
    }

    // --- Assemble enriched conversations ---
    const enriched: ConversationWithMeta[] = convos.map(c => {
      const membership = membershipMap.get(c.id);
      const partnerId = dmPartnerIdMap.get(c.id);
      const partner = partnerId ? partnerProfileMap.get(partnerId) : undefined;

      return {
        ...c,
        is_pinned: membership?.is_pinned || false,
        is_archived: membership?.is_archived || false,
        last_read_at: membership?.last_read_at,
        unread_count: unreadCountMap.get(c.id) || 0,
        dm_partner_name: partner?.display_name,
        dm_partner_online: partner ? isOnline(partner.last_seen_at) : false,
        member_count: memberCountMap.get(c.id) || 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }, []);

  // Load browseable channels
  useEffect(() => {
    if (tab === "channels") loadChannels();
  }, [tab]);

  async function loadChannels() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .in("type", CHANNEL_TYPES)
      .order("updated_at", { ascending: false });
    setAllChannels((data as ConversationWithMeta[]) || []);
  }

  async function handleSearchUsers(q: string) {
    setSearchUser(q);
    if (q.length < 2 && !filterDepartment && !filterRank && !filterVesselType) {
      setFoundUsers([]);
      return;
    }

    let query = supabase
      .from("profiles")
      .select("id, display_name, department_tag, rank_range, vessel_type_tags, last_seen_at")
      .neq("id", profileId!)
      .limit(20);

    if (q.length >= 2) {
      query = query.ilike("display_name", `%${q}%`);
    }
    if (filterDepartment) {
      query = query.eq("department_tag", filterDepartment);
    }
    if (filterRank) {
      query = query.eq("rank_range", filterRank);
    }
    if (filterVesselType) {
      query = query.contains("vessel_type_tags", [filterVesselType]);
    }

    const { data } = await query;
    setFoundUsers((data as FoundUser[]) || []);
  }

  // Re-search when filters change
  useEffect(() => {
    if (showNew && (searchUser.length >= 2 || filterDepartment || filterRank || filterVesselType)) {
      handleSearchUsers(searchUser);
    }
  }, [filterDepartment, filterRank, filterVesselType]);

  async function createConversation() {
    if (!profileId || selectedUsers.length === 0) return;
    setCreating(true);

    const { data: convo, error } = await supabase.from("conversations").insert({
      type: newType,
      name: newType === "group" ? newName || null : null,
      description: newType === "group" ? newDescription || null : null,
      is_encrypted: newEncrypted,
      created_by: profileId,
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
    setNewDescription("");
    setNewEncrypted(false);
    setFilterDepartment("");
    setFilterRank("");
    setFilterVesselType("");
    router.push(`/messages/${convo.id}`);
  }

  async function createChannel() {
    if (!profileId || !newChannelName.trim()) return;
    setCreatingChannel(true);

    const { data: convo, error } = await supabase.from("conversations").insert({
      type: newChannelType,
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || null,
      created_by: profileId,
    }).select("id").single();

    if (error || !convo) { setCreatingChannel(false); return; }

    await supabase.from("conversation_members").insert({
      conversation_id: convo.id,
      profile_id: profileId,
      role: "admin",
    });

    setCreatingChannel(false);
    setShowChannelBrowser(false);
    setNewChannelName("");
    setNewChannelDesc("");
    router.push(`/messages/${convo.id}`);
  }

  async function joinChannel(channelId: string) {
    if (!profileId) return;
    // Check if already a member
    const { data: existing } = await supabase
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", channelId)
      .eq("profile_id", profileId)
      .single();
    if (!existing) {
      await supabase.from("conversation_members").insert({
        conversation_id: channelId,
        profile_id: profileId,
        role: "member",
      });
    }
    router.push(`/messages/${channelId}`);
  }

  async function togglePin(convoId: string, currentlyPinned: boolean) {
    if (!profileId) return;
    await supabase.from("conversation_members")
      .update({ is_pinned: !currentlyPinned })
      .eq("conversation_id", convoId)
      .eq("profile_id", profileId);
    load();
  }

  async function toggleArchive(convoId: string, currentlyArchived: boolean) {
    if (!profileId) return;
    await supabase.from("conversation_members")
      .update({ is_archived: !currentlyArchived })
      .eq("conversation_id", convoId)
      .eq("profile_id", profileId);
    load();
  }

  function formatType(t: string) {
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  }

  // Sort and section conversations
  const myConvos = conversations.filter(c =>
    tab === "direct" ? !isChannel(c.type) : isChannel(c.type)
  );
  const activeConvos = myConvos.filter(c => !c.is_archived);
  const archivedConvos = myConvos.filter(c => c.is_archived);
  const pinnedConvos = activeConvos.filter(c => c.is_pinned);
  const unreadConvos = activeConvos.filter(c => !c.is_pinned && (c.unread_count || 0) > 0);
  const readConvos = activeConvos.filter(c => !c.is_pinned && (c.unread_count || 0) === 0);

  // Total unread for the nav badge (across all convos)
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // Channels the user has NOT joined (for browsing)
  const joinedChannelIds = new Set(conversations.filter(c => isChannel(c.type)).map(c => c.id));
  const unjoinedChannels = allChannels.filter(c => !joinedChannelIds.has(c.id));

  function renderConversationItem(c: ConversationWithMeta) {
    const displayName = c.type === "dm" ? (c.dm_partner_name || "Direct Message") : (c.name || formatType(c.type));
    const hasUnread = (c.unread_count || 0) > 0;

    return (
      <div key={c.id} className="group relative">
        <Link href={`/messages/${c.id}`}
          className={`block bg-navy-900 border rounded-lg p-4 transition-colors ${
            hasUnread ? "border-teal-500/30 bg-navy-900/80" : "border-navy-700 hover:border-navy-600"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Online indicator for DM */}
              {c.type === "dm" && (
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center text-sm font-medium text-slate-300">
                    {(c.dm_partner_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-navy-900 ${
                    c.dm_partner_online ? "bg-green-400" : "bg-slate-600"
                  }`} />
                </div>
              )}
              {/* Channel icon */}
              {isChannel(c.type) && (
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
                  </svg>
                </div>
              )}
              {/* Group icon */}
              {c.type === "group" && (
                <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center text-slate-400 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${hasUnread ? "text-slate-100" : "text-slate-300"}`}>
                    {displayName}
                  </p>
                  {c.is_pinned && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-teal-400 shrink-0">
                      <path d="M4.146.146A.5.5 0 014.5 0h7a.5.5 0 01.5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 01-.5.5H8.5v5.5a.5.5 0 01-1 0V10H3.5a.5.5 0 01-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 015 6.708V2.277a2.77 2.77 0 01-.354-.298C4.342 1.674 4 1.18 4 .5a.5.5 0 01.146-.354z" />
                    </svg>
                  )}
                  {c.is_encrypted && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-teal-400 shrink-0">
                      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {c.last_message_preview && (
                  <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-slate-300" : "text-slate-500"}`}>
                    {c.last_message_preview}
                  </p>
                )}
                {!c.last_message_preview && c.context_port && (
                  <p className="text-xs text-slate-500 mt-0.5">{c.context_port}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {c.member_count && c.type !== "dm" ? (
                <span className="text-[10px] text-slate-500">{c.member_count} members</span>
              ) : null}
              {hasUnread && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-teal-500 text-navy-950 text-[10px] font-bold rounded-full">
                  {c.unread_count! > 99 ? "99+" : c.unread_count}
                </span>
              )}
              <span className="text-[10px] text-slate-500">
                {formatTime(c.last_message_at || c.updated_at)}
              </span>
            </div>
          </div>
        </Link>
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); togglePin(c.id, !!c.is_pinned); }}
            className="p-1.5 rounded bg-navy-800/90 border border-navy-600 text-slate-400 hover:text-teal-400 transition-colors"
            title={c.is_pinned ? "Unpin" : "Pin"}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.146.146A.5.5 0 014.5 0h7a.5.5 0 01.5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 01-.5.5H8.5v5.5a.5.5 0 01-1 0V10H3.5a.5.5 0 01-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 015 6.708V2.277a2.77 2.77 0 01-.354-.298C4.342 1.674 4 1.18 4 .5a.5.5 0 01.146-.354z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); toggleArchive(c.id, !!c.is_archived); }}
            className="p-1.5 rounded bg-navy-800/90 border border-navy-600 text-slate-400 hover:text-amber-400 transition-colors"
            title={c.is_archived ? "Unarchive" : "Archive"}
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function renderSection(title: string, items: ConversationWithMeta[]) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 px-1">{title}</p>
        <div className="space-y-1.5">
          {items.map(renderConversationItem)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Messages</h1>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-teal-500 text-navy-950 text-xs font-bold rounded-full">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => { tab === "direct" ? setShowNew(!showNew) : setShowChannelBrowser(!showChannelBrowser); }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {tab === "direct" ? "+ New Message" : "+ Browse Channels"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-navy-900 rounded-lg p-1 border border-navy-700">
        <button
          onClick={() => setTab("direct")}
          className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
            tab === "direct" ? "bg-teal-500/15 text-teal-400" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setTab("channels")}
          className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
            tab === "channels" ? "bg-teal-500/15 text-teal-400" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Channels
        </button>
      </div>

      {/* New DM/Group panel */}
      {showNew && tab === "direct" && (
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
            <>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name"
                className="w-full px-3 py-2 mb-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
              <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description (optional)"
                className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
            </>
          )}

          {/* Discovery filters */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value as DepartmentType | "")}
              className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
              <option value="">All Departments</option>
              <option value="deck">Deck</option>
              <option value="engine">Engine</option>
              <option value="electro">Electro</option>
              <option value="catering">Catering</option>
            </select>
            <select value={filterRank} onChange={(e) => setFilterRank(e.target.value as RankCategory | "")}
              className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
              <option value="">All Ranks</option>
              <option value="officer">Officer</option>
              <option value="rating">Rating</option>
              <option value="cadet">Cadet</option>
            </select>
            <select value={filterVesselType} onChange={(e) => setFilterVesselType(e.target.value as VesselType | "")}
              className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
              <option value="">All Vessel Types</option>
              <option value="tanker">Tanker</option>
              <option value="bulk_carrier">Bulk Carrier</option>
              <option value="container">Container</option>
              <option value="general_cargo">General Cargo</option>
              <option value="offshore">Offshore</option>
              <option value="passenger">Passenger</option>
              <option value="roro">RoRo</option>
              <option value="lng">LNG</option>
              <option value="lpg">LPG</option>
              <option value="chemical">Chemical</option>
              <option value="tug">Tug</option>
              <option value="fishing">Fishing</option>
            </select>
          </div>

          <input type="text" value={searchUser} onChange={(e) => handleSearchUsers(e.target.value)} placeholder="Search seafarers by name..."
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />

          {foundUsers.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-navy-700 rounded-lg p-1">
              {foundUsers.map((u) => (
                <button key={u.id}
                  onClick={() => { setSelectedUsers((prev) => prev.find((p) => p.id === u.id) ? prev : [...prev, u]); setSearchUser(""); setFoundUsers([]); }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-navy-800 rounded">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-xs font-medium text-slate-300">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-navy-900 ${
                      isOnline(u.last_seen_at) ? "bg-green-400" : "bg-slate-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.display_name}</p>
                    <p className="text-[10px] text-slate-500">
                      {[u.department_tag, u.rank_range].filter(Boolean).map(v => formatType(v!)).join(" / ") || "No details"}
                    </p>
                  </div>
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
              End-to-end encrypted (keys stored in this browser only)
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

      {/* Channel browser/create panel */}
      {showChannelBrowser && tab === "channels" && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Create a Channel</h3>
          <div className="flex gap-2 mb-3">
            {(["channel", "vessel_channel", "port_channel"] as ConversationType[]).map(ct => (
              <button key={ct} onClick={() => setNewChannelType(ct)}
                className={`px-3 py-1.5 text-xs rounded border ${newChannelType === ct ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
                {formatType(ct)}
              </button>
            ))}
          </div>
          <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Channel name"
            className="w-full px-3 py-2 mb-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          <input type="text" value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          <button onClick={createChannel} disabled={creatingChannel || !newChannelName.trim()}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
            {creatingChannel ? "Creating..." : "Create Channel"}
          </button>

          {/* Discoverable channels */}
          {unjoinedChannels.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-slate-200 mt-5 mb-3">Browse Public Channels</h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {unjoinedChannels.map(ch => (
                  <div key={ch.id} className="flex items-center justify-between px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{ch.name || formatType(ch.type)}</p>
                      {ch.description && <p className="text-xs text-slate-500 truncate">{ch.description}</p>}
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatType(ch.type)}</p>
                    </div>
                    <button onClick={() => joinChannel(ch.id)}
                      className="ml-3 px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 text-xs font-medium rounded transition-colors">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Conversation list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-navy-800 animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-navy-800 animate-pulse rounded mb-1.5" />
                  <div className="h-3 w-48 bg-navy-800 animate-pulse rounded" />
                </div>
                <div className="h-3 w-10 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activeConvos.length === 0 && !showNew && !showChannelBrowser ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-300 font-medium">
            {tab === "direct" ? "No conversations yet" : "No channels joined"}
          </p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            {tab === "direct"
              ? "Connect with other seafarers through direct or group messages."
              : "Browse and join channels to connect with the community."}
          </p>
          <button
            onClick={() => tab === "direct" ? setShowNew(true) : setShowChannelBrowser(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {tab === "direct" ? "Start a Conversation" : "Browse Channels"}
          </button>
          {tab === "direct" && (
            <div className="mt-4 pt-3 border-t border-navy-700">
              <p className="text-slate-500 text-sm">You can also browse Channels to find active communities</p>
              <button
                onClick={() => setTab("channels")}
                className="mt-2 inline-flex items-center px-3 py-1.5 bg-navy-800 border border-navy-600 hover:border-navy-500 text-slate-300 text-sm rounded transition-colors"
              >
                Browse Channels
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {renderSection("Pinned", pinnedConvos)}
          {renderSection("Unread", unreadConvos)}
          {renderSection("Recent", readConvos)}

          {archivedConvos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors mb-2 px-1"
              >
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className={`transition-transform ${showArchived ? "rotate-90" : ""}`}>
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Archived ({archivedConvos.length})
              </button>
              {showArchived && (
                <div className="space-y-1.5 opacity-60">
                  {archivedConvos.map(renderConversationItem)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
