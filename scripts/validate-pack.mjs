import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const skillsRoot = path.join(root, "skills");
const errors = [];

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
      }
      if (!/src="\.\/main\.js"/.test(html)) {
        errors.push(`${skillName}: example must load ./main.js: ${relativeHtml}`);
      }
      const mainPath = path.join(path.dirname(htmlPath), "main.js");
      if (!(await existsAsFile(mainPath))) {
        errors.push(`${skillName}: example missing main.js: ${relativeHtml}`);
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (skillName !== "threejs-skill-router" && !routerText.includes(`$${skillName}`)) {
    errors.push(`${skillName}: not reachable from threejs-skill-router`);
  }
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${skillNames.length} skills.`);
}
