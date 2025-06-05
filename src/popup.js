const options = document.querySelectorAll(".mode-option");

chrome.storage.sync.get("mode", (data) => {
  const current = data.mode || "compact";
  options.forEach((el) => {
    if (el.dataset.mode === current) {
      el.classList.add("selected");
    }
  });
});

options.forEach((el) => {
  el.addEventListener("click", () => {
    const selectedMode = el.dataset.mode;
    chrome.storage.sync.set({ mode: selectedMode });

    options.forEach((opt) => opt.classList.remove("selected"));
    el.classList.add("selected");
  });
});
