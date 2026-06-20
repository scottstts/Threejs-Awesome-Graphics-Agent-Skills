import { chromium } from "playwright";
import { startExampleGallery } from "../dev/example-gallery/server.mjs";

const { server, url } = await startExampleGallery({
  host: "127.0.0.1",
  port: 0,
  includeFixtures: true,
});

let browser;
try {
  const response = await fetch(new URL("/api/examples", url));
  if (!response.ok) throw new Error("Example discovery endpoint failed.");
  const payload = await response.json();
  const fixture = payload.examples.find(
    (example) => example.id === "fixture/runtime-contract",
  );
  const realExamples = payload.examples.filter(
    (example) => example.origin === "skill",
  );
  if (!fixture || realExamples.length < 2) {
    throw new Error("Gallery fixture was not discovered correctly.");
  }

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const fixtureUrl = new URL(url);
  fixtureUrl.searchParams.set("example", fixture.id);
  await page.goto(fixtureUrl.href, { waitUntil: "networkidle" });
  await page.locator("#example-title").waitFor();
  if ((await page.locator("#example-title").textContent()) !== "Gallery Runtime Contract") {
    throw new Error("Single-example inspection view did not load.");
  }
  await page
    .locator("#frame-status[data-state='ready']")
    .waitFor({ timeout: 5000 });

  await page.locator("#pause").click();
  if ((await page.locator("#pause").textContent()) !== "Resume") {
    throw new Error("Pause control did not update.");
  }

  await page.locator("#debug-mode").selectOption("field");
  await page.locator("#viewport").selectOption("390x844");
  if ((await page.locator("#frame-size").textContent()) !== "390 × 844") {
    throw new Error("Viewport control did not resize the inspection frame.");
  }

  await page.locator("#toggle-view").click();
  if ((await page.locator(".overview-card").count()) !== payload.count) {
    throw new Error("Overview did not render all discovered examples.");
  }

  if (errors.length > 0) {
    throw new Error(`Gallery emitted browser errors: ${errors.join("; ")}`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("Example gallery smoke test passed.");
