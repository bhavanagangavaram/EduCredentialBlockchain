import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = "D:/FinalProj";
const SVG_DIR = path.join(ROOT, "diagrams");
const PNG_DIR = path.join(ROOT, "diagrams", "png");
const LOG_PATH = path.join(ROOT, "debug-f5a6fa.log");

function log(hypothesisId, location, message, data) {
  const payload = {
    sessionId: "f5a6fa",
    runId: "png-export-playwright",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(payload) + "\n", "utf8");
}

function listSvgs() {
  return fs
    .readdirSync(SVG_DIR)
    .filter((f) => f.startsWith("fig_") && f.endsWith(".svg"))
    .sort()
    .map((f) => path.join(SVG_DIR, f));
}

const TARGET_WIDTH_PX = 1900; // ~16cm at 300dpi

function parseViewBox(svgText) {
  const m = svgText.match(/\bviewBox="([^"]+)"/i);
  if (!m) return null;
  const parts = m[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return { w: parts[2], h: parts[3] };
}

async function main() {
  fs.mkdirSync(PNG_DIR, { recursive: true });
  const svgs = listSvgs();
  if (svgs.length === 0) {
    log("H7", "export_diagrams_png_playwright.mjs:main", "No SVG files found", { dir: SVG_DIR });
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: TARGET_WIDTH_PX + 120, height: 2400, deviceScaleFactor: 2 } });

  for (const svgPath of svgs) {
    const svgName = path.basename(svgPath);
    const svg = fs.readFileSync(svgPath, "utf8");
    const vb = parseViewBox(svg);
    const estHeight = vb ? Math.ceil((TARGET_WIDTH_PX * vb.h) / vb.w) : 2000;
    const viewportHeight = Math.max(1400, estHeight + 120);
    await page.setViewportSize({ width: TARGET_WIDTH_PX + 120, height: viewportHeight });

    // Render inline SVG to ensure sizing control; constrain width for predictable document insertion.
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; }
      #wrap { padding: 20px 40px; }
      svg { width: ${TARGET_WIDTH_PX}px !important; height: auto !important; display: block; }
    </style>
  </head>
  <body>
    <div id="wrap">${svg}</div>
  </body>
</html>`;

    await page.setContent(html, { waitUntil: "load" });
    const handle = await page.$("svg");
    if (!handle) {
      log("H7", "export_diagrams_png_playwright.mjs:loop", "SVG element not found after render", { svg: svgName });
      continue;
    }

    const box = await handle.boundingBox();
    if (!box) {
      log("H7", "export_diagrams_png_playwright.mjs:loop", "Failed to compute SVG bounding box", { svg: svgName });
      continue;
    }

    const outPath = path.join(PNG_DIR, svgName.replace(/\.svg$/i, ".png"));
    await page.screenshot({
      path: outPath,
      clip: {
        x: Math.max(0, box.x - 2),
        y: Math.max(0, box.y - 2),
        width: Math.ceil(box.width + 4),
        height: Math.ceil(box.height + 4),
      },
    });

    log("H7", "export_diagrams_png_playwright.mjs:loop", "Exported PNG via playwright", {
      svg: svgName,
      png: outPath,
      targetWidthPx: TARGET_WIDTH_PX,
      estimatedHeightPx: estHeight,
      viewportHeightPx: viewportHeight,
      boundingBox: { x: box.x, y: box.y, w: box.width, h: box.height },
      deviceScaleFactor: 2,
    });
  }

  await browser.close();
}

main().catch((err) => {
  log("H7", "export_diagrams_png_playwright.mjs:main", "Playwright export failed", { error: String(err?.message || err) });
  process.exitCode = 1;
});

