(() => {
  if (location.pathname !== "/play" && location.pathname !== "/play/") return;
  const CHANNEL = "lh-local-addons-v1";
  let payload;
  const send = () =>
    payload &&
    window.postMessage(
      { channel: CHANNEL, kind: "payload", payload },
      location.origin,
    );
  window.addEventListener("message", (event) => {
    if (
      event.source !== window ||
      event.origin !== location.origin ||
      event.data?.channel !== CHANNEL
    )
      return;
    if (event.data.kind === "hello") send();
    if (event.data.kind === "status") {
      const s = event.data.status;
      if (!s || !["ready", "error", "pending"].includes(s.state)) return;
      // Page diagnostics are untrusted. They can never change the addon library.
      chrome.runtime
        .sendMessage({
          kind: "diagnostic",
          status: {
            state: s.state,
            message: String(s.message || "").slice(0, 1000),
            revision: String(s.revision || "").slice(0, 80),
            loaded: Array.isArray(s.loaded)
              ? s.loaded.slice(0, 100).map((x) => String(x).slice(0, 120))
              : [],
            at: Date.now(),
          },
        })
        .catch(() => {});
    }
  });
  chrome.storage.local
    .get("library")
    .then(({ library }) => {
      const lib = library || { revision: "empty", addons: [] };
      payload = {
        revision: lib.revision,
        addons: lib.addons
          .filter((a) => a.enabled)
          .map((a) => ({ folder: a.folder, files: a.files })),
      };
      send();
    })
    .catch((e) => {
      payload = { revision: "error", addons: [], error: String(e) };
      send();
    });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.library)
      window.postMessage(
        { channel: CHANNEL, kind: "changed" },
        location.origin,
      );
  });
})();
