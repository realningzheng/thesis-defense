/**
 * chunk-dissertation.js
 *
 * Reads all dissertation .tex files, strips LaTeX markup,
 * and splits into ~500-token chunks with chapter/section metadata.
 * Outputs a JSON file ready for embedding generation.
 *
 * Usage: node scripts/chunk-dissertation.js <dissertation-dir> [output-file]
 * Example: node scripts/chunk-dissertation.js ./dissertation chunks.json
 */

import fs from "fs";
import path from "path";

/* ─── Configuration ─── */
const MAX_CHUNK_TOKENS = 500; // approximate token target per chunk
const OVERLAP_SENTENCES = 2; // overlap between chunks for context continuity

/* ─── Chapter mapping (dir name → friendly name) ─── */
const CHAPTER_MAP = {
  "diss-1-spatial-audio": "MIMOSA",
  "diss-2-accessible-video": "SPICA",
  "diss-3-non-visual-cooking": "AROMA",
  "diss-4-transmogrifier": "TRANSMOGRIFIER",
  "appendix-nlq": "Appendix-NLQ",
  "3-mimosa": "MIMOSA",
  "4-spica": "SPICA",
  "5-aroma": "AROMA",
  "6-transmogrifier": "TRANSMOGRIFIER",
  "1-intro": "Introduction",
  "2-background": "Background",
  "7-LFC": "Limitations-Future-Conclusion",
  "appendix": "Appendix",
  main: "Main",
};

function inferChapter(filePath) {
  const parts = filePath.split(path.sep);
  // Check directory names first
  for (const part of parts) {
    if (CHAPTER_MAP[part]) return CHAPTER_MAP[part];
  }
  // Check filename (without extension)
  const basename = path.basename(filePath, ".tex");
  if (CHAPTER_MAP[basename]) return CHAPTER_MAP[basename];
  // Fallback
  return basename;
}

/* ─── LaTeX stripping ─── */
function stripLatex(text) {
  let t = text;

  // Remove comments
  t = t.replace(/%.*$/gm, "");

  // Remove common environments we don't need (figures, tables markup but keep captions)
  t = t.replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, "");
  t = t.replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, "");
  t = t.replace(/\\begin\{algorithm\}[\s\S]*?\\end\{algorithm\}/g, "");
  t = t.replace(/\\begin\{lstlisting\}[\s\S]*?\\end\{lstlisting\}/g, "");

  // Convert itemize/enumerate items to bullet text
  t = t.replace(/\\item\[([^\]]*)\]/g, "- $1:");
  t = t.replace(/\\item/g, "- ");
  t = t.replace(/\\begin\{(itemize|enumerate|description)\}/g, "");
  t = t.replace(/\\end\{(itemize|enumerate|description)\}/g, "");

  // Extract text from common commands
  t = t.replace(/\\textsc\{([^}]*)\}/g, "$1");
  t = t.replace(/\\textbf\{([^}]*)\}/g, "$1");
  t = t.replace(/\\textit\{([^}]*)\}/g, "$1");
  t = t.replace(/\\emph\{([^}]*)\}/g, "$1");
  t = t.replace(/\\underline\{([^}]*)\}/g, "$1");
  t = t.replace(/\\texttt\{([^}]*)\}/g, "$1");
  t = t.replace(/\\text\{([^}]*)\}/g, "$1");

  // Remove footnotes (extract text)
  t = t.replace(/\\footnote\{([^}]*)\}/g, " ($1)");

  // Remove citations, refs, labels
  t = t.replace(/\\cite\{[^}]*\}/g, "");
  t = t.replace(/\\ref\{[^}]*\}/g, "[ref]");
  t = t.replace(/~\\ref\{[^}]*\}/g, " [ref]");
  t = t.replace(/\\label\{[^}]*\}/g, "");
  t = t.replace(/\\looseness=-?\d+/g, "");

  // Remove figure/table references
  t = t.replace(/Fig\.~?\\ref\{[^}]*\}/g, "[Figure]");
  t = t.replace(/Table~?\\ref\{[^}]*\}/g, "[Table]");

  // Remove includegraphics, usepackage, etc.
  t = t.replace(/\\includegraphics(\[[^\]]*\])?\{[^}]*\}/g, "");
  t = t.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, "");
  t = t.replace(/\\(documentclass|bibliography|bibliographystyle)\{[^}]*\}/g, "");

  // Remove remaining commands with arguments
  t = t.replace(/\\(chapter|section|subsection|subsubsection|paragraph)\*?\{([^}]*)\}/g, "\n## $2\n");

  // Remove remaining LaTeX commands (simple ones)
  t = t.replace(/\\begin\{[^}]*\}/g, "");
  t = t.replace(/\\end\{[^}]*\}/g, "");
  t = t.replace(/\\[a-zA-Z]+(\[[^\]]*\])?\{[^}]*\}/g, "");
  t = t.replace(/\\[a-zA-Z]+/g, "");

  // Clean up math mode
  t = t.replace(/\$([^$]*)\$/g, "$1");

  // Clean up braces, tildes, special chars
  t = t.replace(/[{}]/g, "");
  t = t.replace(/~/g, " ");
  t = t.replace(/``/g, '"');
  t = t.replace(/''/g, '"');
  t = t.replace(/\\&/g, "&");
  t = t.replace(/\\_/g, "_");

  // Collapse whitespace
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]+/g, " ");

  return t.trim();
}

