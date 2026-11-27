import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cli = path.join(root, "bin", "threejs-awesome-graphics-agent-skills.mjs");
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
  path.join(os.tmpdir(), "threejs-awesome-graphics-agent-skills-installer-"),
);
try {
  const customRoot = path.join(temporaryRoot, "custom-skills");
  const targetPaths = {
    universal: [".agents", "skills"],
    grok: [".grok", "skills"],
    codex: [".codex", "skills"],
    "claude-code": [".claude", "skills"],
    cursor: [".cursor", "skills"],
    "github-copilot": [".copilot", "skills"],
    antigravity: [".gemini", "config", "skills"],
    devin: [".config", "devin", "skills"],
    "hermes-agent": [".hermes", "skills"],
    openclaw: [".openclaw", "skills"],
    "muse-code": [".config", "muse", "skills"],
    opencode: [".config", "opencode", "skills"],
    pi: [".pi", "agent", "skills"],
    "deepseek-harness": [".dsh", "skills"],
  };
  const projectPaths = {
    universal: [".agents", "skills"],
    grok: [".grok", "skills"],
    codex: [".codex", "skills"],
    "claude-code": [".claude", "skills"],
    cursor: [".cursor", "skills"],
    "github-copilot": [".github", "skills"],
    antigravity: [".agents", "skills"],
    devin: [".devin", "skills"],
    "hermes-agent": [".hermes", "skills"],
    openclaw: ["skills"],
    "muse-code": [".agents", "skills"],
    opencode: [".opencode", "skills"],
    pi: [".pi", "skills"],
    "deepseek-harness": [".dsh", "skills"],
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
      path.join(customRoot, ".threejs-awesome-graphics-agent-skills.json"),
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

  for (const removedAgent of ["windsurf", "gemini-cli", "gemini"]) {
    let rejected = false;
    try {
      await execFileAsync(process.execPath, [
        cli,
        "install",
        "--agent",
        removedAgent,
        "--dry-run",
      ]);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error(`Removed agent target still accepted: ${removedAgent}`);
  }

  for (const [alias, expectedRelative] of [
    ["hermes", [".hermes", "skills"]],
    ["muse", [".config", "muse", "skills"]],
    ["meta-muse-code", [".config", "muse", "skills"]],
    ["dsh", [".dsh", "skills"]],
    ["deepseek", [".dsh", "skills"]],
  ]) {
    const aliasHome = path.join(temporaryRoot, `alias-${alias}`);
    const result = await execFileAsync(process.execPath, [
      cli,
      "install",
      "--agent",
      alias,
      "--dry-run",
    ], { env: { ...process.env, HOME: aliasHome } });
    const expectedDest = path.join(aliasHome, ...expectedRelative);
    if (!result.stdout.includes(expectedDest)) {
      throw new Error(`Alias ${alias} did not resolve to ${expectedDest}`);
    }
  }

  console.log("Installer smoke test passed.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
