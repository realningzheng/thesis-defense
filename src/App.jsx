import { useState, useEffect, useRef, useCallback } from "react";
import {
  ExternalLink, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Eye, Brain, MessageSquare, AlertTriangle, Users, Zap,
  Mic, Camera, BookOpen, Layers, ArrowRight, Quote,
  BarChart3, CheckCircle2, Lightbulb, Target, Workflow, LogIn
} from "lucide-react";
import ChatRoom from "./ChatRoom";
import Presence from "./Presence";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & THEME
   ═══════════════════════════════════════════════════════════════ */
const C = {
  mimosa: "#3A7CA5", spica: "#2E7D8C", aroma: "#5A8F5C", transmog: "#8B6E4E",
  charcoal: "#2d2d2d", darkGray: "#444", gray: "#888", lightGray: "#f5f5f5",
  border: "#e0e0e0", bg: "#fff", red: "#C0392B", orange: "#E67E22", blue: "#2980B9",
};

const PROJECT_LINKS = {
  mimosa: { paper: "https://arxiv.org/abs/2404.15107", site: "https://zning.co/mimosa" },
  spica: { paper: "https://arxiv.org/abs/2402.07300", site: "https://sites.google.com/nd.edu/spica" },
  aroma: { paper: "https://arxiv.org/abs/2507.10963", site: "https://zning.co/aroma" },
  transmog: { paper: null, site: "https://zning.co/transmogrifier" },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function SlideNav({ sections, activeId, onNav }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e0e0e0",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", padding: "10px 24px", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, whiteSpace: "nowrap", letterSpacing: 0.5 }}>
          PhD Defense &middot; Zheng Ning
        </span>
        <div style={{ width: 1, height: 20, background: "#ddd" }} />
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
          {sections.map(s => (
            <span key={s.id}
              onClick={() => onNav(s.id)}
              style={{
                padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
                color: activeId === s.id ? "#fff" : "#777",
                background: activeId === s.id ? C.charcoal : "transparent",
              }}
            >{s.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ id, label, title, subtitle, color, children }) {
  return (
    <div id={id} style={{ minHeight: "100vh", padding: "88px 32px 60px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        {color && <div style={{ width: 32, height: 3, background: color, borderRadius: 2 }} />}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: color || "#999" }}>{label}</span>
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 700, color: "#1a1a2e", marginBottom: subtitle ? 8 : 28, lineHeight: 1.25 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: "#666", marginBottom: 28, maxWidth: 780, lineHeight: 1.7 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Figure({ src, caption, maxW = 900 }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <figure style={{ margin: "24px 0", textAlign: "center" }}>
        <img
          src={src} alt={caption || ""}
          onClick={() => setZoomed(true)}
          style={{ maxWidth: "100%", width: maxW, borderRadius: 8, border: "1px solid #eee", cursor: "zoom-in", transition: "box-shadow 0.2s" }}
        />
        {caption && <figcaption style={{ fontSize: 11, color: "#999", marginTop: 8, fontStyle: "italic" }}>{caption}</figcaption>}
      </figure>
      {zoomed && (
        <div onClick={() => setZoomed(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 32 }}>
          <img src={src} alt={caption || ""} style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 8 }} />
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

function TabBar({ tabs, active, onChange, color }) {
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 20, flexWrap: "wrap" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
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
   SLIDE 0: TITLE
   ═══════════════════════════════════════════════════════════════ */
function TitleSlide() {
  return (
    <div id="title" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 4, color: "#999", marginBottom: 20 }}>PHD DISSERTATION DEFENSE</div>
      <h1 style={{ fontSize: 38, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3, maxWidth: 800, marginBottom: 16 }}>
        Designing Multimodal Human-AI Systems to Augment User Cognitive Capability
      </h1>
      <div style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>Zheng Ning</div>
      <div style={{ fontSize: 13, color: "#999", marginBottom: 40 }}>University of Notre Dame &middot; Department of Computer Science and Engineering</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { name: "MIMOSA", color: C.mimosa, venue: "C&C '24" },
          { name: "SPICA", color: C.spica, venue: "CHI '24" },
          { name: "AROMA", color: C.aroma, venue: "UIST '25" },
          { name: "TRANSMOGRIFIER", color: C.transmog, venue: "Under Review" },
        ].map(s => (
          <div key={s.name} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${s.color}30`, background: `${s.color}06` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.name}</span>
            <span style={{ fontSize: 10, color: "#999", marginLeft: 8 }}>{s.venue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 1: MOTIVATION — COGNITION FLOW
   ═══════════════════════════════════════════════════════════════ */
function CognitionFlow() {
  const [activePhase, setActivePhase] = useState(null);
  const phases = [
    { id: "perception", label: "Perception", Icon: Eye, color: C.mimosa,
      channels: ["Sight", "Hearing", "Touch", "Smell", "Taste"],
      challenge: "A low-vision cook hears sizzling but cannot see browning",
      systems: "MIMOSA uses visual cues; SPICA adds spatial audio; AROMA leverages non-visual senses" },
    { id: "cognition", label: "Cognition", Icon: Brain, color: C.charcoal,
      channels: ["Reasoning", "Decision-making", "Mental models", "Working memory"],
      challenge: "Missing channels amplify cognitive burden on reasoning",
      systems: "All four systems reduce cognitive load by coordinating channels" },
    { id: "expression", label: "Expression", Icon: MessageSquare, color: C.transmog,
      channels: ["Speech", "Writing", "Gesture", "Manipulation"],
      challenge: "A non-speaking user must type timing-sensitive commands",
      systems: "AROMA uses voice; MIMOSA uses drag; TRANSMOGRIFIER uses direct editing" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
        {phases.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
            <div onClick={() => setActivePhase(activePhase === p.id ? null : p.id)}
              style={{
                width: 240, padding: "24px 20px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${activePhase === p.id ? p.color : "#e0e0e0"}`,
                background: activePhase === p.id ? `${p.color}08` : "#fff",
                transition: "all 0.3s", transform: activePhase === p.id ? "scale(1.04)" : "scale(1)",
              }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}><p.Icon size={32} color={p.color} strokeWidth={1.5} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, textAlign: "center", color: p.color }}>{p.label}</div>
              <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 6 }}>{p.channels.join(" · ")}</div>
              {activePhase === p.id && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
                  <div style={{ fontSize: 12, color: p.color, fontStyle: "italic", lineHeight: 1.5, marginBottom: 8 }}>&ldquo;{p.challenge}&rdquo;</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{p.systems}</div>
                </div>
              )}
            </div>
            {i < 2 && (
              <div style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowRight size={20} color="#ccc" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 20, fontStyle: "italic" }}>Click each phase to see how it maps to the four systems</p>
      <div style={{ marginTop: 32 }}>
        <Figure src="/figures/problem-space.png" caption="Problem Space: Three recurring challenges across four systems" maxW={750} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 2: THESIS OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function ThesisOverview() {
  const [selectedSys, setSelectedSys] = useState(null);
  const systems = [
    { id: "mimosa", name: "MIMOSA", color: C.mimosa, venue: "C&C '24", domain: "Spatial Audio for Videos", users: "Amateur video creators",
      thesis: "Decomposing opaque pipelines enables error detection, repair, and creative augmentation without prior expertise.",
      challenges: ["Error Handling", "Cognitive Load", "Diverse Capabilities"] },
    { id: "spica", name: "SPICA", color: C.spica, venue: "CHI '24", domain: "Video Access for BLV Users", users: "Blind or low-vision viewers",
      thesis: "Restructuring accessibility from passive description to active multi-granularity exploration improves comprehension and engagement.",
      challenges: ["Error Handling", "Cognitive Load", "Diverse Capabilities"] },
    { id: "aroma", name: "AROMA", color: C.aroma, venue: "UIST '25", domain: "Non-Visual Cooking Assistance", users: "Blind or low-vision cooks",
      thesis: "Most effective support occurs when the system validates and extends users' own embodied perceptual inferences.",
      challenges: ["Error Handling", "Cognitive Load", "Diverse Capabilities"] },
    { id: "transmog", name: "TRANSMOGRIFIER", color: C.transmog, venue: "Under Review", domain: "Knowledge Work", users: "Professional content creators",
      thesis: "Generative AI can manage semantic coherence across modalities when changes are kept inspectable and reversible.",
      challenges: ["Error Handling", "Cognitive Load", "Diverse Capabilities"] },
  ];
  const sel = systems.find(s => s.id === selectedSys);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {systems.map(s => (
          <div key={s.id} onClick={() => setSelectedSys(selectedSys === s.id ? null : s.id)}
            style={{
              flex: "1 1 200px", padding: "18px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${selectedSys === s.id ? s.color : "#e0e0e0"}`,
              background: selectedSys === s.id ? `${s.color}08` : "#fff",
              transition: "all 0.25s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.name}</span>
              <span style={{ fontSize: 10, color: "#999", background: "#f5f5f5", padding: "2px 8px", borderRadius: 10 }}>{s.venue}</span>
            </div>
            <div style={{ fontSize: 12, color: "#555" }}>{s.domain}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{s.users}</div>
          </div>
        ))}
      </div>
      {sel && (
        <div style={{ padding: 24, borderRadius: 12, border: `1.5px solid ${sel.color}30`, background: `${sel.color}04`, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: sel.color, marginBottom: 8 }}>{sel.name} — Key Thesis Contribution</div>
          <div style={{ fontSize: 14, color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>{sel.thesis}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {PROJECT_LINKS[sel.id]?.site && <LinkBtn href={PROJECT_LINKS[sel.id].site} color={sel.color}><ExternalLink size={11} /> Project</LinkBtn>}
            {PROJECT_LINKS[sel.id]?.paper && <LinkBtn href={PROJECT_LINKS[sel.id].paper} color={sel.color}><ExternalLink size={11} /> Paper</LinkBtn>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 3-6: MIMOSA
   ═══════════════════════════════════════════════════════════════ */
function MimosaSlides() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pipeline", label: "Pipeline & UI" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} color={C.mimosa} />

      {tab === "overview" && (
        <div>
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
            <StatCard label="USEFULNESS" value="6.47/7" sub="σ = 0.52" color={C.mimosa} />
            <StatCard label="IMMERSION" value="6.03/7" sub="user-generated audio" color={C.mimosa} />
          </div>
          <Figure src="/figures/mimosa.png" caption="MIMOSA: System overview — decomposed pipeline with user-in-the-loop editing" />
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
      )}

      {tab === "pipeline" && (
        <div>
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
          <Figure src="/figures/mimosa.png" caption="MIMOSA system interface: 2D overlay (left), 3D manipulation (center), audio controls (right)" />
        </div>
      )}

      {tab === "results" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 16 }}>Technical Evaluation: Immersion & Realism (8 evaluators, 6 videos, 7-point scale)</div>
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
      )}

      {tab === "findings" && (
        <div>
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
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 7-10: SPICA
   ═══════════════════════════════════════════════════════════════ */
function SpicaSlides() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pipeline", label: "Pipeline & UI" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} color={C.spica} />

      {tab === "overview" && (
        <div>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Video is essential for information, entertainment, and learning&mdash;yet it remains largely inaccessible to the
            2.2 billion people with visual impairments worldwide. Traditional audio descriptions (ADs) are passive and
            one-size-fits-all: they emphasize only key moments, force BLV users to parse narration and soundtrack simultaneously,
            and often lead to disengagement during prolonged listening. <strong>SPICA transforms video accessibility from passive
            consumption to active exploration</strong>&mdash;providing layered, multi-granularity access: frame-level captions
            for temporal navigation, and object-level descriptions with touch and keyboard exploration for spatial understanding.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="BLV PARTICIPANTS" value="14" sub="user study" color={C.spica} />
            <StatCard label="EASE OF USE" value="6.29/7" sub="σ = 0.99" color={C.spica} />
            <StatCard label="USEFULNESS" value="6.79/7" sub="σ = 0.43" color={C.spica} />
            <StatCard label="UNDERSTANDING" value="6.11" sub="vs. 4.79 baseline (p=0.033)" color={C.spica} />
          </div>
          <Figure src="/figures/spica-ui.png" caption="SPICA interface: video player with color overlay, frame-level captions, and object-level descriptions" />
          <div style={{ marginTop: 20 }}>
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
        </div>
      )}

      {tab === "pipeline" && (
        <div>
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
      )}

      {tab === "results" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>ML Pipeline Performance</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="OBJECT DETECTION PRECISION" value="0.939" sub="SD = 0.03" color={C.spica} />
            <StatCard label="OBJECT DETECTION RECALL" value="0.791" sub="SD = 0.07" color={C.spica} />
            <StatCard label="DESCRIPTION QUALITY" value="5.10/7" sub="vs. 3.91 baseline (p<0.001)" color={C.spica} />
          </div>
          <Figure src="/figures/spica-barchart.png" caption="SPICA vs. Baseline: understanding and immersion ratings from 14 BLV participants" maxW={650} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12, marginTop: 24 }}>User Study (N=14 BLV, 7-point Likert)</div>
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
      )}

      {tab === "findings" && (
        <div>
          {[
            { title: "F1: Audio descriptions anchor active exploration", detail: "61.4% of active frame explorations occurred within ±5 seconds of original ADs. P10: 'I watch video with ADs every day — those are frames worth exploring, given I have the power to do so.' Native ADs serve as importance signals that invite deeper investigation, not endpoints." },
            { title: "F2: Pausing serves three distinct cognitive purposes", detail: "Reflecting: digesting complex multi-event scenes (P4). Validating: checking adjacent frames to confirm narrative coherence — P9: 'What happened before they hugged? Did they have any eye contact?' Customizing: fast-forwarding past unengaging content to focus on personally relevant scenes (P3)." },
            { title: "F3: Users detect AI errors through cross-modal reasoning", detail: "P5 noticed a frame described two people but only one voice was heard. By checking neighboring frames (which showed one person), P5 concluded: 'I was deterministic enough to say the description was wrong.' P13 rejected 'accordion' in a kitchen scene, reasoning it was likely a cutting board." },
            { title: "F4: Sound triggers spatial curiosity", detail: "14.9% of object explorations followed new sounds. P5: 'When I heard the car engine, I wanted to know where that car was.' P4: 'When I heard noisy conversations, I wanted to know what they were doing.' P1: 'I'm always curious to know what clothes people are wearing.' Sound serves as a spatial invitation to explore." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.spica, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.detail}</div>
            </div>
          ))}
          <Figure src="/figures/spica-pause.png" caption="Exploration behavior patterns: when and how BLV users explore video content" maxW={700} />
          <ParticipantQuote text="Exploring using my fingers augments my perception towards the relative positions of different objects" who="P10 — on touch-based spatial exploration" color={C.spica} />
          <ParticipantQuote text="I like when I touched a point at the screen and a spatial sound just coming from that direction...I felt it connected me with the scene in the video" who="P11 — on multimodal immersion" color={C.spica} />
          <ParticipantQuote text="The detailed information could fill in gaps that traditional audio descriptions miss, offering a richer viewing experience" who="P6 — on layered exploration" color={C.spica} />
          <ParticipantQuote text="Once it took all the color of the other objects away, it was a lot easier to find what I want" who="P14 — on color overlay for residual vision" color={C.spica} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 11-14: AROMA
   ═══════════════════════════════════════════════════════════════ */
function AromaSlides() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "results", label: "Evaluation" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} color={C.aroma} />

      {tab === "overview" && (
        <div>
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
            <StatCard label="BLV PARTICIPANTS" value="8" sub="each cooked in their own kitchen" color={C.aroma} />
            <StatCard label="EVENT MAPPING" value="82%" sub="accuracy" color={C.aroma} />
            <StatCard label="CONVERSATIONAL" value="6.13/7" sub="importance rating" color={C.aroma} />
            <StatCard label="COMPENSATION" value="$50" sub="per participant" color={C.aroma} />
          </div>
          <Figure src="/figures/aroma-teaser.png" caption="AROMA: BLV user cooking with wearable camera — system provides on-demand and proactive assistance" />
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>Design Goals</div>
            {[
              ["DG1", "Mixed-initiative support — respond to voice queries while proactively monitoring for deviations via wearable camera analyzing the scene every 2 seconds"],
              ["DG2", "Bridge embodied perception and video knowledge — fuse the user's non-visual cues (texture, aroma, sound) with AI visual analysis and structured recipe content"],
              ["DG3", "Flexible recipe interaction — conversational access to steps, ingredients, and techniques without rewinding; supports follow-up questions and spatial workspace queries"],
            ].map(([dg, desc]) => (
              <div key={dg} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.aroma, background: `${C.aroma}12`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{dg}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "architecture" && (
        <div>
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
          <Figure src="/figures/aroma-state-machine.png" caption="Response State Machine: 6 states governing interaction flow — food state, step, problem-solving, general, follow-ups" maxW={700} />
        </div>
      )}

      {tab === "results" && (
        <div>
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
      )}

      {tab === "findings" && (
        <div>
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
              Rather than replacing tactile, auditory, olfactory, and gustatory skills, AROMA acts as a complementary scaffold
              that enhances these well-practiced abilities. The most effective support validates and extends users&rsquo; own embodied perceptual inferences.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 15-18: TRANSMOGRIFIER
   ═══════════════════════════════════════════════════════════════ */
function TransmogrifierSlides() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "design", label: "Design Strategies" },
    { id: "results", label: "Study & Concepts" },
    { id: "findings", label: "Key Findings" },
  ];

  return (
    <div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} color={C.transmog} />

      {tab === "overview" && (
        <div>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 24, maxWidth: 800 }}>
            Knowledge workers constantly repurpose content across formats&mdash;notes become slides, reports spawn figures,
            data tables turn into charts&mdash;yet maintaining coherence across these representations is manual, error-prone,
            and cognitively demanding. A single number change in a report can invalidate charts, summaries, and illustrations
            simultaneously. <strong>TRANSMOGRIFIER introduces <em>interpretive linking</em></strong>&mdash;extending
            brushing-and-linking from information visualization to heterogeneous knowledge artifacts. Unlike traditional linking
            (which requires stable identifiers), interpretive linking uses generative AI to detect semantic correspondences,
            propagate changes, and maintain coherence&mdash;keeping every transformation <strong>inspectable and reversible</strong>.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="PROFESSIONALS" value="6" sub="probe-to-prototype study" color={C.transmog} />
            <StatCard label="CONCEPTS" value="22" sub="workflow concepts proposed" color={C.transmog} />
            <StatCard label="MODELS" value="GPT-4o" sub="+ Stable Diffusion" color={C.transmog} />
            <StatCard label="GPU" value="RTX 4090" sub="NVIDIA GeForce" color={C.transmog} />
          </div>
          <Figure src="/figures/transmogrifier-workflow.png" caption="TRANSMOGRIFIER: Interpretive linking across text, charts, and images with semantic propagation" />
        </div>
      )}

      {tab === "design" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 16 }}>Three Design Strategies</div>
          {[
            { ds: "DS1", title: "Meta-descriptions as soft constraints", desc: "Each content block has a free-form meta-description (e.g., 'bullet points for presentation') that guides how content should be transformed into that representation.", color: C.transmog },
            { ds: "DS2", title: "Version history for minimal change", desc: "System preserves intent by updating only semantically corresponding portions. Version history ensures changes are minimal and traceable.", color: C.transmog },
            { ds: "DS3", title: "Visual traceability", desc: "Bold/struck-through text, highlighted image regions, and brushing interactions reveal relationships between linked representations.", color: C.transmog },
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
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12, marginTop: 24 }}>Transformation Pipelines</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
        </div>
      )}

      {tab === "results" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Probe-to-Prototype Study: 6 Professionals, 22 Concepts</div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 20 }}>
            Participants from diverse backgrounds (UX researcher, graphics designer, content designers, project manager, technical artist)
            explored the technology probe over two sessions (60 min + 30 min reflection, 5-7 days apart) and proposed 22 workflow concepts.
          </div>
          <Figure src="/figures/transmogrifier-scenarios.png" caption="Selected proof-of-concept application scenarios proposed by participants" maxW={800} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 12, marginTop: 20 }}>Proof-of-Concept Applications</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { title: "Crystallizer", img: "/figures/transmogrifier-poc-crystallizer.png", desc: "Organize unstructured meeting notes into multiple representational forms" },
              { title: "Perspective", img: "/figures/transmogrifier-poc-perspective.png", desc: "View the same data from multiple perspectives simultaneously" },
              { title: "Story Shaper", img: "/figures/transmogrifier-poc-storyshaper.png", desc: "Shape narratives across text, images, and charts" },
              { title: "Living TLDR", img: "/figures/transmogrifier-poc-tldr.png", desc: "Auto-updating summaries that stay in sync with source" },
              { title: "Learning Playground", img: "/figures/transmogrifier-poc-learning.png", desc: "Interactive learning with linked multi-modal representations" },
            ].map(poc => (
              <div key={poc.title} style={{ borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
                <img src={poc.img} alt={poc.title} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.transmog, marginBottom: 2 }}>{poc.title}</div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>{poc.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "findings" && (
        <div>
          {[
            { title: "Value concentrates in hard, cascading changes", detail: "P5: 'Nothing worse than when a number on a slide doesn't match the chart.' Most compelling use cases: maintaining cross-document number consistency, adapting content across audiences, propagating visual changes through illustration series — tasks that are hours of manual work and error-prone." },
            { title: "Bidirectional editing enables representation-native thinking", detail: "P4: 'Edit right away and focus on the content, not on how to talk to the system.' Users edited in whatever form fit the task — text, chart, or image — and the system maintained coherence. P5: 'You could see many different ways of seeing the same information.'" },
            { title: "A fundamentally new AI interaction paradigm", detail: "Unlike chat-based AI where users craft prompts, interpretive linking embeds AI into the creative workflow itself. Users work through representations rather than on documents — editing any representation implicitly edits the underlying semantic substrate. P3 described it as having an 'AI collaborator.'" },
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
          <ParticipantQuote text="Nothing worse than when a number on a slide doesn't match the chart" who="P5 — on cascading coherence" color={C.transmog} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 19: BRAIN & NERVOUS SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function BrainNervousSystem() {
  const [activeSystem, setActiveSystem] = useState(null);

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
          <div key={c.id} onClick={() => setActiveSystem(activeSystem === c.id ? null : c.id)}
            style={{ padding: "14px 16px", borderRadius: 8, cursor: "pointer", borderLeft: `3px solid ${c.color}`, background: activeSystem === c.id ? `${c.color}08` : "#fafafa", transition: "all 0.25s" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.sys}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{c.desc}</div>
            {activeSystem === c.id && (
              <div style={{ fontSize: 11, color: "#444", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e8e8e8", lineHeight: 1.5 }}>{c.detail}</div>
            )}
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
          <div style={{ fontWeight: 600, fontSize: 13, color: C.charcoal, textAlign: "center" }}>
            The practical implication: shift from optimizing model autonomy &rarr; optimizing <strong style={{ color: C.mimosa }}>the quality of human-AI coupling</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 20: TWO AXES — FUTURE DIRECTIONS
   ═══════════════════════════════════════════════════════════════ */
function TwoAxesPlot() {
  const [hoveredDot, setHoveredDot] = useState(null);
  const dots = [
    { id: "mimosa", name: "MIMOSA", x: 20, y: 60, color: C.mimosa, xLabel: "Creative tool for novices", yLabel: "Interpretable pipeline + direct manipulation" },
    { id: "spica", name: "SPICA", x: 40, y: 45, color: C.spica, xLabel: "BLV user perceptual data", yLabel: "Layered exploration + trust building" },
    { id: "aroma", name: "AROMA", x: 65, y: 30, color: C.aroma, xLabel: "Embodied multimodal traces", yLabel: "Mixed-initiative + embodied grounding" },
    { id: "transmog", name: "TRANSMOG.", x: 85, y: 18, color: C.transmog, xLabel: "Cross-modal thought traces", yLabel: "Semantic coherence + visual traceability" },
  ];
  const pW = 560, pH = 360, pL = 50, pB = 50, pT = 20, pR = 20;
  const iW = pW - pL - pR, iH = pH - pT - pB;

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
      <svg width={pW} height={pH} style={{ overflow: "visible", flexShrink: 0 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}><line x1={pL} y1={pT + iH * (1 - v/100)} x2={pL + iW} y2={pT + iH * (1 - v/100)} stroke="#f0f0f0" /><line x1={pL + iW * v/100} y1={pT} x2={pL + iW * v/100} y2={pT + iH} stroke="#f0f0f0" /></g>
        ))}
        <line x1={pL} y1={pT + iH} x2={pL + iW} y2={pT + iH} stroke="#2d2d2d" strokeWidth="1.5" />
        <line x1={pL} y1={pT + iH} x2={pL} y2={pT} stroke="#2d2d2d" strokeWidth="1.5" />
        <polygon points={`${pL + iW},${pT + iH - 4} ${pL + iW + 8},${pT + iH} ${pL + iW},${pT + iH + 4}`} fill="#2d2d2d" />
        <polygon points={`${pL - 4},${pT} ${pL},${pT - 8} ${pL + 4},${pT}`} fill="#2d2d2d" />
        <text x={pL + iW / 2} y={pH - 2} textAnchor="middle" fontSize="12" fontWeight="600" fill="#2d2d2d">Data-Driven Axis</text>
        <text x={pL + iW / 2} y={pH + 14} textAnchor="middle" fontSize="10" fill="#555" fontStyle="italic">Personalized Model Intelligence</text>
        <text x={12} y={pT + iH / 2} textAnchor="middle" fontSize="12" fontWeight="600" fill="#2d2d2d" transform={`rotate(-90, 12, ${pT + iH / 2})`}>Human-Centered Axis</text>
        <line x1={pL + iW * dots[0].x / 100} y1={pT + iH * dots[0].y / 100} x2={pL + iW * dots[3].x / 100} y2={pT + iH * dots[3].y / 100} stroke="#ddd" strokeWidth="1.5" strokeDasharray="6,4" />
        {dots.map(d => {
          const cx = pL + iW * d.x / 100, cy = pT + iH * d.y / 100, hov = hoveredDot === d.id;
          return (
            <g key={d.id} onMouseEnter={() => setHoveredDot(d.id)} onMouseLeave={() => setHoveredDot(null)} style={{ cursor: "pointer" }}>
              {hov && <circle cx={cx} cy={cy} r="20" fill="none" stroke={d.color} strokeWidth="1.5" opacity="0.3" />}
              <circle cx={cx} cy={cy} r={hov ? 12 : 9} fill={d.color} style={{ transition: "all 0.2s" }} />
              <text x={cx + 16} y={cy + 4} fontSize="11" fontWeight="600" fill={d.color}>{d.name}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ flex: 1, minWidth: 220 }}>
        {hoveredDot ? (() => {
          const d = dots.find(x => x.id === hoveredDot);
          return (
            <div style={{ padding: 20, borderRadius: 10, border: `1.5px solid ${d.color}30`, background: `${d.color}06` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: d.color, marginBottom: 10 }}>{d.name}</div>
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 1 }}>DATA-DRIVEN</div><div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{d.xLabel}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 1 }}>HUMAN-CENTERED</div><div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{d.yLabel}</div></div>
            </div>
          );
        })() : (
          <div>
            <div style={{ padding: 20, color: "#bbb", fontSize: 13 }}>Hover over a system to see its position along both axes</div>
            <div style={{ padding: 16, background: "#fafafa", borderRadius: 8, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>Two Complementary Research Axes</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 10 }}>
                <strong>Data-Driven &mdash; Unlock Personalized Model Intelligence:</strong> Current AI trains on internet data (what people <em>wrote</em>),
                but misses what environments <em>afford</em> for embodied agents. Every user correction &mdash; repositioning a sound source, rejecting a
                fabricated description, overriding a cooking-state judgment &mdash; produces multimodal traces encoding <em>how</em> humans arrive at
                judgments, not just what the correct answer was.
              </div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 10 }}>
                <strong>Human-Centered &mdash; Bottom-Up Evaluation:</strong> Current benchmarks (MMLU, HumanEval, Chatbot Arena) measure model output
                statistically but omit subjective experience. SPICA&rsquo;s models scored well on benchmarks, yet temporal alignment mattered more to BLV
                viewers. TRANSMOGRIFIER&rsquo;s correctness depended on preserving communicative intent &mdash; a judgment only users can render.
                We need evaluation starting from situated use: the cook who must judge doneness before food burns, the viewer following a plot across scene transitions.
              </div>
              <div style={{ fontSize: 10, color: "#999", fontStyle: "italic", paddingTop: 8, borderTop: "1px solid #eee" }}>
                Grounded in: Gibson (ecological affordances) &middot; Sweller (cognitive load) &middot; Dual coding theory &middot; Norman (gulfs of execution/evaluation)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 21: OVERARCHING DESIGN PRINCIPLES
   ═══════════════════════════════════════════════════════════════ */
function OverarchingFlow() {
  const [activeChallenge, setActiveChallenge] = useState(null);
  const challenges = [
    { id: "error", label: "Error Handling", color: C.red, Icon: AlertTriangle,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Expose intermediate AI results as inspectable, editable elements — MIMOSA shows pipeline stages; TRANSMOGRIFIER shows change diffs with bold/strikethrough",
        "Support error discovery through cross-modal verification — MIMOSA uses visual dots for audio errors; SPICA lets users cross-check descriptions against audio context",
        "Error-handling cannot be modality-agnostic — it must account for the perceptual affordances of each output channel (visual, auditory, tactile)",
      ] },
    { id: "cognitive", label: "Cognitive Load", color: C.orange, Icon: Brain,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Coordinate channels to reduce mental effort — MIMOSA visualizes audio positions on video; SPICA layers information by temporal then spatial granularity",
        "Proactive coordination in high-stakes tasks — AROMA monitors cooking state and alerts before errors become irreversible (e.g., miso before tofu)",
        "Quality of cognition depends on coordination quality among representations — TRANSMOGRIFIER's semantic substrate maintains coherence as attention shifts",
      ] },
    { id: "diverse", label: "Diverse Capabilities", color: C.blue, Icon: Users,
      systems: ["mimosa", "spica", "aroma", "transmog"],
      implications: [
        "Adapt to user's preferred sensory channels — SPICA offers touch, keyboard, spatial audio, and color overlays for different visual conditions",
        "Leverage embodied expertise as an alignment signal — AROMA's blind chef validates AI through touch and spatial memory rather than deferring to vision",
        "Multiple interaction strategies at varying precision — MIMOSA offers 2D dragging, 3D manipulation, and numerical input; TRANSMOGRIFIER supports text, chart, and image editing",
      ] },
  ];
  const systems = [
    { id: "mimosa", name: "MIMOSA", color: C.mimosa },
    { id: "spica", name: "SPICA", color: C.spica },
    { id: "aroma", name: "AROMA", color: C.aroma },
    { id: "transmog", name: "TRANSMOG.", color: C.transmog },
  ];
  const ac = challenges.find(c => c.id === activeChallenge);

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>CHALLENGES</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {challenges.map(ch => (
          <div key={ch.id} onClick={() => setActiveChallenge(activeChallenge === ch.id ? null : ch.id)}
            style={{
              flex: "1 1 160px", padding: "16px 14px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: `2px solid ${activeChallenge === ch.id ? ch.color : "#e0e0e0"}`,
              background: activeChallenge === ch.id ? `${ch.color}08` : "#fff",
              transition: "all 0.25s",
            }}>
            <ch.Icon size={24} color={activeChallenge === ch.id ? ch.color : "#666"} strokeWidth={1.5} />
            <div style={{ fontSize: 12, fontWeight: 700, color: activeChallenge === ch.id ? ch.color : "#444", marginTop: 6 }}>{ch.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <svg width="200" height="20"><line x1="100" y1="0" x2="100" y2="14" stroke={ac ? ac.color : "#ddd"} strokeWidth="1.5" /><polygon points="96,12 100,20 104,12" fill={ac ? ac.color : "#ddd"} /></svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>SYSTEMS</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {systems.map(sys => (
          <div key={sys.id} style={{
            flex: "1 1 100px", padding: "12px 10px", borderRadius: 8, textAlign: "center",
            border: `1.5px solid ${ac ? sys.color : "#e0e0e0"}`,
            background: ac ? `${sys.color}10` : "#fafafa", transition: "all 0.3s",
          }}><div style={{ fontSize: 12, fontWeight: 700, color: sys.color }}>{sys.name}</div></div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <svg width="200" height="20"><line x1="100" y1="0" x2="100" y2="14" stroke={ac ? ac.color : "#ddd"} strokeWidth="1.5" /><polygon points="96,12 100,20 104,12" fill={ac ? ac.color : "#ddd"} /></svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>DESIGN IMPLICATIONS</div>
      <div style={{ padding: 18, borderRadius: 10, border: "1px solid #e0e0e0", minHeight: 80, background: ac ? `${ac.color}04` : "#fafafa", borderLeft: ac ? `3px solid ${ac.color}` : "3px solid #e0e0e0", transition: "all 0.3s" }}>
        {ac ? ac.implications.map((imp, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < ac.implications.length - 1 ? 10 : 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ac.color, marginTop: 6, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{imp}</div>
          </div>
        )) : <div style={{ fontSize: 13, color: "#bbb", textAlign: "center" }}>Click a challenge to trace it through systems to design implications</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 22: CONCLUSION
   ═══════════════════════════════════════════════════════════════ */
function ConclusionSlide() {
  return (
    <div>
      <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 28, maxWidth: 800 }}>
        Cycling back to Licklider&rsquo;s 1960 vision of human-computer symbiosis: the classical framework remains valid,
        yet demands reinterpretation in the generative AI era. This dissertation contributes four instantiations of the
        <strong> multimodal coupling layer</strong> between AI capabilities and human cognition&mdash;each demonstrating that
        the quality of the interface, not the autonomy of the model, determines whether powerful AI translates into
        effective human augmentation.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { name: "MIMOSA", color: C.mimosa, conclusion: "Decomposing opaque AI pipelines into interpretable, editable stages lets users detect errors through visual cues, repair them, and creatively augment outputs — without requiring prior audio expertise." },
          { name: "SPICA", color: C.spica, conclusion: "Restructuring video accessibility from passive audio description into active, multi-granularity exploration significantly improves both comprehension (+1.32) and immersion (+1.96) for BLV users." },
          { name: "AROMA", color: C.aroma, conclusion: "The most effective support occurs when the system co-reasons with users' embodied perceptual expertise rather than substituting for it — validating and extending, not replacing." },
          { name: "TRANSMOGRIFIER", color: C.transmog, conclusion: "Generative AI can serve as a coordination mechanism across heterogeneous knowledge representations when every transformation remains inspectable, reversible, and semantically grounded." },
        ].map(s => (
          <div key={s.name} style={{ padding: 18, borderRadius: 10, border: `1.5px solid ${s.color}30`, background: `${s.color}04` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>{s.conclusion}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 24, borderRadius: 12, background: "#fafafa", border: "1px solid #e0e0e0", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 2, marginBottom: 10 }}>CENTRAL ARGUMENT</div>
        <div style={{ fontSize: 16, color: C.charcoal, lineHeight: 1.7, fontWeight: 500, maxWidth: 700, margin: "0 auto" }}>
          Rather than optimizing for model autonomy, evidence consistently favors optimizing the
          <strong style={{ color: C.mimosa }}> quality of human-AI coupling</strong>:
          the model contributes scale, speed, and cross-modal transformation;
          the human contributes embodied expertise, contextual judgment, and perceptual grounding.
        </div>
      </div>
      <div style={{ marginTop: 32, padding: 20, background: `${C.charcoal}04`, borderRadius: 10, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, fontStyle: "italic", maxWidth: 680, margin: "0 auto", marginBottom: 16 }}>
          Building such symbiosis requires advancing not only the AI &ldquo;brain&rdquo; but also the multimodal
          &ldquo;nervous system&rdquo; that connects AI capabilities with human cognition. This dissertation contributes
          four instantiations of that coupling layer across creative production, accessibility, embodied assistance, and knowledge work.
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.charcoal }}>
          Thank you! &nbsp; Questions?
        </div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Zheng Ning &middot; University of Notre Dame &middot; Advisor: Toby Jia-Jun Li</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: "title", label: "Title" },
  { id: "motivation", label: "Motivation" },
  { id: "overview", label: "Overview" },
  { id: "mimosa", label: "MIMOSA" },
  { id: "spica", label: "SPICA" },
  { id: "aroma", label: "AROMA" },
  { id: "transmog", label: "TRANSMOGRIFIER" },
  { id: "symbiosis", label: "Discussion" },
  { id: "axes", label: "Future" },
  { id: "principles", label: "Principles" },
  { id: "conclusion", label: "Conclusion" },
];

/* ═══════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif", background: "#fff",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: "#999", marginBottom: 16 }}>PHD DISSERTATION DEFENSE</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3, marginBottom: 8 }}>
          Designing Multimodal Human-AI Systems
        </h1>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 32 }}>Zheng Ning &middot; University of Notre Dame</div>
        <div style={{ marginBottom: 12, fontSize: 13, color: "#888" }}>Enter your name to join</div>
        <div style={{ display: "flex", gap: 8 }}>
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
              background: name.trim() ? "#2d2d2d" : "#ddd", color: "#fff",
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

export default function App() {
  const [activeSection, setActiveSection] = useState("title");
  const [userName, setUserName] = useState(() => {
    try { return sessionStorage.getItem("defense_user") || ""; } catch { return ""; }
  });

  const handleLogin = (name) => {
    setUserName(name);
    try { sessionStorage.setItem("defense_user", name); } catch {}
  };

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
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#fff", color: "#1a1a2e" }}>
      <Presence userName={userName} activeSection={activeSection} />
      <SlideNav sections={SECTIONS} activeId={activeSection} onNav={scrollTo} />

      <TitleSlide />

      <Section id="motivation" label="Motivation" title="Human Cognition Is Inherently Multimodal"
        subtitle="When multimodal channels are missing or misaligned, three recurring challenges emerge: error handling, cognitive load, and accommodating diverse capabilities.">
        <CognitionFlow />
      </Section>

      <Section id="overview" label="Dissertation" title="Four Systems Across Diverse Domains"
        subtitle="Each system addresses a different domain while tackling the same three recurring challenges through different coupling strategies.">
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
        subtitle="Brushing and interpretive linking across heterogeneous knowledge representations. Under Review.">
        <TransmogrifierSlides />
      </Section>

      <Section id="symbiosis" label="Discussion" title="Rethinking Human-AI Symbiosis"
        subtitle="Returning to Licklider's 1960 vision of human-computer symbiosis, reinterpreted for the generative AI era. Building symbiosis requires advancing not only the AI 'brain' but also the multimodal 'nervous system' — the coupling layer that connects AI capabilities with human cognition.">
        <BrainNervousSystem />
      </Section>

      <Section id="axes" label="Future Directions" title="Towards New Symbiosis: Two Axes"
        subtitle="Two key factors drive future human-AI coupling: richer data from internal thought traces, and human-centered evaluation grounded in situated use cases.">
        <TwoAxesPlot />
      </Section>

      <Section id="principles" label="Overarching" title="Cross-Cutting Design Principles"
        subtitle="Three recurring challenges drive four systems, which together produce generalizable design implications for human-centered AI.">
        <OverarchingFlow />
      </Section>

      <Section id="conclusion" label="Conclusion" title="Contributions & Central Argument">
        <ConclusionSlide />
      </Section>

      <div style={{ padding: "32px 24px 48px", textAlign: "center", borderTop: "1px solid #e8e8e8" }}>
        <div style={{ fontSize: 12, color: "#bbb" }}>
          Thesis Defense Interactive Visuals &middot; Zheng Ning &middot; University of Notre Dame
          &nbsp;&middot;&nbsp; Logged in as <strong>{userName}</strong>
        </div>
      </div>

      <ChatRoom userName={userName} />
    </div>
  );
}
