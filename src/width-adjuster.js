// 1. Definition of the applicator function
// We define it outside the guard so it's available or just defined every time we run.
// Actually, since this is a content script, variables might be isolated or not depending on context,
// but re-defining a local const is fine.
const applyWidth = (width) => {
  let styleEl = document.getElementById("trello-custom-width");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "trello-custom-width";
    document.head.appendChild(styleEl);
  }

  if (!width || width === "auto") {
    styleEl.textContent = "";
  } else {
    styleEl.textContent = `div[data-testid="list"] { width: ${width} !important; }`;
  }
};

// 2. Initial application - Run this EVERY time the script is injected
// This ensures that if the script is re-injected (e.g. by background.js on tab update),
// the style is definitely applied, even if it was lost or if this is a "soft" navigation
// where the previous closure might still exist but we want to be sure.
try {
  chrome.storage.sync.get("listWidth", (data) => {
    if (chrome.runtime.lastError) {
      console.warn("Trello Compact Cards: Storage error", chrome.runtime.lastError);
      return;
    }
    applyWidth(data?.listWidth || "310px");
  });
} catch (e) {
  console.warn("Trello Compact Cards: Could not access storage", e);
}

// 3. Listener setup - Run ONLY ONCE
// We use a global property to ensure we don't attach multiple listeners
if (typeof window.trelloWidthAdjusterInjected === "undefined") {
  window.trelloWidthAdjusterInjected = true;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.listWidth) {
      applyWidth(changes.listWidth.newValue);
    }
  });
}
