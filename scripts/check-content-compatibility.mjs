import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const game = process.argv[2];
if (!game) throw new Error("Pass the reviewed private Game checkout directory. This check is local and read-only.");
for (const name of ["contentFormat.ts", "contentFormat.test.ts"]) {
  const community = await readFile(resolve(root, "src", name), "utf8");
  const production = await readFile(resolve(game, "playcanvas/TrustQuest_DemoHouse/src", name), "utf8");
  if (community !== production) throw new Error(`Content compatibility drift: ${name}`);
}
console.log("Fictional content parser and contract cases match both checkouts. No production behavior or authority was imported.");
