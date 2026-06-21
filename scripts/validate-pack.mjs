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
const officialPackageName = "threejs-awesome-graphics-agent-skills";
const officialDisplayName = "Three.js Awesome Graphics Agent Skills";
const developmentSourcePatterns = [
  /procedural-bank/i,
  /\bez-tree\b/i,
  /three-geospatial/i,
  /mecs-tower-defense-example/i,
  /\bposeidon\b/i,
  /holographic-shader-visualizer/i,
  /takuma-hmng8\/frozen/i,
  /\bmycraft\b/i,
  /interstellar(?:\.three\.js|-three|threejs)/i,
  /\bstellar\b/,
  /mysite_react/i,
  /\bartinlife\b/i,
  /\bgargantua\b/i,
  /scottstts/i,
  /\b(?:the|this|these|both|selected|reviewed|supplied|specific|original) sources?\b/i,
  /source[- ](?:backed|matched|derived|distilled|specific)/i,
  /\breviewed (?:file|implementation|project|preset)\b/i,
  /\b(?:ref(?:erence)? project|development source|source project)\b/i,
  /\b(?:distilled from|distillation)\b/i,
  /\bsource_materials\b/i,
  /\b(?:trace-manifest|example-traces)\b/i,
];

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
const exampleTraceManifest = JSON.parse(
  await readFile(
    path.join(root, "source_materials", "example-traces.json"),
    "utf8",
  ),
);
const skillCoverage = JSON.parse(
  await readFile(
    path.join(root, "source_materials", "skill-coverage.json"),
    "utf8",
  ),
);
const installer = await readFile(
  path.join(root, "bin", "threejs-awesome-graphics-agent-skills.mjs"),
  "utf8",
);

