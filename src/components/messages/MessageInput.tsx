"use client";

import { useRef } from "react";
import type { Message } from "./types";

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  replyTo: Message | null;
  editingMsg: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  sending: boolean;
  uploading: boolean;
  isEncrypted: boolean;
  onTyping: () => void;
  uploadError: string | null;
  onDismissUploadError: () => void;
  displayText: (msg: Message) => string;
  getSenderName: (senderId: string) => string;
};

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  replyTo,
  editingMsg,
  onCancelReply,
  onCancelEdit,
  sending,
  uploading,
  isEncrypted,
  onTyping,
  uploadError,
  onDismissUploadError,
  displayText,
  getSenderName,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-navy-800 border-t border-navy-700 text-xs">
          <div className="flex-1 min-w-0 border-l-2 border-teal-500/40 pl-2">
            <span className="text-teal-400 font-medium">{getSenderName(replyTo.sender_id)}</span>
            <p className="text-slate-400 truncate">{displayText(replyTo)}</p>
          </div>
          <button onClick={onCancelReply} className="text-slate-500 hover:text-red-400 shrink-0" aria-label="Cancel reply">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Editing banner */}
      {editingMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-navy-900 border-t border-teal-500/30 text-xs">
          <div className="flex-1 min-w-0 border-l-2 border-teal-500 pl-2">
            <span className="text-teal-400 font-medium">Editing message</span>
            <p className="text-slate-400 truncate">{displayText(editingMsg)}</p>
          </div>
          <button onClick={onCancelEdit} className="text-slate-500 hover:text-red-400 shrink-0" aria-label="Cancel edit">
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
          <button onClick={onDismissUploadError} className="text-red-400/60 hover:text-red-400 ml-2" aria-label="Dismiss">&times;</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} className="flex gap-2 pt-3 border-t border-navy-700">
        <input type="file" ref={fileInputRef} onChange={onFileUpload} className="hidden" />
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
          value={value}
          onChange={(e) => { onChange(e.target.value); onTyping(); }}
          placeholder={editingMsg ? "Edit your message..." : isEncrypted ? "Type an encrypted message..." : "Type a message..."}
          aria-label={editingMsg ? "Edit message text" : "Message text"}
          className={`flex-1 px-3 py-2.5 bg-navy-800 border rounded text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none ${
            editingMsg ? "border-teal-500/50 focus:border-teal-500" : "border-navy-600 focus:border-teal-500"
          }`}
          onKeyDown={(e) => { if (e.key === "Escape" && editingMsg) onCancelEdit(); }}
        />
        <button type="submit" disabled={sending || !value.trim()}
          aria-label={editingMsg ? "Save edit" : "Send message"}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors shrink-0">
          {editingMsg ? "Save" : "Send"}
        </button>
      </form>
    </>
  );
}
