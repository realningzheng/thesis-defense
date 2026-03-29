import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { MessageSquare, Send, ArrowLeft, ChevronRight, Bot, User, Clock } from "lucide-react";

const C = {
  charcoal: "#2d2d2d", gray: "#888", lightGray: "#f5f5f5", border: "#e0e0e0",
  blue: "#3A7CA5", green: "#5A8F5C", botBg: "#f0f7ff",
};

/* ─── Helper: call bot API ─── */
async function triggerBot(threadId, mode) {
  try {
    await fetch("/api/bot-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, mode }),
    });
  } catch (e) {
    console.error("Bot trigger failed:", e);
  }
}

/* ─── Time formatting ─── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ═══════════════════════════════════════
   THREAD LIST VIEW
   ═══════════════════════════════════════ */
function ThreadList({ threads, onOpenThread, onNewThread, userName }) {
  const [newQ, setNewQ] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    const q = newQ.trim();
    if (!q || posting) return;
    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("threads")
        .insert({ question: q, user_name: userName })
        .select()
        .single();

      if (error) throw error;

      setNewQ("");
      // Trigger immediate bot reply for new thread
      triggerBot(data.id, "immediate");
    } catch (e) {
      console.error("Error posting question:", e);
    }
    setPosting(false);
  };

  return (
    <div>
      {/* New question input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={newQ}
          onChange={e => setNewQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handlePost()}
          placeholder="Ask a question about the thesis..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e0e0e0",
            fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
        />
        <button onClick={handlePost} disabled={!newQ.trim() || posting}
          style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: newQ.trim() ? C.charcoal : "#ddd", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: newQ.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
          }}>
          <Send size={14} /> Post
        </button>
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>
          No questions yet. Be the first to ask!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {threads.map(t => (
            <div key={t.id} onClick={() => onOpenThread(t)}
              style={{
                padding: "14px 16px", borderRadius: 10, border: "1px solid #eee",
                cursor: "pointer", transition: "all 0.2s", background: "#fff",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.charcoal, lineHeight: 1.5, fontWeight: 500 }}>{t.question}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>{t.user_name}</span>
                    <span style={{ fontSize: 10, color: "#bbb" }}>{timeAgo(t.created_at)}</span>
                    {t.bot_replied && (
                      <span style={{ fontSize: 10, color: C.green, display: "flex", alignItems: "center", gap: 2 }}>
                        <Bot size={10} /> replied
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color="#ccc" style={{ marginTop: 2, flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   THREAD DETAIL VIEW
   ═══════════════════════════════════════ */
function ThreadDetail({ thread, onBack, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const messagesEndRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch messages and subscribe to realtime
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`thread-${thread.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${thread.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [thread.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Post a follow-up message in the thread
  const handlePost = async () => {
    const msg = newMsg.trim();
    if (!msg || posting) return;
    setPosting(true);
    try {
      await supabase.from("messages").insert({
        thread_id: thread.id,
        user_name: userName,
        content: msg,
        is_bot: false,
      });

      // Update debounce tracker
      await supabase.from("thread_debounce").upsert({
        thread_id: thread.id,
        last_human_message_at: new Date().toISOString(),
        bot_pending: true,
      });

      setNewMsg("");

      // Client-side debounce: trigger bot after 1 minute of no new messages
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        triggerBot(thread.id, "debounced");
      }, 65000); // 65s to give server-side check margin
    } catch (e) {
      console.error("Error posting message:", e);
    }
    setPosting(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#666" }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, lineHeight: 1.4 }}>{thread.question}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            Asked by <span style={{ color: C.blue, fontWeight: 600 }}>{thread.user_name}</span> &middot; {timeAgo(thread.created_at)}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 12, maxHeight: 400 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#bbb", fontSize: 12 }}>
            <Clock size={16} style={{ marginBottom: 4 }} />
            <div>Ning is typing a response...</div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: m.is_bot ? C.green : C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.is_bot ? <Bot size={14} color="#fff" /> : <User size={14} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.is_bot ? C.green : C.blue }}>{m.user_name}</span>
                {m.is_bot && <span style={{ fontSize: 9, background: `${C.green}15`, color: C.green, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>BOT</span>}
                <span style={{ fontSize: 10, color: "#bbb" }}>{timeAgo(m.created_at)}</span>
              </div>
              <div style={{
                fontSize: 13, color: "#333", lineHeight: 1.65,
                padding: "10px 14px", borderRadius: "2px 10px 10px 10px",
                background: m.is_bot ? C.botBg : "#f5f5f5",
                border: `1px solid ${m.is_bot ? "#d6e8f7" : "#eee"}`,
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #eee" }}>
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handlePost()}
          placeholder="Ask a follow-up question..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e0e0e0",
            fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
        />
        <button onClick={handlePost} disabled={!newMsg.trim() || posting}
          style={{
            padding: "10px 14px", borderRadius: 8, border: "none",
            background: newMsg.trim() ? C.charcoal : "#ddd", color: "#fff",
            cursor: newMsg.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center",
          }}>
          <Send size={14} />
        </button>
      </div>
      <div style={{ fontSize: 10, color: "#bbb", marginTop: 6, fontStyle: "italic" }}>
        Ning replies to follow-up questions after a 1-minute pause
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN CHAT ROOM COMPONENT
   ═══════════════════════════════════════ */
export default function ChatRoom({ userName }) {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  // Fetch threads and subscribe to realtime
  useEffect(() => {
    const fetchThreads = async () => {
      const { data } = await supabase
        .from("threads")
        .select("*")
        .order("created_at", { ascending: false });
      setThreads(data || []);
    };
    fetchThreads();

    const channel = supabase
      .channel("threads-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "threads" },
        (payload) => {
          setThreads(prev => [payload.new, ...prev]);
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "threads" },
        (payload) => {
          setThreads(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div>
      {activeThread ? (
        <ThreadDetail
          thread={activeThread}
          onBack={() => setActiveThread(null)}
          userName={userName}
        />
      ) : (
        <ThreadList
          threads={threads}
          onOpenThread={setActiveThread}
          userName={userName}
        />
      )}
    </div>
  );
}
