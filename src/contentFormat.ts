export type ContentPlace = { id: string; name: string; x: number; y: number; color: string; quest?: string };
export type ContentQuest = { id: string; place: string; name: string; text: string; action: string };
export type CommunityContent = { schema: 1; fictional: true; places: ContentPlace[]; quests: ContentQuest[] };

// Data only: never interpret scripts, URLs, identity, booking rules or permissions.
export function parseCommunityContent(value: unknown): CommunityContent {
  const object = (input: unknown, keys: string[]) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid content object");
    const row = input as Record<string, unknown>;
    if (Object.keys(row).some(key => !keys.includes(key))) throw new Error("Unknown content field");
    return row;
  };
  const text = (input: unknown, limit: number) => {
    if (typeof input !== "string" || !input.trim() || input.length > limit
      || /[<>\u0000-\u001f]|(?:https?:|data:|javascript:|mailto:|\/\/)/i.test(input)) throw new Error("Invalid content text");
    return input;
  };
  const id = (input: unknown) => {
    const result = text(input, 48);
    if (!/^[a-z][a-z0-9-]*$/.test(result)) throw new Error("Invalid content ID");
    return result;
  };
  const root = object(value, ["schema", "fictional", "places", "quests"]);
  if (root.schema !== 1 || root.fictional !== true || !Array.isArray(root.places) || !Array.isArray(root.quests)
    || root.places.length < 1 || root.places.length > 32 || root.quests.length > 64) throw new Error("Unsupported content pack");
  const places = root.places.map(input => {
    const row = object(input, ["id", "name", "x", "y", "color", "quest"]);
    if (typeof row.x !== "number" || !Number.isFinite(row.x) || row.x < 0 || row.x > 1
      || typeof row.y !== "number" || !Number.isFinite(row.y) || row.y < 0 || row.y > 1
      || typeof row.color !== "string" || !/^#[a-f0-9]{6}$/i.test(row.color)) throw new Error("Invalid map location");
    return { id: id(row.id), name: text(row.name, 80), x: row.x, y: row.y, color: row.color,
      ...(row.quest === undefined ? {} : { quest: id(row.quest) }) };
  });
  const quests = root.quests.map(input => {
    const row = object(input, ["id", "place", "name", "text", "action"]);
    return { id: id(row.id), place: id(row.place), name: text(row.name, 80), text: text(row.text, 1000), action: text(row.action, 80) };
  });
  const placeIds = new Set(places.map(place => place.id));
  const questIds = new Set(quests.map(quest => quest.id));
  if (placeIds.size !== places.length || questIds.size !== quests.length) throw new Error("Duplicate content IDs");
  if (quests.some(quest => !placeIds.has(quest.place))
    || places.some(place => place.quest && !quests.some(quest => quest.id === place.quest && quest.place === place.id))) throw new Error("Broken content reference");
  return { schema: 1, fictional: true, places, quests };
}
