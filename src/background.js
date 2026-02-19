// 1. Universal API wrapper: Uses "browser" if available (Firefox), otherwise wraps "chrome" (Chrome)
const api =
  typeof browser !== "undefined"
    ? browser
    : {
        tabs: {
          query: (o) => new Promise((r) => chrome.tabs.query(o, r)),
          onUpdated: chrome.tabs.onUpdated, // Listeners are same in both
        },
        scripting: {
          insertCSS: (o) => chrome.scripting.insertCSS(o), // Usually returns promise in Chrome, but we handle errors
          removeCSS: (o) => chrome.scripting.removeCSS(o),
          executeScript: (o) => chrome.scripting.executeScript(o),
        },
        storage: {
          onChanged: chrome.storage.onChanged,
          sync: {
            get: (k) => new Promise((r) => chrome.storage.sync.get(k, r)),
          },
        },
      };

// 2. Logic using the universal 'api' variable
api.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync" || !changes.mode) return;

  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url?.startsWith("https://trello.com")) return;

  const newMode = changes.mode.newValue;

  // CSS injection doesn't return data, so we can stick to native chrome for scripting if we just want to await completion
  // Note: We use the raw chrome.scripting here because wrapping void promises is messy and unnecessary if we catch errors.
  const target = { target: { tabId: tab.id } };

  await chrome.scripting.removeCSS({ ...target, files: ["styling-compact.css"] }).catch(() => {});
  await chrome.scripting.removeCSS({ ...target, files: ["styling-tiny.css"] }).catch(() => {});

  if (newMode === "compact") {
    chrome.scripting.insertCSS({ ...target, files: ["styling-compact.css"] });
  } else if (newMode === "tiny") {
    chrome.scripting.insertCSS({ ...target, files: ["styling-tiny.css"] });
  }
});

api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url?.startsWith("https://trello.com")) return;

  // Use raw chrome for scripting actions (works in both for void actions)
  const target = { target: { tabId: tab.id } };
  await chrome.scripting.removeCSS({ ...target, files: ["styling-compact.css"] }).catch(() => {});
  await chrome.scripting.removeCSS({ ...target, files: ["styling-tiny.css"] }).catch(() => {});

  const data = await api.storage.sync.get("mode");
  const currentMode = data.mode || "compact";

  if (currentMode === "compact") {
    chrome.scripting.insertCSS({ ...target, files: ["styling-compact.css"] });
  } else if (currentMode === "tiny") {
    chrome.scripting.insertCSS({ ...target, files: ["styling-tiny.css"] });
  }

  // Inject width adjuster
  api.scripting
    .executeScript({
      ...target,
      files: ["width-adjuster.js"],
    })
    .catch(() => {});
});
