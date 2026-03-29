import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { MessageSquare, Send, ArrowLeft, ChevronRight, Bot, User, Clock, X, Minus } from "lucide-react";

const C = {
  charcoal: "#2d2d2d", gray: "#888", lightGray: "#f5f5f5", border: "#e0e0e0",
  blue: "#3A7CA5", green: "#5A8F5C", botBg: "#f0f7ff",
  sidebar: "#1a1a2e", sidebarHover: "#252540", sidebarActive: "#2f2f4a",
  accent: "#3A7CA5",
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
   THREAD LIST (sidebar panel)
   ═══════════════════════════════════════ */
function ThreadList({ threads, activeThreadId, onOpenThread, userName }) {
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
      triggerBot(data.id, "immediate");
    } catch (e) {
      console.error("Error posting question:", e);
    }
    setPosting(false);
  };

  return (
    <div style={{
      width: 220, background: C.sidebar, display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <MessageSquare size={14} /> Thesis Q&A
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{threads.length} thread{threads.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px" }}>
        {threads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 8px", color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
            No questions yet
          </div>
        ) : (
          threads.map(t => (
            <div key={t.id} onClick={() => onOpenThread(t)}
              style={{
                padding: "8px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 2,
                transition: "background 0.15s",
                background: activeThreadId === t.id ? C.sidebarActive : "transparent",
              }}
              onMouseEnter={e => { if (activeThreadId !== t.id) e.currentTarget.style.background = C.sidebarHover; }}
              onMouseLeave={e => { if (activeThreadId !== t.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                fontSize: 12, color: activeThreadId === t.id ? "#fff" : "rgba(255,255,255,0.7)",
                lineHeight: 1.4, fontWeight: activeThreadId === t.id ? 600 : 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{t.question}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{t.user_name}</span>
                {t.bot_replied && (
                  <span style={{ fontSize: 9, color: C.green, display: "flex", alignItems: "center", gap: 2 }}>
                    <Bot size={8} /> replied
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New question input */}
      <div style={{ padding: "8px 8px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePost()}
            placeholder="Ask a question..."
            style={{
              flex: 1, padding: "7px 10px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)",
              fontSize: 11, outline: "none", fontFamily: "inherit",
              color: "#fff",
            }}
          />
          <button onClick={handlePost} disabled={!newQ.trim() || posting}
            style={{
              padding: "7px 10px", borderRadius: 6, border: "none",
              background: newQ.trim() ? C.accent : "rgba(255,255,255,0.06)",
              color: "#fff", cursor: newQ.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", transition: "all 0.15s",
              opacity: newQ.trim() ? 1 : 0.4,
            }}>
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MESSAGE PANEL (main chat area)
   ═══════════════════════════════════════ */
function MessagePanel({ thread, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const messagesEndRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!thread) return;

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
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      await supabase.from("thread_debounce").upsert({
        thread_id: thread.id,
        last_human_message_at: new Date().toISOString(),
        bot_pending: true,
      });

      setNewMsg("");

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        triggerBot(thread.id, "debounced");
      }, 65000);
    } catch (e) {
      console.error("Error posting message:", e);
    }
    setPosting(false);
  };

  if (!thread) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#bbb", fontSize: 13, flexDirection: "column", gap: 8,
      }}>
        <MessageSquare size={28} strokeWidth={1.2} color="#ddd" />
        <div>Select a thread or ask a question</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Thread header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #eee",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.charcoal, lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{thread.question}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>
            <span style={{ color: C.blue, fontWeight: 600 }}>{thread.user_name}</span> &middot; {timeAgo(thread.created_at)}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#bbb", fontSize: 12 }}>
            <Clock size={16} style={{ marginBottom: 4 }} />
            <div>Ning is typing a response...</div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: m.is_bot ? C.green : C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.is_bot ? <Bot size={13} color="#fff" /> : <User size={13} color="#fff" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.is_bot ? C.green : C.charcoal }}>{m.user_name}</span>
                {m.is_bot && <span style={{ fontSize: 9, background: `${C.green}15`, color: C.green, padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>BOT</span>}
                <span style={{ fontSize: 10, color: "#bbb" }}>{timeAgo(m.created_at)}</span>
              </div>
              <div style={{
                fontSize: 13, color: "#333", lineHeight: 1.6,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div style={{ padding: "10px 16px 12px", borderTop: "1px solid #eee", flexShrink: 0 }}>
        <div style={{
          display: "flex", gap: 8, padding: "6px 6px 6px 14px",
          border: "1.5px solid #e0e0e0", borderRadius: 8,
          background: "#fff", alignItems: "center",
          transition: "border-color 0.15s",
        }}>
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePost()}
            placeholder="Reply..."
            style={{
              flex: 1, padding: "6px 0", border: "none",
              fontSize: 13, outline: "none", fontFamily: "inherit",
              background: "transparent",
            }}
          />
          <button onClick={handlePost} disabled={!newMsg.trim() || posting}
            style={{
              padding: "6px 10px", borderRadius: 6, border: "none",
              background: newMsg.trim() ? C.charcoal : "#eee",
              color: "#fff", cursor: newMsg.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", transition: "all 0.15s",
            }}>
            <Send size={13} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#bbb", marginTop: 4, paddingLeft: 2 }}>
          Ning replies to follow-ups after a 1-minute pause
        </div>
      </div>
    </div>
  );
}

/* ─── Draggable position hook ─── */
function useDrag(initialPos) {
  const [pos, setPos] = useState(initialPos);
  const dragState = useRef(null);

  const onPointerDown = (e) => {
    // ignore clicks on buttons/inputs inside the drag handle
    if (e.target.closest("button, input, a")) return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
      moved: false,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 60, dragState.current.startPosX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, dragState.current.startPosY + dy)),
    });
  };

  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    const wasDrag = dragState.current?.moved;
    dragState.current = null;
    return wasDrag;
  };

  // returns true if the last interaction was a drag (suppress click)
  const wasDragged = () => dragState.current?.moved;

  return { pos, setPos, onPointerDown, wasDragged };
}

/* ═══════════════════════════════════════
   FLOATING CHAT WIDGET
   ═══════════════════════════════════════ */
export default function ChatRoom({ userName }) {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevThreadCountRef = useRef(0);
  const isOpenRef = useRef(isOpen);
  const isMinimizedRef = useRef(isMinimized);
  useEffect(() => {
    isOpenRef.current = isOpen;
    isMinimizedRef.current = isMinimized;
  }, [isOpen, isMinimized]);

  const { pos, onPointerDown, wasDragged } = useDrag({
    x: typeof window !== "undefined" ? window.innerWidth - 76 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 76 : 0,
  });
  const suppressClick = useRef(false);

  // Fetch threads and subscribe to realtime
  useEffect(() => {
    const fetchThreads = async () => {
      const { data } = await supabase
        .from("threads")
        .select("*")
        .order("created_at", { ascending: false });
      setThreads(data || []);
      prevThreadCountRef.current = (data || []).length;
    };
    fetchThreads();

    const channel = supabase
      .channel("threads-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "threads" },
        (payload) => {
          setThreads(prev => [payload.new, ...prev]);
          if (!isOpenRef.current || isMinimizedRef.current) {
            setUnreadCount(c => c + 1);
          }
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

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveThread(null);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Floating Action Button (collapsed state)
  if (!isOpen) {
    return (
      <div
        onPointerDown={(e) => {
          onPointerDown(e);
          suppressClick.current = false;
          const onUp = () => {
            suppressClick.current = wasDragged();
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointerup", onUp);
        }}
        onClick={() => { if (!suppressClick.current) handleOpen(); }}
        aria-label="Open Q&A chat"
        style={{
          position: "fixed", left: pos.x, top: pos.y, zIndex: 900,
          width: 52, height: 52, borderRadius: 16, border: "none",
          background: C.sidebar, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "grab", boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)",
          touchAction: "none", userSelect: "none",
        }}
      >
        <MessageSquare size={22} />
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            width: 20, height: 20, borderRadius: "50%",
            background: "#e74c3c", color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>
    );
  }

  // Minimized bar
  if (isMinimized) {
    return (
      <div
        onPointerDown={(e) => {
          onPointerDown(e);
          suppressClick.current = false;
          const onUp = () => {
            suppressClick.current = wasDragged();
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointerup", onUp);
        }}
        onClick={() => { if (!suppressClick.current) handleRestore(); }}
        style={{
          position: "fixed", left: pos.x, top: pos.y, zIndex: 900,
          width: 280, padding: "10px 14px", borderRadius: 12,
          background: C.sidebar, color: "#fff", cursor: "grab",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 8,
          touchAction: "none", userSelect: "none",
        }}
      >
        <MessageSquare size={14} />
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Thesis Q&A</span>
        {unreadCount > 0 && (
          <span style={{
            background: "#e74c3c", padding: "1px 6px", borderRadius: 8,
            fontSize: 10, fontWeight: 700,
          }}>{unreadCount}</span>
        )}
        <X size={14} style={{ opacity: 0.5 }} onClick={e => { e.stopPropagation(); handleClose(); }} />
      </div>
    );
  }

  // Full floating panel — anchor to bottom-left corner of the panel
  const panelLeft = Math.max(0, Math.min(pos.x, window.innerWidth - 640));
  const panelTop = Math.max(0, Math.min(pos.y - 520 + 52, window.innerHeight - 520));

  return (
    <div style={{
      position: "fixed", left: panelLeft, top: panelTop, zIndex: 900,
      width: 640, height: 520,
      borderRadius: 14, overflow: "hidden",
      background: "#fff",
      boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column",
      animation: "chatWidgetIn 0.2s ease-out",
    }}>
      {/* Title bar — drag handle */}
      <div
        onPointerDown={onPointerDown}
        style={{
          display: "flex", alignItems: "center", padding: "0 4px 0 0",
          background: C.sidebar, flexShrink: 0,
          cursor: "grab", touchAction: "none", userSelect: "none",
        }}
      >
        <div style={{ flex: 1, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
          Thesis Q&A
        </div>
        <button onClick={handleMinimize} aria-label="Minimize chat"
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            cursor: "pointer", padding: "8px 6px", display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
        >
          <Minus size={14} />
        </button>
        <button onClick={handleClose} aria-label="Close chat"
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            cursor: "pointer", padding: "8px 6px", display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content: sidebar + messages */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <ThreadList
          threads={threads}
          activeThreadId={activeThread?.id}
          onOpenThread={setActiveThread}
          userName={userName}
        />
        <MessagePanel
          thread={activeThread}
          userName={userName}
        />
      </div>
    </div>
  );
}
