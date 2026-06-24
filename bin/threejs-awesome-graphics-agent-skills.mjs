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
const manifestName = ".threejs-awesome-graphics-agent-skills.json";

const targets = {
  universal: {
    label: "Open Agent Skills",
    project: [".agents", "skills"],
    user: [".agents", "skills"],
  },
  codex: {
    label: "OpenAI Codex",
    project: [".codex", "skills"],
    user: [".codex", "skills"],
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
  console.log(`Three.js Awesome Graphics Agent Skills ${packageJson.version}

Usage:
  threejs-awesome-graphics-agent-skills list
  threejs-awesome-graphics-agent-skills install --agent <target> [options]
  threejs-awesome-graphics-agent-skills uninstall --agent <target> [options]

Targets:
  universal, codex, claude-code, cursor, github-copilot, gemini-cli, windsurf
  custom (requires --path)

Options:
  --scope <user|project>   Installation scope (default: user)
  --path <directory>       Exact skills root; required for custom agents
  --project-dir <path>     Project root for project-scoped installs
  --force                  Reinstall the same version or replace untracked conflicts
  --dry-run                Print actions without writing
  --version                Print package version
  --help                   Show this help

Examples:
  npx threejs-awesome-graphics-agent-skills install --agent codex
  npx threejs-awesome-graphics-agent-skills install --agent claude-code --scope project
  npx threejs-awesome-graphics-agent-skills install --agent cursor,copilot --force
  npx threejs-awesome-graphics-agent-skills install --agent custom --path ~/.my-agent/skills
`);
}

function parseArgs(argv) {
  const [rawCommand = "help", ...rest] = argv;
  const command = rawCommand === "--help" || rawCommand === "-h"
    ? "help"
    : rawCommand === "--version" || rawCommand === "-v"
      ? "version"
      : rawCommand;
  const options = {
    command,
    scope: "user",
    agents: [],
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
    const manifest = JSON.parse(
      await readFile(path.join(destination, manifestName), "utf8"),
    );
    if (
      manifest.package !== packageJson.name ||
      !Array.isArray(manifest.skills) ||
      manifest.skills.some(
        (skillName) =>
          typeof skillName !== "string" ||
          !/^[a-z0-9-]{1,63}$/.test(skillName),
      )
    ) {
      throw new Error("invalid ownership manifest");
    }
    return {
      ...manifest,
      manifestFound: true,
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw new Error(
        `Unable to read ${path.join(destination, manifestName)}: ${error.message}`,
      );
    }
    return {
      package: packageJson.name,
      version: packageJson.version,
      manifestFound: false,
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

function formatVersion(version) {
  return typeof version === "string" && version.length > 0 ? version : "unknown";
}

function shouldAutoReplaceForVersion(previous, existingSkillNames) {
  if (!previous.manifestFound || previous.version === packageJson.version) {
    return false;
  }

  const previouslyTracked = new Set(previous.skills ?? []);
  return existingSkillNames.every((skillName) => previouslyTracked.has(skillName));
}

function buildExistingSkillsError(destination, existing, previous) {
  if (previous.manifestFound && previous.version !== packageJson.version) {
    const previouslyTracked = new Set(previous.skills ?? []);
    const untrackedExisting = existing.filter(
      (skillName) => !previouslyTracked.has(skillName),
    );
    if (untrackedExisting.length > 0) {
      return `Existing untracked skills at ${destination}: ${untrackedExisting.join(", ")}. ` +
        `Installed ${packageJson.name} version ${formatVersion(previous.version)} differs from package version ${packageJson.version}, ` +
        "but these directories are not listed in the ownership manifest. Re-run with --force to replace them.";
    }
  }

  if (previous.manifestFound && previous.version === packageJson.version) {
    return `Existing skills at ${destination}: ${existing.join(", ")}. ` +
      `Version ${packageJson.version} is already installed. Re-run with --force to reinstall it.`;
  }

  return `Existing skills at ${destination}: ${existing.join(", ")}. Re-run with --force to replace them.`;
}

async function installInto(destination, skillNames, options, agent) {
  const previous = await readInstallManifest(destination);
  const existing = [];
  for (const skillName of skillNames) {
    if (await pathExists(path.join(destination, skillName))) existing.push(skillName);
  }

  const autoReplaceForVersion = shouldAutoReplaceForVersion(previous, existing);
  const effectiveForce = options.force || autoReplaceForVersion;

  if (existing.length > 0 && !effectiveForce) {
    throw new Error(buildExistingSkillsError(destination, existing, previous));
  }

  if (autoReplaceForVersion) {
    console.log(
      `Detected ${packageJson.name} ${formatVersion(previous.version)} -> ${packageJson.version}; replacing tracked skills without --force.`,
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

  const currentSkills = new Set(skillNames);
  for (const previousSkill of previous.skills ?? []) {
    if (!currentSkills.has(previousSkill) && !options.dryRun) {
      await rm(path.join(destination, previousSkill), { recursive: true, force: true });
    }
  }

  await writeInstallManifest(destination, {
    package: packageJson.name,
    version: packageJson.version,
    agent,
    installedAt: new Date().toISOString(),
    completePack: true,
    skills: [...currentSkills].sort(),
  }, options.dryRun);
}

async function uninstallFrom(destination, options) {
  const manifest = await readInstallManifest(destination);
  const tracked = new Set(manifest.skills ?? []);
  if (tracked.size === 0) {
    throw new Error(`No ${packageJson.name} installation manifest found at ${destination}.`);
  }

  const skillNames = [...tracked];

  console.log(`${options.dryRun ? "Would remove" : "Removing"} ${skillNames.length} skills from ${destination}`);
  for (const skillName of skillNames) {
    console.log(`- ${skillName}`);
    if (!options.dryRun) {
      await rm(path.join(destination, skillName), { recursive: true, force: true });
      tracked.delete(skillName);
    }
  }

  if (!options.dryRun) {
    await rm(path.join(destination, manifestName), { force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help") {
    printHelp();
    return;
  }
  if (options.command === "version") {
    console.log(packageJson.version);
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

  const destinations = new Map();
  for (const requestedAgent of options.agents) {
    const agent = normalizeAgent(requestedAgent);
    const destination = resolveDestination(agent, options);
    if (!destinations.has(destination)) destinations.set(destination, agent);
  }

  for (const [destination, agent] of destinations) {
    if (options.command === "install") {
      await installInto(destination, allSkills, options, agent);
    } else {
      await uninstallFrom(destination, options);
    }
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
