import * as pc from "playcanvas";
import { PLACES } from "./fixtures";
import type { PlaceId, QuestId } from "./contracts";
import { buildVillage, worldPoint } from "./world";

export function createVillageScene(canvas: HTMLCanvasElement, open: (place: PlaceId) => void) {
  const app = new pc.Application(canvas, { graphicsDeviceOptions: { antialias: true, deviceTypes: ["webgl2"] } });
  const setupCleanup: (() => void)[] = [];
  try {
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    app.scene.ambientLight = new pc.Color(0.65, 0.72, 0.8);
    const camera = new pc.Entity("Village camera", app);
    camera.addComponent("camera", { projection: pc.PROJECTION_ORTHOGRAPHIC, clearColor: new pc.Color(0.9, 0.96, 0.98), nearClip: 0.1, farClip: 100, orthoHeight: 10 });
    camera.setPosition(14, 20, 18); camera.lookAt(0, 0, 0); app.root.addChild(camera);
    const sunlight = new pc.Entity("Sunlight", app);
    sunlight.addComponent("light", { type: "directional", color: new pc.Color(1, 0.96, 0.88), intensity: 1.2, castShadows: false });
    sunlight.setEulerAngles(45, 30, 0); app.root.addChild(sunlight);
    const village = buildVillage(app);
    let player = { x: 0.48, y: 0.62 }, destination = { ...player }, disposed = false, moving = false;
    app.autoRender = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const keys = new Set<string>();
    const nearest = (x: number, y: number) => [...PLACES].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    const labels = document.createElement("div"); labels.className = "place-labels";
    const buttons = PLACES.map(place => {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = place.name; button.onclick = () => go(place.id); labels.append(button);
      return { place, button };
    });
    canvas.parentElement!.append(labels);
    setupCleanup.push(() => labels.remove());
    const placePlayer = () => village.player.setPosition(worldPoint(player.x, player.y));
    const positionLabels = () => {
      const bounds = canvas.getBoundingClientRect();
      const projected = buttons.map(({ place, button }) => {
        const point = worldPoint(place.x, place.y); point.y = 3.1;
        const screen = camera.camera!.worldToScreen(point);
        const width = button.offsetWidth, height = button.offsetHeight;
        const left = Math.max(4, Math.min(bounds.width - width - 4, screen.x - width / 2));
        return { button, left, width, height, top: Math.max(4, screen.y - height) };
      }).sort((a, b) => a.top - b.top);
      const placed: typeof projected = [];
      for (const label of projected) {
        // Keep independently clickable labels apart on narrow portrait screens.
        for (const previous of placed) {
          const horizontal = label.left < previous.left + previous.width + 4 && label.left + label.width + 4 > previous.left;
          if (horizontal && label.top < previous.top + previous.height + 4 && label.top + label.height > previous.top) {
            label.top = previous.top + previous.height + 4;
          }
        }
        label.button.style.left = `${label.left}px`;
        label.button.style.top = `${canvas.offsetTop + label.top}px`;
        placed.push(label);
      }
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (disposed || bounds.width < 1 || bounds.height < 1) return;
      // Resize the drawing buffer without overriding the responsive CSS layout.
      app.graphicsDevice.resizeCanvas(bounds.width, bounds.height);
      camera.camera!.orthoHeight = Math.max(10, 10 / (bounds.width / bounds.height));
      app.renderNextFrame = true; positionLabels();
    };
    const go = (place: PlaceId) => {
      const target = PLACES.find(item => item.id === place);
      if (!target) return;
      destination = { x: target.x, y: target.y + 0.09 };
      moving = !reduceMotion;
      if (reduceMotion) { player = { ...destination }; placePlayer(); }
      app.renderNextFrame = true;
      open(place);
    };
    const update = (delta: number) => {
      if (document.hidden || disposed || (!moving && !keys.size)) return;
      const dt = Math.min(delta, 0.04);
      const dx = Number(keys.has("arrowright") || keys.has("d")) - Number(keys.has("arrowleft") || keys.has("a"));
      const dy = Number(keys.has("arrowdown") || keys.has("s")) - Number(keys.has("arrowup") || keys.has("w"));
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        player.x = Math.max(0.06, Math.min(0.94, player.x + dx / length * dt * 0.25));
        player.y = Math.max(0.06, Math.min(0.94, player.y + dy / length * dt * 0.25));
        destination = { ...player };
      } else {
        player.x += (destination.x - player.x) * Math.min(1, dt * 5);
        player.y += (destination.y - player.y) * Math.min(1, dt * 5);
        if (Math.hypot(destination.x - player.x, destination.y - player.y) < 0.0001) {
          player = { ...destination }; moving = false;
        }
      }
      placePlayer(); app.renderNextFrame = true;
    };
    const pointer = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
      const start = camera.camera!.screenToWorld(x, y, 0.1), end = camera.camera!.screenToWorld(x, y, 100);
      const direction = end.clone().sub(start);
      if (Math.abs(direction.y) < 0.0001) return;
      const hit = start.clone().add(direction.mulScalar(-start.y / direction.y));
      const px = hit.x / 16 + 0.5, py = hit.z / 16 + 0.5;
      const place = nearest(px, py);
      if (Math.hypot(place.x - px, place.y - py) < 0.12) go(place.id);
      else {
        destination = { x: Math.max(0.06, Math.min(0.94, px)), y: Math.max(0.06, Math.min(0.94, py)) };
        moving = !reduceMotion;
        if (reduceMotion) { player = { ...destination }; placePlayer(); }
        app.renderNextFrame = true;
        canvas.focus({ preventScroll: true });
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.target !== canvas) return;
      const key = event.key.toLowerCase();
      if (key === "enter") { event.preventDefault(); go(nearest(player.x, player.y).id); }
      else if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) { event.preventDefault(); keys.add(key); }
    };
    const keyup = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const clearKeys = () => keys.clear();
    const contextLost = () => {
      clearKeys();
      document.getElementById("status")!.textContent = "3D rendering paused. Village navigation and local demo actions are still available.";
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    setupCleanup.push(() => observer.disconnect());
    canvas.addEventListener("pointerup", pointer); canvas.addEventListener("keydown", keydown);
    canvas.addEventListener("blur", clearKeys); canvas.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("keyup", keyup); window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", clearKeys);
    placePlayer(); resize(); app.on("update", update); app.start();
    return {
      go,
      progress: (quests: QuestId[]) => {
        for (const place of PLACES) village.markers.get(place.id)!.enabled = Boolean(place.quest && quests.includes(place.quest));
        app.renderNextFrame = true;
      },
      reset: () => { player = { x: 0.48, y: 0.62 }; destination = { ...player }; moving = false; keys.clear(); placePlayer(); app.renderNextFrame = true; },
      dispose() {
        if (disposed) return; disposed = true;
        observer.disconnect(); labels.remove(); app.off("update", update);
        canvas.removeEventListener("pointerup", pointer); canvas.removeEventListener("keydown", keydown);
        canvas.removeEventListener("blur", clearKeys); canvas.removeEventListener("webglcontextlost", contextLost);
        window.removeEventListener("keyup", keyup); window.removeEventListener("blur", clearKeys);
        document.removeEventListener("visibilitychange", clearKeys);
        app.destroy(); village.dispose();
      },
    };
  } catch (error) {
    for (const cleanup of setupCleanup) cleanup();
    app.destroy();
    throw error;
  }
}
