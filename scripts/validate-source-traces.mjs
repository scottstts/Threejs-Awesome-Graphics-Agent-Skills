import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const manifest = JSON.parse(
  await readFile(
    path.join(root, "source_materials", "trace-manifest.json"),
    "utf8",
  ),
);
const failures = [];

async function isDirectory(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

for (const [sourceId, source] of Object.entries(manifest.sources ?? {})) {
  if (!source.localDirectory) continue;
  const checkout = path.join(root, "source_materials", source.localDirectory);
  if (!(await isDirectory(checkout))) {
    failures.push(`${sourceId}: missing checkout ${source.localDirectory}`);
    continue;
  }

  const { stdout } = await execFileAsync("git", [
    "-C",
    checkout,
    "rev-parse",
    "HEAD",
  ]);
  if (stdout.trim() !== source.revision) {
    failures.push(
      `${sourceId}: expected ${source.revision}, found ${stdout.trim()}`,
    );
  }

  for (const [relativeFile, expectedHash] of Object.entries(source.files)) {
    const bytes = await readFile(path.join(checkout, relativeFile)).catch(
      () => null,
    );
    if (!bytes) {
      failures.push(`${sourceId}: missing reviewed file ${relativeFile}`);
      continue;
    }
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    if (actualHash !== expectedHash) {
      failures.push(
        `${sourceId}: ${relativeFile} changed (${actualHash}, expected ${expectedHash})`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Source trace validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Reviewed external source revisions and file hashes match.");
}
