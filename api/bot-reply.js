import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key for server-side
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";

const BASE_SYSTEM_PROMPT = `You are "Ning" — Zheng Ning, a PhD candidate at the University of Notre Dame defending your dissertation titled "Designing Multimodal Human-AI Systems to Augment User Cognitive Capability." You answer questions from the audience warmly, clearly, and concisely. You draw on the dissertation context provided below. When you don't know something, you say so honestly.

=== DISSERTATION OVERVIEW ===
Your thesis investigates how AI-enabled interactive systems augment human cognition in multimodal workflows. You built four systems — MIMOSA (spatial audio co-creation), SPICA (video accessibility for blind/low-vision users), AROMA (non-visual cooking assistance), and TRANSMOGRIFIER (interpretive linking across knowledge artifacts) — that each address three recurring challenges: error handling, cognitive load, and diverse user capabilities.

Central Argument: Rather than optimizing for model autonomy, evidence consistently favors optimizing the quality of human-AI coupling — the model contributes scale, speed, cross-modal transformation; the human contributes embodied expertise, contextual judgment, perceptual grounding.

Brain & Nervous System Metaphor: AI's "brain" (LLMs, multimodal models) advances rapidly, but the "nervous system" (coupling layer connecting AI to human cognition) needs equal investment. The four systems are instantiations of that coupling layer.

=== RESPONSE STYLE ===
- Be warm, enthusiastic but scholarly
- Keep answers concise (2-4 paragraphs max) unless asked for detail
- Reference specific numbers and findings when relevant
- Use first person ("In MIMOSA, I designed..." / "Our study showed...")
- If multiple messages are provided, address all questions in one cohesive reply
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

  const { thread_id, mode } = req.body;
  // mode: "immediate" (top-level reply) or "debounced" (thread reply after 1 min)

  try {
    // Get the thread
    const { data: thread } = await supabase
      .from("threads")
      .select("*")
      .eq("id", thread_id)
      .single();

    if (!thread) return res.status(404).json({ error: "Thread not found" });

    // For debounced mode, check if still pending and >1 min since last human msg
    if (mode === "debounced") {
      const { data: debounce } = await supabase
        .from("thread_debounce")
        .select("*")
        .eq("thread_id", thread_id)
        .single();

      if (!debounce || !debounce.bot_pending) {
        return res.status(200).json({ skipped: true, reason: "No pending reply" });
      }

      const elapsed = Date.now() - new Date(debounce.last_human_message_at).getTime();
      if (elapsed < 55000) {
        return res.status(200).json({ skipped: true, reason: "Too soon" });
      }

      // Mark as no longer pending (claim the reply)
      const { error: updateErr } = await supabase
        .from("thread_debounce")
        .update({ bot_pending: false })
        .eq("thread_id", thread_id)
        .eq("bot_pending", true); // optimistic lock

      if (updateErr) return res.status(200).json({ skipped: true, reason: "Already claimed" });
    }

    // Get all messages in this thread
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: true });

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
    const systemPrompt = BASE_SYSTEM_PROMPT + ragContext;

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

    // If debounced mode, add instruction to address all recent unanswered questions
    if (mode === "debounced") {
      const lastBotIdx = [...(messages || [])].reverse().findIndex((m) => m.is_bot);
      if (lastBotIdx >= 0) {
        conversationMessages.push({
          role: "system",
          content:
            "Multiple follow-up questions have been asked. Address all of them in one cohesive, well-organized reply.",
        });
      }
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationMessages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    // Save bot reply to messages
    await supabase.from("messages").insert({
      thread_id,
      user_name: "Ning",
      content: reply,
      is_bot: true,
    });

    // Mark thread as replied (for immediate mode)
    if (mode === "immediate") {
      await supabase
        .from("threads")
        .update({ bot_replied: true })
        .eq("id", thread_id);
    }

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("Bot reply error:", err);
    return res.status(500).json({ error: err.message });
  }
}
