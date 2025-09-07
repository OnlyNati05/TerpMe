import * as cheerio from "cheerio";
import { groupChunks } from "../utils/groupChunks";
import { processChunks } from "../utils/processor";

export async function scrapeCheerio(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const rawChunks: string[] = [];

    // Scope to main content if available, fallback to body
    const root = $("main, #main, .main-content").first().length
      ? $("main, #main, .main-content").first()
      : $("body");

    // Grab text elements but exclude navbars/footers/sidebars
    root
      .find("p, h1, h2, h3, h4, h5, h6, li, section, article")
      .not("header *, nav *, footer *, aside *")
      .each((_, el) => {
        const txt = $(el).text().replace(/\s+/g, " ").trim();
        if (txt) rawChunks.push(txt);
      });

    const grouped = groupChunks(rawChunks);
    const chunksArr = processChunks(grouped);

    const final = chunksArr.map((c) => ({ url: url, content: c }));

    return final;
  } catch (err) {
    console.error("Cheerio scrape failed:", err);
    return [];
  }
}
