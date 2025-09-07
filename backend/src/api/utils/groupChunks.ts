export type GroupOptions = {
  headingWordThreshold?: number; // default: 8
  maxChunkChars?: number; // default: 1800
  junkPhrases?: string[]; // phrases to drop
};

// Get rid of extra spaces
function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Check if string is a heading
function isLikelyHeading(s: string, headingWordThreshol: number): boolean {
  // normalize string
  const text = normalize(s);
  if (!text) return false;

  // Turn text into an array, seperating at each space
  const words = text.split(" ");
  if (words.length <= 2) return true;
  if (words.length <= headingWordThreshol && !/[.!?]$/.test(text)) return true;

  const letters = text.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;
  const upperRatio = letters.replace(/[a-z]/g, "").length / letters.length;
  return upperRatio > 0.7;
}

// Check if string is a bullet point
function isBulletLine(s: string): boolean {
  const t = s.trim();
  return /^(\-|\*|•|·|\u2022|\u00B7)\s+/.test(t) || /^\d+\.\s+/.test(t);
}

// Check if string contains junk words/phrases (learn more, read more, etc.)
function isJunk(s: string, junkPhrases: string[]): boolean {
  const t = s.trim().toLowerCase();
  if (!t) return true;
  return junkPhrases.some((p) => t === p || t.startsWith(p + " "));
}

// Split chunks that are too large
function splitByMaxChars(chunk: string, maxChars: number): string[] {
  if (!maxChars || chunk.length <= maxChars) {
    return [chunk];
  }

  const out: string[] = [];

  //Detect heading
  const lines = chunk.split("\n");
  const heading = lines[0];
  const body = lines.slice(1).join("\n");
  const hasHeading = lines.length > 1 && /^[A-Z][A-Za-z0-9\s]*$/.test(heading.trim());

  let remaining = hasHeading ? body : chunk;

  while (remaining.length > maxChars) {
    const slice = remaining.slice(0, maxChars);

    // Try to break cleanly at sentence/word boundary
    let cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("! "));
    if (cut === -1) cut = slice.lastIndexOf(" ");
    if (cut === -1) cut = maxChars;

    let piece = remaining.slice(0, cut + 1).trim();
    if (hasHeading) {
      piece = heading + "\n" + piece;
    }

    out.push(piece);
    remaining = remaining.slice(cut + 1).trim();
  }

  // Handle remainder
  if (remaining) {
    if (out.length && remaining.length < 50) {
      // Merge tiny leftovers with the last chunk
      out[out.length - 1] += " " + remaining;
    } else {
      let piece = remaining;
      if (hasHeading) {
        piece = heading + "\n" + piece;
      }
      out.push(piece);
    }
  }

  return out;
}

//  Properly group chunks
export function groupChunks(rawChunks: string[], opts: GroupOptions = {}): string[] {
  const {
    headingWordThreshold = 8,
    maxChunkChars = 1800,
    junkPhrases = ["learn more", "read more"],
  } = opts;

  const cleaned: string[] = [];
  const lines = rawChunks.map(normalize).filter((t) => t.length > 0 && !isJunk(t, junkPhrases));

  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];

    // Headings get first priority
    if (isLikelyHeading(cur, headingWordThreshold)) {
      const parts: string[] = [cur];
      i++;

      while (i < lines.length) {
        const next = lines[i];
        if (!next) break;
        if (isLikelyHeading(next, headingWordThreshold)) break;

        parts.push(next);
        i++;

        const joined = parts.join("\n");
        if (joined.length > maxChunkChars * 0.8) break;
      }

      const merged = parts.join("\n").trim();
      cleaned.push(merged);
      continue;
    }

    // Bullets (only if not captured under a heading)
    if (isBulletLine(cur)) {
      const bullets: string[] = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        bullets.push(lines[i]);
        i++;
      }
      cleaned.push(bullets.join("\n"));
      continue;
    }

    // Plain text
    cleaned.push(cur);
    i++;
  }

  // Final pass: enforce max chunk size
  const sized: string[] = [];
  for (const c of cleaned) {
    const pieces = splitByMaxChars(c, maxChunkChars);
    for (const p of pieces) if (p) sized.push(p);
  }

  return sized;
}

export default groupChunks;
