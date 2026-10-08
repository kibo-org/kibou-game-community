import { fileURLToPath } from "node:url";
import { isAbsolute, relative, sep } from "node:path";
import { readFileSync, realpathSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const sourceRoot = fileURLToPath(new URL("./src", import.meta.url));
const engineRoot = realpathSync(fileURLToPath(new URL("./node_modules/playcanvas", import.meta.url)));
const policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const boundary: Plugin = {
  name: "offline-community-boundary", enforce: "pre",
  resolveId(source) {
    if (/^(?:https?:|data:|\/\/)/i.test(source)) throw new Error("Remote runtime modules are not allowed");
  },
  load(id) {
    if (id.startsWith("\0")) return;
    const path = id.split("?", 1)[0];
    if (!isAbsolute(path) || path.replace(/\\/g, "/").includes("/node_modules/vite/")) return;
    if (path === fileURLToPath(new URL("./index.html", import.meta.url))) return;
    const enginePath = relative(engineRoot, path);
    if (enginePath !== ".." && !enginePath.startsWith(`..${sep}`) && !isAbsolute(enginePath)) return;
    const local = relative(sourceRoot, path);
    if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) throw new Error("Runtime imports must stay inside src/");
  },
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "LICENSE-playcanvas.txt", source: readFileSync(new URL("./licenses/PLAYCANVAS.txt", import.meta.url), "utf8") });
    this.emitFile({ type: "asset", fileName: "community-manifest.json", source: JSON.stringify({
      contract: "kibou-community-demo-v1", authority: "local-fiction", production_connected: false,
      telemetry: false, login: false, identity_documents: false, real_applications: false,
      engine: "playcanvas", engine_version: "2.20.6", renderer: "3d",
    }, null, 2) + "\n" });
    this.emitFile({ type: "asset", fileName: "_headers", source: `/*\n  Content-Security-Policy: ${policy}\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n` });
  },
};
export default defineConfig({
  root, publicDir: false, envDir: false, envPrefix: "__COMMUNITY_NO_PUBLIC_ENV__", base: "./",
  plugins: [boundary], build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
  server: { host: "127.0.0.1", port: 5175, strictPort: true, hmr: false, fs: { strict: true, allow: [root] } },
  preview: { host: "127.0.0.1", port: 5175, strictPort: true },
});
