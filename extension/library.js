import { LIMITS } from "./archive.js";
export const emptyLibrary = () => ({ revision: "empty", addons: [] });
export function mergeAddons(library, items) {
  const next = library.addons.map((a) => ({ ...a }));
  for (const item of items) {
    const at = next.findIndex(
      (a) => a.folder.toLowerCase() === item.folder.toLowerCase(),
    );
    const addon = { ...item, enabled: at >= 0 ? next[at].enabled : false };
    if (at >= 0) next[at] = addon;
    else next.push(addon);
  }
  if (next.reduce((n, a) => n + a.size, 0) > LIMITS.total)
    throw Error("libraryLimit");
  return { ...library, addons: next };
}
export function toggleAddon(library, folder, enabled) {
  return {
    ...library,
    addons: library.addons.map((a) =>
      a.folder === folder ? { ...a, enabled } : a,
    ),
  };
}
export function removeAddon(library, folder) {
  return {
    ...library,
    addons: library.addons.filter((a) => a.folder !== folder),
  };
}
export function missingDependencies(addon, library) {
  return addon.dependencies.filter(
    (dep) =>
      !library.addons.some(
        (a) => a.enabled && a.folder.toLowerCase() === dep.toLowerCase(),
      ),
  );
}
