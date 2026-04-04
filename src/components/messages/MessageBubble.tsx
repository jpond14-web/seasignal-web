"use client";

import Image from "next/image";
import type { Message, Reactions, Attachment } from "./types";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

type MessageBubbleProps = {
  message: Message;
  profileId: string | null;
  isAdmin: boolean;
  senderName: string;
  isGrouped: boolean;
  blockedIds: Set<string>;
  onReply: (msg: Message) => void;
  onReact: (msgId: string, emoji: string) => void;
  onDelete: (msgId: string, adminOverride?: boolean) => void;
  onEdit: (msg: Message) => void;
  onReport: (msgId: string) => void;
  onBlock: (targetId: string) => void;
  displayText: (msg: Message) => string;
  linkify: (text: string) => React.ReactNode;
  getSenderName: (senderId: string) => string;
  scrollToMessage: (msgId: string) => void;
  replyMsg: Message | null;
  isMyLastMsg: boolean;
  readByNames: string[];
  showReactionsFor: string | null;
  setShowReactionsFor: (msgId: string | null) => void;
};

export default function MessageBubble({
  message: msg,
  profileId,
  isAdmin,
  senderName,
  isGrouped,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onReport,
  onBlock,
  displayText,
  linkify,
  getSenderName,
  scrollToMessage,
  replyMsg,
  isMyLastMsg,
  readByNames,
  showReactionsFor,
  setShowReactionsFor,
}: MessageBubbleProps) {
  const isMine = msg.sender_id === profileId;
  const reactions: Reactions = (msg.reactions as Reactions) || {};
  const attachments: Attachment[] = (msg.attachments as Attachment[]) || [];

  return (
    <div
      id={`msg-${msg.id}`}
      className={`group flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"} transition-all`}
    >
      <div className="max-w-[75%]">
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
          {!isMine && !isGrouped && (
            <p className="text-xs text-teal-400 mb-0.5 font-medium">
              {senderName}
            </p>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-1.5">
              {attachments.map((att, i) => (
                att.type.startsWith("image/") ? (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Image src={att.url} alt={att.name} width={400} height={256} className="max-w-full max-h-64 rounded object-contain" unoptimized />
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
            <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{linkify(displayText(msg))}</p>
          )}

          {!isGrouped && (
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {msg.edited_at && (
                <span className="ml-1 text-slate-500/70 italic" title={`Edited ${new Date(msg.edited_at).toLocaleString()}`}>(edited)</span>
              )}
              {msg.expires_at && (
                <span className="inline-flex items-center gap-0.5 ml-1 text-amber-400/70" title={`Expires ${new Date(msg.expires_at).toLocaleString()}`}>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </p>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
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
            onClick={() => onReply(msg)}
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
                    onClick={() => onReact(msg.id, emoji)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-navy-700 rounded text-sm transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isMine ? (
            <>
              {msg.message_type === "text" && (
                <button
                  onClick={() => onEdit(msg)}
                  className="p-1 text-slate-500 hover:text-teal-400 rounded hover:bg-navy-800 transition-colors"
                  title="Edit"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onDelete(msg.id)}
                className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-navy-800 transition-colors"
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onReport(msg.id)}
                className="p-1 text-slate-500 hover:text-amber-400 rounded hover:bg-navy-800 transition-colors"
                title="Report"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onBlock(msg.sender_id)}
                className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-navy-800 transition-colors"
                title="Block user"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </button>
              {isAdmin && (
                <button
                  onClick={() => onDelete(msg.id, true)}
                  className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-navy-800 transition-colors"
                  title="Delete (Admin)"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Read receipts — only on the current user's last message */}
        {isMyLastMsg && readByNames.length > 0 && (
          <div className="flex items-center gap-1 mt-1 justify-end">
            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className="text-teal-400 shrink-0">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-slate-500">
              Read by {readByNames.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
