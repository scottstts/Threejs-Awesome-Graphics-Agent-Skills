#!/usr/bin/env node

import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsSource = path.join(packageRoot, "skills");
const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8"),
);
const manifestName = ".threejs-gamedev-mega-skills.json";

const targets = {
  universal: {
    label: "Open Agent Skills",
    project: [".agents", "skills"],
    user: [".agents", "skills"],
  },
  codex: {
    label: "OpenAI Codex",
    project: [".agents", "skills"],
    user: [".agents", "skills"],
  },
  "claude-code": {
    label: "Claude Code",
    project: [".claude", "skills"],
    user: [".claude", "skills"],
  },
  cursor: {
    label: "Cursor",
    project: [".cursor", "skills"],
    user: [".cursor", "skills"],
  },
  "github-copilot": {
    label: "GitHub Copilot",
    project: [".github", "skills"],
    user: [".copilot", "skills"],
  },
  "gemini-cli": {
    label: "Gemini CLI",
    project: [".gemini", "skills"],
    user: [".gemini", "skills"],
  },
  windsurf: {
    label: "Windsurf / Devin Desktop",
    project: [".windsurf", "skills"],
    user: [".codeium", "windsurf", "skills"],
  },
};

const aliases = {
  agents: "universal",
  claude: "claude-code",
  copilot: "github-copilot",
  gemini: "gemini-cli",
  devin: "windsurf",
};