/* ─── Section extraction ─── */
function extractSections(text) {
  const sectionRegex = /## ([^\n]+)/g;
  const sections = [];
  let match;
  const indices = [];

  while ((match = sectionRegex.exec(text)) !== null) {
    indices.push({ title: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index;
    const end = i + 1 < indices.length ? indices[i + 1].index : text.length;
    const content = text
      .slice(start, end)
      .replace(/^## [^\n]+\n*/, "")
      .trim();
    if (content.length > 50) {
      sections.push({ section: indices[i].title, content });
    }
  }

  // If no sections found, treat whole text as one section
  if (sections.length === 0 && text.trim().length > 50) {
    sections.push({ section: "General", content: text.trim() });
  }

  return sections;
}

/* ─── Chunking ─── */
function approximateTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

function splitIntoChunks(text, maxTokens = MAX_CHUNK_TOKENS) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = approximateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" ").trim());

      // Keep overlap sentences for context
      const overlap = currentChunk.slice(-OVERLAP_SENTENCES);
      currentChunk = [...overlap];
      currentTokens = approximateTokens(overlap.join(" "));
    }

    currentChunk.push(sentence.trim());
    currentTokens += sentenceTokens;
  }

  if (currentChunk.length > 0) {
    const final = currentChunk.join(" ").trim();
    if (final.length > 50) {
      chunks.push(final);
    }
  }

  return chunks;
}

/* ─── Main ─── */
function main() {
  const dissertationDir = process.argv[2];
  const outputFile = process.argv[3] || "chunks.json";

  if (!dissertationDir) {
    console.error("Usage: node scripts/chunk-dissertation.js <dissertation-dir> [output-file]");
    process.exit(1);
  }

  // Find all .tex files recursively
  function findTexFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip archived directories
        if (entry.name === "archived") continue;
        files.push(...findTexFiles(fullPath));
      } else if (entry.name.endsWith(".tex")) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const texFiles = findTexFiles(dissertationDir);
  console.log(`Found ${texFiles.length} .tex files`);

  const allChunks = [];

  for (const filePath of texFiles) {
    const chapter = inferChapter(filePath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const stripped = stripLatex(raw);

    if (stripped.length < 100) {
      console.log(`  Skipping ${path.basename(filePath)} (too short after stripping)`);
      continue;
    }

    const sections = extractSections(stripped);

    for (const { section, content } of sections) {
      const chunks = splitIntoChunks(content);
      for (const chunk of chunks) {
        allChunks.push({
          chapter,
          section,
          content: chunk,
        });
      }
    }

    console.log(`  ${path.basename(filePath)}: chapter=${chapter}, ${sections.length} sections`);
  }

  console.log(`\nTotal chunks: ${allChunks.length}`);
  console.log(
    `Average chunk length: ${Math.round(allChunks.reduce((s, c) => s + c.content.length, 0) / allChunks.length)} chars`
  );

  fs.writeFileSync(outputFile, JSON.stringify(allChunks, null, 2));
  console.log(`Written to ${outputFile}`);
}

main();
