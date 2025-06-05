chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "sync" && changes.enabled) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.id || !tab.url?.startsWith("https://trello.com")) return;

    if (changes.enabled.newValue) {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content.css"],
      });
    } else {
      chrome.scripting.removeCSS({
        target: { tabId: tab.id },
        files: ["content.css"],
      });
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://trello.com")
  ) {
    chrome.storage.sync.get("enabled", (data) => {
      const enabled = data.enabled ?? true;
      if (enabled) {
        chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ["content.css"],
        });
      }
    });
  }
});
