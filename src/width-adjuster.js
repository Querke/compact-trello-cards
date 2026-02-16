const applyWidth = (width) => {
  let styleEl = document.getElementById("trello-custom-width");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "trello-custom-width";
    document.head.appendChild(styleEl);
  }

  if (width === "auto") {
    styleEl.textContent = "";
  } else {
    // Ensure px if it's a number-like string without unit (though popup handles this, safety check)
    // Actually popup logic ensures "px" or "auto" or valid css string usually.
    // simpler:
    styleEl.textContent = `div[data-testid="list"] { width: ${width} !important; }`;
  }
};

// Initial load
chrome.storage.sync.get("listWidth", (data) => {
  if (data.listWidth) {
    applyWidth(data.listWidth);
  } else {
    // Default
    applyWidth("310px");
  }
});

// Listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.listWidth) {
    applyWidth(changes.listWidth.newValue);
  }
});
