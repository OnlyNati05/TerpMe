//  Combines smaller chunks with larger ones
export const processChunks = (chunks: string[], minTokens = 30): string[] => {
  const merged: string[] = [];

  for (const chunk of chunks) {
    const tokenCount = chunk.split(" ").length;

    if (tokenCount < minTokens && merged.length > 0) {
      merged[merged.length - 1] += " " + chunk;
    } else {
      merged.push(chunk);
    }
  }

  return merged.filter((c) => c.length > 0).map((c) => c.replace(/learn more/gi, "").trim());
};
