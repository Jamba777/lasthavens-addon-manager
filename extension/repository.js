import { emptyLibrary } from "./library.js";
export async function readLibrary() {
  const { library } = await chrome.storage.local.get("library");
  return library?.addons ? library : emptyLibrary();
}
export async function writeLibrary(next) {
  const saved = { ...next, revision: crypto.randomUUID() };
  await chrome.storage.local.set({ library: saved });
  return saved;
}
