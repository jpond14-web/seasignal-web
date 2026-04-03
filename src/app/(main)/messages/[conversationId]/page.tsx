"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  plaintext: string | null;
  message_type: string;
  created_at: string;
  profiles?: { display_name: string } | null;
};

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [convoName, setConvoName] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (profile) setProfileId(profile.id);

      const { data: convo } = await supabase.from("conversations").select("name, type").eq("id", conversationId).single();
      if (convo) setConvoName(convo.name || convo.type.replace(/_/g, " "));

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
    setMessages((data as unknown as Message[]) || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => { loadMessages(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !profileId) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profileId,
      plaintext: newMsg.trim(),
      message_type: "text",
    });

    setNewMsg("");
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.8))] md:h-[calc(100vh-theme(spacing.12))] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-navy-700">
        <Link href="/messages" className="text-slate-400 hover:text-slate-300 text-sm">&larr;</Link>
        <h1 className="font-semibold text-slate-100 capitalize">{convoName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No messages yet. Say something!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === profileId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                isMine ? "bg-teal-500/20 border border-teal-500/30" : "bg-navy-800 border border-navy-700"
              }`}>
                {!isMine && (
                  <p className="text-xs text-teal-400 mb-0.5">
                    {msg.profiles?.display_name || "Unknown"}
                  </p>
                )}
                <p className="text-sm text-slate-200">{msg.plaintext}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-navy-700">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button type="submit" disabled={sending || !newMsg.trim()}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}
