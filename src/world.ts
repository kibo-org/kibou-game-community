import * as pc from "playcanvas";
import { PLACES } from "./fixtures";
import type { PlaceId } from "./contracts";

export const worldPoint = (x: number, y: number) => new pc.Vec3((x - 0.5) * 16, 0, (y - 0.5) * 16);

// New primitive art only; no production models, textures or asset service.
export function buildVillage(app: pc.Application) {
  const materials: pc.StandardMaterial[] = [];
  const material = (hex: string) => {
    const value = new pc.StandardMaterial();
    value.diffuse = new pc.Color().fromString(hex);
    value.useMetalness = true; value.metalness = 0; value.gloss = 0.15;
    value.update(); materials.push(value); return value;
  };
  const mint = material("#82bfa0"), ivory = material("#eef5ee"), roof = material("#3a5554");
  const wood = material("#e6b98e"), glass = material("#a6d9e8"), coral = material("#ed6a49");
  const foliage = material("#409e72"), yellow = material("#f1cf65");
  const primitive = (name: string, type: string, position: pc.Vec3, scale: pc.Vec3, surface: pc.Material, parent = app.root) => {
    const entity = new pc.Entity(name, app);
    entity.addComponent("render", { type, material: surface, castShadows: false });
    entity.setLocalPosition(position); entity.setLocalScale(scale); parent.addChild(entity);
    return entity;
  };
  primitive("Village ground", "box", new pc.Vec3(0, -0.3, 0), new pc.Vec3(17, 0.5, 17), mint);
  primitive("Crossing east", "box", new pc.Vec3(0, -0.02, 0), new pc.Vec3(14, 0.08, 1.4), ivory);
  primitive("Crossing north", "box", new pc.Vec3(0, -0.01, 0), new pc.Vec3(1.4, 0.08, 14), ivory);
  const markers = new Map<PlaceId, pc.Entity>();
  for (const place of PLACES) {
    const house = new pc.Entity(place.name, app); house.setPosition(worldPoint(place.x, place.y)); app.root.addChild(house);
    const color = material(place.color);
    primitive("Floor", "box", new pc.Vec3(0, 0.1, 0), new pc.Vec3(2.8, 0.2, 2.5), ivory, house);
    primitive("House", "box", new pc.Vec3(0, 1, 0), new pc.Vec3(2.3, 1.8, 2), color, house);
    const top = primitive("Roof", "cone", new pc.Vec3(0, 2.35, 0), new pc.Vec3(3.6, 1.15, 3.3), roof, house);
    top.setLocalEulerAngles(0, 45, 0);
    primitive("Door", "box", new pc.Vec3(0, 0.6, 1.02), new pc.Vec3(0.6, 1.1, 0.08), wood, house);
    for (const x of [-0.72, 0.72]) primitive("Window", "box", new pc.Vec3(x, 1.05, 1.03), new pc.Vec3(0.45, 0.55, 0.09), glass, house);
    const marker = primitive("Quest complete", "sphere", new pc.Vec3(1.2, 2.8, 0), new pc.Vec3(0.35, 0.35, 0.35), yellow, house);
    marker.enabled = false; markers.set(place.id, marker);
    if (place.id === "garden") {
      for (const x of [-0.6, 0, 0.6]) primitive("Garden seed", "sphere", new pc.Vec3(x, 0.4, 1.9), new pc.Vec3(0.4, 0.65, 0.4), foliage, house);
    }
  }
  for (const [x, z] of [[-6, -6], [6, -5.5], [-6.5, 4.8], [5.8, 6], [0, -6.7]]) {
    primitive("Tree trunk", "cylinder", new pc.Vec3(x, 0.6, z), new pc.Vec3(0.25, 1.2, 0.25), wood);
    primitive("Tree crown", "sphere", new pc.Vec3(x, 1.65, z), new pc.Vec3(1.5, 1.8, 1.5), foliage);
  }
  const player = new pc.Entity("Fictional maker", app); app.root.addChild(player);
  primitive("Body", "capsule", new pc.Vec3(0, 0.55, 0), new pc.Vec3(0.45, 0.75, 0.45), coral, player);
  primitive("Head", "sphere", new pc.Vec3(0, 1.05, 0), new pc.Vec3(0.45, 0.45, 0.45), wood, player);
  primitive("Cap", "sphere", new pc.Vec3(0, 1.22, 0), new pc.Vec3(0.48, 0.2, 0.48), yellow, player);
  return { player, markers, dispose: () => materials.forEach(item => item.destroy()) };
}
