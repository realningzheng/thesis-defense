import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { Users } from "lucide-react";

/* Assign a consistent color based on name */
const NAME_COLORS = [
  "#3A7CA5", "#2E7D8C", "#5A8F5C", "#8B6E4E", "#C0392B",
  "#E67E22", "#8E44AD", "#2980B9", "#D4A017", "#1ABC9C",
  "#E74C3C", "#3498DB", "#9B59B6", "#F39C12", "#16A085",
];
function nameColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

/* ─── Cursor component ─── */
function RemoteCursor({ name, x, y, color }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y, pointerEvents: "none", zIndex: 9999,
      transition: "left 0.1s linear, top 0.1s linear",
    }}>
      {/* Arrow cursor shape */}
      <svg width="16" height="20" viewBox="0 0 16 20" style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.2))` }}>
        <path d="M0 0 L0 16 L4.5 12 L8 20 L10.5 19 L7 11 L12 11 Z" fill={color} stroke="#fff" strokeWidth="1" />
      </svg>
      {/* Name label */}
      <div style={{
        position: "absolute", left: 14, top: 12,
        background: color, color: "#fff",
        padding: "2px 8px", borderRadius: 4,
        fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }}>
        {name}
      </div>
    </div>
  );
}

/* ─── Online users badge ─── */
function OnlineBadge({ users, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 999,
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 20,
        background: "#fff", border: "1px solid #e0e0e0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {/* Stacked avatars */}
      <div style={{ display: "flex" }}>
        {users.slice(0, 5).map((u, i) => (
          <div key={u.name + i} style={{
            width: 24, height: 24, borderRadius: "50%",
            background: nameColor(u.name), border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
            marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
          }}>
            {u.name[0].toUpperCase()}
          </div>
        ))}
        {users.length > 5 && (
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "#ddd", border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "#666", marginLeft: -8,
          }}>
            +{users.length - 5}
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>{users.length} online</span>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF50" }} />
    </div>
  );
}

/* ─── Online users panel ─── */
function OnlinePanel({ users, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", bottom: 64, right: 20, zIndex: 999,
      width: 220, maxHeight: 300, overflowY: "auto",
      background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 12,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>ONLINE NOW</div>
      {users.map((u, i) => (
        <div key={u.name + i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: nameColor(u.name),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {u.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{u.name}</div>
            <div style={{ fontSize: 10, color: "#bbb" }}>
              {u.section ? `Viewing: ${u.section}` : "Browsing"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PRESENCE COMPONENT
   ═══════════════════════════════════════ */
export default function Presence({ userName, activeSection }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userName) return;

    const channel = supabase.channel("presence-room", {
      config: { presence: { key: userName } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = [];
        Object.values(state).forEach(presences => {
          presences.forEach(p => {
            if (p.name) users.push({ name: p.name, section: p.section });
          });
        });
        setOnlineUsers(users);
      })
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (payload.name !== userName) {
          setCursors(prev => ({ ...prev, [payload.name]: payload }));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: userName, section: activeSection });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userName]);

  // Update presence when section changes
  useEffect(() => {
    if (channelRef.current && userName) {
      channelRef.current.track({ name: userName, section: activeSection });
    }
  }, [activeSection, userName]);

  // Broadcast cursor position (throttled)
  useEffect(() => {
    let lastBroadcast = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastBroadcast < 100) return; // throttle to 10fps
      lastBroadcast = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "cursor",
        payload: { name: userName, x: e.clientX, y: e.clientY },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [userName]);

  // Clean up stale cursors (no update in 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now();
        const next = {};
        // Keep only cursors from users still online
        const onlineNames = new Set(onlineUsers.map(u => u.name));
        Object.entries(prev).forEach(([name, data]) => {
          if (onlineNames.has(name)) next[name] = data;
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [onlineUsers]);

  return (
    <>
      {/* Remote cursors */}
      {Object.entries(cursors).map(([name, data]) => (
        <RemoteCursor key={name} name={name} x={data.x} y={data.y} color={nameColor(name)} />
      ))}

      {/* Online badge */}
      <OnlineBadge users={onlineUsers} onClick={() => setShowPanel(!showPanel)} />

      {/* Online panel */}
      <OnlinePanel users={onlineUsers} isOpen={showPanel} onClose={() => setShowPanel(false)} />
    </>
  );
}
