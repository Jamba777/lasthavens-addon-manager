chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onMessage.addListener((m, sender) => {
  if (
    m.kind === "diagnostic" &&
    sender.url?.startsWith("https://lasthavens.com/play")
  )
    chrome.storage.session.set({ lastStatus: m.status });
});
