import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const manifestPath = new URL("../extension/manifest.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.version = pkg.version;
await writeFile(
  manifestPath,
  await format(JSON.stringify(manifest), { parser: "json" }),
);
console.log(`Extension manifest version: ${pkg.version}`);
