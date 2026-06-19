import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = process.cwd();
const examples = [
  "skills/threejs-animation-motion/examples/spring-motion-lab/index.html",
  "skills/threejs-cinematic-lighting-composition/examples/flat-to-cinematic/index.html",
  "skills/threejs-game-design-playability/examples/game-feel-playground/index.html",
  "skills/threejs-geometry-modeling/examples/road-curve-sweep/index.html",
  "skills/threejs-material-lookdev/examples/material-calibration/index.html",
  "skills/threejs-shaders-vfx/examples/impact-vfx-system/index.html",
  "skills/threejs-shaders-vfx/examples/shader-noise-lab/index.html",
];

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const target = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, target);
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      !(await stat(target)).isFile()
    ) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": contentTypes.get(path.extname(target)) ?? "application/octet-stream",
    });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  for (const example of examples) {
    const errors = [];
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/${example}`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(300);
    if ((await page.locator("canvas").count()) !== 1) {
      errors.push("Expected exactly one canvas.");
    }
    if (errors.length > 0) {
      throw new Error(`${example}: ${errors.join("; ")}`);
    }
    console.log(`Passed ${example}`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
