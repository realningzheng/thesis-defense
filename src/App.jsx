import { useState, useEffect, useRef, useCallback } from "react";
import {
  ExternalLink,
  Eye, Brain, MessageSquare, AlertTriangle, Users, Zap,
  Mic, Camera, BookOpen, Layers, ArrowRight, Quote,
  BarChart3, CheckCircle2, Lightbulb, Target, Workflow, LogIn, List, Navigation
} from "lucide-react";
import ChatRoom, { PANEL_WIDTH } from "./ChatRoom";
import Presence from "./Presence";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & THEME
   ═══════════════════════════════════════════════════════════════ */
const C = {
  mimosa: "#3A7CA5", spica: "#2E7D8C", aroma: "#5A8F5C", transmog: "#8B6E4E",
  charcoal: "#2d2d2d", darkGray: "#444", gray: "#888", lightGray: "#f5f5f5",
  border: "#e0e0e0", bg: "#fff", red: "#C0392B", orange: "#E67E22", blue: "#2980B9",
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const PROJECT_LINKS = {
  mimosa: { paper: "https://arxiv.org/abs/2404.15107", site: "https://zning.co/mimosa" },
  spica: { paper: "https://arxiv.org/abs/2402.07300", site: "https://sites.google.com/nd.edu/spica" },
  aroma: { paper: "https://arxiv.org/abs/2507.10963", video: "https://www.youtube.com/watch?v=GGj-Asfx2Ew" },
  transmog: { paper: null, site: null },
  nlqStudy: { paper: null, site: null },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function OutlineSidebar({ sections, activeId, onNav }) {
  const isMobile = useIsMobile();
  const activeIdx = sections.findIndex(s => s.id === activeId);
  if (isMobile) return null;
  return (
    <nav style={{
      position: "fixed", top: "50%", left: 12, transform: "translateY(-50%)",
      zIndex: 100, padding: "10px 4px",
    }}>
      {sections.map((s, i) => {
        const isActive = activeId === s.id;
        const isPast = i < activeIdx;
        const accentColor = s.color || C.charcoal;
        return (
          <div key={s.id}
            onClick={() => onNav(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: s.depth === 0 ? "5px 8px" : "4px 8px 4px 20px",
              borderRadius: 6, cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              transform: isActive ? "scale(1.08)" : "scale(1)",
              transformOrigin: "left center",
            }}
          >
            <div style={{
              width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
              background: isActive ? accentColor : isPast ? "#bbb" : "#ddd",
              transition: "all 0.3s",
              boxShadow: isActive ? `0 0 6px ${accentColor}50` : "none",
            }} />
            <span style={{
              fontSize: s.depth === 0 ? 11 : 10,
              fontWeight: isActive ? 800 : s.depth === 0 ? 600 : 500,
              color: isActive ? accentColor : isPast ? "#aaa" : "#999",
              letterSpacing: isActive ? 0.3 : 0,
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              whiteSpace: "nowrap",
            }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function TopBar({ isPresenterUser, showRemoteCursors, onToggleCursors, chatOpen, onToggleChat, chatUnread, showOutline, onToggleOutline, onFollowPresenter }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e0e0e0",
    }}>
      <div style={{
        display: "flex", alignItems: "center", padding: isMobile ? "6px 12px" : "8px 24px",
        gap: isMobile ? 8 : 14,
      }}>
        <img src="/nd-logo.png" alt="University of Notre Dame" style={{ height: isMobile ? 36 : 60, objectFit: "contain" }} />
        <div style={{ width: 1, height: 24, background: "#ddd", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: C.charcoal, lineHeight: 1.3 }}>
            {isMobile ? "Multimodal Human-AI Systems" : "Designing Multimodal Human-AI Systems to Enhance Human Cognitive Capability"}
          </div>
          <div style={{ fontSize: 10, color: "#999", letterSpacing: 0.5 }}>PhD Defense &middot; Zheng Ning</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 6, flexShrink: 0 }}>
          {!isMobile && <div
            onClick={onToggleOutline}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 16,
              background: showOutline ? `${C.charcoal}0A` : "transparent",
              border: `1px solid ${showOutline ? C.charcoal + "30" : "#e0e0e0"}`,
              cursor: "pointer", userSelect: "none", transition: "all 0.2s",
            }}
          >
            <List size={14} color={showOutline ? C.charcoal : "#888"} />
            <span style={{ fontSize: 11, fontWeight: 600, color: showOutline ? C.charcoal : "#888" }}>Outline</span>
          </div>}

          {!isPresenterUser && (
            <div
              onClick={onFollowPresenter}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 16,
                background: "transparent",
                border: `1px solid #e0e0e0`,
                cursor: "pointer", userSelect: "none", transition: "all 0.2s",
              }}
            >
              <Navigation size={14} color={C.charcoal} />
              {!isMobile && <span style={{ fontSize: 11, fontWeight: 600, color: C.charcoal }}>Follow Presenter</span>}
            </div>
          )}

          {isPresenterUser && (
            <div
              onClick={onToggleCursors}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 16,
                background: showRemoteCursors ? `${C.charcoal}0A` : "transparent",
                border: `1px solid ${showRemoteCursors ? C.charcoal + "30" : "#e0e0e0"}`,
                cursor: "pointer", userSelect: "none", transition: "all 0.2s",
              }}
            >
              <Eye size={14} color={showRemoteCursors ? C.charcoal : "#aaa"} />
              <div style={{
                width: 28, height: 16, borderRadius: 8,
                background: showRemoteCursors ? "#4CAF50" : "#ccc",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#fff", position: "absolute", top: 2,
                  left: showRemoteCursors ? 14 : 2,
                  transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }} />
              </div>
            </div>
          )}

          <div
            onClick={onToggleChat}
            style={{
              position: "relative",
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 16,
              background: chatOpen ? `${C.charcoal}0A` : "transparent",
              border: `1px solid ${chatOpen ? C.charcoal + "30" : "#e0e0e0"}`,
              cursor: "pointer", userSelect: "none", transition: "all 0.2s",
            }}
          >
            <MessageSquare size={14} color={C.charcoal} />
            {!isMobile && <span style={{ fontSize: 11, fontWeight: 600, color: C.charcoal }}>chat room</span>}
            {chatUnread > 0 && (
              <div style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 18, height: 18, borderRadius: 9,
                background: "#e74c3c", color: "#fff",
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "2px solid #fff",
              }}>
                {chatUnread > 9 ? "9+" : chatUnread}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, label, title, subtitle, color, children }) {
  const isMobile = useIsMobile();
  return (
    <div id={id} style={{ minHeight: isMobile ? "auto" : "100vh", padding: isMobile ? "40px 16px 32px" : "72px 32px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        {color && <div style={{ width: 32, height: 3, background: color, borderRadius: 2 }} />}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: color || "#999" }}>{label}</span>
      </div>
      <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: "#1a1a2e", marginBottom: subtitle ? 8 : 28, lineHeight: 1.25 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: isMobile ? 13 : 14, color: "#666", marginBottom: 28, maxWidth: 780, lineHeight: 1.7 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Figure({ src, caption, maxW = 900, video }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <figure style={{ margin: "24px 0", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={src} alt={caption || ""}
            onClick={() => setZoomed(true)}
            style={{ maxWidth: "100%", width: maxW, borderRadius: 8, border: "1px solid #eee", cursor: video ? "pointer" : "zoom-in", transition: "box-shadow 0.2s" }}
          />
          {video && (
            <div onClick={() => setZoomed(true)}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "transform 0.2s" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="6,3 20,12 6,21" /></svg>
              </div>
            </div>
          )}
        </div>
        {caption && <figcaption style={{ fontSize: 11, color: "#999", marginTop: 8, fontStyle: "italic" }}>{caption}{video && " — click to play video"}</figcaption>}
      </figure>
      {zoomed && !video && (
        <div onClick={() => setZoomed(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 32 }}>
          <img src={src} alt={caption || ""} style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 8 }} />
        </div>
      )}
      {zoomed && video && (
        <div onClick={() => setZoomed(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", padding: 32 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "85vh" }}>
            <video src={video} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, outline: "none" }} />
            <button onClick={() => setZoomed(false)}
              style={{ position: "absolute", top: -16, right: -16, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, sub, color = C.charcoal }) {
  return (
    <div style={{ padding: "16px 18px", background: "#fafafa", borderRadius: 10, borderLeft: `3px solid ${color}`, flex: "1 1 140px", minWidth: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ParticipantQuote({ text, who, color = "#888" }) {
  return (
    <div style={{ padding: "14px 18px", background: `${color}08`, borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", margin: "10px 0" }}>
      <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{text}&rdquo;</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>&mdash; {who}</div>
    </div>
  );
}

function LinkBtn({ href, children, color = C.charcoal }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, color, border: `1px solid ${color}30`, background: `${color}06`, textDecoration: "none" }}>
      {children}
    </a>
  );
}

function TabBar({ tabs, color, prefix }) {
  const [active, setActive] = useState(tabs[0]?.id || "");

  useEffect(() => {
    const ids = tabs.map(t => t.id);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const tabId = e.target.id.replace(`${prefix}-`, "");
          if (ids.includes(tabId)) setActive(tabId);
        }
      });
    }, { threshold: 0.15, rootMargin: "-100px 0px -50% 0px" });
    ids.forEach(id => {
      const el = document.getElementById(`${prefix}-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [prefix]);

  const scrollTo = (id) => {
    const el = document.getElementById(`${prefix}-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div style={{
      display: "flex", gap: 2, marginBottom: 20, flexWrap: "wrap",
      position: "sticky", top: 77, zIndex: 10,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
      padding: "10px 0", marginTop: -10,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => scrollTo(t.id)}
          style={{
            padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${active === t.id ? color : "#e0e0e0"}`,
            background: active === t.id ? `${color}10` : "#fff", color: active === t.id ? color : "#888",
            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AnimatedBar({ value, max = 7, color, label, sub }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setWidth((value / max) * 100); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, max]);
  return (
    <div ref={ref} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}<span style={{ fontSize: 11, fontWeight: 400, color: "#999" }}>/{max}</span></span>
      </div>
      <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 4, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      {sub && <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ComparisonBar({ label, valueA, valueB, labelA, labelB, max = 7, color, pValue }) {
  const [w, setW] = useState({ a: 0, b: 0 });
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setW({ a: (valueA / max) * 100, b: (valueB / max) * 100 }); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [valueA, valueB, max]);
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 }}>{label} {pValue && <span style={{ fontSize: 10, color, fontWeight: 700 }}>p = {pValue}</span>}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color, fontWeight: 600, width: 60 }}>{labelA}</span>
        <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w.a}%`, background: color, borderRadius: 4, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, width: 36, textAlign: "right" }}>{valueA}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#999", fontWeight: 600, width: 60 }}>{labelB}</span>
        <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w.b}%`, background: "#ccc", borderRadius: 4, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#999", width: 36, textAlign: "right" }}>{valueB}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CENTRAL ARGUMENT (shown right after title)
   ═══════════════════════════════════════════════════════════════ */
function CentralArgumentSlide() {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: 24, borderRadius: 12, background: "#fafafa", border: "1px solid #e0e0e0", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>THESIS STATEMENT</div>
      <div style={{ fontSize: isMobile ? 14 : 16, color: C.charcoal, lineHeight: 1.7, fontWeight: 500, maxWidth: 700, margin: "0 auto" }}>
        AI-enabled interactive systems can effectively augment human cognition in multimodal workflows by exposing <strong style={{ color: C.spica }}>intermediate AI-generated results</strong> and surfacing them in <strong style={{ color: C.spica }}>controllable interface elements</strong>. This allows users to <strong style={{ color: "#D4A017" }}>perceive, verify, and adjust</strong> outputs with their own sensory and expressive capabilities. The design principle of balancing <strong style={{ color: C.spica }}>data-driven system performance</strong> and <strong style={{ color: C.spica }}>human-centered values</strong> such as <strong style={{ color: "#D4A017" }}>usability, trust, agency, and safety</strong> generalizes across diverse user groups and application domains, from creative video production to accessibility and knowledge work.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 0: TITLE
   ═══════════════════════════════════════════════════════════════ */
function TitleSlide() {
  const isMobile = useIsMobile();
  return (
    <div id="title" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "32px 16px" : "40px 32px", textAlign: "center" }}>
      <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, letterSpacing: 4, color: "#999", marginBottom: 20 }}>PHD DISSERTATION DEFENSE</div>
      <h1 style={{ fontSize: isMobile ? 24 : 38, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3, maxWidth: 800, marginBottom: 16 }}>
        Designing Multimodal Human-AI Systems to Augment User Cognitive Capability
      </h1>
      <div style={{ fontSize: isMobile ? 14 : 16, color: "#666", marginBottom: 32 }}>Zheng Ning</div>
      <div style={{ fontSize: isMobile ? 12 : 13, color: "#999", marginBottom: 40 }}>University of Notre Dame &middot; Department of Computer Science and Engineering</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { name: "NL2SQL", color: "#7c6bc4", venue: "" },
          { name: "MIMOSA", color: C.mimosa, venue: "" },
          { name: "SPICA", color: C.spica, venue: "" },
          { name: "AROMA", color: C.aroma, venue: "" },
          { name: "TRANSMOGRIFIER", color: C.transmog, venue: "" },
        ].map(s => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "6px 12px" : "8px 18px", borderRadius: 8, border: `1.5px solid #ddd`, background: `${s.color}06` }}>
            <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, color: C.charcoal }}>{s.name}</span>
            {s.venue && <span style={{ fontSize: 10, color: "#999", marginLeft: 8 }}>{s.venue}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROBLEM SPACE DIAGRAM (replaces problem-space.png)
   ═══════════════════════════════════════════════════════════════ */
function ProblemSpaceDiagram() {
  const isMobile = useIsMobile();
  const [hoveredCell, setHoveredCell] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const sys = {
    mimosa: { name: "MIMOSA", color: C.mimosa },
    spica: { name: "SPICA", color: C.spica },
    aroma: { name: "AROMA", color: C.aroma },
    transmog: { name: "TRANSMOGRIFIER", color: C.transmog },
  };

  const rows = [
    {
      label: "Application Areas",
      bg: "#d5e8d1",
      cells: [
        { id: "app-video", text: ["Video Editing &", "Consumption"], systems: ["mimosa", "spica"] },
        { id: "app-knowledge", text: ["Knowledge", "Work"], systems: ["transmog"] },
        { id: "app-physical", text: ["Physical", "Tasks"], systems: ["aroma"] },
      ],
    },
    {
      label: "User group",
      bg: "#d4e4f0",
      cells: [
        { id: "user-blv", text: ["Blind or Low-", "Vision Users"], systems: ["spica", "aroma"] },
        { id: "user-nonexpert", text: ["Non-expert", "Users"], systems: ["mimosa", "transmog"] },
        { id: "user-pro", text: ["Professional", "Users"], systems: ["transmog"] },
      ],
    },
    {
      label: "Data modality",
      bg: "#f9d9c6",
      cells: [
        { id: "mod-audio", text: ["Audio"], systems: [] },
        { id: "mod-visual", text: ["Visual"], systems: [] },
        { id: "mod-text", text: ["Text"], systems: [] },
      ],
    },
    {
      label: "Theory",
      bg: "#e8e8e8",
      cells: [
        { id: "th-disambig", text: ["Multimodal", "Disambiguation"], systems: [] },
        { id: "th-interact", text: ["Multimodal", "Interaction"], systems: [] },
        { id: "th-mix", text: ["Mix-Initiative", "Interface"], systems: [] },
        { id: "th-direct", text: ["Direct-Agent", "Manipulation"], systems: [] },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 750, margin: "0 auto" }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{
          display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center",
          borderBottom: ri < rows.length - 1 ? "1.5px solid #888" : "none",
          paddingBottom: ri < rows.length - 1 ? 22 : 0,
          marginBottom: ri < rows.length - 1 ? 22 : 0,
        }}>
          <div style={{
            width: isMobile ? "auto" : 120, fontSize: isMobile ? 12 : 13, fontWeight: 600, color: "#666",
            fontStyle: "italic", lineHeight: 1.4, flexShrink: 0,
            marginBottom: isMobile ? 8 : 0,
          }}>
            {row.label}
          </div>
          <div style={{ display: "flex", gap: isMobile ? 8 : 14, flex: 1, flexWrap: "wrap", justifyContent: "center" }}>
            {row.cells.map((cell) => {
              const hovered = hoveredCell === cell.id;
              return (
                <div key={cell.id}
                  onMouseEnter={() => setHoveredCell(cell.id)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => cell.systems.length === 1 && scrollTo(cell.systems[0])}
                  style={{
                    flex: `1 1 ${row.cells.length === 4 ? "110px" : "140px"}`,
                    maxWidth: row.cells.length === 4 ? 170 : 200,
                    background: row.bg,
                    borderRadius: 12, padding: "14px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", textAlign: "center",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    transform: hovered ? "translateY(-2px)" : "none",
                    boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                    cursor: "pointer", minHeight: 58,
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#444", lineHeight: 1.35 }}>
                    {cell.text.map((l, i) => <span key={i}>{l}{i < cell.text.length - 1 && <br />}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    {cell.systems.map(sId => (
                      <span key={sId}
                        onClick={(e) => { e.stopPropagation(); scrollTo(sId); }}
                        style={{
                          fontSize: 9, fontWeight: 700, color: "#fff",
                          background: sys[sId].color,
                          padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                          transition: "opacity 0.2s",
                          opacity: hovered ? 1 : 0.65,
                        }}>
                        {sys[sId].name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", fontSize: 11, color: "#999", marginTop: 14, fontStyle: "italic" }}>
        {/* Problem Space — Click system badges to navigate to corresponding sections */}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 1: MOTIVATION — COGNITION FLOW
   ═══════════════════════════════════════════════════════════════ */
function PhaseCard({ phase: p, index: i, total, isMobile }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: isMobile ? "100%" : 240, padding: isMobile ? "18px 16px" : "24px 20px", borderRadius: 12,
          border: `2px solid ${p.color}40`,
          background: `${p.color}08`,
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: hovered ? "scale(1.06)" : "scale(1)",
          boxShadow: hovered ? `0 8px 24px ${p.color}20` : "none",
          cursor: "default",
        }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}><p.Icon size={32} color={p.color} strokeWidth={1.5} /></div>
        <div style={{ fontSize: 15, fontWeight: 700, textAlign: "center", color: p.color }}>{p.label}</div>
        <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 6 }}>{p.channels.join(" · ")}</div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 12, color: p.color, fontStyle: "italic", lineHeight: 1.5, marginBottom: 8 }}>&ldquo;{p.challenge}&rdquo;</div>
          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{p.systems}</div>
        </div>
      </div>
      {i < total - 1 && !isMobile && (
        <div style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 52 }}>
          <ArrowRight size={20} color="#ccc" />
        </div>
      )}
    </div>
  );
}

function CognitionFlow() {
  const isMobile = useIsMobile();
  const phases = [
    { id: "perception", label: "Perception", Icon: Eye, color: C.mimosa,
      channels: ["Sight", "Hearing", "Touch", "Smell", "Taste"],
      challenge: "A low-vision cook hears sizzling but cannot see browning",
      // systems: "MIMOSA uses visual cues; SPICA adds spatial audio; AROMA leverages non-visual senses" 
    },
    { id: "cognition", label: "Cognition", Icon: Brain, color: C.charcoal,
      channels: ["Reasoning", "Decision-making", "Mental models", "Working memory"],
      challenge: "Missing channels, or errors from one perception channels amplify cognitive burden on reasoning",
      // systems: "All four systems reduce cognitive load by coordinating channels" 
    },
    { id: "expression", label: "Expression", Icon: MessageSquare, color: C.transmog,
      channels: ["Speech", "Writing", "Gesture", "Manipulation"],
      challenge: "A patient must convey subtle symptoms like skin texture or swelling through verbal description alone during a remote consultation",
      // systems: "AROMA uses voice; MIMOSA uses drag; TRANSMOGRIFIER uses direct editing" 
    },
  ];

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          {phases.map((p, i) => (
            <PhaseCard key={p.id} phase={p} index={i} total={phases.length} isMobile={isMobile} />
          ))}
        </div>
        {/* Feedback arrow from Expression back to Perception */}
        <svg width="100%" height="56" viewBox="0 0 816 56" preserveAspectRatio="xMidYMin meet"
          style={{ display: isMobile ? "none" : "block", margin: "0 auto", maxWidth: 816, overflow: "visible" }}>
          <defs>
            <marker id="feedback-arrow" viewBox="0 0 10 8" refX="9" refY="4"
              markerWidth="8" markerHeight="6" orient="auto">
              <path d="M0,0 L10,4 L0,8 Z" fill="#aaa" />
            </marker>
          </defs>
          <path
            d="M 696,4 C 696,48 120,48 120,4"
            fill="none" stroke="#bbb" strokeWidth="1.8" strokeDasharray="6 4"
            markerEnd="url(#feedback-arrow)"
          />
          <text x="408" y="48" textAnchor="middle"
            style={{ fontSize: 11, fill: "#999", fontStyle: "italic" }}>
            {/* Feedback loop */}
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 2: THESIS OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function OverviewCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  const links = PROJECT_LINKS[item.id] || {};
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        flex: "1 1 200px", padding: "18px 16px", borderRadius: 10,
        border: `2px solid ${item.color}40`,
        background: `${item.color}08`,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "scale(1.06)" : "scale(1)",
        boxShadow: hovered ? `0 8px 24px ${item.color}20` : "none",
        cursor: onClick ? "pointer" : "default",
        zIndex: hovered ? 2 : 1,
        position: "relative",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.name}</span>
        {item.venue && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f5", padding: "2px 8px", borderRadius: 10 }}>{item.venue}</span>}
      </div>
      <div style={{ fontSize: 12, color: "#555" }}>{item.domain}</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{item.users}</div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${item.color}20` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: item.color, marginBottom: 4 }}>Key takeaway</div>
        <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6, fontStyle: "italic" }}>{item.thesis}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {links.site && <LinkBtn href={links.site} color={item.color}><ExternalLink size={11} /> Project</LinkBtn>}
          {links.paper && <LinkBtn href={links.paper} color={item.color}><ExternalLink size={11} /> Paper</LinkBtn>}
          {links.video && <LinkBtn href={links.video} color={item.color}><ExternalLink size={11} /> Video</LinkBtn>}
        </div>
      </div>
    </div>
  );
}

function ThesisOverview() {
  const items = [
    { id: "mimosa", name: "MIMOSA", color: C.mimosa, venue: "", domain: "Spatial Audio for Videos", users: "Amateur video creators",
      thesis: "Decomposing opaque pipelines enables error detection, repair, and creative augmentation without prior expertise." },
    { id: "spica", name: "SPICA", color: C.spica, venue: "", domain: "Video Access for BLV Users", users: "Blind or low-vision viewers",
      thesis: "Restructuring audio descriptions from passive description to active multi-granularity exploration improves comprehension and engagement." },
    { id: "aroma", name: "AROMA", color: C.aroma, venue: "", domain: "Non-Visual Cooking Assistance", users: "Blind or low-vision cooks",
      thesis: "Most effective support occurs when the system validates and extends users' own embodied perceptual inferences." },
    { id: "transmog", name: "TRANSMOGRIFIER", color: C.transmog, venue: "", domain: "Knowledge Work", users: "Professional knowledge workers",
      thesis: "Generative AI can manage semantic coherence across modalities when changes are kept inspectable and reversible." },
    { id: "nlqStudy", name: "NL2SQL ERROR STUDY", color: "#7c6bc4", venue: "", domain: "Empirical Grounding", users: "26 participants, 4 NL2SQL models",
      thesis: "Independent evidence for design principles: 48-type error taxonomy, human-model attention alignment analysis, and evaluation of error-handling mechanisms." },
  ];

  const systems = items.filter(s => s.id !== "nlqStudy");
  const nlq = items.find(s => s.id === "nlqStudy");

  return (
    <div>
      <ProblemSpaceDiagram />
      <div style={{ display: "flex", gap: 10, marginBottom: 24, marginTop: 32, flexWrap: "wrap" }}>
        {systems.map(s => (
          <OverviewCard key={s.id} item={s} />
        ))}
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, lineHeight: 1.25 }}>One Empirical Study on Error-Handling in Human-AI Interaction</h2>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 20, maxWidth: 780, lineHeight: 1.7 }}>An empirical study into NL2SQL errors that grounds the design principles derived from the four systems.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <OverviewCard item={nlq} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 3-6: MIMOSA
   ═══════════════════════════════════════════════════════════════ */
function MimosaSlides() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pipeline", label: "Pipeline & UI" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} color={C.mimosa} prefix="mimosa" />

      <div id="mimosa-overview" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Creating spatial audio normally requires specialized hardware (binaural microphones, ambisonic rigs) and professional
            expertise&mdash;yet millions of existing videos have only mono or stereo audio. End-to-end ML models can reconstruct
            spatial audio, but their opaque outputs offer no creative control. <strong>MIMOSA decomposes the pipeline into
            interpretable, editable stages</strong>&mdash;<strong>Detect &rarr; Repair &rarr; Augment</strong>&mdash;so users
            can inspect each step, fix model errors through visual cues, and creatively explore spatial effects beyond what
            any ground-truth reconstruction would produce.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="PARTICIPANTS" value="15" sub="in-lab usability study" color={C.mimosa} />
            <StatCard label="EVALUATORS" value="8" sub="subjective quality eval" color={C.mimosa} />
            {/* <StatCard label="REALISM" value="6.47/7" sub="σ = 0.52" color={C.mimosa} /> */}
            <StatCard label="IMMERSION" value="6.03/7" sub="user-generated audio" color={C.mimosa} />
          </div>
          <Figure src="/figures/mimosa.png" caption="MIMOSA system interface: 2D overlay (left), 3D manipulation (center), audio controls (right)" />
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>Design Goals</div>
            {[
              ["DG1", "Enable error detection and repair through visual-audio cross-modal verification — colored dots on video frames reveal positioning errors without requiring audio expertise"],
              ["DG2", "Support creative augmentation beyond ground-truth reconstruction — users explore spatial configurations they imagine, treating model predictions as starting points"],
              ["DG3", "Coordinate visual and auditory perception through synchronized representations (2D overlay, 3D space, audio waveforms) to reduce cognitive load"],
            ].map(([dg, desc]) => (
              <div key={dg} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.mimosa, background: `${C.mimosa}12`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{dg}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="mimosa-pipeline" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Backend Audiovisual Spatializing Pipeline</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { stage: "Stage 1", title: "Infer 3D Positions", desc: "Object detection (Faster R-CNN) + depth estimation → 3D positions over time" },
              { stage: "Stage 2", title: "Separate & Align Audio", desc: "Sound separation model → audio tagging → map soundtracks to visual objects" },
              { stage: "Stage 3", title: "Spatial Rendering", desc: "WebAudio PannerNode mixes separated tracks based on 3D positions for surround output" },
            ].map(s => (
              <div key={s.stage} style={{ flex: "1 1 220px", padding: 16, borderRadius: 10, border: `1px solid ${C.mimosa}30`, background: `${C.mimosa}04` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.mimosa, letterSpacing: 1, marginBottom: 4 }}>{s.stage}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Frontend: Three Interactive Panels</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { title: "2D Video Overlay", desc: "Colored dots on video frame — drag to fix object positions. Dots sized by depth. Real-time volume indicators." },
              { title: "3D Manipulation", desc: "Colored spheres in 3D space — rotate, move camera reference point, adjust viewing angle for creative augmentation." },
              { title: "Audio Controls", desc: "Verify audio-visual pairings, volume sliders, waveform display for navigation, numeric coordinate editing." },
            ].map(s => (
              <div key={s.title} style={{ flex: "1 1 220px", padding: 16, borderRadius: 10, border: "1px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <Figure src="/figures/mimosa-ml-pipeline.png" caption="MIMOSA: ML pipeline overview — decomposed ML pipeline with user-in-the-loop editing" />
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="mimosa-results" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 16 }}>Evaluation: Immersion & Realism (8 evaluators, 6 videos, 7-point scale)</div>
          <Figure src="/figures/mimosa-barchart.png" caption="User-generated audio (UA) significantly outperforms all baselines in immersion (p < 0.001)" maxW={700} />
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", marginTop: 16 }}>
            {[
              { type: "User-Generated", imm: "6.03", real: "5.58", highlight: true },
              { type: "Raw Audio (GT)", imm: "4.51", real: "6.03" },
              { type: "Mimosa Default", imm: "4.47", real: "3.67" },
              { type: "Offline Model", imm: "2.76", real: "3.96" },
              { type: "Monaural", imm: "1.95", real: "5.68" },
            ].map(r => (
              <div key={r.type} style={{
                flex: "1 1 140px", padding: 14, borderRadius: 8,
                border: r.highlight ? `2px solid ${C.mimosa}` : "1px solid #e8e8e8",
                background: r.highlight ? `${C.mimosa}06` : "#fff",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: r.highlight ? C.mimosa : "#888", marginBottom: 6 }}>{r.type}</div>
                <div style={{ fontSize: 11, color: "#666" }}>Immersion: <strong>{r.imm}</strong></div>
                <div style={{ fontSize: 11, color: "#666" }}>Realism: <strong>{r.real}</strong></div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderRadius: 10, background: `${C.mimosa}06`, border: `1px solid ${C.mimosa}20`, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.mimosa, marginBottom: 4 }}>Key Insight</div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>
              Automated default output (4.47) <strong>nearly matched professional recordings</strong> (4.51) in immersion &mdash; and user-edited versions <strong>significantly outperformed all alternatives</strong> (6.03, p &lt; 0.001), demonstrating the value of human-in-the-loop editing over both full automation and raw capture.
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Usability Study (N=15, 7-point Likert)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>OVERALL</div>
              {[
                { q: "System usefulness", m: 6.47, s: 0.52 },
                { q: "Spatial audio immersion", m: 6.20, s: 0.68 },
                { q: "Creative freedom", m: 6.27, s: 0.96 },
              ].map(r => (
                <AnimatedBar key={r.q} label={r.q} value={r.m} color={C.mimosa} sub={`σ = ${r.s}`} />
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>INTERFACE</div>
              {[
                { q: "2D dots overlay", m: 6.53, s: 0.83 },
                { q: "3D manipulation panel", m: 6.07, s: 1.09 },
                { q: "Easy to use", m: 5.87, s: 1.06 },
              ].map(r => (
                <AnimatedBar key={r.q} label={r.q} value={r.m} color={C.mimosa} sub={`σ = ${r.s}`} />
              ))}
            </div>
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="mimosa-findings" style={{ scrollMarginTop: 140 }}>
          {[
            { title: "F1: Decomposed pipeline democratizes spatial audio creation", detail: "All 15 participants (8 amateur creators, 7 non-creators) successfully completed tasks across 6 videos. The automated default (4.47/7 immersion) nearly matched professional recordings (4.51/7), while user-edited versions significantly outperformed all alternatives (6.03/7, p < 0.001)." },
            { title: "F2: Visual cues enable intuitive cross-modal error discovery", detail: "Colored dots on video frames reveal audio-visual misalignment instantly — a direct demonstration of the mutual disambiguation principle. P13: 'I easily found errors by just looking at the dot positions.' Amateurs discovered errors visually without needing any audio expertise." },
            { title: "F3: Users augment beyond ground truth", detail: "Rather than simply correcting model errors, participants actively experimented: moving sounds behind them, repositioning instruments across the scene, testing imaginative spatial configurations. P8: 'I can clearly feel the car is moving from left to right.' Model predictions become creative starting points, not final outputs." },
            { title: "F4: Diverse manipulation strategies serve different cognitive needs", detail: "Some users preferred 2D/3D dragging for immediacy (P2: 'spatial effect changes were more immediate'); others chose numerical input for precision (P1: 'I felt more confident with numerical input'). Three participants (P6, P10, P11) fluidly mixed all methods." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.mimosa, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.detail}</div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <ParticipantQuote text="It allows me to imagine I can walk into the video scene and pretend to be at a particular position to hear the music instruments playing" who="P15 — on the 3D manipulation panel" color={C.mimosa} />
            <ParticipantQuote text="Getting instant feedback is super important in the editing process...this allows me to do the editing and evaluating tasks simultaneously" who="P8 — on real-time rendering" color={C.mimosa} />
            <ParticipantQuote text="Aligning the dots and the sounding objects in the video frame cost nearly no labor, so I felt really excited playing around with different settings" who="P11 — on creative exploration" color={C.mimosa} />
            <ParticipantQuote text="When I moved the Saxophone to my back, the sound was actually coming from that position" who="P3 — on spatial immersion" color={C.mimosa} />
          </div>
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${C.mimosa}06`, border: `1px solid ${C.mimosa}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.mimosa, marginBottom: 6 }}>Key Conclusion</div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
              Decomposing opaque AI pipelines into interpretable, editable stages lets users detect errors through visual cues, repair them, and creatively augment outputs — without requiring prior video/audio editing expertise.
            </div>
          </div>

          <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

          <div style={{ fontSize: 15, fontWeight: 700, color: C.mimosa, marginBottom: 12 }}>MIMOSA with Professional Editing Tools</div>
          <video controls style={{ width: "100%", maxWidth: 900, borderRadius: 8, border: "1px solid #eee" }}>
            <source src="/videos/mimosa_pr.mp4" type="video/mp4" />
          </video>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 7-10: SPICA
   ═══════════════════════════════════════════════════════════════ */
function SpicaSlides() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pipeline", label: "Pipeline & UI" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} color={C.spica} prefix="spica" />

      <div id="spica-overview" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Video is essential for information, entertainment, and learning&mdash;yet it remains largely inaccessible to 
            people with visual impairments worldwide. Traditional audio descriptions (ADs) are passive and
            one-size-fits-all: they emphasize only key moments, force BLV users to parse narration and soundtrack simultaneously,
            and often lead to disengagement during prolonged listening. <strong>SPICA transforms video accessibility from passive
            consumption to active exploration</strong>&mdash;providing layered, multi-granularity access: frame-level captions
            for temporal navigation, and object-level descriptions with touch and keyboard exploration for spatial understanding.
          </div>
          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>Addressing Three Limitations of Static Audio Descriptions</div>
            {[
              ["Content Depth", "ADs cover only key moments — users want details about 'less important' objects too. SPICA provides on-demand object-level exploration so users choose what to investigate"],
              ["Mental Load & Autonomy", "Sighted viewers can visually scan and focus; BLV users must linearly consume audio. SPICA gives control over timing, granularity, and exploration strategy"],
              ["Immersion & Engagement", "Prolonged passive listening causes disengagement. SPICA enriches the experience with spatialized sound effects, touch-based discovery, and color overlays for residual vision"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.spica, background: `${C.spica}12`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{title}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
          <Figure src="/figures/spica-ui.png" caption="SPICA interface: video player with color overlay, frame-level captions, and object-level descriptions" />
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="spica-pipeline" style={{ scrollMarginTop: 140 }}>
          <Figure src="/figures/spica-pipeline.png" caption="SPICA ML Pipeline: scene analysis → object segmentation → description generation → sound retrieval → depth estimation" maxW={800} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12, marginTop: 24 }}>Five-Stage ML Pipeline</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 24 }}>
            {[
              { n: "1", title: "Scene Analysis", desc: "Identify keyframes, generate scene descriptions" },
              { n: "2", title: "Object Segmentation", desc: "Detect & segment objects of interest within frames" },
              { n: "3", title: "Description Generation", desc: "OFA captioning + GPT-4 refinement for consistency" },
              { n: "4", title: "Sound Retrieval", desc: "Query Freesound database using description keywords" },
              { n: "5", title: "Depth Estimation", desc: "Predict object depth for spatialized audio positioning" },
            ].map(s => (
              <div key={s.n} style={{ padding: 14, borderRadius: 8, border: `1px solid ${C.spica}20`, background: `${C.spica}04` }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.spica, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Exploration Modalities</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", padding: 16, borderRadius: 10, border: "1px solid #e8e8e8" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.spica, marginBottom: 4 }}>Touch-Based</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>Scan frame with finger → triggers description, color overlay, spatialized sound effect. Provides spatial awareness of object positions.</div>
            </div>
            <div style={{ flex: "1 1 240px", padding: 16, borderRadius: 10, border: "1px solid #e8e8e8" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.spica, marginBottom: 4 }}>Keyboard-Based</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>Cycle through objects with arrow keys. Ensures comprehensive, deterministic coverage. Preferred by 4 of 6 participants who tried both.</div>
            </div>
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="spica-results" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>ML Pipeline Performance</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="OBJECT DETECTION PRECISION" value="0.939" sub="SD = 0.03" color={C.spica} />
            <StatCard label="OBJECT DETECTION RECALL" value="0.791" sub="SD = 0.07" color={C.spica} />
            <StatCard label="DESCRIPTION QUALITY" value="5.10/7" sub="vs. 3.91 baseline (p<0.001)" color={C.spica} />
          </div>
          <Figure src="/figures/spica-barchart.png" caption="SPICA vs. Baseline: understanding and immersion ratings from 14 BLV participants" maxW={650} />
          <div style={{ display: "flex", gap: 12, marginBottom: 24, marginTop: 24, flexWrap: "wrap" }}>
            <StatCard label="BLV PARTICIPANTS" value="14" sub="user study" color={C.spica} />
            <StatCard label="EASE OF USE" value="6.29/7" sub="σ = 0.99" color={C.spica} />
            <StatCard label="USEFULNESS" value="6.79/7" sub="σ = 0.43" color={C.spica} />
            <StatCard label="UNDERSTANDING" value="6.11" sub="vs. 4.79 baseline (p=0.033)" color={C.spica} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>User Study (N=14 BLV, 7-point Likert)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>CORE USABILITY</div>
              {[
                { q: "Usefulness", m: 6.79, s: 0.43 },
                { q: "Additional information", m: 6.57, s: 0.65 },
                { q: "Ease of use", m: 6.29, s: 0.99 },
              ].map(r => (
                <AnimatedBar key={r.q} label={r.q} value={r.m} color={C.spica} sub={`σ = ${r.s}`} />
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>IMMERSION FEATURES</div>
              {[
                { q: "Improved immersion", m: 6.29, s: 0.83 },
                { q: "Sound effects", m: 5.86, s: 1.51 },
                { q: "Spatial audio", m: 5.21, s: 1.67 },
              ].map(r => (
                <AnimatedBar key={r.q} label={r.q} value={r.m} color={C.spica} sub={`σ = ${r.s}`} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 20, padding: 18, borderRadius: 10, background: `${C.spica}04`, border: `1px solid ${C.spica}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.spica, marginBottom: 12 }}>Comparative Results (Wilcoxon signed-rank test)</div>
            <ComparisonBar label="Understanding" valueA={6.11} valueB={4.79} labelA="SPICA" labelB="Baseline" color={C.spica} pValue="0.033" />
            <ComparisonBar label="Immersion" valueA={6.25} valueB={4.29} labelA="SPICA" labelB="Baseline" color={C.spica} pValue="0.046" />
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />
      <Figure src="/figures/spica-pause.png" caption="Exploration behavior patterns: when and how BLV users explore video content" maxW={700} />
      <div id="spica-findings" style={{ scrollMarginTop: 140 }}>
          {[
            { title: "F1: Audio descriptions anchor active exploration", detail: "61.4% of active frame explorations occurred within ±5 seconds of original ADs. P10: 'I watch video with ADs every day — those are frames worth exploring, given I have the power to do so.' Native ADs serve as importance signals that invite deeper investigation, not endpoints." },
            { title: "F2: Pausing serves three distinct cognitive purposes", detail: "Reflecting: digesting complex multi-event scenes (P4). Validating: checking adjacent frames to confirm narrative coherence — P9: 'What happened before they hugged? Did they have any eye contact?' Customizing: fast-forwarding past unengaging content to focus on personally relevant scenes (P3)." },
            { title: "F3: Users detect AI errors through cross-modal reasoning", detail: "P5 noticed a frame described two people but only one voice was heard. By checking neighboring frames (which showed one person), P5 concluded: 'I was deterministic enough to say the description was wrong.' P13 rejected 'accordion' in a kitchen scene, reasoning it was likely a cutting board." },
            { title: "F4: Sound triggers spatial curiosity", detail: "14.9% of object explorations followed new sounds. P5: 'When I heard the car engine, I wanted to know where that car was.' P4: 'When I heard noisy conversations, I wanted to know what they were doing.' P1: '(When a new person joined the conversation) I'm always curious to know what clothes people are wearing.' Sound serves as a spatial invitation to explore." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.spica, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.detail}</div>
            </div>
          ))}
          <ParticipantQuote text="Exploring using my fingers augments my perception towards the relative positions of different objects" who="P10 — on touch-based spatial exploration" color={C.spica} />
          <ParticipantQuote text="I like when I touched a point at the screen and a spatial sound just coming from that direction...I felt it connected me with the scene in the video" who="P11 — on multimodal immersion" color={C.spica} />
          <ParticipantQuote text="The detailed information could fill in gaps that traditional audio descriptions miss, offering a richer viewing experience" who="P6 — on layered exploration" color={C.spica} />
          <ParticipantQuote text="Once it took all the color of the other objects away, it was a lot easier to find what I want" who="P14 — on color overlay for residual vision" color={C.spica} />
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${C.spica}06`, border: `1px solid ${C.spica}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.spica, marginBottom: 6 }}>Key Conclusion</div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
              Restructuring audio descriptions from passive audio description into active, multi-granularity exploration significantly improves both comprehension and immersion for BLV users.
            </div>
          </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 11-14: AROMA
   ═══════════════════════════════════════════════════════════════ */
function AromaSlides() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} color={C.aroma} prefix="aroma" />

      <div id="aroma-overview" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Cooking demands continuous multi-sensory assessment&mdash;monitoring color changes, judging texture, tracking spatial
            layout&mdash;yet BLV users must accomplish all of this through touch, smell, sound, and spatial memory alone. Video
            recipes, the most popular instructional format, are designed entirely for sighted viewers. <strong>AROMA is a
            mixed-initiative system</strong> that pairs the user&rsquo;s embodied non-visual expertise with AI visual sensing
            through a wearable camera, providing both on-demand conversational guidance and proactive monitoring. The key insight:
            rather than compensating for &ldquo;missing&rdquo; vision, AROMA <strong>co-reasons with users&rsquo; existing
            embodied expertise</strong>.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="BLV PARTICIPANTS" value="8" sub="each cooked in their own kitchen or a prefered location" color={C.aroma} />
            {/* <StatCard label="EVENT MAPPING" value="82%" sub="accuracy" color={C.aroma} /> */}
            <StatCard label="CONVERSATIONAL" value="6.13/7" sub="importance rating" color={C.aroma} />
            {/* <StatCard label="COMPENSATION" value="$50" sub="per participant" color={C.aroma} /> */}
          </div>
          <Figure src="/figures/aroma-teaser.png" caption="AROMA: BLV user cooking with wearable camera — system provides on-demand and proactive assistance" />
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>Design Goals</div>
            {[
              ["DG1", "Flexible recipe interaction — conversational access to steps, ingredients, and techniques without rewinding; supports follow-up questions and spatial workspace queries"],
              ["DG2", "Mixed-initiative support — respond to voice queries while proactively monitoring for deviations via wearable camera analyzing the scene every 2 seconds"],
              ["DG3", "Bridge embodied perception and video knowledge — fuse the user's non-visual cues (texture, aroma, sound) with AI visual analysis and structured recipe content"],
            ].map(([dg, desc]) => (
              <div key={dg} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.aroma, background: `${C.aroma}12`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{dg}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="aroma-architecture" style={{ scrollMarginTop: 140 }}>
          <Figure src="/figures/aroma-sys-arch.png" caption="AROMA System Architecture: video extraction, real-time visual agent, conversational agent, shared context" maxW={800} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginTop: 24 }}>
            {[
              { title: "Video Extraction Pipeline", desc: "Parses recipe video into structured JSON knowledge base — spoken instructions, visual descriptions, environmental sounds" },
              { title: "Real-Time Visual Agent", desc: "Wearable camera feed analyzed every 2 seconds. Compares observations with recipe knowledge to detect errors and track progress" },
              { title: "Conversational Agent", desc: "Handles user voice queries using non-visual input, visual information, and session context. Supports follow-up questions" },
              { title: "Context Management", desc: "Shared memory across both agents — conversational history, periodic visual analysis results, recipe state tracking" },
            ].map(m => (
              <div key={m.title} style={{ padding: 16, borderRadius: 10, border: `1px solid ${C.aroma}20`, background: `${C.aroma}04` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.aroma, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 24 }}>6 States Governing Interaction Flow — Food State, Step, Problem-Solving, General, Follow-Ups</div>
          <Figure src="/figures/aroma-state-machine.png" caption="Response State Machine" maxW={700} />
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="aroma-results" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>System Performance (N=8 BLV)</div>
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.aroma}` }}>
                  {["Participant", "Total Queries", "Correct Mappings", "Mapping Accuracy", "Response Accuracy"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.aroma }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["P1", 10, 9, "0.90", "0.80"], ["P2", 6, 5, "0.83", "0.83"],
                  ["P3", 13, 11, "0.85", "0.69"], ["P4", 7, 5, "0.71", "0.57"],
                  ["P5", 16, 12, "0.75", "0.63"], ["P6", 11, 9, "0.82", "0.73"],
                  ["P7", 8, 7, "0.88", "0.63"], ["P8", 12, 10, "0.83", "0.58"],
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    {r.map((c, j) => <td key={j} style={{ padding: "8px 12px", color: j === 0 ? C.aroma : "#444", fontWeight: j === 0 ? 600 : 400 }}>{c}</td>)}
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${C.aroma}`, fontWeight: 700 }}>
                  {["Average", "10.4", "8.5", "0.82", "0.67"].map((c, j) => (
                    <td key={j} style={{ padding: "8px 12px", color: j === 0 ? C.charcoal : C.aroma }}>{c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Figure src="/figures/aroma-questionnaire.png" caption="Likert ratings for conversational features, proactive assistance, and video replay" maxW={650} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 20 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>CONVERSATIONAL FEATURES</div>
              <AnimatedBar label="Importance" value={6.13} color={C.aroma} sub="σ = 0.60" />
              <AnimatedBar label="Usefulness" value={6.00} color={C.aroma} sub="σ = 0.50" />
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 10 }}>PROACTIVE MONITORING</div>
              <AnimatedBar label="Importance" value={5.88} color={C.aroma} sub="σ = 0.78" />
              <AnimatedBar label="Usefulness" value={5.13} color={C.aroma} sub="σ = 0.78" />
            </div>
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="aroma-findings" style={{ scrollMarginTop: 140 }}>
          {[
            { title: "Conversational interaction enables non-linear recipe access", detail: "Users broke free from linear video playback. P3: 'I could ask what ingredients I need for the next step without hearing back from the video again.' Users iteratively refined answers, requesting spatial descriptions 'from top left to bottom right' (P3) or 'in a clockwise direction' (P1)." },
            { title: "Proactive monitoring: powerful when precise, frustrating when misaligned", detail: "P6's system detected a wrong step — 'about to put miso paste before adding tofu.' P3 valued having 'an assistant to detect some, if not all, problems.' But interventions frustrated users during intentional deviations, highlighting the need for configurable proactivity." },
            { title: "Hybrid perception loop: co-reasoning, not compensating", detail: "P5 (professional blind chef): 'I use different shapes and sizes and textures. So if the computer couldn't answer me, I could.' P4 used touch to feel two plates, then asked 'Is this the pepperoni?' for visual confirmation. Users brought embodied inferences; AI provided visual grounding." },
            { title: "Non-visual expertise as the foundation of interaction", detail: "Experienced cooks relied on sophisticated schemas — distinguishing ingredients by shape and texture (P5), feeling pan edges to gauge dough spread (P3), integrating tactile moisture cues (P4). AI validates and extends these embodied inferences rather than substituting for them." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.aroma, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.detail}</div>
            </div>
          ))}
          <ParticipantQuote text="I use different shapes and sizes and textures. So if the computer couldn't answer me, I could" who="P5 — professional blind chef, on embodied expertise" color={C.aroma} />
          <ParticipantQuote text="I could feel there were two plates. So I picked one and asked, 'Is this the pepperoni?' and got confirmation" who="P4 — on hybrid perception" color={C.aroma} />
          <ParticipantQuote text="I know I have an assistant by my side to detect some, if not all, problems" who="P3 — on proactive monitoring" color={C.aroma} />
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${C.aroma}06`, border: `1px solid ${C.aroma}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.aroma, marginBottom: 6 }}>Key Conclusion</div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
              AROMA acts as a complementary scaffold that enhances BLV users' well-practiced abilities. The most effective support validates and extends users&rsquo; own embodied perceptual inferences.
            </div>
          </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POC CAROUSEL (TRANSMOGRIFIER)
   ═══════════════════════════════════════════════════════════════ */
const POC_ITEMS = [
  { title: "Crystallizer", img: "/figures/transmogrifier-poc-crystallizer.png", desc: "Organize unstructured notes into multiple representational forms" },
  { title: "Perspective", img: "/figures/transmogrifier-poc-perspective.png", desc: "View the same data from multiple perspectives simultaneously" },
  { title: "Story Shaper", img: "/figures/transmogrifier-poc-storyshaper.png", desc: "Shape narratives across text, images, and charts" },
  { title: "Living TLDR", img: "/figures/transmogrifier-poc-tldr.png", desc: "Auto-updating summaries that stay in sync with source" },
  { title: "Learning Playground", img: "/figures/transmogrifier-poc-learning.png", desc: "Interactive learning with linked multi-modal representations" },
];

function PocCarousel() {
  const [expanded, setExpanded] = useState(null);
  const scrollRef = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(true);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 2);
    setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (expanded === null) return;
      if (e.key === "Escape") setExpanded(null);
      if (e.key === "ArrowLeft" && expanded > 0) setExpanded(expanded - 1);
      if (e.key === "ArrowRight" && expanded < POC_ITEMS.length - 1) setExpanded(expanded + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const CARD_W = 200;

  return (
    <>
      <div style={{ position: "relative" }}>
        <div ref={scrollRef} className="poc-scroll"
          style={{
            display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", paddingBottom: 6,
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}>
          {POC_ITEMS.map((poc, i) => (
            <div key={poc.title} onClick={() => setExpanded(i)}
              style={{
                flex: `0 0 ${CARD_W}px`, width: CARD_W, scrollSnapAlign: "start",
                borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden",
                background: "#fafafa", cursor: "pointer",
                transition: "box-shadow .2s, transform .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <img src={poc.img} alt={poc.title}
                style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} draggable={false} />
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.transmog, marginBottom: 2 }}>{poc.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>{poc.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {canScrollL && (
          <button onClick={() => scroll(-1)}
            style={{ position: "absolute", left: -6, top: "42%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
            ‹
          </button>
        )}
        {canScrollR && (
          <button onClick={() => scroll(1)}
            style={{ position: "absolute", right: -6, top: "42%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
            ›
          </button>
        )}
      </div>

      {expanded !== null && (
        <div onClick={() => setExpanded(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.85)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <div style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }}
               onClick={(e) => e.stopPropagation()}>
            <img src={POC_ITEMS[expanded].img} alt={POC_ITEMS[expanded].title}
              style={{ maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", borderRadius: 10 }} />
            <div style={{ textAlign: "center", color: "#fff", padding: "12px 0 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{POC_ITEMS[expanded].title}</div>
              <div style={{ fontSize: 13, color: "#ccc", marginTop: 4, maxWidth: 500, margin: "4px auto 0" }}>{POC_ITEMS[expanded].desc}</div>
            </div>
            <button onClick={() => setExpanded(null)}
              style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%",
                border: "none", background: "rgba(255,255,255,.9)", color: "#333", fontSize: 18,
                cursor: "pointer", fontWeight: 700 }}>×</button>
            {expanded > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded - 1); }}
                style={{ position: "absolute", left: -50, top: "50%", transform: "translateY(-50%)",
                  width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)",
                  color: "#fff", fontSize: 22, cursor: "pointer" }}>‹</button>
            )}
            {expanded < POC_ITEMS.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded + 1); }}
                style={{ position: "absolute", right: -50, top: "50%", transform: "translateY(-50%)",
                  width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)",
                  color: "#fff", fontSize: 22, cursor: "pointer" }}>›</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 15-18: TRANSMOGRIFIER
   ═══════════════════════════════════════════════════════════════ */
function TransmogrifierSlides() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "design", label: "Design Strategies" },
    { id: "results", label: "Study & Concepts" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} color={C.transmog} prefix="transmog" />

      <div id="transmog-overview" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Knowledge workers constantly repurpose content across formats&mdash;notes become slides, reports spawn figures,
            data tables turn into charts&mdash;yet maintaining coherence across these representations is manual, error-prone,
            and cognitively demanding. A single number change in a report can invalidate charts, summaries, and illustrations
            simultaneously. <strong>TRANSMOGRIFIER introduces <em>interpretive linking</em></strong>&mdash;extending
            brushing-and-linking from information visualization to heterogeneous knowledge artifacts. Interpretive linking uses generative AI to detect semantic correspondences,
            propagate changes, and maintain coherence&mdash;keeping every transformation <strong>interpretable and reversible</strong>.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="PROFESSIONALS" value="6" sub="probe-to-prototype study" color={C.transmog} />
            <StatCard label="CONCEPTS" value="22" sub="workflow concepts proposed" color={C.transmog} />
            {/* <StatCard label="MODELS" value="GPT-4o" sub="+ Stable Diffusion" color={C.transmog} />
            <StatCard label="GPU" value="RTX 4090" sub="NVIDIA GeForce" color={C.transmog} /> */}
          </div>
          <Figure src="/figures/transmogrifier-workflow.png" caption="TRANSMOGRIFIER: Interpretive linking across text, charts, and images with semantic propagation" />
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="transmog-design" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Transformation Pipelines</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { title: "Text → Text/Chart", desc: "LLM incorporates source content, target meta-description, version history. Generates HTML for charts." },
              { title: "Text → Image", desc: "Controlled pipeline: analyze style → generate prompt → segment referenced object → inpaint new object." },
              { title: "Image → Image", desc: "LLM analyzes modified source → infers change → identifies target region → performs inpainting." },
            ].map(p => (
              <div key={p.title} style={{ flex: "1 1 200px", padding: 14, borderRadius: 8, border: "1px solid #e8e8e8" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.transmog, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 16 }}>Three Key Components</div>
          <Figure src="/figures/transmogrifier-pipeline.png" caption="TRANSMOGRIFIER: Cross-representation linking pipeline" maxW={450} />
          {[
            { ds: "1", title: "Meta-descriptions as soft constraints", desc: "Each content block has a free-form meta-description (e.g., 'bullet points for presentation') that guides how content should be transformed into that representation.", color: C.transmog },
            { ds: "2", title: "Version history for minimal change", desc: "System preserves intent by updating only semantically corresponding portions. Version history ensures changes are minimal and traceable.", color: C.transmog },
            { ds: "3", title: "Visual traceability", desc: "Bold/struck-through text, highlighted image regions, and brushing interactions reveal relationships between linked representations.", color: C.transmog },
          ].map(s => (
            <div key={s.ds} style={{ padding: 18, borderRadius: 10, border: `1px solid ${s.color}30`, background: `${s.color}04`, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: s.color, padding: "2px 10px", borderRadius: 4 }}>{s.ds}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
          <Figure src="/figures/transmogrifier-txt-img.png" caption="Text-to-image propagation: segmentation + inpainting avoids unintended visual changes" maxW={700} />
          <Figure src="/figures/transmogrifier-scenarios.png" caption="Selected proof-of-concept application scenarios proposed by participants" maxW={800} video="/videos/collaborative-demo.mp4" />
          <div style={{ borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden", background: "#fafafa" }}>
            <video
              src="/videos/a11y.mp4"
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", display: "block" }}
            />
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                An accessibility scenario where the concept of "cat" is conveyed through American Sign Language alongside a visual image&mdash;demonstrating cross-modal representation for inclusive communication.
              </div>
            </div>
          </div>
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="transmog-results" style={{ scrollMarginTop: 140 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Probe-to-Prototype Study: 6 Professionals, 22 Concepts</div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 20 }}>
            Participants from diverse backgrounds (UX researcher, graphics designer, content designers, project manager, technical artist)
            explored the technology probe over two sessions (60 min + 30 min reflection, 5-7 days apart) and proposed 22 workflow concepts.
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12, marginTop: 20 }}>Proof-of-Concept Applications</div>
          <PocCarousel />
      </div>

      <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />

      <div id="transmog-findings" style={{ scrollMarginTop: 140 }}>
          {[
            { title: "Value concentrates in hard, cascading changes", detail: "Most compelling use cases: maintaining cross-document number consistency, adapting content across audiences, propagating visual changes through illustration series — tasks that are hours of manual work and error-prone." },
            { title: "Bidirectional editing enables representation-native thinking", detail: "P4: 'Edit right away and focus on the content, not on how to talk to the system.' Users edited in whatever form fit the task — text, chart, or image — and the system maintained coherence. P5: 'You could see many different ways of seeing the same information.'" },
            { title: "A new AI interaction paradigm", detail: "Unlike chat-based AI where users craft prompts, interpretive linking embeds AI into the creative workflow itself. Users work through representations rather than on documents — editing any representation implicitly edits the underlying semantic substrate. P3 described it as having an 'AI collaborator.'" },
            { title: "Trust hinges on inspectability and reversibility", detail: "Even rare failures massively erode confidence. Participants demanded explicit accept/reject controls, change tracking (bold/strikethrough), and version history for every propagated change. P6 stressed 'grounding generated content in selected source materials and tracking provenance.'" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.transmog, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.detail}</div>
            </div>
          ))}
          <ParticipantQuote text="You could see many different ways of seeing the same information. That was really cool" who="P5 — on representational flexibility" color={C.transmog} />
          <ParticipantQuote text="Seeing text brought to life — especially valuable when creating alternatives would otherwise require substantial manual effort" who="P1 — on cross-modal transformation" color={C.transmog} />
          <ParticipantQuote text="Pretty unique... and super valuable — the ability to edit content across any representation and propagate changes" who="P4 — on bidirectional editing" color={C.transmog} />
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: `${C.transmog}06`, border: `1px solid ${C.transmog}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.transmog, marginBottom: 6 }}>Key Conclusion</div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
              Generative AI can serve as a coordination mechanism across heterogeneous knowledge representations when every transformation remains inspectable, reversible, and semantically grounded.
            </div>
          </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 19: BRAIN & NERVOUS SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function BrainNervousSystem() {
  const couplings = [
    { id: "mimosa", sys: "MIMOSA", desc: "Inspectable intermediate stages", color: C.mimosa,
      detail: "Pipeline outputs (detected objects, separated soundtracks, depth maps) exposed as editable UI elements. Visual dots on video frames let users catch and fix errors the model cannot detect in itself — each correction produces a multimodal trace of human spatial judgment." },
    { id: "spica", sys: "SPICA", desc: "Layered multi-granularity access", color: C.spica,
      detail: "Frame-level and object-level descriptions accessible through touch, keyboard, spatial audio, and color overlays. BLV users cross-check descriptions against audio context to identify AI errors — temporal alignment and granularity control mattered more than raw model accuracy." },
    { id: "aroma", sys: "AROMA", desc: "Mixed-initiative embodied interface", color: C.aroma,
      detail: "Voice interaction + proactive visual monitoring via wearable camera. Users bring embodied expertise (touch, smell, spatial memory); AI contributes visual grounding. A blind chef remarked: 'If the computer couldn't answer me, I could' — AI validates, not replaces." },
    { id: "transmog", sys: "TRANSMOGRIFIER", desc: "Semantic substrate tracking", color: C.transmog,
      detail: "Meta-descriptions, version history, and visual traceability maintain semantic coherence across linked artifacts. Users edit in their preferred representation; the system infers intent and propagates changes. Every transformation remains inspectable and reversible." },
  ];

  return (
    <div>
      {/* Licklider 1960 Original Vision */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 16 }}>LICKLIDER'S ORIGINAL VISION (1960)</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ width: 180, padding: 24, borderRadius: "50%", textAlign: "center", border: "2px dashed #bbb", background: "#f9f9f9" }}>
            <div style={{ fontSize: 28 }}>🖥</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginTop: 6 }}>Computer</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 4, lineHeight: 1.4 }}>Routine computation, data retrieval, simulation</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <svg width="100" height="40" viewBox="0 0 100 40">
              <line x1="5" y1="20" x2="42" y2="20" stroke="#bbb" strokeWidth="1.5" strokeDasharray="4,3" />
              <line x1="58" y1="20" x2="95" y2="20" stroke="#bbb" strokeWidth="1.5" strokeDasharray="4,3" />
              <polygon points="42,15 52,20 42,25" fill="#bbb" />
              <polygon points="58,15 48,20 58,25" fill="#bbb" />
            </svg>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>Tight Coupling</div>
          </div>
          <div style={{ width: 180, padding: 24, borderRadius: "50%", textAlign: "center", border: "2px dashed #bbb", background: "#f9f9f9" }}>
            <div style={{ fontSize: 28 }}>👤</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginTop: 6 }}>Human</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 4, lineHeight: 1.4 }}>Goal setting, hypothesis formation, evaluation</div>
          </div>
        </div>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "14px 20px", background: "#f8f8f8", borderRadius: 8, border: "1px solid #e8e8e8" }}>
          <div style={{ fontSize: 12, color: "#777", lineHeight: 1.7, textAlign: "center", fontStyle: "italic" }}>
            &ldquo;Men will set the goals, formulate the hypotheses, determine the criteria, and perform the evaluations. Computing machines will do the routinizable work that must be done to prepare the way for insights and decisions.&rdquo;
          </div>
          <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 6 }}>— J.C.R. Licklider, &ldquo;Man-Computer Symbiosis,&rdquo;, 1960</div>
        </div>
      </div>

      {/* Reinterpreted for GenAI Era */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 16 }}>REINTERPRETED FOR THE GENERATIVE AI ERA</div>
      <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
        {/* AI Brain */}
        <div style={{ width: 200, padding: 28, borderRadius: "50%", textAlign: "center", border: "2px solid #e0e0e0", background: "#fafafa" }}>
          <Zap size={36} color={C.charcoal} strokeWidth={1.2} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginTop: 8 }}>AI Brain</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4, lineHeight: 1.4 }}>Scale, speed, cross-modal transformation</div>
        </div>
        {/* Connector */}
        <div style={{ textAlign: "center" }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <line x1="5" y1="20" x2="32" y2="20" stroke="#ccc" strokeWidth="2" strokeDasharray="4,3" />
            <line x1="48" y1="20" x2="75" y2="20" stroke="#ccc" strokeWidth="2" strokeDasharray="4,3" />
            <polygon points="32,15 42,20 32,25" fill="#ccc" />
            <polygon points="48,15 38,20 48,25" fill="#ccc" />
          </svg>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#999" }}>Nervous System</div>
        </div>
        {/* Human */}
        <div style={{ width: 200, padding: 28, borderRadius: "50%", textAlign: "center", border: "2px solid #2d2d2d" }}>
          <Users size={36} color={C.charcoal} strokeWidth={1.2} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginTop: 8 }}>Human Cognition</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4, lineHeight: 1.4 }}>Embodied expertise, contextual judgment</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>THE COUPLING LAYER — FOUR INSTANTIATIONS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
        {couplings.map(c => (
          <div key={c.id}
            style={{ padding: "14px 16px", borderRadius: 8, borderLeft: `3px solid ${c.color}`, background: `${c.color}08`, transition: "all 0.25s" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.sys}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{c.desc}</div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e8e8e8", lineHeight: 1.5 }}>{c.detail}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 20, background: "#fafafa", borderRadius: 10, border: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, textAlign: "center", fontStyle: "italic", marginBottom: 10 }}>
            LLMs hallucinate, produce locally coherent but globally inconsistent outputs, and fail unpredictably.
            These are not engineering defects awaiting a fix &mdash; they are consequences of data-driven training.
          </div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, textAlign: "center", fontStyle: "italic", marginBottom: 12 }}>
            The user&rsquo;s ongoing perception, domain expertise, and contextual awareness function as continuous alignment
            signals that compensate where models fall short.
          </div>
          {/* <div style={{ fontWeight: 600, fontSize: 13, color: C.charcoal, textAlign: "center" }}>
            The practical implication: shift from optimizing model autonomy &rarr; optimizing <strong style={{ color: C.mimosa }}>the quality of human-AI coupling</strong>
          </div> */}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 20: TWO AXES — FUTURE DIRECTIONS
   ═══════════════════════════════════════════════════════════════ */
function TwoAxesPlot() {
  const dCol = "#2B7EC1";
  const hCol = "#8B5E83";

  const axisData = [
    {
      id: "data", Icon: BarChart3, color: dCol,
      title: "Data-Driven",
      subtitle: "Evaluate Technical Feasibility & Scalability",
      question: "Can the system do it?",
      aspects: [
        "Automated benchmarks on standard datasets (precision, recall)",
        "Robustness and generalizability across diverse inputs",
        "Latency, cost, and computational scalability",
        "Model capability: what AI can perceive, reason, and generate",
      ],
      detail: <>Current training captures what environments look like and what people have written, but not what an environment <em>affords</em> for a situated agent. User corrections produce multimodal traces encoding <em>how</em> humans arrive at judgments, not just what the correct answer was &mdash; a richer data source for advancing personalized model intelligence.</>,
    },
    {
      id: "human", Icon: Users, color: hCol,
      title: "Human-Centered",
      subtitle: "Evaluate from User Perspective & Situated Use",
      question: "Does it serve human needs?",
      aspects: [
        "Usability and experience studies in real-world contexts",
        "Cognitive load and working memory demands at point of use",
        "Trust calibration, sense of agency, error recoverability",
        "Bottom-up benchmarks starting from situated use cases",
      ],
      detail: <>Current benchmarks (MMLU, HumanEval, Chatbot Arena) measure model output statistically but omit personalized experience. Evaluation must start from situated use: the cook who must judge doneness before food burns, the viewer following a plot across scene transitions. Metrics should capture cognitive load, trust, and mental model coherence at the point of use.</>,
    },
  ];

  const renderPanel = (ax, radius) => (
    <div
      style={{ flex: 1, padding: "22px 24px", borderRadius: radius,
        background: `${ax.color}08`,
        border: `1.5px solid ${ax.color}30`, borderRight: radius.startsWith("12") ? "none" : undefined, borderLeft: radius.startsWith("0") ? "none" : undefined,
        transition: "all 0.25s" }}>
      <ax.Icon size={26} color={ax.color} strokeWidth={1.4} />
      <div style={{ fontSize: 15, fontWeight: 700, color: ax.color, marginTop: 8 }}>{ax.title}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontStyle: "italic" }}>{ax.subtitle}</div>
      <div style={{ marginTop: 14, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
        {ax.aspects.map((item, j) => (
          <div key={j} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ax.color, marginTop: 6, flexShrink: 0, opacity: 0.5 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "8px 12px", background: `${ax.color}0a`, borderRadius: 6, border: `1px solid ${ax.color}15` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: ax.color }}>{ax.question}</div>
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: "#666", lineHeight: 1.6, paddingTop: 12, borderTop: `1px solid ${ax.color}20` }}>
        {ax.detail}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {renderPanel(axisData[0], "12px 0 0 12px")}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "20px 14px", background: "#fff", minWidth: 76,
          borderTop: "1.5px solid #e8e8e8", borderBottom: "1.5px solid #e8e8e8" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Comple&shy;mentary</div>
          <svg width="50" height="36" viewBox="0 0 50 36">
            <line x1="4" y1="13" x2="42" y2="13" stroke={dCol} strokeWidth="1.5" />
            <polygon points="40,9 48,13 40,17" fill={dCol} />
            <line x1="46" y1="23" x2="8" y2="23" stroke={hCol} strokeWidth="1.5" />
            <polygon points="10,19 2,23 10,27" fill={hCol} />
          </svg>
          <div style={{ fontSize: 8, color: "#bbb", textAlign: "center", marginTop: 6, lineHeight: 1.3 }}>Neither alone<br/>is sufficient</div>
        </div>

        {renderPanel(axisData[1], "0 12px 12px 0")}
      </div>

      {/* Convergence insight */}
      <div style={{ marginTop: 20, padding: "16px 20px", background: "#fafafa", borderRadius: 10, border: "1px solid #e8e8e8" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <svg width="180" height="22" viewBox="0 0 180 22">
            <line x1="10" y1="3" x2="85" y2="17" stroke={dCol} strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1="170" y1="3" x2="95" y2="17" stroke={hCol} strokeWidth="1.5" strokeDasharray="4,3" />
            <circle cx="90" cy="18" r="3" fill={C.charcoal} />
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, textAlign: "center", marginBottom: 6 }}>
          Building effective human-AI systems requires progress along <strong>both</strong> axes
        </div>
        {/* <div style={{ fontSize: 11, color: "#777", textAlign: "center", lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>
          Building effective human-AI systems requires progress along <strong>both</strong> axes:
          data-driven methods validate what the technology can achieve,
          while human-centered methods ensure that achievement translates into real benefit at the point of use.
        </div> */}
        {/* <div style={{ fontSize: 10, color: "#999", fontStyle: "italic", paddingTop: 10, marginTop: 10, borderTop: "1px solid #eee", textAlign: "center" }}>
          Grounded in: Gibson (ecological affordances) &middot; Sweller (cognitive load) &middot; Dual coding theory &middot; Norman (gulfs of execution/evaluation)
        </div> */}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 21: OVERARCHING DESIGN PRINCIPLES
   ═══════════════════════════════════════════════════════════════ */
function OverarchingFlow() {
  const challenges = [
    { id: "error", label: "Error Handling", color: C.red, Icon: AlertTriangle,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Expose intermediate AI results as inspectable, editable elements — MIMOSA shows pipeline stages; TRANSMOGRIFIER shows change diffs with bold/strikethrough",
        "Support error discovery through cross-modal verification — MIMOSA uses visual dots for audio errors; AROMS lets users ask follow-ups against the on-going session",
        "Error-handling cannot be modality-agnostic — it must account for the perceptual affordances of each output channel (visual, auditory, tactile)",
      ],
      nlqEvidence: {
        finding: "Existing error-handling mechanisms showed no significant improvement in repair accuracy",
        stat: "p = 0.82",
        statLabel: "ANOVA",
        detail: "Across 26 participants and 4 conditions (baseline, explanation-based, visualization, conversational dialog), average repair accuracy remained ~56% with no significant differences. Users struggled when \"none of the recommended options made sense\" (P15) or when errors spanned multiple locations (P24).",
        implication: "Corroborates the thesis principle: exposing intermediate AI state for direct manipulation outperforms one-shot error-correction tools. The four systems each make AI internals inspectable rather than relying on external repair mechanisms.",
      },
    },
    { id: "cognitive", label: "Cognitive Load", color: C.orange, Icon: Brain,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Coordinate channels to reduce mental effort — MIMOSA visualizes audio positions on video; SPICA layers information by temporal then spatial granularity and allow both key-board and touch exploration.",
        "Proactive coordination in high-stakes tasks — AROMA monitors cooking state and alerts before errors become irreversible (e.g., miso before tofu)",
        "Quality of cognition depends on coordination quality among representations — TRANSMOGRIFIER's semantic substrate maintains coherence as attention shifts",
      ],
      nlqEvidence: {
        finding: "Attention misalignment between human and model is significantly correlated with AI errors",
        stat: "p < 0.05",
        statLabel: "ALL K VALUES",
        detail: "When the NL2SQL model generated correct queries, human-model attention alignment was significantly higher than for erroneous queries (77.6% keyword coverage at K=12). Below 67% alignment, all queries were incorrect, i.e., low alignment reliably predicts failure.",
        implication: "Supports the thesis argument that cognitive load arises from misalignment between human and AI representations. The four systems each coordinate multiple modalities to keep human attention aligned with AI state.",
      },
    },
    { id: "diverse", label: "Diverse Capabilities", color: C.blue, Icon: Users,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Adapt to user's preferred sensory channels — SPICA offers touch, keyboard, spatial audio, and color overlays for different visual conditions",
        "Leverage embodied expertise as an alignment signal — AROMA's blind chef validates AI through touch and spatial memory rather than deferring to vision",
        "Multiple interaction strategies at varying precision — TRANSMOGRIFIER supports text, chart, and image transformation, and allows multi-user collaboration",
      ],
      nlqEvidence: {
        finding: "Effectiveness of error-handling strategies varies by user expertise, with no one-size-fits-all solution",
        stat: "3 levels",
        statLabel: "EXPERTISE",
        detail: "Novice users (9) preferred visualization and step-by-step explanations that lower the barrier to understanding. Experienced users (7) preferred direct editing and execution-result previews for efficient validation. Intermediate users (10) fell between. For easy queries, direct editing was significantly faster (p=0.04).",
        implication: "Directly motivates the thesis principle of offering multiple interaction strategies at varying precision levels. Each system provides alternative modalities and granularities rather than a single fixed interface.",
      },
    },
  ];
  const systems = [
    { id: "mimosa", name: "MIMOSA", color: C.mimosa },
    { id: "spica", name: "SPICA", color: C.spica },
    { id: "aroma", name: "AROMA", color: C.aroma },
    { id: "transmog", name: "TRANSMOGRIFIER", color: C.transmog },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>CHALLENGES</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {challenges.map(ch => (
          <div key={ch.id}
            style={{
              flex: "1 1 160px", padding: "16px 14px", borderRadius: 10, textAlign: "center",
              border: `2px solid ${ch.color}40`,
              background: `${ch.color}08`,
            }}>
            <ch.Icon size={24} color={ch.color} strokeWidth={1.5} />
            <div style={{ fontSize: 12, fontWeight: 700, color: ch.color, marginTop: 6 }}>{ch.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <svg width="200" height="20"><line x1="100" y1="0" x2="100" y2="14" stroke="#999" strokeWidth="1.5" /><polygon points="96,12 100,20 104,12" fill="#999" /></svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>SYSTEMS</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {systems.map(sys => (
          <div key={sys.id} style={{
            flex: "1 1 100px", padding: "12px 10px", borderRadius: 8, textAlign: "center",
            border: `1.5px solid ${sys.color}`,
            background: `${sys.color}10`,
          }}><div style={{ fontSize: 12, fontWeight: 700, color: sys.color }}>{sys.name}</div></div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <svg width="200" height="20"><line x1="100" y1="0" x2="100" y2="14" stroke="#999" strokeWidth="1.5" /><polygon points="96,12 100,20 104,12" fill="#999" /></svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>DESIGN IMPLICATIONS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {challenges.map(ch => (
          <div key={ch.id} style={{ padding: 18, borderRadius: 10, border: "1px solid #e0e0e0", background: `${ch.color}04`, borderLeft: `3px solid ${ch.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ch.color, marginBottom: 10 }}>{ch.label}</div>
            {ch.implications.map((imp, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < ch.implications.length - 1 ? 10 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ch.color, marginTop: 6, flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{imp}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Empirical Grounding: NLQ Study ── */}
      {/* <NLQEvidencePanel challenges={challenges} /> */}
    </div>
  );
}

/* ── NLQ Empirical Grounding sub-component ── */
function NLQEvidencePanel({ challenges }) {
  const isMobile = useIsMobile();
  const alignmentData = [
    { k: 3, correct: 0.36, incorrect: 0.24 },
    { k: 6, correct: 0.54, incorrect: 0.36 },
    { k: 9, correct: 0.72, incorrect: 0.56 },
    { k: 12, correct: 0.82, incorrect: 0.70 },
    { k: 15, correct: 0.89, incorrect: 0.79 },
  ];
  const conditionData = [
    { label: "Baseline", acc: 0.55 },
    { label: "Explanation", acc: 0.56 },
    { label: "Visualization", acc: 0.60 },
    { label: "Conversational", acc: 0.53 },
  ];

  const vizByChallenge = {
    cognitive: (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 8 }}>
          ATTENTION ALIGNMENT: CORRECT vs. INCORRECT QUERIES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {alignmentData.map(d => (
            <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10, color: "#999", width: 36, textAlign: "right" }}>K={d.k}</div>
              <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "center" }}>
                <div style={{ height: 10, borderRadius: 3, background: "#6ab7e8", width: `${d.correct * 100}%`, transition: "width 0.6s ease" }} />
                <span style={{ fontSize: 9, color: "#6ab7e8", fontWeight: 600, whiteSpace: "nowrap" }}>{Math.round(d.correct * 100)}%</span>
              </div>
              <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "center" }}>
                <div style={{ height: 10, borderRadius: 3, background: "#f08080", width: `${d.incorrect * 100}%`, transition: "width 0.6s ease" }} />
                <span style={{ fontSize: 9, color: "#f08080", fontWeight: 600, whiteSpace: "nowrap" }}>{Math.round(d.incorrect * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#6ab7e8" }} />
            <span style={{ fontSize: 10, color: "#888" }}>Correct queries</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f08080" }} />
            <span style={{ fontSize: 10, color: "#888" }}>Incorrect queries</span>
          </div>
        </div>
      </div>
    ),
    error: (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 8 }}>
          REPAIR ACCURACY BY ERROR-HANDLING MECHANISM
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {conditionData.map(d => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10, color: "#666", width: 80, textAlign: "right" }}>{d.label}</div>
              <div style={{ flex: 1, position: "relative", height: 14, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: d.acc >= 0.56 ? `${C.red}60` : `${C.red}40`, width: `${d.acc * 100}%`, transition: "width 0.6s ease" }} />
              </div>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 600, width: 32 }}>{Math.round(d.acc * 100)}%</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#bbb", fontStyle: "italic", marginTop: 6 }}>
          No significant differences between conditions (ANOVA p=0.82)
        </div>
      </div>
    ),
    diverse: (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 8 }}>
          USER EXPERTISE DISTRIBUTION (N=26)
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { level: "Novice", n: 9, pref: "Visualization + explanations", color: "#6ab7e8" },
            { level: "Intermediate", n: 10, pref: "Mixed strategies", color: "#f5b342" },
            { level: "Expert", n: 7, pref: "Direct editing + data preview", color: "#6bc48a" },
          ].map(g => (
            <div key={g.level} style={{
              flex: "1 1 120px", padding: "10px 12px", borderRadius: 8,
              background: `${g.color}12`, border: `1px solid ${g.color}30`,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: g.color }}>{g.n}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{g.level}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>Preferred: {g.pref}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 16px", borderRadius: 10,
          background: "#f8f6ff",
          border: "1.5px solid #7c6bc4",
        }}
      >
        <BookOpen size={16} color="#7c6bc4" strokeWidth={1.5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#7c6bc4" }}>
            EMPIRICAL GROUNDING
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            NL2SQL Error Study (Appendix) &mdash; 3 studies, 4 models, 26 participants, 48 error types
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{
          padding: "16px 18px", borderRadius: 10, background: "#f8f6ff",
          border: "1px solid #e8e4f4", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
            An empirical study across three investigations into Natural Language to SQL (NL2SQL) errors provides
            independent evidence for the design principles derived from the four systems. The study analyzed errors
            from 4 NL2SQL models (SmBoP, BRIDGE, GAZP, DIN-SQL+GPT-4), developed a 48-type error taxonomy, measured
            human-model attention alignment on 200 tasks, and evaluated error-handling mechanisms with 26 participants.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px", padding: "14px 16px", borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 4 }}>STUDY 1: ERROR TAXONOMY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#7c6bc4" }}>48</div>
            <div style={{ fontSize: 11, color: "#666" }}>error types identified across syntactic and semantic dimensions from 4 models</div>
          </div>
          <div style={{ flex: "1 1 160px", padding: "14px 16px", borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 4 }}>STUDY 2: ATTENTION</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#7c6bc4" }}>77.6%</div>
            <div style={{ fontSize: 11, color: "#666" }}>human-model attention alignment for correct queries (K=12), significantly higher than incorrect</div>
          </div>
          <div style={{ flex: "1 1 160px", padding: "14px 16px", borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999", marginBottom: 4 }}>STUDY 3: USER STUDY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#7c6bc4" }}>~56%</div>
            <div style={{ fontSize: 11, color: "#666" }}>repair accuracy across all conditions with no significant difference (p=0.82)</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {challenges.filter(ch => ch.nlqEvidence).map(ch => (
            <div key={ch.id} style={{
              padding: 18, borderRadius: 10,
              background: `${ch.color}04`, border: `1px solid ${ch.color}20`,
              borderLeft: `3px solid ${ch.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Target size={14} color={ch.color} strokeWidth={2} />
                <div style={{ fontSize: 12, fontWeight: 700, color: ch.color }}>
                  NLQ Evidence for &ldquo;{ch.label}&rdquo;
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8, lineHeight: 1.5 }}>
                {ch.nlqEvidence.finding}
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{
                  padding: "6px 12px", borderRadius: 6, background: `${ch.color}12`,
                  display: "inline-flex", alignItems: "baseline", gap: 6,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#999" }}>{ch.nlqEvidence.statLabel}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: ch.color }}>{ch.nlqEvidence.stat}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 12 }}>
                {ch.nlqEvidence.detail}
              </div>
              {vizByChallenge[ch.id]}
              <div style={{
                padding: "10px 14px", borderRadius: 8, background: "#fff",
                border: "1px solid #e8e8e8", marginTop: 4,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Lightbulb size={14} color={ch.color} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, fontStyle: "italic" }}>
                    {ch.nlqEvidence.implication}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 16 }}>
          <div>
            <Figure src="/figures/nlq-attention-alignment.png"
              caption="Attention alignment distributions: correct queries (top, blue) cluster at higher coverage than incorrect queries (bottom, red), confirming that human-model attention misalignment correlates with AI errors (Study 2)"
              maxW={400} />
          </div>
          <div>
            <Figure src="/figures/nlq-attention-k.png"
              caption="Keyword coverage rates at varying K: correct queries consistently show higher alignment at every threshold, with all p-values < 0.05 (Study 2)"
              maxW={400} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 22: CONCLUSION
   ═══════════════════════════════════════════════════════════════ */
const CONCLUSION_ITEMS = [
  { name: "MIMOSA", color: C.mimosa, conclusion: "Decomposing opaque AI pipelines into interpretable, editable stages lets users detect errors through visual cues, repair them, and creatively augment outputs — without requiring prior audio/video editing expertise." },
  { name: "SPICA", color: C.spica, conclusion: "Restructuring audio descriptions from passive audio description into active, multi-granularity exploration significantly improves both comprehension (+1.32) and immersion (+1.96) for BLV users." },
  { name: "AROMA", color: C.aroma, conclusion: "The most effective support occurs when the system co-reasons with users' embodied perceptual expertise rather than substituting for it — validating and extending, not replacing." },
  { name: "TRANSMOGRIFIER", color: C.transmog, conclusion: "Generative AI can serve as a coordination mechanism across heterogeneous knowledge representations when every transformation remains inspectable, reversible, and semantically grounded." },
  { name: "NL2SQL STUDY", color: "#7c6bc4", conclusion: "A 48-type error taxonomy across 4 NL2SQL models and user study with three error-handling strategies provide independent empirical evidence for the design principles of error transparency and user verification." },
];

function ConclusionSlide() {
  const scrollRef = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(true);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 2);
    setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: "smooth" });
  }, []);

  const CARD_W = 240;

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div ref={scrollRef}
          style={{
            display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", paddingBottom: 6,
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}>
          {CONCLUSION_ITEMS.map(s => (
            <div key={s.name}
              style={{
                flex: `0 0 ${CARD_W}px`, width: CARD_W, scrollSnapAlign: "start",
                padding: 18, borderRadius: 10, border: `1.5px solid ${s.color}30`, background: `${s.color}04`,
                transition: "box-shadow .2s, transform .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>{s.conclusion}</div>
            </div>
          ))}
        </div>

        {canScrollL && (
          <button onClick={() => scroll(-1)}
            style={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
            ‹
          </button>
        )}
        {canScrollR && (
          <button onClick={() => scroll(1)}
            style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACKNOWLEDGMENT — COMMITTEE
   ═══════════════════════════════════════════════════════════════ */
const COMMITTEE = [
  { name: "Toby Jia-Jun Li", role: "Advisor", affiliation: "University of Notre Dame", img: "/figures/portraits/toby-li.jpg", url: "https://toby.li/" },
  { name: "Diego Gomez-Zara", role: "Committee Member", affiliation: "University of Notre Dame", img: "/figures/portraits/diego-gomez-zara.jpg", url: "https://www.dgomezara.cl/" },
  { name: "Tingyu Cheng", role: "Committee Member", affiliation: "University of Notre Dame", img: "/figures/portraits/tingyu-cheng.jpg", url: "https://tingyucheng.com/" },
  { name: "Yapeng Tian", role: "Committee Member", affiliation: "University of Texas at Dallas", img: "/figures/portraits/yapeng-tian.jpg", url: "https://www.yapengtian.com/" },
];

function PortraitCircle({ name, role, affiliation, img, url, size = 140 }) {
  const [hovered, setHovered] = useState(false);
  const Wrapper = url ? "a" : "div";
  const wrapperProps = url ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: size + 40,
        textDecoration: "none", cursor: url ? "pointer" : "default",
      }}
    >
      <div style={{
        width: size, height: size, perspective: 600,
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
          border: `3px solid ${hovered ? "#999" : "#e8e8e8"}`,
          background: "#f5f5f5",
          boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.18)" : "0 2px 12px rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s, border-color 0.3s",
          transform: hovered ? "rotateY(360deg)" : "rotateY(0deg)",
        }}>
          <img
            src={img} alt={name}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span style={{ display: "none", fontSize: size / 3, color: "#ccc", fontWeight: 700, alignItems: "center", justifyContent: "center" }}>
            {name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? "#1a1a2e" : C.charcoal, lineHeight: 1.3, transition: "color 0.2s" }}>{name}</div>
        {role && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{role}</div>}
        {affiliation && <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{affiliation}</div>}
      </div>
    </Wrapper>
  );
}

function AcknowledgmentCommitteeSlide() {
  const isMobile = useIsMobile();
  return (
    <div>
      <div style={{ fontSize: isMobile ? 13 : 14, color: "#555", lineHeight: 1.7, marginBottom: 36, maxWidth: 700, textAlign: "center", margin: "0 auto 36px" }}>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 20 : 48, flexWrap: "wrap" }}>
        {COMMITTEE.map(m => (
          <PortraitCircle key={m.name} {...m} size={isMobile ? 100 : 150} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACKNOWLEDGMENT — COLLABORATORS
   ═══════════════════════════════════════════════════════════════ */
const COLLABORATORS = [
  { name: "Anh Truong", img: "/figures/portraits/anh-truong.jpg", url: "https://brown.stanford.edu/portfolio/anh-truong/" },
  { name: "Brianna Wimer", img: "/figures/portraits/brianna-wimer.jpg", url: "https://www.briannawimer.com/" },
  { name: "Chenglong Wang", img: "/figures/portraits/chenglong-wang.jpg", url: "https://chenglongwang.org/" },
  { name: "Chenliang Xu", img: "/figures/portraits/chenliang-xu.jpg", url: "https://www.cs.rochester.edu/~cxu22/" },
  { name: "Daniel Killough", img: "/figures/portraits/daniel-killough.jpg", url: "https://scholar.google.com/citations?user=Lu3L4HoAAAAJ" },
  { name: "Dave Brown", img: "/figures/portraits/dave-brown.jpg", url: "https://www.microsoft.com/en-us/research/people/dabrown/" },
  { name: "Dingzeyu Li", img: "/figures/portraits/dingzeyu-li.jpg", url: "https://dingzeyu.li/" },
  { name: "Fanny Chevalier", img: "/figures/portraits/fanny-chevalier.png", url: "https://www.cs.toronto.edu/~fchevali/fannydotnet/" },
  { name: "Franklin Mingzhe Li", img: "/figures/portraits/franklin-li.jpg", url: "https://franklin-li.com/" },
  { name: "Hugo Romat", img: "/figures/portraits/hugo-romat.jpg", url: "https://hugoromat.com/" },
  { name: "Jeevana Priya Inala", img: "/figures/portraits/jeevana-inala.jpg", url: "https://jinala.github.io/" },
  { name: "Jerrick Ban", img: "/figures/portraits/jerrick-ban.png", url: "https://www.linkedin.com/in/jerrickban/" },
  { name: "Jiawen Li", img: "/figures/portraits/jiawen-li.jpg", url: "https://jiawen-lee.github.io/JiawenLi/" },
  { name: "JooYoung Seo", img: "/figures/portraits/jooyoung-seo.jpg", url: "https://ischool.illinois.edu/people/jooyoung-seo" },
  { name: "Kaiwen Jiang", img: "/figures/portraits/kaiwen-jiang.jpg", url: "https://scholar.google.com/citations?user=kHRmdjwAAAAJ" },
  { name: "Ken Hinckley", img: "/figures/portraits/ken-hinckley.jpg", url: "https://kenhinckley.wordpress.com/" },
  { name: "Leyang Li", img: "/figures/portraits/leyang-li.webp", url: "https://leoreoreo.github.io/" },
  { name: "Lydia B. Chilton", img: "/figures/portraits/lydia-chilton.jpg", url: "https://www.cs.columbia.edu/~chilton/chilton.html" },
  { name: "Michel Pahud", img: "/figures/portraits/michel-pahud.png", url: "https://www.microsoft.com/en-us/research/people/mpahud/" },
  { name: "Mira Dontcheva", img: "/figures/portraits/mira-dontcheva.jpg", url: "https://research.adobe.com/person/mira-dontcheva/" },
  { name: "Nathalie Riche", img: "/figures/portraits/nathalie-riche.jpg", url: "https://www.microsoft.com/en-us/research/people/nath/" },
  { name: "Nicolai Marquardt", img: "/figures/portraits/nicolai-marquardt.jpg", url: "http://www.nicolaimarquardt.com/" },
  { name: "Patrick Carrington", img: "/figures/portraits/patrick-carrington.jpg", url: "https://patrickcarrington.com/" },
  { name: "Sitong Wang", img: "/figures/portraits/sitong-wang.jpg", url: "https://sitong-wang.github.io/" },
  { name: "Tianyi Zhang", img: "/figures/portraits/tianyi-zhang.png", url: "https://tianyi-zhang.github.io/" },
  { name: "Yuan Tian", img: "/figures/portraits/yuan-tian.jpg", url: "https://yuan-tian.com/" },
  { name: "Yuhang Zhao", img: "/figures/portraits/yuhang-zhao.jpg", url: "https://www.yuhangz.com/" },
  { name: "Zheng Zhang", img: "/figures/portraits/zheng-zhang.jpg", url: "https://hci.nd.edu/people/graduate-students/zheng-zhang/" },
];

function AcknowledgmentCollaboratorsSlide() {
  const isMobile = useIsMobile();
  return (
    <div>
      <div style={{ fontSize: isMobile ? 13 : 14, color: "#555", lineHeight: 1.7, marginBottom: 32, maxWidth: 700, textAlign: "center", margin: "0 auto 32px" }}>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(80px, 1fr))" : "repeat(auto-fill, minmax(110px, 1fr))",
        gap: isMobile ? "16px 8px" : "24px 12px",
        justifyItems: "center",
        maxWidth: 960,
        margin: "0 auto",
      }}>
        {COLLABORATORS.map(c => (
          <PortraitCircle key={c.name} name={c.name} img={c.img} url={c.url} size={isMobile ? 60 : 84} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACKNOWLEDGMENT — NOTRE DAME FRIENDS
   ═══════════════════════════════════════════════════════════════ */
const ND_FRIENDS = [
  { name: "Annalisa Szymanski", img: "/figures/portraits/annalisa-szymanski.jpg", url: "https://hci.nd.edu/people/graduate-students/annalisa-szymanski/" },
  { name: "Chaoran Chen", img: "/figures/portraits/chaoran-chen.jpg", url: "https://www.chaoranchen.com/" },
  { name: "Charles Chiang", img: "/figures/portraits/charles-chiang.jpg", url: "https://charles-c-chiang.github.io/" },
  { name: "Mariana Fernández Espinosa", img: "/figures/portraits/mariana-fernandez.jpg", url: "https://hci.nd.edu/people/graduate-students/mariana-consuelo-fernandez-espinosa/" },
  { name: "Meng Chen", img: "/figures/portraits/meng-chen.webp", url: "https://meng-chen.com/" },
  { name: "Mohammed Almutairi", img: "/figures/portraits/mohammed-almutairi.png", url: "https://hci.nd.edu/people/graduate-students/mohammed-almutairi/" },
  { name: "Nandini Banerjee", img: "/figures/portraits/nandini-banerjee.jpg", url: "https://nanbantan.github.io/" },
  { name: "Niloofar Sayadi", img: "/figures/portraits/niloofar-sayadi.jpg", url: "https://sites.google.com/nd.edu/niloofarsayadi/" },
  { name: "Ningzhi Tang", img: "/figures/portraits/ningzhi-tang.jpg", url: "https://www.nztang.com/" },
  { name: "Oghenemaro Anuyah", img: "/figures/portraits/oghenemaro-anuyah.png", url: "https://anuyahmaro.github.io/" },
  { name: "Ozioma Collins Oguine", img: "/figures/portraits/ozioma-oguine.jpg", url: "https://hci.nd.edu/people/graduate-students/ozioma-collins-oguine/" },
  { name: "Si Chen", img: "/figures/portraits/si-chen.jpg", url: "https://learning.nd.edu/about/team-bios/si-chen/" },
  { name: "Simret Gebreegziabher", img: "/figures/portraits/simret-gebreegziabher.png", url: "https://simreta.github.io/" },
  { name: "Sumin Hong", img: "/figures/portraits/sumin-hong.jpg", url: "https://scholar.google.com/citations?user=gg-AUEsAAAAJ" },
  { name: "Shang Ma", img: "/figures/portraits/shang-ma.png", url: "http://shangma.org/" },
  { name: "Yuwen Lu", img: "/figures/portraits/yuwen-lu.png", url: "https://yuwen.io/" },
  { name: "Yinuo Yang", img: "/figures/portraits/yinuo-yang.png", url: "https://x.com/yino_yang" },
  { name: "Yunhao Xing", img: "/figures/portraits/yunhao-xing.jpg", url: "https://github.com/YunhaoXing" },
  { name: "Zhenwen Liang", img: "/figures/portraits/zhenwen-liang.jpg", url: "https://zhenwen-nlp.github.io/" },
];

function AcknowledgmentFriendsSlide() {
  const isMobile = useIsMobile();
  return (
    <div>
      <div style={{ fontSize: isMobile ? 13 : 14, color: "#555", lineHeight: 1.7, marginBottom: 32, maxWidth: 700, textAlign: "center", margin: "0 auto 32px" }}>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(80px, 1fr))" : "repeat(auto-fill, minmax(110px, 1fr))",
        gap: isMobile ? "16px 8px" : "24px 12px",
        justifyItems: "center",
        maxWidth: 960,
        margin: "0 auto",
      }}>
        {ND_FRIENDS.map(c => (
          <PortraitCircle key={c.name} name={c.name} img={c.img} url={c.url} size={isMobile ? 60 : 84} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: "title", label: "Title", depth: 0 },
  { id: "thesis-statement", label: "Thesis Statement", depth: 0 },
  { id: "motivation", label: "Motivation", depth: 0 },
  { id: "overview", label: "Overview", depth: 0 },
  { id: "mimosa", label: "MIMOSA", depth: 1, color: C.mimosa },
  { id: "spica", label: "SPICA", depth: 1, color: C.spica },
  { id: "aroma", label: "AROMA", depth: 1, color: C.aroma },
  { id: "transmog", label: "TRANSMOGRIFIER", depth: 1, color: C.transmog },
  { id: "symbiosis", label: "Going Beyond", depth: 0 },
  { id: "principles", label: "Conclusion", depth: 0 },
  { id: "ack-committee", label: "Acknowledgments", depth: 0 },
];

/* ═══════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif", background: "#fff",
      padding: isMobile ? "0 16px" : 0,
    }}>
        <div style={{ textAlign: "center", maxWidth: 800, padding: isMobile ? "32px 0" : "40px 32px" }}>
          <img src="/nd-logo.png" alt="University of Notre Dame" style={{ height: isMobile ? 80 : 140, marginBottom: isMobile ? 20 : 32, objectFit: "contain" }} />
          <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, letterSpacing: 4, color: "#999", marginBottom: 20 }}>PHD DISSERTATION DEFENSE</div>
          <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.35, marginBottom: 12 }}>
            Designing Multimodal Human-AI Systems to Enhance Human Cognitive Capability
          </h1>
          <div style={{ fontSize: isMobile ? 13 : 15, color: "#666", marginBottom: 40 }}>Zheng Ning &middot; University of Notre Dame</div>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#888" }}>Enter your nick name to join</div>
          <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && onLogin(name.trim())}
              placeholder="Your name"
              autoFocus
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e0e0e0",
                fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => name.trim() && onLogin(name.trim())}
              disabled={!name.trim()}
              style={{
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: name.trim() ? "#0c2340" : "#ddd", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: name.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
              }}
            >
              <LogIn size={16} /> Enter
            </button>
          </div>
        </div>
    </div>
  );
}

function isPresenter(name) {
  const n = name.toLowerCase().trim();
  return n === "ning" || n === "nz";
}

export default function App() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("title");
  const [userName, setUserName] = useState(() => {
    try { return sessionStorage.getItem("defense_user") || ""; } catch { return ""; }
  });
  const [showRemoteCursors, setShowRemoteCursors] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [chatMode, setChatMode] = useState("panel");
  const [showOutline, setShowOutline] = useState(true);
  const presenterCursorRef = useRef(null);
  const squeezed = !isMobile && chatOpen && chatMode === "panel";

  const handleLogin = (name) => {
    setUserName(name);
    try { sessionStorage.setItem("defense_user", name); } catch {}
  };

  const handlePresenterCursorChange = useCallback((cursor) => {
    presenterCursorRef.current = cursor;
  }, []);

  const handleFollowPresenter = useCallback(() => {
    const cursor = presenterCursorRef.current;
    if (!cursor) return;
    window.scrollTo({ top: Math.max(0, cursor.y - window.innerHeight / 3), behavior: "smooth" });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.2 });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!userName) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#fff", color: "#1a1a2e", position: "relative" }}>
      <Presence userName={userName} activeSection={activeSection} showRemoteCursors={showRemoteCursors} onPresenterCursorChange={handlePresenterCursorChange} />
      {showOutline && <OutlineSidebar sections={SECTIONS} activeId={activeSection} onNav={scrollTo} />}
      <div style={{
        marginRight: squeezed ? PANEL_WIDTH : 0,
        transition: "margin-right 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>

      <TopBar
        isPresenterUser={isPresenter(userName)}
        showRemoteCursors={showRemoteCursors}
        onToggleCursors={() => setShowRemoteCursors(prev => !prev)}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(prev => !prev)}
        chatUnread={chatUnread}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(prev => !prev)}
        onFollowPresenter={handleFollowPresenter}
      />

      <TitleSlide />

      <Section id="thesis-statement" label="" title="">
        <CentralArgumentSlide />
      </Section>

      <Section id="motivation" label="Motivation" title="Human Cognition Is Inherently Multimodal"
        subtitle="When multimodal channels are missing or misaligned, recurring challenges emerge: cognitive load, error handling, accommodating diverse capabilities etc.">
        <CognitionFlow />
      </Section>

      <Section id="overview" label="Overview" title="Four Systems Across Diverse Domains"
        subtitle="Each system addresses a different domain while tackling similar recurring challenges through different interactive strategies.">
        <ThesisOverview />
      </Section>

      <Section id="mimosa" label="System 1" title="MIMOSA: Spatial Audio Co-Creation" color={C.mimosa}
        subtitle="Human-AI co-creation of computational spatial audio effects on videos. C&C '24.">
        <MimosaSlides />
      </Section>

      <Section id="spica" label="System 2" title="SPICA: Interactive Video Exploration for BLV" color={C.spica}
        subtitle="Interactive video content exploration through augmented audio descriptions. CHI '24.">
        <SpicaSlides />
      </Section>

      <Section id="aroma" label="System 3" title="AROMA: Non-Visual Cooking Assistance" color={C.aroma}
        subtitle="Mixed-initiative AI assistance for non-visual cooking by grounding multimodal information. UIST '25.">
        <AromaSlides />
      </Section>

      <Section id="transmog" label="System 4" title="TRANSMOGRIFIER: Interpretive Linking" color={C.transmog}
        subtitle="Brushing and interpretive linking across heterogeneous knowledge representations.">
        <TransmogrifierSlides />
      </Section>

      <Section id="symbiosis" label="Going Beyond" title="Rethinking Man-Computer Symbiosis in the Era of GenAI"
        subtitle="Returning to Licklider's 1960 vision of human-computer symbiosis, reinterpreted for the generative AI era. Building symbiosis requires advancing not only the AI 'brain' but also the multimodal 'nervous system' — the coupling layer that connects AI capabilities with human cognition.">
        <BrainNervousSystem />
      </Section>

      <Section id="axes" label="Moving Forward" title="Towards New Symbiosis: Two Axes"
        subtitle="Two key factors drive future human-AI coupling: richer data from internal thought traces, and human-centered evaluation grounded in situated use cases.">
        <TwoAxesPlot />
      </Section>

      <Section id="principles" label="" title="Conclusion & Key Takeaways"
        subtitle="Recurring challenges drive four systems for facilitating Human-AI interaction in multimodal workflows">
        <OverarchingFlow />
        <div style={{ height: 1, background: "#e8e8e8", margin: "32px 0" }} />
        <ConclusionSlide />
      </Section>


      <Section id="ack-committee" label="Acknowledgments" title="Dissertation Committee">
        <AcknowledgmentCommitteeSlide />
      </Section>

      <Section id="ack-collaborators" label="Acknowledgments" title="Mentors & Collaborators">
        <AcknowledgmentCollaboratorsSlide />
      </Section>

      <Section id="ack-friends" label="Acknowledgments" title="Best Notre Dame Friends!">
        <AcknowledgmentFriendsSlide />
      </Section>

      </div>

      <ChatRoom userName={userName} isOpen={chatOpen} onClose={() => setChatOpen(false)} onUnreadChange={setChatUnread} mode={isMobile ? "float" : chatMode} onModeChange={setChatMode} />
    </div>
  );
}
