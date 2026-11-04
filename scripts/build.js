import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { zipSync } from "fflate";
const manifest = JSON.parse(
  await readFile(new URL("../extension/manifest.json", import.meta.url)),
);
const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url)),
);
if (manifest.version !== pkg.version)
  throw Error("Package and manifest versions differ");
if (
  process.env.GITHUB_REF_TYPE === "tag" &&
  process.env.GITHUB_REF_NAME !== `v${manifest.version}`
)
  throw Error(
    `Release tag ${process.env.GITHUB_REF_NAME} does not match project version ${manifest.version}. Expected v${manifest.version}. Update the version with npm version <version> --no-git-tag-version, commit the changes, then tag that commit.`,
  );
const files = {};
async function walk(dir, prefix = "") {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const name = prefix + entry.name;
    if (entry.isDirectory())
      await walk(new URL(entry.name + "/", dir), name + "/");
    else
      files[name] = [
        new Uint8Array(await readFile(new URL(entry.name, dir))),
        { mtime: new Date("2020-01-01T00:00:00Z") },
      ];
  }
}
await walk(new URL("../extension/", import.meta.url));
await mkdir("dist", { recursive: true });
const name = `lasthavens-addon-manager-${manifest.version}.zip`;
const bytes = zipSync(files, { level: 9 });
await writeFile("dist/" + name, bytes);
await writeFile(
  "dist/SHA256SUMS",
  createHash("sha256").update(bytes).digest("hex") + "  " + name + "\n",
);
console.log("Built dist/" + name);
