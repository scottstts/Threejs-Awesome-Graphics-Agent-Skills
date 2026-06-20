#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { discoverExamples } from "./discovery.mjs";

const galleryRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(galleryRoot, "../..");
const publicRoot = path.join(galleryRoot, "public");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".glb", "model/gltf-binary"],
  [".gltf", "model/gltf+json"],
  [".hdr", "image/vnd.radiance"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".ktx2", "image/ktx2"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".wgsl", "text/plain; charset=utf-8"],
]);

function parseArgs(argv) {
  const options = {
    host: "127.0.0.1",
    port: 4173,
    open: false,
    includeFixtures: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--host" && argv[index + 1]) {
      options.host = argv[index + 1];
      index += 1;
    } else if (argument === "--port" && argv[index + 1]) {
      options.port = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (argument === "--open") {
      options.open = true;
    } else if (argument === "--include-fixtures") {
      options.includeFixtures = true;
    } else if (argument === "--help" || argument === "-h") {
      console.log(`Three.js example gallery

Usage:
  node dev/example-gallery/server.mjs [options]

Options:
  --host <host>          Bind host (default: 127.0.0.1)
  --port <port>          Bind port; use 0 for any free port (default: 4173)
  --open                 Open the gallery in the system browser
  --include-fixtures     Include gallery self-test fixtures
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete option: ${argument}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("--port must be an integer from 0 to 65535.");
  }
  return options;
}

async function existingFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function safePath(root, pathname) {
  const target = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return target;
}

async function sendFile(request, response, filePath) {
  if (!(await existingFile(filePath))) return false;
  const metadata = await stat(filePath);
  response.writeHead(200, {
    "content-type":
      contentTypes.get(path.extname(filePath).toLowerCase()) ??
      "application/octet-stream",
    "content-length": metadata.size,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(filePath).pipe(response);
  }
  return true;
}

export function createExampleGalleryServer({ includeFixtures = false } = {}) {
  return createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method ?? "")) {
        response.writeHead(405, { allow: "GET, HEAD" }).end("Method not allowed");
        return;
      }

      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname === "/api/examples") {
        const examples = await discoverExamples(projectRoot, { includeFixtures });
        const payload = JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            count: examples.length,
            examples,
          },
          null,
          2,
        );
        response.writeHead(200, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "content-length": Buffer.byteLength(payload),
        });
        response.end(request.method === "HEAD" ? undefined : payload);
        return;
      }

      if (url.pathname === "/" || url.pathname === "/gallery") {
        await sendFile(request, response, path.join(publicRoot, "index.html"));
        return;
      }

      if (url.pathname.startsWith("/gallery/")) {
        const target = safePath(
          publicRoot,
          url.pathname.slice("/gallery".length),
        );
        if (target && await sendFile(request, response, target)) return;
      }

      const allowedProjectPrefixes = [
        "/skills/",
        "/dev/example-gallery/runtime/",
        "/node_modules/",
      ];
      if (includeFixtures) {
        allowedProjectPrefixes.push("/dev/example-gallery/fixtures/");
      }
      if (
        allowedProjectPrefixes.some((prefix) =>
          url.pathname.startsWith(prefix)
        )
      ) {
        const projectTarget = safePath(projectRoot, url.pathname);
        if (projectTarget && await sendFile(request, response, projectTarget)) {
          return;
        }
      }

      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(`Example gallery error: ${error.message}`);
    }
  });
}

function openBrowser(url) {
  const command = process.platform === "darwin"
    ? ["open", [url]]
    : process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

export async function startExampleGallery(options = {}) {
  const server = createExampleGalleryServer(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 4173, options.host ?? "127.0.0.1", resolve);
  });
  const address = server.address();
  const host = options.host === "0.0.0.0" ? "127.0.0.1" : options.host;
  const url = `http://${host}:${address.port}/`;
  return { server, url };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const { url } = await startExampleGallery(options);
    console.log(`Three.js example gallery: ${url}`);
    console.log("Press Ctrl+C to stop.");
    if (options.open) openBrowser(url);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
