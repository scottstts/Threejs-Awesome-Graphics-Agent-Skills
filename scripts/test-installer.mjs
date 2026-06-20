import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cli = path.join(root, "bin", "threejs-gamedev-mega-skills.mjs");
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const expectedSkills = (await readdir(path.join(root, "skills"), {
  withFileTypes: true,
}))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "threejs-gamedev-mega-skills-installer-"),
);
const customRoot = path.join(temporaryRoot, "custom-skills");
const targetPaths = {
  universal: [".agents", "skills"],
  codex: [".agents", "skills"],
  "claude-code": [".claude", "skills"],
  cursor: [".cursor", "skills"],
  "github-copilot": [".copilot", "skills"],
  "gemini-cli": [".gemini", "skills"],
  windsurf: [".codeium", "windsurf", "skills"],
};
const projectPaths = {
  universal: [".agents", "skills"],
  codex: [".agents", "skills"],
  "claude-code": [".claude", "skills"],
  cursor: [".cursor", "skills"],
  "github-copilot": [".github", "skills"],
  "gemini-cli": [".gemini", "skills"],
  windsurf: [".windsurf", "skills"],
};

const help = await execFileAsync(process.execPath, [cli, "--help"]);
if (!help.stdout.includes("Usage:")) throw new Error("Top-level --help failed.");
const version = await execFileAsync(process.execPath, [cli, "--version"]);
if (version.stdout.trim() !== packageJson.version) {
  throw new Error("Top-level --version failed.");
}

for (const [agent, relativePath] of Object.entries(targetPaths)) {
  const home = path.join(temporaryRoot, `home-${agent}`);
  await execFileAsync(process.execPath, [
    cli,
    "install",
    "--agent",
    agent,
  ], { env: { ...process.env, HOME: home } });
  await stat(path.join(home, ...relativePath, "threejs-skill-router", "SKILL.md"));
  await stat(path.join(home, ...relativePath, "threejs-procedural-fields", "SKILL.md"));
}

for (const [agent, relativePath] of Object.entries(projectPaths)) {
  const project = path.join(temporaryRoot, `project-${agent}`);
  await execFileAsync(process.execPath, [
    cli,
    "install",
    "--agent",
    agent,
    "--scope",
    "project",
    "--project-dir",
    project,
  ]);
  await stat(path.join(project, ...relativePath, "threejs-skill-router", "SKILL.md"));
  await stat(path.join(project, ...relativePath, "threejs-procedural-fields", "SKILL.md"));
}

await execFileAsync(process.execPath, [
  cli,
  "install",
  "--agent",
  "custom",
  "--path",
  customRoot,
]);

await stat(path.join(customRoot, "threejs-skill-router", "SKILL.md"));
await stat(path.join(customRoot, "threejs-procedural-fields", "SKILL.md"));
const manifest = JSON.parse(
  await readFile(
    path.join(customRoot, ".threejs-gamedev-mega-skills.json"),
    "utf8",
  ),
);
if (
  manifest.completePack !== true ||
  JSON.stringify(manifest.skills) !== JSON.stringify(expectedSkills)
) {
  throw new Error("Installer manifest does not describe the complete pack.");
}

await execFileAsync(process.execPath, [
  cli,
  "install",
  "--agent",
  "custom",
  "--path",
  customRoot,
  "--force",
]);

await execFileAsync(process.execPath, [
  cli,
  "uninstall",
  "--agent",
  "custom",
  "--path",
  customRoot,
]);

let removed = true;
try {
  await stat(path.join(customRoot, "threejs-skill-router"));
  removed = false;
} catch {
}
if (!removed) throw new Error("Installer did not remove the complete pack.");

let partialRejected = false;
try {
  await execFileAsync(process.execPath, [
    cli,
    "install",
    "--agent",
    "custom",
    "--path",
    customRoot,
    "--skills",
    "threejs-skill-router",
  ]);
} catch {
  partialRejected = true;
}
if (!partialRejected) throw new Error("Installer still accepts partial installation.");

console.log("Installer smoke test passed.");
