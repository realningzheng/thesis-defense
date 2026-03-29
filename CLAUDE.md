# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive React web app for a PhD Dissertation Defense on "Designing Multimodal Human-AI Systems to Augment User Cognitive Capability." Features presentation slides for 4 research systems (MIMOSA, SPICA, AROMA, TRANSMOGRIFIER), a real-time collaborative Q&A chatroom with an AI bot ("Ning") using RAG, and shared cursor presence.

## Commands

```bash
npm run dev        # Start Vite dev server on :5173
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint check (eslint .)
```

**RAG pipeline (one-time setup):**
```bash
node scripts/chunk-dissertation.js <latex-dir> scripts/chunks.json
OPENAI_API_KEY=... SUPABASE_SERVICE_KEY=... node scripts/generate-embeddings.js [chunks-file]
```

## Architecture

**Stack:** React 19 (plain JSX, no TypeScript) + Vite 8 + Supabase (Postgres/pgvector/Realtime) + OpenAI + Vercel serverless functions.

### Key source files

- `src/App.jsx` — Monolithic main component. Contains all slides, navigation, shared UI components (`SlideNav`, `Section`, `Figure`, `TabBar`, `StatCard`, `ParticipantQuote`, `LinkBtn`, `AnimatedBar`, `ComparisonBar`), and a color constants object `C` for theming. All styling is inline CSS. `AnimatedBar` and `ComparisonBar` use IntersectionObserver to trigger scroll-activated animations for evaluation data.
- `src/ChatRoom.jsx` — Q&A chatroom with `ThreadList` and `ThreadDetail` subcomponents. Creates Supabase realtime channels for live message updates. Triggers bot replies via `/api/bot-reply` with immediate mode (new question) or debounced mode (follow-ups, 65s delay).
- `src/Presence.jsx` — Real-time presence and remote cursor display. Uses Supabase presence sync and broadcast channels. Throttled to 10fps for cursor position updates.
- `src/supabase.js` — Supabase client init using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `api/bot-reply.js` — Vercel serverless function implementing the RAG pipeline: generates query embedding (text-embedding-3-small), calls Supabase RPC `match_chunks()` for top-8 similar chunks, then calls gpt-4o-mini with RAG context + conversation history. Uses `thread_debounce` table for optimistic locking to prevent duplicate bot replies.

### Database schema (supabase-schema.sql)

- `threads` / `messages` / `thread_debounce` — Chat threading with bot debounce logic
- `dissertation_chunks` — pgvector store (1536-dim embeddings) with `match_chunks()` RPC for cosine similarity search
- RLS is permissive (public app for defense attendees)

### Scripts

- `scripts/chunk-dissertation.js` — Parses LaTeX files into ~500-token chunks with 2-sentence overlap
- `scripts/generate-embeddings.js` — Batch-generates OpenAI embeddings and inserts into Supabase (50/batch, auto-retry)

## Environment Variables

```
VITE_SUPABASE_URL        # Supabase project URL (frontend + backend)
VITE_SUPABASE_ANON_KEY   # Supabase anon key (frontend)
SUPABASE_SERVICE_KEY     # Supabase service key (backend/scripts only)
OPENAI_API_KEY           # OpenAI API key (backend/scripts only)
```

## Key Patterns

- **No TypeScript** — entire codebase is plain JS/JSX
- **Inline styling** — all components use React style objects with shared color constants `C`
- **State management** — React hooks only (useState, useEffect, useRef); no external state library
- **Real-time** — Supabase channels for presence sync, cursor broadcast, and message subscriptions
- **Bot debounce** — server-side `thread_debounce` table with optimistic locking prevents race conditions on concurrent bot reply triggers
- **Vercel routing** — `vercel.json` rewrites `/api/*` to serverless functions, everything else to SPA fallback
- **Scroll-triggered animations** — `AnimatedBar` and `ComparisonBar` use IntersectionObserver to animate evaluation scores when scrolled into view (cubic-bezier easing, 1s duration)
- **Content sourced from dissertation** — Slide text, findings, and participant quotes are drawn from the LaTeX dissertation at `../dissertation/`. Each system's findings tab includes inline participant quotes with attribution context
