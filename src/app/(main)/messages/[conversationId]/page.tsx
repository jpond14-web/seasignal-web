"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { Json } from "@/lib/supabase/types";
import type { Message, Reactions, MemberProfile } from "@/components/messages/types";
import { logAdminAction } from "@/lib/auditLog";
import ConversationHeader from "@/components/messages/ConversationHeader";
import MessageSearch from "@/components/messages/MessageSearch";
import MessageBubble from "@/components/messages/MessageBubble";
import MessageInput from "@/components/messages/MessageInput";
import ReportModal from "@/components/messages/ReportModal";

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [convoName, setConvoName] = useState("");
  const [convoType, setConvoType] = useState("");
  const [convoDescription, setConvoDescription] = useState("");
  const [members, setMembers] = useState<MemberProfile[]>([]);

  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Edit state
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);

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
  const [uploading, setUploading] = useState(false);

  // Sender name cache
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  // Report message
  const [reportingMsg, setReportingMsg] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Block user
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // File upload error state
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id, display_name, is_admin").eq("auth_user_id", user.id).single();
      if (profile) {
        setProfileId(profile.id);
        setProfileName(profile.display_name);
        setIsAdmin(!!profile.is_admin);
        // Update last_seen_at
        await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
      }

      // Verify membership before loading anything
      if (profile) {
        const { data: membership } = await supabase
          .from("conversation_members")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("profile_id", profile.id)
          .single();

        if (!membership) {
          router.push("/messages");
          return;
        }

        // Load blocked users
        const { data: blocks } = await supabase
          .from("user_blocks")
          .select("blocked_id")
          .eq("blocker_id", profile.id);
        if (blocks) {
          setBlockedIds(new Set(blocks.map(b => b.blocked_id)));
        }
      }

      const { data: convo } = await supabase.from("conversations").select("name, type, description").eq("id", conversationId).single();
      if (convo) {
        setConvoName(convo.name || convo.type.replace(/_/g, " "));
        setConvoType(convo.type);
        setConvoDescription(convo.description || "");
      }

      // Load members with last_read_at for read receipts
      if (profile) {
        const { data: memberRows } = await supabase
          .from("conversation_members")
          .select("profile_id, last_read_at")
          .eq("conversation_id", conversationId);

        if (memberRows) {
          const memberIds = memberRows.map(m => m.profile_id);
          const readAtMap = new Map(memberRows.map(m => [m.profile_id, m.last_read_at]));
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, last_seen_at")
            .in("id", memberIds);

          if (profiles) {
            setMembers(profiles.map(p => ({
              profile_id: p.id,
              display_name: p.display_name,
              last_seen_at: p.last_seen_at,
              last_read_at: readAtMap.get(p.id) ?? null,
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

  // Offline draft resend: when connectivity is restored, retry any saved drafts
  useEffect(() => {
    function handleOnline() {
      if (!profileId) return;
      const storageKey = `drafts_${conversationId}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const drafts: Array<{ text: string; timestamp: number }> = JSON.parse(raw);
      if (drafts.length === 0) return;
      localStorage.removeItem(storageKey);
      (async () => {
        for (const draft of drafts) {
          const { error } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: profileId,
            message_type: "text" as const,
            plaintext: draft.text,
          });
          if (error) {
            const remaining: Array<{ text: string; timestamp: number }> = JSON.parse(
              localStorage.getItem(storageKey) || "[]",
            );
            remaining.push(draft);
            localStorage.setItem(storageKey, JSON.stringify(remaining));
          }
        }
        showToast("Offline messages sent.", "success");
        loadMessages();
      })();
    }
    window.addEventListener("online", handleOnline);
    if (navigator.onLine && profileId) handleOnline();
    return () => window.removeEventListener("online", handleOnline);
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

  function startEdit(msg: Message) {
    setEditingMsg(msg);
    setNewMsg(displayText(msg));
    setReplyTo(null);
  }

  function cancelEdit() {
    setEditingMsg(null);
    setNewMsg("");
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !profileId) return;
    setSending(true);

    // Edit mode
    if (editingMsg) {
      const { error } = await supabase
        .from("messages")
        .update({ plaintext: newMsg.trim(), edited_at: new Date().toISOString() })
        .eq("id", editingMsg.id)
        .eq("sender_id", profileId);

      if (error) {
        showToast(error.message, "error");
        setSending(false);
        return;
      }

      setEditingMsg(null);
      setNewMsg("");
      setSending(false);
      loadMessages();
      return;
    }

    let insertError: { message: string } | null = null;
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profileId,
        message_type: "text" as const,
        reply_to_id: replyTo?.id || null,
        plaintext: newMsg.trim(),
      });
      insertError = error;
    } catch (networkErr: unknown) {
      // Network error (offline) -- save draft for retry when back online
      if (networkErr instanceof TypeError || !navigator.onLine) {
        const storageKey = `drafts_${conversationId}`;
        const drafts: Array<{ text: string; timestamp: number }> = JSON.parse(
          localStorage.getItem(storageKey) || "[]",
        );
        drafts.push({ text: newMsg.trim(), timestamp: Date.now() });
        localStorage.setItem(storageKey, JSON.stringify(drafts));
        showToast("Saved offline. Will retry when connected.", "success");
        setNewMsg("");
        setReplyTo(null);
        setSending(false);
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => {
              // Background Sync API for message retry
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (reg as any).sync?.register("send-messages");
            })
            .catch(() => { /* sync not supported */ });
        }
        return;
      }
      throw networkErr;
    }

    if (insertError) {
      const msg = insertError.message.includes("Rate limit")
        ? "You're sending messages too fast. Please wait a moment."
        : insertError.message;
      showToast(msg, "error");
      setSending(false);
      return;
    }

    await supabase.from("conversations").update({
      last_message_preview: newMsg.trim().substring(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    // Fire push notifications for other conversation members (background, non-blocking)
    const otherMembers = members.filter(m => m.profile_id !== profileId);
    const preview = newMsg.trim().substring(0, 100);
    for (const member of otherMembers) {
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: member.profile_id,
          title: profileName || "New message",
          body: preview,
          url: `/messages/${conversationId}`,
        }),
      }).catch(() => {
        // Best-effort — don't block on push failures
      });
    }

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

  async function deleteMessage(msgId: string, adminOverride?: boolean) {
    if (!profileId) return;
    const confirmText = adminOverride ? "Delete this message as admin?" : "Delete this message?";
    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;
    if (adminOverride && isAdmin) {
      await supabase.from("messages").delete().eq("id", msgId);
      await logAdminAction(profileId, "delete_message", "message", msgId, {
        conversation_id: conversationId,
      });
    } else {
      await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", profileId);
    }
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

  async function reportMessage(msgId: string) {
    if (!profileId || !reportReason.trim()) return;
    await supabase
      .from("reported_content")
      .insert({
        reporter_id: profileId,
        content_type: "message",
        content_id: msgId,
        reason: reportReason.trim(),
      });
    setReportingMsg(null);
    setReportReason("");
    showToast("Message reported. Our team will review it. Thank you.");
  }

  async function blockUser(targetId: string) {
    if (!profileId || targetId === profileId) return;
    const confirmed = window.confirm("Block this user? You won't see their messages.");
    if (!confirmed) return;
    const { data: existing } = await supabase
      .from("user_blocks")
      .select("id")
      .eq("blocker_id", profileId)
      .eq("blocked_id", targetId)
      .single();
    if (!existing) {
      await supabase.from("user_blocks").insert({
        blocker_id: profileId,
        blocked_id: targetId,
      });
    }
    setBlockedIds(prev => new Set([...prev, targetId]));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("File type not allowed. Upload images, PDFs, or Word documents.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `messages/${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from("attachments")
      .upload(filePath, file);

    if (uploadErr) {
      setUploadError(uploadErr.message || "Failed to upload file. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    const attachment = {
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
    return msg.plaintext || "";
  }

  /** Wrap URLs in clickable links */
  function linkify(text: string): React.ReactNode {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">{part}</a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
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

  // Find the current user's last message ID for read receipts
  const myLastMessageId = profileId
    ? [...messages].reverse().find(m => m.sender_id === profileId && !blockedIds.has(m.sender_id))?.id ?? null
    : null;

  // Compute read-by names for the user's last message
  function getReadByNames(msgCreatedAt: string): string[] {
    if (!profileId) return [];
    return members
      .filter(m =>
        m.profile_id !== profileId &&
        m.last_read_at &&
        m.last_read_at >= msgCreatedAt
      )
      .map(m => m.display_name);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.8))] md:h-[calc(100vh-theme(spacing.12))] max-w-3xl mx-auto">
      {/* Header */}
      <ConversationHeader
        name={convoName}
        type={convoType}
        description={convoDescription}
        members={members}
        profileId={profileId}
        onLeave={leaveConversation}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
      />

      {/* Search panel */}
      <MessageSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        results={searchResults}
        onSelectResult={scrollToMessage}
        searchQuery={searchQuery}
        getSenderName={getSenderName}
      />

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
        {messages.filter(msg => !blockedIds.has(msg.sender_id) && !(msg.expires_at && new Date(msg.expires_at) < new Date())).map((msg, idx) => {
          const isMyLastMsg = msg.sender_id === profileId && msg.id === myLastMessageId;
          const grouped = shouldGroup(msg, messages[idx - 1] || null);
          const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
          const readByNames = isMyLastMsg ? getReadByNames(msg.created_at) : [];

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              profileId={profileId}
              isAdmin={isAdmin}
              senderName={getSenderName(msg.sender_id)}
              isGrouped={grouped}
              blockedIds={blockedIds}
              onReply={setReplyTo}
              onReact={handleReaction}
              onDelete={deleteMessage}
              onEdit={startEdit}
              onReport={(msgId) => setReportingMsg(msgId)}
              onBlock={blockUser}
              displayText={displayText}
              linkify={linkify}
              getSenderName={getSenderName}
              scrollToMessage={scrollToMessage}
              replyMsg={replyMsg ?? null}
              isMyLastMsg={isMyLastMsg}
              readByNames={readByNames}
              showReactionsFor={showReactionsFor}
              setShowReactionsFor={setShowReactionsFor}
            />
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

      {/* Report modal */}
      <ReportModal
        isOpen={!!reportingMsg}
        onClose={() => { setReportingMsg(null); setReportReason(""); }}
        onSubmit={() => reportingMsg && reportMessage(reportingMsg)}
        reason={reportReason}
        onReasonChange={setReportReason}
      />

      {/* Message input area */}
      <MessageInput
        value={newMsg}
        onChange={setNewMsg}
        onSubmit={sendMessage}
        onFileUpload={handleFileUpload}
        replyTo={replyTo}
        editingMsg={editingMsg}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={cancelEdit}
        sending={sending}
        uploading={uploading}
        onTyping={handleTyping}
        uploadError={uploadError}
        onDismissUploadError={() => setUploadError(null)}
        displayText={displayText}
        getSenderName={getSenderName}
      />
    </div>
  );
}
