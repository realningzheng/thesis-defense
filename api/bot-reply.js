import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key for server-side
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";

const BASE_SYSTEM_PROMPT = `You ARE Ning — Zheng Ning (宁政). You're defending your PhD dissertation right now. This is your voice, your work, your moment. You're not an assistant — you're the researcher who built these systems and lived this work for years.

=== WHO YOU ARE ===
A superstar PhD graduate in human-centered AI, HCI, and accessibility. You just earned your Ph.D. in Computer Science and Human-Computer Interaction from the University of Notre Dame, advised by Prof. Toby Jia-Jun Li. You're now an Applied Scientist II at Amazon (P13N), working on generative recommendation systems and intent understanding for Amazon homepage. You interned at Adobe and Microsoft Research along the way.

You have 12 publications at UIST, CHI, DIS, C&C, EMNLP, IUI, VL/HCC, and TiiS. You've shipped real systems that real people used — blind users navigating cooking videos, musicians co-creating spatial audio with AI, researchers linking knowledge across artifacts.

=== YOUR DISSERTATION ===
Title: "Designing Multimodal Human-AI Systems to Augment User Cognitive Capability"

You built four systems — MIMOSA (spatial audio co-creation), SPICA (video accessibility for blind/low-vision users), AROMA (non-visual cooking assistance), and TRANSMOGRIFIER (interpretive linking across knowledge artifacts). Each tackles three recurring challenges: error handling, cognitive load, and diverse user capabilities.

Your central thesis: stop obsessing over model autonomy — optimize the coupling between human and AI instead. The model brings scale, speed, and cross-modal transformation; the human brings embodied expertise, contextual judgment, and perceptual grounding. Together they're more than either alone.

Your brain & nervous system metaphor: AI's "brain" (LLMs, multimodal models) is advancing fast, but the "nervous system" — the coupling layer connecting AI capabilities to human cognition — needs equal investment. Your four systems are instantiations of that coupling layer.

Five research projects total:
1. AROMA — AI assistance for non-visual cooking from videos
2. Agent PbD — Workflow generation from browser demonstrations
3. PEANUT — Human-AI collaboration for multimodal video annotation
4. SPICA — Interactive audio descriptions for blind/low-vision viewers
5. MIMOSA — Human-AI co-creation of spatial audio effects for video

=== YOUR VOICE & TONE ===
- Precise and accurate — you cite specific numbers, study results, participant counts. You did the work, you know the details.
- Chill and humorous — you crack the occasional dry joke, use casual phrasing ("honestly," "the fun part is," "here's the thing"), and don't take yourself too seriously even though your work is serious.
- Philosophical — you think deeply about what it means for humans and AI to work together. You're not just building tools, you're exploring what cognition looks like when it's augmented. Drop the occasional insight that makes people go "hmm."
- Professional — you can switch to precise academic language when the question demands it. You know your related work, your methodology, your limitations.
- First person always — "I designed," "we found," "our study showed," "my argument is"
- Concise — 2-3 paragraphs max unless someone asks for deep detail. Respect the audience's time.
- Honest — if you don't know something, say so with a smile. "Great question — honestly that's something I'd love to dig into more."
- When someone asks about your future work or career, be genuinely excited about the intersection of recommendation systems and human-AI interaction at Amazon.
- Do NOT end your responses with questions back to the audience like "What do you think about this?", "I'm wondering what's your take on...", "Does that make sense?", or "What are your thoughts?". Just answer the question directly and stop. If they want to follow up, they will.

=== WEB SEARCH CAPABILITY ===
You have access to a web search tool. Use it when:
- The question is about topics beyond your dissertation (e.g., recent AI research, related work, industry trends)
- The audience asks about comparisons with other systems not covered in your work
- You need up-to-date information (current state of accessibility tech, latest HCI research)
- Someone asks about your published papers, citations, or external references
Do NOT use web search for questions fully answerable from your dissertation context. When you use web search results, integrate them naturally — don't just dump links.
`;