const skillNames = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const discoveredExamples = await discoverExamples(root);
const discoveredExampleIds = new Set(
  discoveredExamples.map((example) => example.id),
);
const discoveredExamplesById = new Map(
  discoveredExamples.map((example) => [example.id, example]),
);

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
  if (!frontmatterData?.description?.includes("Use for")) {
    errors.push(`${skillName}: description must include explicit Use for triggers`);
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
  if (
    typeof interfaceData?.default_prompt === "string" &&
    interfaceData.default_prompt.length < 80
  ) {
    errors.push(`${skillName}: default_prompt is too vague to demonstrate correct use`);
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
      if (/https:\/\/(?:github\.com|codeberg\.org)\//.test(referenceText)) {
        errors.push(`${skillName}: ${reference} leaks a development source URL`);
      }
      if (/\b[a-f0-9]{40}\b/.test(referenceText)) {
        errors.push(`${skillName}: ${reference} leaks a development source revision`);
      }
      if (
        lineCount(referenceText) > 100 &&
        !/^## (?:Contents|Table of contents)$/im.test(referenceText)
      ) {
        errors.push(`${skillName}: ${reference} needs a contents section for progressive disclosure`);
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
  const scenePath = path.join(exampleRoot, "scene.js");
  if (!(await existsAsFile(metadataPath))) {
    errors.push(`${example.id}: missing example.json`);
  }
  if (!(await existsAsFile(scenePath))) {
    errors.push(`${example.id}: missing dev inspection adapter scene.js`);
  }
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  if (Object.hasOwn(metadata, "sourceTrace")) {
    errors.push(`${example.id}: sourceTrace belongs in source_materials/example-traces.json`);
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
  if (example.debugModes.length < 4) {
    errors.push(
      `${example.id}: visual example must expose final plus at least three diagnostic modes`,
    );
  }
  const exampleTraces = exampleTraceManifest.examples?.[example.id] ?? [];
  if (exampleTraces.length === 0) {
    errors.push(`${example.id}: missing development-only source trace metadata`);
  }
  for (const trace of exampleTraces) {
    const source = sourceTraceManifest.sources?.[trace?.source];
    if (!source) {
      errors.push(`${example.id}: unknown sourceTrace source ${trace?.source}`);
      continue;
    }
    if (!Array.isArray(trace.files) || trace.files.length < 1) {
      errors.push(`${example.id}: each sourceTrace must name at least one reviewed file`);
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
          const assetPath = asset.localPath.startsWith("dev/")
            ? path.join(root, asset.localPath)
            : path.join(exampleRoot, asset.localPath);
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
  if (!example.entry.includes("/dev/example-gallery/runtime/index.html?module=")) {
    errors.push(`${example.id}: inspection entry must use the shared dev runtime`);
  }
  const skillText = await readFile(
    path.join(skillsRoot, example.skill, "SKILL.md"),
    "utf8",
  );
  const relativeImplementationRoot = `examples/${example.slug}/`;
  if (!skillText.includes(relativeImplementationRoot)) {
    errors.push(
      `${example.id}: SKILL.md must link an effect implementation under ${relativeImplementationRoot}`,
    );
  }
  if (!readme.includes(`example=${encodeURIComponent(example.id)}`)) {
    errors.push(`${example.id}: README must link every accepted inspection surface`);
  }
}

for (const skillFile of await collectFiles(skillsRoot)) {
  const relative = path.relative(skillsRoot, skillFile).split(path.sep).join("/");
  if (!relative.includes("/examples/")) continue;
  if (
    /\.(?:png|jpe?g|webp|gif|hdr|exr|bin|glb|gltf|fbx|obj|mtl|wasm|html)$/i.test(
      relative,
    )
  ) {
    errors.push(`${relative}: supporting asset or runtime file must live under dev/`);
  }
  if (/(?:^|\/)(?:scene|runtime|inspection-host)\.[cm]?[jt]s$/i.test(relative)) {
    errors.push(`${relative}: supporting scene/runtime implementation must live under dev/`);
  }
}

if (packageJson.name !== officialPackageName) {
  errors.push("package.json: package name is noncanonical");
}
if (packageJson.private === true) {
  errors.push("package.json: publishable package must not be private");
}
if (
  packageJson.bin?.[officialPackageName] !==
  "bin/threejs-awesome-graphics-agent-skills.mjs"
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
if (pluginJson.interface?.displayName !== officialDisplayName) {
  errors.push("plugin.json: displayName must use the official skill-pack name");
}
if (!readme.startsWith(`# ${officialDisplayName}\n`)) {
  errors.push("README: title must use the official skill-pack name");
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
  "jeantimex/geospatial",
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
if (exampleTraceManifest.schemaVersion !== 1) {
  errors.push("example traces: unsupported schemaVersion");
}
const traceExampleIds = Object.keys(exampleTraceManifest.examples ?? {}).sort();
const discoveredExampleIdList = [...discoveredExampleIds].sort();
if (JSON.stringify(traceExampleIds) !== JSON.stringify(discoveredExampleIdList)) {
  errors.push("example traces: entries must match discovered examples exactly");
}

if (skillCoverage.schemaVersion !== 1) {
  errors.push("skill coverage: unsupported schemaVersion");
}
const coverageSkillNames = Object.keys(skillCoverage.skills ?? {}).sort();
if (JSON.stringify(coverageSkillNames) !== JSON.stringify(skillNames)) {
  errors.push("skill coverage: entries must match the discovered skill set exactly");
}
for (const [skillName, coverage] of Object.entries(skillCoverage.skills ?? {})) {
  if (
    !["example-required", "reference-sufficient", "tooling", "meta"].includes(
      coverage?.classification,
    )
  ) {
    errors.push(`${skillName}: invalid coverage classification`);
  }
  if (!Array.isArray(coverage?.evidence) || coverage.evidence.length === 0) {
    errors.push(`${skillName}: coverage evidence is required`);
  }
  if (typeof coverage?.rationale !== "string" || coverage.rationale.length < 80) {
    errors.push(`${skillName}: coverage rationale is too weak`);
  }
  for (const evidence of coverage?.evidence ?? []) {
    if (coverage.classification === "example-required") {
      if (!discoveredExampleIds.has(evidence)) {
        errors.push(`${skillName}: missing required example evidence ${evidence}`);
      } else if ((discoveredExamplesById.get(evidence)?.debugModes.length ?? 0) < 4) {
        errors.push(
          `${skillName}: example evidence ${evidence} needs at least three diagnostic modes`,
        );
      }
    } else {
      const evidencePath = path.join(root, evidence);
      if (!(await existsAsFile(evidencePath))) {
        errors.push(`${skillName}: missing coverage evidence file ${evidence}`);
      } else if (coverage.classification === "reference-sufficient") {
        const evidenceText = await readFile(evidencePath, "utf8");
        if (lineCount(evidenceText) < 150) {
          errors.push(
            `${skillName}: reference-sufficient evidence must be at least 150 lines`,
          );
        }
        if (!evidenceText.includes("```")) {
          errors.push(
            `${skillName}: reference-sufficient evidence needs executable code, formulas, or contracts`,
          );
        }
        if (!/\b(?:debug|diagnostics?)\b/i.test(evidenceText)) {
          errors.push(
            `${skillName}: reference-sufficient evidence needs explicit diagnostics`,
          );
        }
        if (!/\b(?:failure|limitations?|defects?|boundaries)\b/i.test(evidenceText)) {
          errors.push(
            `${skillName}: reference-sufficient evidence needs failure modes or boundaries`,
          );
        }
        const numericContracts = evidenceText.match(
          /(?:^|[^A-Za-z])(?:\d+(?:\.\d+)?|\.\d+)(?:[^A-Za-z]|$)/g,
        ) ?? [];
        if (numericContracts.length < 8) {
          errors.push(
            `${skillName}: reference-sufficient evidence needs concrete numeric contracts`,
          );
        }
      }
    }
  }
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

const allSkillFiles = await collectFiles(skillsRoot);
const allMarkdownFiles = allSkillFiles.filter((file) => file.endsWith(".md"));
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

const packagedSurfaceFiles = [
  ...allSkillFiles,
  path.join(root, "README.md"),
  path.join(root, "package.json"),
  path.join(root, ".codex-plugin", "plugin.json"),
  path.join(root, "bin", "threejs-awesome-graphics-agent-skills.mjs"),
];
const productTextFiles = packagedSurfaceFiles.filter((file) =>
  /\.(?:md|yaml|json|js|mjs|html)$/i.test(file) &&
  path.basename(file) !== "THIRD_PARTY_LICENSES.md"
);
for (const productFile of productTextFiles) {
  const relative = path.relative(root, productFile);
  const text = await readFile(productFile, "utf8");
  for (const pattern of developmentSourcePatterns) {
    if (pattern.test(relative) || pattern.test(text)) {
      errors.push(`${relative}: leaks development-source identity (${pattern})`);
      break;
    }
  }
}

const routeTable = routerText.match(
  /## Route by the visual system being authored\n([\s\S]*?)\n## /,
)?.[1] ?? "";
for (const skillName of skillNames) {
  if (skillName === routerName) continue;
  const routeMatches = routeTable.match(
    new RegExp(`\\$${skillName}(?![a-z0-9-])`, "g"),
  ) ?? [];
  if (routeMatches.length !== 1) {
    errors.push(
      `${routerName}: expected exactly one route-table entry for $${skillName}, found ${routeMatches.length}`,
    );
  }
}

const skillMarkdownSurface = (
  await Promise.all(allMarkdownFiles.map((file) => readFile(file, "utf8")))
).join("\n");
for (const match of skillMarkdownSurface.matchAll(/\$(threejs-[a-z0-9-]+)/g)) {
  if (!skillNames.includes(match[1])) {
    errors.push(`pack: markdown references missing skill $${match[1]}`);
  }
}
if (/\/Users\/|[A-Za-z]:\\Users\\/.test(skillMarkdownSurface)) {
  errors.push("pack: distributed skill markdown contains a local user path");
}

const requiredRoutingBoundaries = [
  {
    file: "threejs-spectral-ocean/SKILL.md",
    pattern: /\$threejs-water-optics/,
    message: "spectral ocean must route bounded analytic water elsewhere",
  },
  {
    file: "threejs-water-optics/SKILL.md",
    pattern: /\$threejs-spectral-ocean/,
    message: "water optics must route spectral oceans elsewhere",
  },
  {
    file: "threejs-image-pipeline/SKILL.md",
    pattern: /For one effect, load its atomic skill instead/,
    message: "image pipeline must not absorb atomic post-processing tasks",
  },
  {
    file: "threejs-temporal-surfaces/SKILL.md",
    pattern: /Do not route world footprints/,
    message: "temporal surfaces must declare its screen-space boundary",
  },
];
for (const boundary of requiredRoutingBoundaries) {
  const text = await readFile(path.join(skillsRoot, boundary.file), "utf8");
  if (!boundary.pattern.test(text)) {
    errors.push(`${boundary.file}: ${boundary.message}`);
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
  "threejs-stylized-shader-transitions",
];
const activeSurface = [
  readme,
  JSON.stringify(pluginJson),
  routerText,
  installer,
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

const stalePackNames = [
  "threejs-gamedev-mega-skills",
  "Three.js Visual Mega Skills",
  "Three.js Awesome Visual Mega Pack Skills",
];
for (const staleName of stalePackNames) {
  if (activeSurface.includes(staleName)) {
    errors.push(`pack: stale package-name reference ${staleName}`);
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
