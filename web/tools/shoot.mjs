// Design-phase screenshot helper. Renders a local HTML file to a PNG so the
// agent can self-review mockups. Usage:
//   node shoot.mjs <input.html> <output.png> [width] [height] [fullPage]
// NOT part of the storefront app — throwaway design tooling.
import puppeteer from "puppeteer";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const [, , inFile, outFile, w = "1200", h = "900", full = "true"] = process.argv;
if (!inFile || !outFile) {
  console.error("usage: node shoot.mjs <input.html> <output.png> [w] [h] [fullPage]");
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(resolve(inFile)).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.screenshot({ path: resolve(outFile), fullPage: full === "true" });
await browser.close();
console.log("wrote", outFile);
