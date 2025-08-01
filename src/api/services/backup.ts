import puppeteer from "puppeteer";

export const scrapeUMDFacts = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://today.umd.edu/", { waitUntil: "networkidle2" });

  try {
    // Let the page fully render
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.evaluate(() => {
      const shadowTexts = new Set<string>(); // ✅ Deduplicate text as we collect it
      const visited = new WeakSet<ShadowRoot>();

      const isLeaf = (el: Element) => {
        return el.children.length === 0 && el.textContent?.trim();
      };

      const collectText = (root: Element | ShadowRoot): void => {
        for (const el of root.querySelectorAll("*")) {
          if (["STYLE", "SCRIPT", "TEMPLATE"].includes(el.tagName)) continue;

          // ✅ Add visible leaf node text
          if (isLeaf(el)) {
            const text = el.textContent?.trim();
            if (text && !shadowTexts.has(text)) {
              shadowTexts.add(text);
            }
          }

          // ✅ Traverse unique shadow roots
          const shadow = (el as any).shadowRoot;
          if (shadow && !visited.has(shadow)) {
            visited.add(shadow);
            collectText(shadow);
          }
        }
      };

      collectText(document.body);
      (window as any).__flattenedShadowText__ = Array.from(shadowTexts).join(" ");
    });

    const fullText = await page.evaluate(() => {
      const shadowText = (window as any).__flattenedShadowText__ || "";
      const bodyText = document.body.innerText || "";

      const combined = (shadowText + " " + bodyText)
        .replace(/(\s*{[^}]*}\s*)+/g, " ") // remove junk like CSS
        .replace(/\s+/g, " ") // normalize whitespace
        .trim();

      return combined;
    });

    // Final deduplication by paragraph (for safety)
    const paragraphs = fullText
      .split(/(?<=\.\s|\n|\?\s|\!\s)/g)
      .map((p) => p.trim())
      .filter((p) => p.length > 25);

    const seen = new Set<string>();
    const uniqueParagraphs = [];

    for (const para of paragraphs) {
      const normalized = para
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueParagraphs.push(para);
      }
    }

    await browser.close();
    return uniqueParagraphs.join(" ");
  } catch (error) {
    console.error("Scraping error:", error);
    await browser.close();
    return "Error occurred while scraping";
  }
};
