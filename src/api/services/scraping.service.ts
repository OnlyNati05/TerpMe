import puppeteer from "puppeteer";

export const scrapeUMD = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://umd.edu/student-life/athletics-and-recreation", {
    waitUntil: "networkidle2",
  });

  try {
    await page.waitForSelector("#main", { timeout: 3000 });

    const result = await page.evaluate(() => {
      let text: string = "";

      function collectTextFrom(node: Node) {
        const blockTags = [
          "P",
          "DIV",
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
          "LI",
          "SECTION",
          "ARTICLE",
        ];

        if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) return;

        const parentNode = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (parentNode instanceof Element && parentNode.closest("header, nav, footer")) return;

        if (node.nodeType === Node.TEXT_NODE) {
          const clean = node.textContent?.replace(/\s+/g, " ").trim();
          if (clean) text += clean + " ";
          return;
        }

        if (!(node instanceof Element)) return;
        const tag = node.tagName.toUpperCase();

        const ignoredTags = new Set(["STYLE", "SCRIPT", "TEMPLATE"]);

        if (ignoredTags.has(tag)) return;

        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return;

        for (const child of node.childNodes) {
          collectTextFrom(child);
        }

        if (blockTags.includes(tag) || ["block", "flex"].includes(style.display)) {
          text += "\n ";
        }
      }

      function collectText(): string {
        const root = document.querySelector("#main") || document.body;
        collectTextFrom(root);

        return text
          .replace(/\s+\n/g, "\n")
          .replace(/\n\s+/g, "\n")
          .replace(/[ ]{2,}/g, " ")
          .trim();
      }

      return collectText();
    });

    await browser.close();
    return result;
  } catch (err) {
    await browser.close();
    console.log("Scraping Error:", err);
    return "Scraping failed";
  }
};
