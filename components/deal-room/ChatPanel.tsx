// =============================================================================
// MIDDLEMAN.COM — DEAL ROOM (Encrypted Real-Time Chat)
// Path: @/components/deal-room/ChatPanel.tsx
// Messages are immutable (no update/delete policy exists on deal_messages —
// see 002_rls_policies.sql) — this is an append-only audit-safe chat log.
// =============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatPanelProps, DealMessage } from "@/types";

export default function ChatPanel({ dealRoomId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadMessages() {
      const { data } = await supabase
        .from("deal_messages")
        .select("*")
        .eq("deal_room_id", dealRoomId)
        .order("created_at", { ascending: true });

      if (!cancelled && data) setMessages(data as DealMessage[]);
    }

    loadMessages();

    const channel = supabase
      .channel(`deal_room_chat_${dealRoomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_room_id=eq.${dealRoomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DealMessage]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dealRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;

    const supabase = createClient();
    const text = draft;
    setDraft("");

    await supabase.from("deal_messages").insert({
      deal_room_id: dealRoomId,
      sender_id: currentUserId,
      message_text: text,
    });
  }

  return (
    <div
      className="flex h-[500px] flex-col rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[70%] rounded-lg px-3 py-2 text-sm"
                style={{
                  background: isMine ? "var(--accent)" : "var(--bg)",
                  color: isMine ? "#ffffff" : "var(--text-primary)",
                }}
              >
                {msg.message_text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t p-3" style={{ borderColor: "var(--border)" }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the deal room…"
          className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          type="submit"
          className="flex items-center justify-center rounded-lg px-4 text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
