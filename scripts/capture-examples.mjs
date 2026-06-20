import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { discoverExamples } from "../dev/example-gallery/discovery.mjs";
import { startExampleGallery } from "../dev/example-gallery/server.mjs";

const root = process.cwd();

function parseArgs(argv) {
  const options = {
    output: path.join(root, ".example-captures"),
    includeFixtures: false,
    debugMode: "final",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output" && argv[index + 1]) {
      options.output = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === "--include-fixtures") {
      options.includeFixtures = true;
    } else if (argument === "--debug" && argv[index + 1]) {
      options.debugMode = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete option: ${argument}`);
    }
  }
  return options;
}

function safeFilename(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const options = parseArgs(process.argv.slice(2));
const examples = await discoverExamples(root, {
  includeFixtures: options.includeFixtures,
});

if (examples.length === 0) {
  console.log("No examples discovered; nothing to capture.");
  process.exit(0);
}

await rm(options.output, { recursive: true, force: true });
await mkdir(options.output, { recursive: true });

const { server, url } = await startExampleGallery({
  host: "127.0.0.1",
  port: 0,
  includeFixtures: options.includeFixtures,
});

let browser;
const captures = [];
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const example of examples) {
    const debugMode = example.debugModes.some(
      (mode) => mode.value === options.debugMode,
    )
      ? options.debugMode
      : example.debugModes[0]?.value ?? "final";
    const target = new URL(example.entry, url);
    target.searchParams.set("galleryPaused", "1");
    target.searchParams.set("galleryDpr", String(example.defaultDpr));
    target.searchParams.set("galleryDebugMode", debugMode);

    await page.setViewportSize(example.defaultViewport);
    const runtimeErrors = [];
    const onPageError = (error) => runtimeErrors.push(error.message);
    const onConsole = (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    };
    page.on("pageerror", onPageError);
    page.on("console", onConsole);

    await page.goto(target.href, { waitUntil: "networkidle" });
    await page
      .locator("html[data-example-ready='true']")
      .waitFor({ timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(500);

    const filename = `${safeFilename(example.id)}-${safeFilename(debugMode)}.png`;
    await page.screenshot({
      path: path.join(options.output, filename),
      type: "png",
    });

    page.off("pageerror", onPageError);
    page.off("console", onConsole);

    captures.push({
      ...example,
      debugMode,
      filename,
      runtimeErrors,
    });
    console.log(
      `${runtimeErrors.length === 0 ? "Captured" : "Captured with errors"} ${example.id}`,
    );
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

const cards = captures
  .map(
    (capture) => `
      <article>
        <img src="./${escapeHtml(capture.filename)}" alt="${escapeHtml(capture.title)}" />
        <div>
          <p>${escapeHtml(capture.skill ?? "Gallery fixture")} · ${escapeHtml(capture.backend)}</p>
          <h2>${escapeHtml(capture.title)}</h2>
          <span>${escapeHtml(capture.debugMode)}</span>
          ${
            capture.runtimeErrors.length > 0
              ? `<pre>${escapeHtml(capture.runtimeErrors.join("\n"))}</pre>`
              : ""
          }
        </div>
      </article>`,
  )
  .join("\n");

const contactSheet = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Three.js example captures</title>
    <style>
      :root { color: #f2f4f7; background: #090a0c; font-family: system-ui, sans-serif; }
      body { margin: 0; padding: 28px; }
      header { margin-bottom: 24px; }
      h1 { margin: 0 0 6px; font-size: 28px; }
      header p, article p { color: #757d89; }
      main { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
      article { overflow: hidden; border: 1px solid #242830; border-radius: 10px; background: #111318; }
      img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; background: black; }
      article div { padding: 12px 14px 15px; }
      article p { margin: 0 0 5px; font-size: 10px; text-transform: uppercase; letter-spacing: .1em; }
      h2 { margin: 0 0 8px; font-size: 16px; }
      span { color: #d9ff55; font: 11px ui-monospace, monospace; }
      pre { overflow: auto; padding: 8px; color: #ff8b94; background: #180c0e; font-size: 10px; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <header>
      <h1>Three.js visual example captures</h1>
      <p>${captures.length} deterministic inspection frames.</p>
    </header>
    <main>${cards}</main>
  </body>
</html>
`;

await writeFile(path.join(options.output, "index.html"), contactSheet);
await writeFile(
  path.join(options.output, "manifest.json"),
  `${JSON.stringify(captures, null, 2)}\n`,
);

const failures = captures.filter((capture) => capture.runtimeErrors.length > 0);
console.log(`Contact sheet: ${path.join(options.output, "index.html")}`);
if (failures.length > 0) {
  throw new Error(`${failures.length} example(s) emitted runtime errors.`);
}
