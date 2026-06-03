// Screenshot helper for visual self-review. Renders a local HTML file OR a
// running dev URL (e.g. http://localhost:3000/...) to a PNG. Usage:
//   node shoot.mjs <input.html | http(s)://url> <output.png> [width] [height] [fullPage]
// NOT part of the storefront app — dev tooling.
import puppeteer from "puppeteer";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const [, , inArg, outFile, w = "1200", h = "900", full = "true"] = process.argv;
if (!inArg || !outFile) {
  console.error("usage: node shoot.mjs <input.html | http(s)://url> <output.png> [w] [h] [fullPage]");
  process.exit(1);
}

// Accept a real URL as-is; otherwise treat the arg as a local file path.
const target = /^https?:\/\//.test(inArg)
  ? inArg
  : pathToFileURL(resolve(inArg)).href;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
await page.goto(target, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.screenshot({ path: resolve(outFile), fullPage: full === "true" });
await browser.close();
console.log("wrote", outFile);
