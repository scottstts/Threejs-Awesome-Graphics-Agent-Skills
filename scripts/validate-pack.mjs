import { readdir, readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const root = process.cwd();
const skillsRoot = path.join(root, "skills");
const errors = [];
const execFileAsync = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const pluginJson = JSON.parse(
  await readFile(path.join(root, ".codex-plugin", "plugin.json"), "utf8"),
);
const sourceManifest = await readFile(
  path.join(root, "source_materials", "README.md"),
  "utf8",
);
const researchThreeVersion = sourceManifest.match(/`three@(0\.\d+\.\d+)`/)?.[1];
const exampleVersions = new Set();

async function existsAsFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else files.push(entryPath);
  }
  return files;
}

const skillNames = (await readdir(skillsRoot)).sort();
const routerText = await readFile(
  path.join(skillsRoot, "threejs-skill-router", "SKILL.md"),
  "utf8",
);

for (const skillName of skillNames) {
  const skillPath = path.join(skillsRoot, skillName);
  if (!(await stat(skillPath)).isDirectory()) continue;

  if (!/^[a-z0-9-]{1,63}$/.test(skillName)) {
    errors.push(`${skillName}: invalid directory name`);
  }

  const skillFile = path.join(skillPath, "SKILL.md");
  const yamlFile = path.join(skillPath, "agents", "openai.yaml");
  const skillText = await readFile(skillFile, "utf8");
  const yamlText = await readFile(yamlFile, "utf8");

  const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    errors.push(`${skillName}: missing YAML frontmatter`);
    continue;
  }

  const keys = [...frontmatter[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)].map(
    (match) => match[1],
  );
  if (keys.join(",") !== "name,description") {
    errors.push(`${skillName}: frontmatter must contain only name, description`);
  }
  if (!frontmatter[1].includes(`name: ${skillName}`)) {
    errors.push(`${skillName}: frontmatter name does not match directory`);
  }
  if (skillText.includes("[TODO")) {
    errors.push(`${skillName}: unresolved TODO placeholder`);
  }
  if (skillText.split("\n").length > 500) {
    errors.push(`${skillName}: SKILL.md exceeds 500 lines`);
  }
  if (!yamlText.includes(`$${skillName}`)) {
    errors.push(`${skillName}: default_prompt must mention $${skillName}`);
  }

  const shortDescription = yamlText.match(
    /^\s*short_description:\s*"([^"]+)"\s*$/m,
  )?.[1];
  if (
    !shortDescription ||
    shortDescription.length < 25 ||
    shortDescription.length > 64
  ) {
    errors.push(`${skillName}: short_description must be 25–64 characters`);
  }

  const referencesPath = path.join(skillPath, "references");
  const references = await readdir(referencesPath);
  if (references.filter((name) => name.endsWith(".md")).length === 0) {
    errors.push(`${skillName}: references directory is empty`);
  }
  for (const reference of references.filter((name) => name.endsWith(".md"))) {
    const relativeReference = `references/${reference}`;
    if (!skillText.includes(relativeReference)) {
      errors.push(`${skillName}: reference not linked from SKILL.md: ${relativeReference}`);
    }
  }

  for (const match of skillText.matchAll(/\]\((?!https?:|#)([^)#]+)(?:#[^)]+)?\)/g)) {
    const relativePath = decodeURIComponent(match[1]);
    if (!(await existsAsFile(path.join(skillPath, relativePath)))) {
      errors.push(`${skillName}: missing linked file ${relativePath}`);
    }
  }

  const examplesPath = path.join(skillPath, "examples");
  try {
    const exampleFiles = await collectFiles(examplesPath);
    for (const htmlPath of exampleFiles.filter((file) => file.endsWith("index.html"))) {
      const html = await readFile(htmlPath, "utf8");
      const relativeHtml = path.relative(skillPath, htmlPath);
      if (!skillText.includes(relativeHtml)) {
        errors.push(`${skillName}: example not linked from SKILL.md: ${relativeHtml}`);
      }
      if (!/three@0\.\d+\.\d+/.test(html)) {
        errors.push(`${skillName}: example must pin a Three.js version: ${relativeHtml}`);
      } else {
        exampleVersions.add(html.match(/three@(0\.\d+\.\d+)/)[1]);
      }
      if (!/src="\.\/main\.js"/.test(html)) {
        errors.push(`${skillName}: example must load ./main.js: ${relativeHtml}`);
      }
      const mainPath = path.join(path.dirname(htmlPath), "main.js");
      if (!(await existsAsFile(mainPath))) {
        errors.push(`${skillName}: example missing main.js: ${relativeHtml}`);
      } else {
        const main = await readFile(mainPath, "utf8");
        if (/\binner(?:Width|Height)\b/.test(main)) {
          errors.push(`${skillName}: example must size from its host, not innerWidth/innerHeight: ${relativeHtml}`);
        }
        if (/^(?!.*runtime\.listen).*addEventListener\(/m.test(main)) {
          errors.push(`${skillName}: example has an untracked event listener: ${relativeHtml}`);
        }
        if (!main.includes("lab-runtime.js")) {
          errors.push(`${skillName}: example must use the lifecycle harness: ${relativeHtml}`);
        }
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (skillName !== "threejs-skill-router" && !routerText.includes(`$${skillName}`)) {
    errors.push(`${skillName}: not reachable from threejs-skill-router`);
  }
}

if (packageJson.name !== "threejs-gamedev-mega-skills") {
  errors.push("package.json: unexpected package name");
}
if (packageJson.private === true) {
  errors.push("package.json: publishable package must not be private");
}
if (!packageJson.bin?.["threejs-gamedev-mega-skills"]) {
  errors.push("package.json: missing installer bin entry");
}
if (pluginJson.name !== packageJson.name) {
  errors.push("plugin.json: name must match package.json");
}
if (pluginJson.version !== packageJson.version) {
  errors.push("plugin.json: version must match package.json");
}
if (pluginJson.skills !== "./skills/") {
  errors.push("plugin.json: skills must point to ./skills/");
}
if (!(await existsAsFile(path.join(root, "LICENSE")))) {
  errors.push("package: LICENSE is missing");
}
if (exampleVersions.size !== 1) {
  errors.push(`examples: expected one pinned Three.js version, found ${[...exampleVersions].join(", ")}`);
}
if (
  researchThreeVersion &&
  !exampleVersions.has(researchThreeVersion)
) {
  errors.push(
    `examples: pinned version must match research snapshot ${researchThreeVersion}`,
  );
}
if (
  !sourceManifest.includes("RenderPipeline") ||
  !sourceManifest.includes("deprecated in r183")
) {
  errors.push("source manifest: record the PostProcessing to RenderPipeline deprecation");
}

const syntaxRoots = [
  path.join(root, "bin"),
  path.join(root, "scripts"),
  path.join(root, "skills"),
];
for (const syntaxRoot of syntaxRoots) {
  const codeFiles = (await collectFiles(syntaxRoot)).filter(
    (file) => file.endsWith(".js") || file.endsWith(".mjs"),
  );
  for (const codeFile of codeFiles) {
    try {
      await execFileAsync(process.execPath, ["--check", codeFile]);
    } catch (error) {
      errors.push(
        `${path.relative(root, codeFile)}: JavaScript syntax error: ${error.stderr?.trim() ?? error.message}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${skillNames.length} skills.`);
}
