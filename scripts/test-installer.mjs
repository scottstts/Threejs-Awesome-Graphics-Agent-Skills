import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cli = path.join(root, "bin", "threejs-gamedev-mega-skills.mjs");
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

for (const [agent, relativePath] of Object.entries(targetPaths)) {
  const home = path.join(temporaryRoot, `home-${agent}`);
  await execFileAsync(process.execPath, [
    cli,
    "install",
    "--agent",
    agent,
    "--skills",
    "threejs-skill-router",
  ], { env: { ...process.env, HOME: home } });
  await stat(path.join(home, ...relativePath, "threejs-skill-router", "SKILL.md"));
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
    "--skills",
    "threejs-skill-router",
  ]);
  await stat(path.join(project, ...relativePath, "threejs-skill-router", "SKILL.md"));
}

await execFileAsync(process.execPath, [
  cli,
  "install",
  "--agent",
  "custom",
  "--path",
  customRoot,
  "--skills",
  "threejs-skill-router,threejs-project-foundations",
]);

await stat(path.join(customRoot, "threejs-skill-router", "SKILL.md"));
await stat(path.join(customRoot, "threejs-project-foundations", "SKILL.md"));
const manifest = JSON.parse(
  await readFile(
    path.join(customRoot, ".threejs-gamedev-mega-skills.json"),
    "utf8",
  ),
);
if (manifest.skills.length !== 2) throw new Error("Installer manifest is incomplete.");

await execFileAsync(process.execPath, [
  cli,
  "install",
  "--agent",
  "custom",
  "--path",
  customRoot,
  "--skills",
  "threejs-skill-router",
  "--force",
]);

await execFileAsync(process.execPath, [
  cli,
  "uninstall",
  "--agent",
  "custom",
  "--path",
  customRoot,
  "--skills",
  "threejs-skill-router",
]);

let removed = false;
try {
  await stat(path.join(customRoot, "threejs-skill-router"));
} catch {
  removed = true;
}
if (!removed) throw new Error("Installer did not remove the selected skill.");

console.log("Installer smoke test passed.");
