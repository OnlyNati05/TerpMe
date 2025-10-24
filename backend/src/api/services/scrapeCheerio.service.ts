import * as cheerio from "cheerio";
import { groupChunks } from "../utils/groupChunks";
import { processChunks } from "../utils/processor";

type Base = { url: string; title: string; content: string; date?: string; sport?: string };

export async function scrapeCheerio(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title
    let title = $("head > title").first().text().trim();
    if (!title) title = new URL(url).hostname.replace("www.", "");

    // Scope root
    const root = $("main, #main, .main-content").first().length
      ? $("main, #main, .main-content").first()
      : $("body");

    // Date field (optional)
    let date: string | undefined;
    const timeEl = root.find("time").first();

    if (timeEl.length) {
      const attrDate = timeEl.attr("datetime") || timeEl.attr("pubdate") || timeEl.attr("title");
      const rawDate = attrDate?.trim() || timeEl.text().trim();

      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          date = `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
        } else {
          date = rawDate;
        }
      }
    }

    // Fallback for terp.umd.edu if no <time> tag was found
    if (!date && url.includes("terp.umd.edu")) {
      const dateText = $("#umd-editorial-article-meta li").first().text().trim();
      if (dateText) {
        const parsed = new Date(dateText);
        date = !isNaN(parsed.getTime())
          ? `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`
          : dateText;
      }
    }

    // Sports field (optional)
    let sport: string | undefined;

    if (url.includes("umterps.com")) {
      const timeEl = root.find("time").first();
      if (timeEl.length) {
        const prevSpan = timeEl.prev("span");
        if (prevSpan.length) {
          const spanText = prevSpan.text().trim();
          if (spanText) sport = spanText;
        }
      }
    }

    // Content
    const rawChunks: string[] = [];

    root
      .find("p, h1, h2, h3, h4, h5, h6, li")
      .not("header *, nav *, footer *, aside *, script, style, noscript, form")
      .each((_, el) => {
        const txt = $(el).text().replace(/\s+/g, " ").trim();
        if (txt) rawChunks.push(txt);
      });

    const grouped = groupChunks(rawChunks);
    const chunksArr = processChunks(grouped);

    // Build final object
    const final = chunksArr.map((c) => {
      const base: Base = {
        url,
        title,
        content: `Title: ${title}. ${c}`,
      };

      if (date) {
        base.content = `Date: ${date}. ${base.content}`;
        base.date = date;
      }

      if (sport) {
        base.content = `Sport: ${sport}. ${base.content}`;
        base.sport = sport;
      }

      return base;
    });

    return final;
  } catch (err) {
    console.error("Cheerio scrape failed:", err);
    return [];
  }
}
