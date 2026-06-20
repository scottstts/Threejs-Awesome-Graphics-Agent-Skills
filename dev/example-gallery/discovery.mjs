import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function discoverDirectories(root, segments) {
  const found = [];
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return found;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, entry.name);
    if (await isFile(path.join(directory, "index.html"))) {
      found.push({ directory, segments: [...segments, entry.name] });
    }
  }
  return found;
}

function normalizeDebugModes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((mode) => {
      if (typeof mode === "string") return { value: mode, label: mode };
      if (
        mode &&
        typeof mode.value === "string" &&
        typeof mode.label === "string"
      ) {
        return { value: mode.value, label: mode.label };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeViewport(value) {
  if (
    value &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height)
  ) {
    return {
      width: Math.max(240, Math.round(value.width)),
      height: Math.max(180, Math.round(value.height)),
    };
  }
  return { width: 1440, height: 900 };
}

async function loadExample(projectRoot, candidate, origin) {
  const metadataPath = path.join(candidate.directory, "example.json");
  const warnings = [];
  let metadata = {};

  if (await isFile(metadataPath)) {
    try {
      metadata = await readJson(metadataPath);
    } catch (error) {
      warnings.push(`Invalid example.json: ${error.message}`);
    }
  } else {
    warnings.push("Missing example.json; using directory-derived metadata.");
  }

  const relativeDirectory = path
    .relative(projectRoot, candidate.directory)
    .split(path.sep)
    .join("/");
  const skill = origin === "skill" ? candidate.segments[0] : null;
  const slug = candidate.segments.at(-1);
  const id = origin === "skill" ? `${skill}/${slug}` : `fixture/${slug}`;

  const title = typeof metadata.title === "string" && metadata.title.trim()
    ? metadata.title.trim()
    : slug
        .split("-")
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");

  return {
    id,
    origin,
    skill,
    slug,
    title,
    description:
      typeof metadata.description === "string" ? metadata.description : "",
    techniques: Array.isArray(metadata.techniques)
      ? metadata.techniques.filter((value) => typeof value === "string")
      : [],
    backend:
      typeof metadata.backend === "string" ? metadata.backend : "unspecified",
    entry: `/${relativeDirectory}/index.html`,
    source: `/${relativeDirectory}/`,
    preview:
      typeof metadata.preview === "string"
        ? `/${relativeDirectory}/${metadata.preview}`
        : null,
    defaultViewport: normalizeViewport(metadata.defaultViewport),
    defaultDpr: Number.isFinite(metadata.defaultDpr)
      ? Math.min(3, Math.max(0.5, metadata.defaultDpr))
      : 1,
    debugModes: normalizeDebugModes(metadata.debugModes),
    controls: Array.isArray(metadata.controls)
      ? metadata.controls.filter((value) => typeof value === "string")
      : [],
    sourceTrace: Array.isArray(metadata.sourceTrace)
      ? metadata.sourceTrace
      : [],
    warnings,
  };
}

export async function discoverExamples(
  projectRoot,
  { includeFixtures = false } = {},
) {
  const skillsRoot = path.join(projectRoot, "skills");
  const skillEntries = await readdir(skillsRoot, { withFileTypes: true });
  const candidates = [];

  for (const skillEntry of skillEntries) {
    if (!skillEntry.isDirectory()) continue;
    const examplesRoot = path.join(
      skillsRoot,
      skillEntry.name,
      "examples",
    );
    candidates.push(
      ...await discoverDirectories(examplesRoot, [skillEntry.name]),
    );
  }

  const loaded = await Promise.all(
    candidates.map((candidate) =>
      loadExample(projectRoot, candidate, "skill")
    ),
  );

  if (includeFixtures) {
    const fixtureRoot = path.join(
      projectRoot,
      "dev",
      "example-gallery",
      "fixtures",
    );
    const fixtures = await discoverDirectories(fixtureRoot, []);
    loaded.push(
      ...await Promise.all(
        fixtures.map((candidate) =>
          loadExample(projectRoot, candidate, "fixture")
        ),
      ),
    );
  }

  return loaded.sort(
    (a, b) =>
      (a.skill ?? "zz-fixtures").localeCompare(b.skill ?? "zz-fixtures") ||
      a.title.localeCompare(b.title),
  );
}
