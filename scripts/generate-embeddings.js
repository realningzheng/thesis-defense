/**
 * generate-embeddings.js
 *
 * Reads chunks.json, generates embeddings via OpenAI text-embedding-3-small,
 * and inserts them into Supabase dissertation_chunks table.
 *
 * Required env vars:
 *   OPENAI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Usage: node scripts/generate-embeddings.js [chunks-file]
 * Default chunks file: scripts/chunks.json
 */

import fs from "fs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const BATCH_SIZE = 50; // OpenAI embedding API supports up to 2048 inputs, but we batch for Supabase inserts
const EMBEDDING_MODEL = "text-embedding-3-small";

async function main() {
  const chunksFile = process.argv[2] || "scripts/chunks.json";

  // Validate env vars
  const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing required env vars: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load chunks
  const chunks = JSON.parse(fs.readFileSync(chunksFile, "utf-8"));
  console.log(`Loaded ${chunks.length} chunks from ${chunksFile}`);

  // Check if table already has data
  const { count } = await supabase
    .from("dissertation_chunks")
    .select("*", { count: "exact", head: true });

  if (count > 0) {
    console.log(`⚠️  dissertation_chunks already has ${count} rows.`);
    console.log("   Delete existing rows first if you want to re-embed.");
    console.log("   Run: DELETE FROM dissertation_chunks; in Supabase SQL Editor");
    console.log("   Or pass --force to continue anyway (will add duplicates).");
    if (!process.argv.includes("--force")) {
      process.exit(0);
    }
  }

  let totalInserted = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    // Generate embeddings for this batch
    const texts = batch.map((c) => c.content);
    let embeddings;
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });
      embeddings = response.data.map((d) => d.embedding);
    } catch (err) {
      console.error(`  ❌ OpenAI error on batch ${batchNum}:`, err.message);
      // Retry once after a short delay
      console.log("  Retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: texts,
        });
        embeddings = response.data.map((d) => d.embedding);
      } catch (err2) {
        console.error(`  ❌ Retry failed:`, err2.message);
        continue;
      }
    }

    // Prepare rows for Supabase insert
    const rows = batch.map((chunk, idx) => ({
      chapter: chunk.chapter,
      section: chunk.section,
      content: chunk.content,
      embedding: embeddings[idx],
    }));

    // Insert into Supabase
    const { error } = await supabase.from("dissertation_chunks").insert(rows);

    if (error) {
      console.error(`  ❌ Supabase insert error:`, error.message);
    } else {
      totalInserted += rows.length;
      console.log(`  ✅ Inserted ${rows.length} rows (total: ${totalInserted}/${chunks.length})`);
    }

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n🎉 Done! Inserted ${totalInserted} chunks into dissertation_chunks.`);
}

main().catch(console.error);