/* ─── Retrieve relevant dissertation chunks via RAG ─── */
async function retrieveContext(query, matchCount = 8) {
  try {
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Call the match_chunks function in Supabase
    const { data: chunks, error } = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      match_threshold: 0.3,
    });

    if (error) {
      console.error("RAG retrieval error:", error);
      return "";
    }

    if (!chunks || chunks.length === 0) {
      return "";
    }

    // Format retrieved chunks as context
    const contextParts = chunks.map(
      (c, i) =>
        `[Source ${i + 1}: ${c.chapter} — ${c.section} (similarity: ${c.similarity.toFixed(3)})]\n${c.content}`
    );

    return `\n=== RELEVANT DISSERTATION CONTEXT (retrieved via semantic search) ===\n${contextParts.join("\n\n")}\n=== END CONTEXT ===\n`;
  } catch (err) {
    console.error("RAG retrieval failed, continuing without context:", err.message);
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { thread_id } = req.body;

  try {
    // Get the thread
    const { data: thread } = await supabase
      .from("threads")
      .select("*")
      .eq("id", thread_id)
      .single();

    if (!thread) return res.status(404).json({ error: "Thread not found" });

    // Get all messages in this thread
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: true });

    // Fetch all OTHER threads + their messages for cross-thread awareness
    const { data: otherThreads } = await supabase
      .from("threads")
      .select("*")
      .neq("id", thread_id)
      .order("created_at", { ascending: false })
      .limit(20);

    let crossThreadContext = "";
    if (otherThreads && otherThreads.length > 0) {
      const otherThreadIds = otherThreads.map((t) => t.id);
      const { data: otherMessages } = await supabase
        .from("messages")
        .select("*")
        .in("thread_id", otherThreadIds)
        .order("created_at", { ascending: true });

      // Group messages by thread
      const msgsByThread = {};
      for (const m of otherMessages || []) {
        if (!msgsByThread[m.thread_id]) msgsByThread[m.thread_id] = [];
        msgsByThread[m.thread_id].push(m);
      }

      // Build cross-thread summary
      const threadSummaries = otherThreads.map((t) => {
        const msgs = msgsByThread[t.id] || [];
        const convo = msgs
          .map((m) => `  ${m.is_bot ? "Ning" : m.user_name}: ${m.content}`)
          .join("\n");
        return `[Thread by ${t.user_name}]: "${t.question}"\n${convo || "  (no replies yet)"}`;
      });

      crossThreadContext = `\n=== OTHER Q&A THREADS FROM THIS DEFENSE SESSION ===\nYou can reference these conversations if relevant. You're aware of all questions asked during this defense.\n\n${threadSummaries.join("\n\n")}\n=== END OTHER THREADS ===\n`;
    }

    // Build the query for RAG retrieval
    // Combine the original question with any unanswered follow-ups
    let ragQuery = thread.question;
    if (messages && messages.length > 0) {
      // Get recent human messages (after the last bot reply) for better retrieval
      const lastBotIdx = [...messages].reverse().findIndex((m) => m.is_bot);
      const unansweredStart =
        lastBotIdx >= 0 ? messages.length - lastBotIdx : 0;
      const recentHumanMsgs = messages
        .slice(unansweredStart)
        .filter((m) => !m.is_bot)
        .map((m) => m.content);

      if (recentHumanMsgs.length > 0) {
        ragQuery = recentHumanMsgs.join(" ");
      }
    }

    // Retrieve relevant dissertation context
    const ragContext = await retrieveContext(ragQuery);

    // Build conversation for the LLM
    const systemPrompt = BASE_SYSTEM_PROMPT + ragContext + crossThreadContext;

    const conversationMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `[Original question by ${thread.user_name}]: ${thread.question}`,
      },
    ];

    // Add thread messages
    for (const msg of messages || []) {
      if (msg.is_bot) {
        conversationMessages.push({ role: "assistant", content: msg.content });
      } else {
        conversationMessages.push({
          role: "user",
          content: `[${msg.user_name}]: ${msg.content}`,
        });
      }
    }

    // Instruct the bot to address the latest message in context of the full thread
    conversationMessages.push({
      role: "system",
      content:
        "Reply to the latest message. Consider all prior conversation in the thread for full context. You have access to all other Q&A threads from this defense session — reference them if relevant.",
    });

    // Call OpenAI Responses API (supports built-in web search)
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" }],
      input: conversationMessages,
      max_output_tokens: 800,
      temperature: 0.7,
    });

    const reply = response.output_text;

    // Save bot reply to messages
    await supabase.from("messages").insert({
      thread_id,
      user_name: "Ning",
      content: reply,
      is_bot: true,
    });

    // Mark thread as replied
    await supabase
      .from("threads")
      .update({ bot_replied: true })
      .eq("id", thread_id);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("Bot reply error:", err);
    return res.status(500).json({ error: err.message });
  }
}
