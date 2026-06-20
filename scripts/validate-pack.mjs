import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { parseDocument } from "yaml";
import { discoverExamples } from "../dev/example-gallery/discovery.mjs";

const root = process.cwd();
const skillsRoot = path.join(root, "skills");
const errors = [];
const execFileAsync = promisify(execFile);

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

function parseYaml(text, label) {
  const document = parseDocument(text, {
    prettyErrors: true,
    strict: true,
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    for (const error of document.errors) {
      errors.push(`${label}: invalid YAML: ${error.message}`);
    }
    return null;
  }
  return document.toJS();
}

function lineCount(text) {
  return text.split("\n").length;
}

const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const pluginJson = JSON.parse(
  await readFile(path.join(root, ".codex-plugin", "plugin.json"), "utf8"),
);
const readme = await readFile(path.join(root, "README.md"), "utf8");
const sourceManifest = await readFile(
  path.join(root, "source_materials", "README.md"),
  "utf8",
);
const sourceTraceManifest = JSON.parse(
  await readFile(
    path.join(root, "source_materials", "trace-manifest.json"),
    "utf8",
  ),
);
const installer = await readFile(
  path.join(root, "bin", "threejs-gamedev-mega-skills.mjs"),
  "utf8",
);

const skillNames = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const discoveredExamples = await discoverExamples(root);

if (skillNames.length < 12) {
  errors.push(`pack: expected an expert modular pack, found only ${skillNames.length} skills`);
}

const routerName = "threejs-skill-router";
if (!skillNames.includes(routerName)) {
  errors.push(`pack: missing ${routerName}`);
}

const routerText = await readFile(
  path.join(skillsRoot, routerName, "SKILL.md"),
  "utf8",
);

const forbiddenIntroHeadings = [
  /^#\s+getting started/im,
  /^##\s+installation/im,
  /^##\s+what is three\.?js/im,
  /^##\s+creating a scene/im,
  /^##\s+basic setup/im,
];

for (const skillName of skillNames) {
  const skillPath = path.join(skillsRoot, skillName);
  if (!/^[a-z0-9-]{1,63}$/.test(skillName)) {
    errors.push(`${skillName}: invalid directory name`);
  }

  const skillFile = path.join(skillPath, "SKILL.md");
  const yamlFile = path.join(skillPath, "agents", "openai.yaml");
  if (!(await existsAsFile(skillFile))) {
    errors.push(`${skillName}: missing SKILL.md`);
    continue;
  }
  if (!(await existsAsFile(yamlFile))) {
    errors.push(`${skillName}: missing agents/openai.yaml`);
    continue;
  }

  const skillText = await readFile(skillFile, "utf8");
  const yamlText = await readFile(yamlFile, "utf8");
  const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    errors.push(`${skillName}: missing YAML frontmatter`);
    continue;
  }

  const frontmatterData = parseYaml(frontmatter[1], `${skillName}/SKILL.md`);
  const frontmatterKeys = frontmatterData && typeof frontmatterData === "object"
    ? Object.keys(frontmatterData)
    : [];
  if (frontmatterKeys.join(",") !== "name,description") {
    errors.push(`${skillName}: frontmatter must contain only name, description`);
  }
  if (frontmatterData?.name !== skillName) {
    errors.push(`${skillName}: frontmatter name does not match directory`);
  }
  if (
    typeof frontmatterData?.description !== "string" ||
    frontmatterData.description.trim().length < 80
  ) {
    errors.push(`${skillName}: description must route a specific expert task`);
  }
  if (skillText.includes("[TODO")) {
    errors.push(`${skillName}: unresolved TODO placeholder`);
  }
  if (lineCount(skillText) > 220) {
    errors.push(`${skillName}: SKILL.md is too large for routing context`);
  }
  for (const pattern of forbiddenIntroHeadings) {
    if (pattern.test(skillText)) {
      errors.push(`${skillName}: contains introductory documentation instead of expertise`);
    }
  }

  const agentData = parseYaml(yamlText, `${skillName}/agents/openai.yaml`);
  const agentKeys = agentData && typeof agentData === "object"
    ? Object.keys(agentData)
    : [];
  if (agentKeys.join(",") !== "interface") {
    errors.push(`${skillName}: agents/openai.yaml must contain only interface`);
  }
  const interfaceData = agentData?.interface;
  const interfaceKeys = interfaceData && typeof interfaceData === "object"
    ? Object.keys(interfaceData)
    : [];
  if (
    interfaceKeys.join(",") !==
    "display_name,short_description,default_prompt"
  ) {
    errors.push(
      `${skillName}: interface must contain display_name, short_description, default_prompt`,
    );
  }
  if (
    typeof interfaceData?.display_name !== "string" ||
    interfaceData.display_name.trim().length === 0
  ) {
    errors.push(`${skillName}: display_name must be non-empty`);
  }
  if (
    typeof interfaceData?.short_description !== "string" ||
    interfaceData.short_description.length < 25 ||
    interfaceData.short_description.length > 64
  ) {
    errors.push(`${skillName}: short_description must be 25–64 characters`);
  }
  if (
    typeof interfaceData?.default_prompt !== "string" ||
    !interfaceData.default_prompt.includes(`$${skillName}`)
  ) {
    errors.push(`${skillName}: default_prompt must mention $${skillName}`);
  }

  for (const match of skillText.matchAll(/\]\((?!https?:|#)([^)#]+)(?:#[^)]+)?\)/g)) {
    const relativePath = decodeURIComponent(match[1]);
    if (!(await existsAsFile(path.join(skillPath, relativePath)))) {
      errors.push(`${skillName}: missing linked file ${relativePath}`);
    }
  }

  if (skillName !== routerName) {
    const referencesPath = path.join(skillPath, "references");
    let references = [];
    try {
      references = (await readdir(referencesPath))
        .filter((name) => name.endsWith(".md"))
        .sort();
    } catch {
      errors.push(`${skillName}: missing references directory`);
    }
    if (references.length === 0) {
      errors.push(`${skillName}: requires at least one practical reference`);
    }
    for (const reference of references) {
      const relativeReference = `references/${reference}`;
      if (!skillText.includes(relativeReference)) {
        errors.push(`${skillName}: reference not linked from SKILL.md: ${relativeReference}`);
      }
      const referenceText = await readFile(path.join(referencesPath, reference), "utf8");
      if (lineCount(referenceText) < 80) {
        errors.push(`${skillName}: ${reference} is too shallow for expert guidance`);
      }
      if (!referenceText.includes("```")) {
        errors.push(`${skillName}: ${reference} lacks direct code, formulas, or data contracts`);
      }
      if (!/\b(debug|diagnostics?)\b/i.test(referenceText)) {
        errors.push(`${skillName}: ${reference} lacks inspection/debug outputs`);
      }
    }
    if (!routerText.includes(`$${skillName}`)) {
      errors.push(`${skillName}: not reachable from ${routerName}`);
    }
    if (!sourceManifest.includes(`$${skillName}`)) {
      errors.push(`${skillName}: missing from source-material consumption map`);
    }
  }

  if (!readme.includes(`\`${skillName}\``)) {
    errors.push(`${skillName}: missing from README skill inventory`);
  }
}

for (const example of discoveredExamples) {
  const exampleRoot = path.join(
    root,
    example.source.replace(/^\//, ""),
  );
  const metadataPath = path.join(exampleRoot, "example.json");
  const indexPath = path.join(exampleRoot, "index.html");
  if (!(await existsAsFile(metadataPath))) {
    errors.push(`${example.id}: missing example.json`);
  }
  if (example.warnings.length > 0) {
    errors.push(`${example.id}: ${example.warnings.join("; ")}`);
  }
  if (example.description.trim().length < 60) {
    errors.push(`${example.id}: metadata description is too weak`);
  }
  if (example.techniques.length < 2) {
    errors.push(`${example.id}: metadata must identify at least two techniques`);
  }
  if (example.debugModes.length < 2) {
    errors.push(`${example.id}: visual example must expose final plus diagnostic modes`);
  }
  if (example.sourceTrace.length === 0) {
    errors.push(`${example.id}: missing file-level sourceTrace metadata`);
  }
  for (const trace of example.sourceTrace) {
    const source = sourceTraceManifest.sources?.[trace?.source];
    if (!source) {
      errors.push(`${example.id}: unknown sourceTrace source ${trace?.source}`);
      continue;
    }
    if (!Array.isArray(trace.files) || trace.files.length < 2) {
      errors.push(`${example.id}: each sourceTrace must name at least two reviewed files`);
    } else {
      for (const file of trace.files) {
        if (!source.files?.[file]) {
          errors.push(
            `${example.id}: ${trace.source} file is absent from trace manifest: ${file}`,
          );
        }
      }
    }
    if (!Array.isArray(trace.mechanisms) || trace.mechanisms.length < 3) {
      errors.push(`${example.id}: each sourceTrace must name at least three extracted mechanisms`);
    }
    if (trace.assets !== undefined) {
      if (!Array.isArray(trace.assets) || trace.assets.length === 0) {
        errors.push(`${example.id}: sourceTrace assets must be a non-empty array`);
      } else {
        for (const asset of trace.assets) {
          const expectedHash = source.assets?.[asset?.sourcePath];
          if (!expectedHash) {
            errors.push(
              `${example.id}: ${trace.source} asset is absent from trace manifest: ${asset?.sourcePath}`,
            );
            continue;
          }
          if (
            typeof asset.localPath !== "string" ||
            asset.localPath.startsWith("/") ||
            asset.localPath.includes("..")
          ) {
            errors.push(`${example.id}: invalid bundled asset path ${asset?.localPath}`);
            continue;
          }
          const assetPath = path.join(exampleRoot, asset.localPath);
          const bytes = await readFile(assetPath).catch(() => null);
          if (!bytes) {
            errors.push(`${example.id}: missing bundled asset ${asset.localPath}`);
            continue;
          }
          const actualHash = createHash("sha256").update(bytes).digest("hex");
          if (actualHash !== expectedHash) {
            errors.push(
              `${example.id}: bundled asset hash mismatch for ${asset.localPath}`,
            );
          }
        }
      }
    }
    if (
      !["independent-distillation", "conceptual-only"].includes(trace.boundary)
    ) {
      errors.push(`${example.id}: invalid sourceTrace boundary for ${trace.source}`);
    }
    if (source.license === "unobserved" && trace.boundary !== "conceptual-only") {
      errors.push(
        `${example.id}: unlicensed source ${trace.source} must be conceptual-only`,
      );
    }
    if (
      !sourceManifest.includes(source.repository) ||
      !sourceManifest.includes(source.revision)
    ) {
      errors.push(
        `${example.id}: source ledger is missing ${trace.source} repository or revision`,
      );
    }
  }
  const indexHtml = await readFile(indexPath, "utf8");
  if (!indexHtml.includes("example-runtime.js")) {
    const exampleFiles = await collectFiles(exampleRoot);
    const runtimeImported = (
      await Promise.all(
        exampleFiles
          .filter((file) => file.endsWith(".js") || file.endsWith(".mjs"))
          .map((file) => readFile(file, "utf8")),
      )
    ).some((text) => text.includes("example-runtime.js"));
    if (!runtimeImported) {
      errors.push(`${example.id}: example must use the gallery runtime contract`);
    }
  }
  const skillText = await readFile(
    path.join(skillsRoot, example.skill, "SKILL.md"),
    "utf8",
  );
  const relativeIndex = `examples/${example.slug}/index.html`;
  if (!skillText.includes(relativeIndex)) {
    errors.push(`${example.id}: SKILL.md must link ${relativeIndex}`);
  }
}

if (packageJson.name !== "threejs-gamedev-mega-skills") {
  errors.push("package.json: compatibility package name changed");
}
if (packageJson.private === true) {
  errors.push("package.json: publishable package must not be private");
}
if (
  packageJson.bin?.["threejs-gamedev-mega-skills"] !==
  "bin/threejs-gamedev-mega-skills.mjs"
) {
  errors.push("package.json: installer bin entry is missing or noncanonical");
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
if (readme.includes("--skills") || installer.includes("--skills")) {
  errors.push("package: partial installation must not be documented or exposed");
}
if (!(await existsAsFile(path.join(root, "LICENSE")))) {
  errors.push("package: LICENSE is missing");
}
if (
  !sourceManifest.includes("RenderPipeline") ||
  !sourceManifest.includes("deprecated in r183")
) {
  errors.push("source manifest: missing RenderPipeline migration record");
}

const requiredSourceRecords = [
  "dgreenheck/ez-tree",
  "takram-design-engineering/three-geospatial",
  "perplexdotgg/mecs-tower-defense-example",
  "YasirAwan4831/holographic-shader-visualizer-three.Js",
  "vibe-stack/procedural-bank",
  "takuma-hmng8/frozen",
  "owenyuwono/poseidon",
  "https://github.com/scottstts/MyCraft",
  "https://github.com/scottstts/Stellar",
  "https://github.com/scottstts/Interstellar.three.js",
  "https://github.com/scottstts/mysite_React",
];
for (const sourceRecord of requiredSourceRecords) {
  if (!sourceManifest.includes(sourceRecord)) {
    errors.push(`source manifest: missing reviewed source ${sourceRecord}`);
  }
}

if (sourceTraceManifest.schemaVersion !== 1) {
  errors.push("source trace manifest: unsupported schemaVersion");
}
for (const [sourceId, source] of Object.entries(
  sourceTraceManifest.sources ?? {},
)) {
  if (
    typeof source.repository !== "string" ||
    !source.repository.startsWith("https://")
  ) {
    errors.push(`source trace manifest: ${sourceId} repository must be an HTTPS URL`);
  }
  if (!/^[a-f0-9]{40}$/.test(source.revision ?? "")) {
    errors.push(`source trace manifest: ${sourceId} revision must be a full Git SHA`);
  }
  if (!source.files || Object.keys(source.files).length === 0) {
    errors.push(`source trace manifest: ${sourceId} has no reviewed files`);
  }
  for (const [file, hash] of Object.entries(source.files ?? {})) {
    if (file.startsWith("/") || file.includes("..")) {
      errors.push(`source trace manifest: ${sourceId} has unsafe file path ${file}`);
    }
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      errors.push(`source trace manifest: ${sourceId}/${file} has invalid SHA-256`);
    }
  }
  for (const [file, hash] of Object.entries(source.assets ?? {})) {
    if (file.startsWith("/") || file.includes("..")) {
      errors.push(`source trace manifest: ${sourceId} has unsafe asset path ${file}`);
    }
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      errors.push(`source trace manifest: ${sourceId}/${file} has invalid asset SHA-256`);
    }
  }
}

const allMarkdownFiles = (await collectFiles(skillsRoot)).filter(
  (file) => file.endsWith(".md"),
);
for (const markdownFile of allMarkdownFiles) {
  const markdown = await readFile(markdownFile, "utf8");
  for (const match of markdown.matchAll(/https:\/\/[^\s)]+/g)) {
    if (!sourceManifest.includes(match[0])) {
      errors.push(
        `source manifest: undocumented URL in ${path.relative(root, markdownFile)}: ${match[0]}`,
      );
    }
  }
}

const staleSkillNames = [
  "threejs-project-foundations",
  "threejs-game-design-playability",
  "threejs-audio-feedback",
  "threejs-data-visualization",
  "threejs-testing-debugging",
  "threejs-webgpu-tsl",
  "threejs-postprocessing",
];
const activeSurface = [
  readme,
  JSON.stringify(pluginJson),
  ...await Promise.all(
    (await collectFiles(path.join(root, "scripts")))
      .filter(
        (file) =>
          file.endsWith(".mjs") &&
          path.basename(file) !== "validate-pack.mjs",
      )
      .map((file) => readFile(file, "utf8")),
  ),
].join("\n");
for (const staleName of staleSkillNames) {
  if (activeSurface.includes(staleName)) {
    errors.push(`pack: stale deleted skill reference ${staleName}`);
  }
}

for (const codeRoot of [
  path.join(root, "bin"),
  path.join(root, "scripts"),
  path.join(root, "dev", "example-gallery"),
]) {
  const codeFiles = (await collectFiles(codeRoot)).filter(
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
  console.log(`Validated ${skillNames.length} expert graphics skills.`);
}
