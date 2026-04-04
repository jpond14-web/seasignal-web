"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getOrCreateConversationKey,
  encrypt,
  decrypt,
} from "@/lib/crypto";
import type { Json } from "@/lib/supabase/types";

type Reactions = Record<string, string[]>; // emoji -> profileId[]
type Attachment = { name: string; url: string; type: string; size: number };

type Message = {
  id: string;
  sender_id: string;
  plaintext: string | null;
  ciphertext: string | null;
  message_type: string;
  reply_to_id: string | null;
  reactions: Json;
  attachments: Json;
  created_at: string;
  profiles?: { display_name: string } | null;
};

type MemberProfile = {
  profile_id: string;
  display_name: string;
  last_seen_at: string | null;
};

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  if (isOnline(lastSeen)) return "Online";
  const d = new Date(lastSeen);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `Last seen ${diffHrs}h ago`;
  return `Last seen ${d.toLocaleDateString()}`;
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [convoName, setConvoName] = useState("");
  const [convoType, setConvoType] = useState("");
  const [convoDescription, setConvoDescription] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);

  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Reactions popup
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);

  // Message search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  // Scroll state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMsgIndicator, setNewMsgIndicator] = useState(false);
  const isScrolledUpRef = useRef(false);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typing channel ref (reused across handleTyping calls)
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Sender name cache
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  // Decrypt all encrypted messages whenever messages or key change
  const decryptMessages = useCallback(
    async (msgs: Message[], key: CryptoKey | null) => {
      if (!key) return;
      const results: Record<string, string> = {};
      await Promise.all(
        msgs.map(async (msg) => {
          if (msg.ciphertext && !msg.plaintext) {
            try {
              results[msg.id] = await decrypt(msg.ciphertext, key);
            } catch {
              results[msg.id] = "[Unable to decrypt]";
            }
          }
        }),
      );
      setDecryptedTexts(results);
    },
    [],
  );

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id, display_name").eq("auth_user_id", user.id).single();
      if (profile) {
        setProfileId(profile.id);
        setProfileName(profile.display_name);
        // Update last_seen_at
        await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
      }

      const { data: convo } = await supabase.from("conversations").select("name, type, is_encrypted, description").eq("id", conversationId).single();
      if (convo) {
        setConvoName(convo.name || convo.type.replace(/_/g, " "));
        setConvoType(convo.type);
        setConvoDescription(convo.description || "");
        setIsEncrypted(!!convo.is_encrypted);

        if (convo.is_encrypted) {
          try {
            const key = await getOrCreateConversationKey(conversationId);
            setCryptoKey(key);
          } catch {
            console.error("Failed to initialize encryption key");
          }
        }
      }

      // Load members
      if (profile) {
        const { data: memberRows } = await supabase
          .from("conversation_members")
          .select("profile_id")
          .eq("conversation_id", conversationId);

        if (memberRows) {
          const memberIds = memberRows.map(m => m.profile_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, last_seen_at")
            .in("id", memberIds);

          if (profiles) {
            setMembers(profiles.map(p => ({
              profile_id: p.id,
              display_name: p.display_name,
              last_seen_at: p.last_seen_at,
            })));
            const nameMap: Record<string, string> = {};
            profiles.forEach(p => { nameMap[p.id] = p.display_name; });
            setSenderNames(nameMap);
          }
        }
      }

      // Update last_read_at
      if (profile) {
        await supabase.from("conversation_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("profile_id", profile.id);
      }

      loadMessages();
    }
    init();
  }, [conversationId]);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    const msgs = (data as unknown as Message[]) || [];
    setMessages(msgs);

    // Fetch sender names for any new senders
    const unknownIds = msgs.map(m => m.sender_id).filter(id => !senderNames[id]);
    if (unknownIds.length > 0) {
      const uniqueIds = [...new Set(unknownIds)];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", uniqueIds);
      if (profiles) {
        setSenderNames(prev => {
          const updated = { ...prev };
          profiles.forEach(p => { updated[p.id] = p.display_name; });
          return updated;
        });
      }
    }

    if (!isScrolledUpRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      setNewMsgIndicator(true);
    }
  }

  // Decrypt whenever messages or cryptoKey change
  useEffect(() => {
    if (isEncrypted && cryptoKey && messages.length > 0) {
      decryptMessages(messages, cryptoKey);
    }
  }, [messages, cryptoKey, isEncrypted, decryptMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => { loadMessages(); }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => { loadMessages(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Typing indicator via Realtime Presence
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: profileId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const typing: string[] = [];
      Object.entries(state).forEach(([key, presences]) => {
        if (key !== profileId && Array.isArray(presences)) {
          const latest = presences[presences.length - 1] as { typing?: boolean; name?: string };
          if (latest?.typing) {
            typing.push(latest.name || key);
          }
        }
      });
      setTypingUsers(typing);
    });

    channel.subscribe();
    typingChannelRef.current = channel;

    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  function handleTyping() {
    if (!profileId || !typingChannelRef.current) return;
    typingChannelRef.current.track({ typing: true, name: profileName });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.track({ typing: false, name: profileName });
    }, 3000);
  }

  // Scroll tracking
  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isScrolledUpRef.current = !atBottom;
    setShowScrollBottom(!atBottom);
    if (atBottom) {
      setNewMsgIndicator(false);
      // Mark as read when scrolling to bottom
      if (profileId) {
        supabase.from("conversation_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("profile_id", profileId)
          .then(() => {});
      }
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgIndicator(false);
    setShowScrollBottom(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !profileId) return;
    setSending(true);

    if (isEncrypted && cryptoKey) {
      const ciphertext = await encrypt(newMsg.trim(), cryptoKey);
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profileId,
        message_type: "text" as const,
        reply_to_id: replyTo?.id || null,
        ciphertext,
        plaintext: null,
      });
    } else {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profileId,
        message_type: "text" as const,
        reply_to_id: replyTo?.id || null,
        plaintext: newMsg.trim(),
      });
    }

    // Update conversation last_message info
    await supabase.from("conversations").update({
      last_message_preview: isEncrypted ? "[Encrypted]" : newMsg.trim().substring(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    setNewMsg("");
    setReplyTo(null);
    setSending(false);
  }

  async function handleReaction(msgId: string, emoji: string) {
    if (!profileId) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const reactions: Reactions = (msg.reactions as Reactions) || {};
    const current = reactions[emoji] || [];

    if (current.includes(profileId)) {
      reactions[emoji] = current.filter(id => id !== profileId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...current, profileId];
    }

    await supabase.from("messages").update({ reactions: reactions as unknown as Json }).eq("id", msgId);
    setShowReactionsFor(null);
    loadMessages();
  }

  async function deleteMessage(msgId: string) {
    if (!profileId) return;
    await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", profileId);
    loadMessages();
  }

  async function leaveConversation() {
    if (!profileId) return;
    const confirmed = window.confirm("Are you sure you want to leave this conversation?");
    if (!confirmed) return;
    await supabase.from("conversation_members").delete()
      .eq("conversation_id", conversationId)
      .eq("profile_id", profileId);
    router.push("/messages");
  }

  // File upload error state
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadError(null);
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `messages/${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    const attachment: Attachment = {
      name: file.name,
      url: urlData.publicUrl,
      type: file.type,
      size: file.size,
    };

    const messageType = file.type.startsWith("image/") ? "image" : "file";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profileId,
      plaintext: file.name,
      message_type: messageType,
      attachments: [attachment] as unknown as Json,
    });

    await supabase.from("conversations").update({
      last_message_preview: `[${messageType === "image" ? "Image" : "File"}] ${file.name}`,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .ilike("plaintext", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    setSearchResults((data as unknown as Message[]) || []);
  }

  function scrollToMessage(msgId: string) {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-1", "ring-teal-500/50");
      setTimeout(() => el.classList.remove("ring-1", "ring-teal-500/50"), 2000);
    }
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  /** Get display text for a message */
  function displayText(msg: Message): string {
    if (msg.plaintext) return msg.plaintext;
    if (msg.ciphertext) {
      return decryptedTexts[msg.id] ?? "Decrypting...";
    }
    return "";
  }

  function getSenderName(senderId: string): string {
    return senderNames[senderId] || "Unknown";
  }

  // Should group: same sender, within 3 minutes, no reply
  function shouldGroup(msg: Message, prevMsg: Message | null): boolean {
    if (!prevMsg) return false;
    if (msg.sender_id !== prevMsg.sender_id) return false;
    if (msg.reply_to_id) return false;
    const diff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return diff < 3 * 60 * 1000;
  }

  // DM partner info
  const dmPartner = convoType === "dm" ? members.find(m => m.profile_id !== profileId) : null;
  const onlineCount = members.filter(m => isOnline(m.last_seen_at)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.8))] md:h-[calc(100vh-theme(spacing.12))] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-navy-700">
        <Link href="/messages" className="text-slate-400 hover:text-slate-300 text-sm shrink-0" aria-label="Back to messages">&larr;</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-slate-100 capitalize truncate">{convoName}</h1>
            {isEncrypted && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/25 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                  <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                </svg>
                E2E
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {convoType === "dm" && dmPartner
              ? formatLastSeen(dmPartner.last_seen_at)
              : `${members.length} members, ${onlineCount} online`}
          </p>
        </div>
        {convoType && convoType !== "dm" && (
          <button
            onClick={leaveConversation}
            className="px-2.5 py-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition-colors shrink-0"
            title="Leave conversation"
          >
            Leave
          </button>
        )}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-slate-400 hover:text-slate-300 rounded hover:bg-navy-800 transition-colors shrink-0"
          aria-label="Search messages"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* E2E encryption notice */}
      {isEncrypted && (
        <p className="text-[11px] text-amber-400/70 px-3 py-1">
          &#x26A0;&#xFE0F; E2E keys are stored locally in your browser. Messages cannot be read on other devices.
        </p>
      )}

      {/* Search panel */}
      {searchOpen && (
        <div className="border-b border-navy-700 p-3 bg-navy-900/50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search in conversation..."
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => scrollToMessage(r.id)}
                  className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-navy-800 rounded truncate">
                  <span className="text-teal-400">{getSenderName(r.sender_id)}</span>: {r.plaintext}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-3 py-1.5 text-xs text-slate-500 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.slice(0, 2).join(", ")}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} more` : ""} are typing...`}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-0.5 relative"
      >
        {messages.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No messages yet. Say something!</p>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === profileId;
          const grouped = shouldGroup(msg, messages[idx - 1] || null);
          const reactions: Reactions = (msg.reactions as Reactions) || {};
          const attachments: Attachment[] = (msg.attachments as Attachment[]) || [];
          const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`group flex ${isMine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-3"} transition-all`}
            >
              <div className={`max-w-[75%] ${grouped ? "" : ""}`}>
                {/* Reply quote */}
                {replyMsg && (
                  <button
                    onClick={() => scrollToMessage(replyMsg.id)}
                    className="flex items-center gap-1.5 mb-1 px-2.5 py-1 text-[11px] text-slate-400 bg-navy-800/50 border-l-2 border-teal-500/40 rounded-r cursor-pointer hover:text-slate-300"
                  >
                    <span className="text-teal-400 font-medium">{getSenderName(replyMsg.sender_id)}</span>
                    <span className="truncate">{displayText(replyMsg)}</span>
                  </button>
                )}

                <div className={`rounded-lg px-3 py-2 ${
                  isMine ? "bg-teal-500/20 border border-teal-500/30" : "bg-navy-800 border border-navy-700"
                }`}>
                  {!isMine && !grouped && (
                    <p className="text-xs text-teal-400 mb-0.5 font-medium">
                      {getSenderName(msg.sender_id)}
                    </p>
                  )}

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="mb-1.5">
                      {attachments.map((att, i) => (
                        att.type.startsWith("image/") ? (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={att.url} alt={att.name} className="max-w-full max-h-64 rounded" />
                          </a>
                        ) : (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2.5 py-1.5 bg-navy-900/50 rounded text-xs text-teal-400 hover:text-teal-300">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            {att.name}
                            <span className="text-slate-500">({Math.round(att.size / 1024)}KB)</span>
                          </a>
                        )
                      ))}
                    </div>
                  )}

                  {msg.message_type !== "image" && (
                    <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{displayText(msg)}</p>
                  )}

                  {!grouped && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                {/* Reactions display */}
                {Object.keys(reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                          users.includes(profileId || "")
                            ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                            : "bg-navy-800 border-navy-700 text-slate-400 hover:border-navy-600"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px]">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons on hover */}
                <div className={`hidden group-hover:flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-navy-800 transition-colors"
                    title="Reply"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionsFor(showReactionsFor === msg.id ? null : msg.id)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-navy-800 transition-colors"
                      title="React"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showReactionsFor === msg.id && (
                      <div className={`absolute bottom-full mb-1 flex gap-1 p-1.5 bg-navy-800 border border-navy-600 rounded-lg shadow-lg z-10 ${isMine ? "right-0" : "left-0"}`}>
                        {REACTION_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-navy-700 rounded text-sm transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-navy-800 transition-colors"
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom / new messages indicator */}
      {(showScrollBottom || newMsgIndicator) && (
        <div className="flex justify-center -mt-12 mb-2 relative z-10">
          <button
            onClick={scrollToBottom}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg transition-colors text-xs font-medium ${
              newMsgIndicator
                ? "bg-teal-500 text-navy-950"
                : "bg-navy-800 border border-navy-600 text-slate-300 hover:bg-navy-700"
            }`}
          >
            {newMsgIndicator ? "New messages" : "Scroll to bottom"}
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-navy-800 border-t border-navy-700 text-xs">
          <div className="flex-1 min-w-0 border-l-2 border-teal-500/40 pl-2">
            <span className="text-teal-400 font-medium">{getSenderName(replyTo.sender_id)}</span>
            <p className="text-slate-400 truncate">{displayText(replyTo)}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-red-400 shrink-0" aria-label="Cancel reply">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border-t border-red-500/20">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400/60 hover:text-red-400 ml-2" aria-label="Dismiss">&times;</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-3 border-t border-navy-700">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-2.5 py-2.5 text-slate-400 hover:text-slate-300 hover:bg-navy-800 rounded transition-colors disabled:opacity-50 shrink-0"
          aria-label="Attach file"
        >
          {uploading ? (
            <svg width="18" height="18" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M6.34 6.34L3.51 3.51" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => { setNewMsg(e.target.value); handleTyping(); }}
          placeholder={isEncrypted ? "Type an encrypted message..." : "Type a message..."}
          aria-label="Message text"
          className="flex-1 px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button type="submit" disabled={sending || !newMsg.trim()}
          aria-label="Send message"
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
