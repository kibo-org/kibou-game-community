import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

function canvasColors(png) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8); assert([2, 6].includes(png[25])); assert.equal(png[28], 0);
  const channels = png[25] === 6 ? 4 : 3, stride = width * channels, chunks = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset), kind = png.toString("ascii", offset + 4, offset + 8);
    if (kind === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)); let previous = Buffer.alloc(stride), offset = 0;
  const colors = new Set();
  for (let y = 0; y < height; y++) {
    const filter = raw[offset++], row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row[x - channels] : 0, b = previous[x], c = x >= channels ? previous[x - channels] : 0;
      const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
      const predictor = [0, a, b, Math.floor((a + b) / 2), da <= db && da <= dc ? a : db <= dc ? b : c][filter];
      assert(predictor !== undefined); row[x] = (raw[offset++] + predictor) & 255;
    }
    for (let x = 0; x < stride; x += channels) colors.add(`${row[x]},${row[x + 1]},${row[x + 2]}`);
    previous = row;
  }
  return colors.size;
}

// Use an already-reviewed local Playwright installation; do not auto-install tools.
const tool = process.argv[2];
if (!tool) throw new Error("Pass a local Playwright package directory. Build the demo first.");
const { chromium } = await import(pathToFileURL(resolve(tool, "index.mjs")).href);
const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "http://127.0.0.1:5175";
try { await fetch(origin, { signal: AbortSignal.timeout(500) }); throw new Error("Port 5175 is occupied; stop your own server first."); }
catch (error) { if (error.message.includes("occupied")) throw error; }
const server = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", "5175", "--strictPort"], { cwd: root, stdio: "ignore" });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Local preview failed to start");
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(500) })).ok; } catch { /* Startup wait. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, "Preview did not become ready");
  browser = await chromium.launch();
  const output = await mkdtemp(resolve(tmpdir(), "community-browser-"));
  for (const [name, viewport, touch] of [["desktop", { width: 1280, height: 800 }, false], ["mobile", { width: 390, height: 844 }, true]]) {
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, acceptDownloads: true });
    const failures = [];
    await context.route("**/*", route => {
      if (new URL(route.request().url()).origin !== origin) { failures.push("external request"); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.on("pageerror", error => failures.push(error.message));
    const waitText = (selector, text, target = page) => target.waitForFunction(({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text), { selector, text });
    await page.goto(origin);
    await page.locator(".place-labels button").first().waitFor();
    assert.equal(await page.locator(".place-labels button").count(), 4);
    await page.locator("#board").focus(); await page.keyboard.press("Enter");
    assert(await page.locator("#panel-title").evaluate(node => node === document.activeElement));
    await page.keyboard.press("Escape");
    assert(await page.locator("#board").evaluate(node => node === document.activeElement));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
    const screenshot = await page.locator("canvas").screenshot();
    assert(canvasColors(screenshot) > 16, "Canvas pixels are blank or a single background");
    await page.screenshot({ path: resolve(output, `${name}.png`) });
    const other = await context.newPage(); await other.goto(origin);
    await page.locator("#board").click();
    await page.getByRole("button", { name: "Read the village note" }).click();
    await waitText("#storage-status", "Another tab", other);
    await other.locator("#board").click(); await other.getByRole("button", { name: "Read the village note" }).click();
    await waitText("#status", "Another tab", other);
    const download = other.waitForEvent("download"); await other.locator("#export-progress").click();
    const file = await download; assert.equal(file.suggestedFilename(), "community-progress.json");
    assert.equal(JSON.parse(await readFile(await file.path(), "utf8")).schema, 1);
    page.once("dialog", dialog => dialog.accept()); await page.locator("#reset").click();
    await waitText("#progress", "0 / 3");
    other.once("dialog", dialog => dialog.accept()); await other.locator("#reload-save").click();
    await waitText("#storage-status", "saved", other);
    assert((await other.locator("#progress").textContent()).includes("0 / 3"));
    await other.close();
    await page.locator("#host").click(); await page.getByRole("button", { name: "Submit local demo application" }).click();
    await waitText("#panel", "submitted");
    await page.getByRole("button", { name: "Try fictional Host view" }).click();
    await page.getByRole("button", { name: "Accept in demo" }).click();
    await page.getByRole("button", { name: "Open fictional conversation" }).click();
    await page.getByRole("button", { name: "Ask about quiet time" }).click(); await waitText(".reply", "21:00");
    await page.goto(`${origin}/community-manifest.json`); await page.goBack();
    await page.locator(".place-labels button").first().waitFor();
    await page.locator("#applications").click(); await waitText("#panel", "accepted");
    assert.deepEqual(failures, []);
    await context.close();
  }
  const context = await browser.newContext();
  await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    localStorage.setItem("kibou-community-fiction:v1", "{fictional-broken-save");
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  const page = await context.newPage(); await page.goto(origin);
  assert((await page.locator("#status").textContent()).includes("3D rendering is unavailable"));
  const download = page.waitForEvent("download"); await page.locator("#export-original").click();
  assert.equal(await readFile(await (await download).path(), "utf8"), "{fictional-broken-save");
  await page.locator("#board").click(); await page.getByRole("button", { name: "Read the village note" }).click();
  assert((await page.locator("#progress").textContent()).includes("1 / 3"));
  await context.close();
  console.log("Passed desktop/mobile keyboard, layout, canvas, multi-tab conflict, reset, export, Host conversation, return navigation and WebGL fallback. Screenshots in a private temporary directory.");
} finally {
  try { await browser?.close(); }
  finally {
    if (server.exitCode === null) {
      const exited = new Promise(resolve => server.once("exit", resolve));
      server.kill("SIGTERM");
      const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
      await exited; clearTimeout(timer);
    }
  }
}
