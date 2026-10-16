/**
 * JAMFLEX build — app/ -> dist/.
 * No bundler and no dependencies: the front-end is plain ES modules, so the build is a copy
 * plus a sanity pass over the module graph (every relative import resolves, every file parses).
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "app");
const out = join(root, "dist");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(src)) {
  const from = join(src, entry);
  cpSync(from, join(out, entry), entry === "js" || entry === "fonts" ? { recursive: true } : undefined);
}

/* ---- module graph: start at the entry the HTML loads ---- */
const seen = [];
const queue = [resolve(out, "js/main.js")];
const missing = [];
const visited = new Set();

while (queue.length) {
  const file = queue.shift();
  if (visited.has(file)) continue;
  visited.add(file);

  let code;
  try {
    code = readFileSync(file, "utf8");
  } catch {
    missing.push(relative(out, file));
    continue;
  }
  seen.push(file);

  for (const match of code.matchAll(/(?:from|import)\s*["'](\.[^"']+?)["']/g)) {
    queue.push(resolve(dirname(file), match[1]));
  }
}

if (missing.length) {
  console.error(`build: unresolved imports -> ${missing.join(", ")}`);
  process.exit(1);
}

/* ---- parse check: node --check understands ESM syntax without executing the module ---- */
const bad = [];
for (const file of seen) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) bad.push(`${relative(out, file)}: ${(result.stderr || "").trim()}`);
}

if (bad.length) {
  console.error("build: syntax errors");
  for (const line of bad) console.error("  " + line);
  process.exit(1);
}

console.log(`build: ${seen.length} modules checked -> dist/`);
