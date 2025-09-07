/**
 * IMPORTANT: Because I have changing my scraping logic, i will no longer be using this file
 * this only exists in case I want to change back to this method of scraping
 
import puppeteer from "puppeteer";

import { processChunks } from "../utils/processor";

// Launches a browser and scrapes clean text from a UMD page
export const scrapePuppeteer = async (umdURL: string) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the target page and wait for network activity to finish
  await page.goto(umdURL, {
    waitUntil: "networkidle2",
  });

  try {
    // Wait for the main content container to appear
    await page.waitForSelector("#main", { timeout: 3000 });

    // Execute scraping logic
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

        //Add all text type nodes to the "text" variable
        if (node.nodeType === Node.TEXT_NODE) {
          const clean = node.textContent?.replace(/\s+/g, " ").trim();
          if (clean) {
            text += clean + " ";
          }
          return;
        }

        if (!(node instanceof Element)) return;
        const tag = node.tagName.toUpperCase();

        const ignoredTags = new Set(["STYLE", "SCRIPT", "TEMPLATE"]);

        if (ignoredTags.has(tag)) return;

        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return;

        // Correctly add line breaks to all text inside a DIV
        if (tag === "DIV") {
          const children = Array.from(node.children);

          const headings = children.filter((node) => {
            return ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName.toUpperCase());
          });

          const paragraphs = children.filter((node) => {
            return ["P", "SPAN"].includes(node.tagName.toUpperCase());
          });

          // Heading line breaks
          if (headings.length === 1) {
            collectTextFrom(headings[0]);
            text += "\n";
          } else if (headings.length > 1) {
            headings.forEach((el, index) => {
              collectTextFrom(el);
              text += index === headings.length - 1 ? "\n\n" : "\n";
            });
          }

          // Paragraph line breaks
          if (paragraphs.length === 1) {
            collectTextFrom(paragraphs[0]);
            text += "\n\n";
          } else if (paragraphs.length > 1) {
            paragraphs.forEach((el, index) => {
              collectTextFrom(el);
              text += index === paragraphs.length - 1 ? "\n\n" : "\n";
            });
          }

          // Render the rest of the DIV's children
          children.forEach((child) => {
            if (![...headings, ...paragraphs].includes(child)) {
              collectTextFrom(child);
            }
          });

          return;
        }

        // Recurse through all child nodes
        for (const child of node.childNodes) {
          collectTextFrom(child);
        }
      }

      // Starts collecting text from the #main element or falls back to body
      function collectText(): Array<string> {
        const root = document.querySelector("#main") || document.body;
        collectTextFrom(root);

        const chunks = text
          // Turn string into array of strings at every line break
          .split(/\n{2,}/)
          //  Filter out uneccesary word "learn more"
          .filter((line) => line.trim().toLowerCase() !== "learn more")
          // Clean up any extra white space that was missed
          .map((chunk) => chunk.replace(/\n+/g, " ").trim());

        return chunks;
      }

      return collectText();
    });

    // Close the browser
    await browser.close();

    //Merge all strings less than 30 words to the prev string in the array
    const chunksArr = processChunks(result);

    // Properly format the array to be processed by the database
    const chunks = chunksArr.map((c) => ({
      url: umdURL,
      content: c,
    }));

    return chunks;
  } catch (err) {
    await browser.close();
    return "Scraping failed";
  }
};
*/
