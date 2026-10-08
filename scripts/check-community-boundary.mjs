import { readdir, readFile, lstat } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => { throw new Error(`Community boundary: ${message}`); };
const ignored = new Set([".git", "node_modules", "dist", "coverage", ".vite"]);
async function walk(directory) {
  const files = [];
  for (const name of await readdir(directory)) {
    if (ignored.has(name)) continue;
    const path = join(directory, name);
    const local = relative(root, path).replaceAll("\\", "/");
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) fail(`symlinks are not allowed: ${local}`);
    if (/^\.env(?:\.|$)/.test(name)) fail(`environment files are not allowed: ${local}`);
    if (/\.(?:patch|diff|sqlite|db|pem|key)(?:-(?:wal|shm|journal))?$/i.test(name)) {
      fail(`private working data or credentials are not allowed: ${local}`);
    }
    if (stat.isDirectory()) files.push(...await walk(path));
    else if (stat.isFile()) files.push(local);
    else fail(`unsupported file type: ${local}`);
  }
  return files;
}
const files = await walk(root);
for (const file of files) {
  if (/^(?:public|assets|api|contracts|supabase|db|packages|playcanvas|test-results)\//.test(file)) fail(`private or unreviewed directory: ${file}`);
}
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (pkg.workspaces || pkg.private !== true || pkg.license !== "MIT") fail("the standalone package policy changed");
if (JSON.stringify(pkg.dependencies) !== JSON.stringify({ playcanvas: "2.20.6" })) fail("only the reviewed pinned PlayCanvas engine is allowed");
const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
const engine = lock.packages?.["node_modules/playcanvas"];
if (engine?.version !== "2.20.6" || engine.integrity !== "sha512-Dc0jlnjL782G9DhU+dT6UyxcnKA305xSCwZYTXpn2Ohx+6GXisCknYvog50b2FgMb+OPSY7SqBWMVrSsgvUtKw==") fail("the reviewed engine lock changed");
for (const [name, dependency] of Object.entries(lock.packages ?? {})) {
  if (!name) continue;
  if (dependency.link || !dependency.resolved?.startsWith("https://registry.npmjs.org/") || !dependency.integrity?.startsWith("sha512-")) fail(`unreviewed dependency source: ${name}`);
}
if (Object.keys(pkg.devDependencies ?? {}).sort().join(",") !== "typescript,vite,vitest") fail("new dependencies require maintainer review and an updated boundary policy");
for (const file of files.filter((file) => file.startsWith("src/") && /\.[cm]?[jt]s$/.test(file) && !file.endsWith(".test.ts"))) {
  const text = await readFile(join(root, file), "utf8");
  // This is a conservative PR tripwire, not a substitute for a parser or a secret scan.
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|\bimport\s*\(/.test(text)) fail(`network or dynamic module access: ${file}`);
  if (/\b(?:process\.env|import\.meta\.env)\b|https?:\/\/|supabase|kibouspace\.com/i.test(text)) fail(`production or external configuration: ${file}`);
  const imports = [...text.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g)];
  for (const [, specifier] of imports) {
    if (specifier === "playcanvas") continue;
    if (!specifier.startsWith("./") && !specifier.startsWith("../")) fail(`runtime dependency: ${file}`);
    const local = relative(join(root, "src"), resolve(dirname(join(root, file)), specifier));
    if (local === ".." || local.startsWith("../") || local.startsWith("..\\")) fail(`source escape: ${file}`);
  }
}
const manifest = JSON.parse(await readFile(join(root, "ASSET_MANIFEST.json"), "utf8"));
if (manifest.existing_production_assets_included !== false || manifest.trademarks_licensed !== false) fail("asset/brand declarations changed");
for (const asset of manifest.assets ?? []) {
  if (!files.includes(asset.path) || !asset.creator || !asset.credit || asset.license !== "CC-BY-4.0" || asset.contains_real_person_data !== false) fail("missing asset provenance");
}
if (!manifest.assets?.length) fail("the asset inventory is empty");
for (const file of files.filter((file) => file.startsWith(".github/workflows/"))) {
  const text = await readFile(join(root, file), "utf8");
  if (/secrets\s*[.\[]|pull_request_target|workflow_run|self-hosted|id-token|write-all|:\s*write\b|\benvironment:|\bdeploy\b/i.test(text)) fail(`privileged workflow: ${file}`);
  const actions = [...text.matchAll(/\buses:\s*([^\s#]+)/g)];
  if (actions.some(([, action]) => !/^actions\/(?:checkout|setup-node)@[a-f0-9]{40}$/.test(action))) fail(`unapproved or unpinned action: ${file}`);
  if (!/persist-credentials:\s*false/.test(text) || !/contents:\s*read/.test(text)) fail(`workflow credential policy: ${file}`);
}
console.log("Static community boundary checks passed. Runtime, dependency and secret reviews are separate requirements.");
