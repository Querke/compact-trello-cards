// Listen for mode changes from the popup
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync" || !changes.mode) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url?.startsWith("https://trello.com")) return;

  const newMode = changes.mode.newValue;

  // Always remove both styles first
  await chrome.scripting
    .removeCSS({ target: { tabId: tab.id }, files: ["styling-compact.css"] })
    .catch(() => {});
  await chrome.scripting
    .removeCSS({ target: { tabId: tab.id }, files: ["styling-tiny.css"] })
    .catch(() => {});

  // Then inject the correct one, if needed
  if (newMode === "compact") {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styling-compact.css"],
    });
  } else if (newMode === "tiny") {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styling-tiny.css"],
    });
  }
});

// Reapply styling when Trello tab is reloaded or navigated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status !== "complete" ||
    !tab.url?.startsWith("https://trello.com")
  )
    return;

  // Always remove both styles first
  await chrome.scripting
    .removeCSS({ target: { tabId: tab.id }, files: ["styling-compact.css"] })
    .catch(() => {});
  await chrome.scripting
    .removeCSS({ target: { tabId: tab.id }, files: ["styling-tiny.css"] })
    .catch(() => {});

  const data = await new Promise((resolve) =>
    chrome.storage.sync.get("mode", resolve)
  );
  const mode = data.mode || "compact";

  if (mode === "compact") {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["styling-compact.css"],
    });
  } else if (mode === "tiny") {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["styling-tiny.css"],
    });
  }
});