function printHelp() {
  console.log(`Three.js Gamedev Mega Skills ${packageJson.version}

Usage:
  threejs-gamedev-mega-skills list
  threejs-gamedev-mega-skills install --agent <target> [options]
  threejs-gamedev-mega-skills uninstall --agent <target> [options]

Targets:
  universal, codex, claude-code, cursor, github-copilot, gemini-cli, windsurf
  custom (requires --path)

Options:
  --scope <user|project>   Installation scope (default: user)
  --path <directory>       Exact skills root; required for custom agents
  --project-dir <path>     Project root for project-scoped installs
  --skills <a,b,c>         Install or remove selected skills only
  --force                  Replace existing installed skill directories
  --dry-run                Print actions without writing
  --help                   Show this help

Examples:
  npx threejs-gamedev-mega-skills install --agent codex
  npx threejs-gamedev-mega-skills install --agent claude-code --scope project
  npx threejs-gamedev-mega-skills install --agent cursor,copilot --force
  npx threejs-gamedev-mega-skills install --agent custom --path ~/.my-agent/skills
`);
}

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const options = {
    command,
    scope: "user",
    agents: [],
    skills: null,
    force: false,
    dryRun: false,
    projectDir: process.cwd(),
    customPath: null,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    const value = rest[index + 1];
    if (argument === "--agent" && value) {
      options.agents.push(...value.split(",").filter(Boolean));
      index += 1;
    } else if (argument === "--scope" && value) {
      options.scope = value;
      index += 1;
    } else if (argument === "--path" && value) {
      options.customPath = value;
      index += 1;
    } else if (argument === "--project-dir" && value) {
      options.projectDir = value;
      index += 1;
    } else if (argument === "--skills" && value) {
      options.skills = value.split(",").filter(Boolean);
      index += 1;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--help" || argument === "-h") {
      options.command = "help";
    } else {
      throw new Error(`Unknown or incomplete option: ${argument}`);
    }
  }

  return options;
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function availableSkills() {
  const entries = await readdir(skillsSource, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function normalizeAgent(agent) {
  const normalized = aliases[agent] ?? agent;
  if (normalized !== "custom" && !targets[normalized]) {
    throw new Error(`Unsupported agent target: ${agent}`);
  }
  return normalized;
}

function resolveDestination(agent, options) {
  if (agent === "custom") {
    if (!options.customPath) {
      throw new Error("The custom target requires --path <skills-directory>.");
    }
    return path.resolve(options.customPath.replace(/^~(?=$|\/|\\)/, os.homedir()));
  }

  if (!["user", "project"].includes(options.scope)) {
    throw new Error("--scope must be user or project.");
  }

  const base = options.scope === "user"
    ? os.homedir()
    : path.resolve(options.projectDir);
  return path.join(base, ...targets[agent][options.scope]);
}

async function readInstallManifest(destination) {
  try {
    return JSON.parse(await readFile(path.join(destination, manifestName), "utf8"));
  } catch {
    return {
      package: packageJson.name,
      version: packageJson.version,
      skills: [],
    };
  }
}

async function writeInstallManifest(destination, manifest, dryRun) {
  if (dryRun) return;
  await writeFile(
    path.join(destination, manifestName),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function installInto(destination, skillNames, options, agent) {
  const existing = [];
  for (const skillName of skillNames) {
    if (await pathExists(path.join(destination, skillName))) existing.push(skillName);
  }

  if (existing.length > 0 && !options.force) {
    throw new Error(
      `Existing skills at ${destination}: ${existing.join(", ")}. Re-run with --force to replace them.`,
    );
  }

  console.log(`${options.dryRun ? "Would install" : "Installing"} ${skillNames.length} skills to ${destination}`);
  if (!options.dryRun) await mkdir(destination, { recursive: true });

  for (const skillName of skillNames) {
    const source = path.join(skillsSource, skillName);
    const target = path.join(destination, skillName);
    const staging = path.join(destination, `.${skillName}.tmp-${process.pid}`);
    const backup = path.join(destination, `.${skillName}.bak-${process.pid}`);
    console.log(`- ${skillName}`);
    if (options.dryRun) continue;

    await rm(staging, { recursive: true, force: true });
    await cp(source, staging, { recursive: true });
    if (await pathExists(target)) {
      await rename(target, backup);
      try {
        await rename(staging, target);
        await rm(backup, { recursive: true, force: true });
      } catch (error) {
        await rename(backup, target);
        throw error;
      }
    } else {
      await rename(staging, target);
    }
  }

  const previous = await readInstallManifest(destination);
  const installed = new Set(previous.skills ?? []);
  for (const skillName of skillNames) installed.add(skillName);
  await writeInstallManifest(destination, {
    package: packageJson.name,
    version: packageJson.version,
    agent,
    installedAt: new Date().toISOString(),
    skills: [...installed].sort(),
  }, options.dryRun);
}

async function uninstallFrom(destination, requestedSkills, options) {
  const manifest = await readInstallManifest(destination);
  const tracked = new Set(manifest.skills ?? []);
  if (tracked.size === 0) {
    throw new Error(`No ${packageJson.name} installation manifest found at ${destination}.`);
  }

  const skillNames = requestedSkills ?? [...tracked];
  for (const skillName of skillNames) {
    if (!tracked.has(skillName)) {
      throw new Error(`Refusing to remove untracked skill: ${skillName}`);
    }
  }

  console.log(`${options.dryRun ? "Would remove" : "Removing"} ${skillNames.length} skills from ${destination}`);
  for (const skillName of skillNames) {
    console.log(`- ${skillName}`);
    if (!options.dryRun) {
      await rm(path.join(destination, skillName), { recursive: true, force: true });
      tracked.delete(skillName);
    }
  }

  if (!options.dryRun) {
    if (tracked.size === 0) {
      await rm(path.join(destination, manifestName), { force: true });
    } else {
      await writeInstallManifest(destination, {
        ...manifest,
        version: packageJson.version,
        updatedAt: new Date().toISOString(),
        skills: [...tracked].sort(),
      }, false);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help") {
    printHelp();
    return;
  }

  const allSkills = await availableSkills();
  if (options.command === "list") {
    console.log("Agent targets:");
    for (const [name, target] of Object.entries(targets)) {
      console.log(`- ${name}: ${target.label}`);
    }
    console.log("- custom: any skills directory supplied with --path");
    console.log("\nPack skills:");
    for (const skillName of allSkills) console.log(`- ${skillName}`);
    return;
  }

  if (!["install", "uninstall"].includes(options.command)) {
    throw new Error(`Unknown command: ${options.command}`);
  }
  if (options.agents.length === 0) {
    throw new Error("Specify at least one --agent target.");
  }

  const selectedSkills = options.skills ?? allSkills;
  const unknownSkills = selectedSkills.filter((skillName) => !allSkills.includes(skillName));
  if (unknownSkills.length > 0) {
    throw new Error(`Unknown skills: ${unknownSkills.join(", ")}`);
  }

  const destinations = new Map();
  for (const requestedAgent of options.agents) {
    const agent = normalizeAgent(requestedAgent);
    const destination = resolveDestination(agent, options);
    if (!destinations.has(destination)) destinations.set(destination, agent);
  }

  for (const [destination, agent] of destinations) {
    if (options.command === "install") {
      await installInto(destination, selectedSkills, options, agent);
    } else {
      await uninstallFrom(destination, options.skills, options);
    }
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
