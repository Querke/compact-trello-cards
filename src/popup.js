const options = document.querySelectorAll(".mode-option");
const widthSlider = document.getElementById("width-slider");
const widthValueInput = document.getElementById("width-value");

// Map slider steps to width values
const stepToWidth = {
  1: "180px",
  2: "220px",
  3: "272px",
  4: "310px",
  5: "370px",
  6: "auto",
};

const widthToStep = {
  "180px": 1,
  "220px": 2,
  "272px": 3,
  "310px": 4,
  "370px": 5,
  auto: 6,
};

// Load saved settings
chrome.storage.sync.get(["mode", "listWidth"], (data) => {
  const currentMode = data.mode || "compact";
  const currentWidth = data.listWidth || "310px";

  // Set mode selection
  options.forEach((el) => {
    if (el.dataset.mode === currentMode) {
      el.classList.add("selected");
    }
  });

  // Set width inputs
  widthValueInput.value = currentWidth === "auto" ? "Auto" : currentWidth.replace("px", "");

  if (widthToStep[currentWidth]) {
    widthSlider.value = widthToStep[currentWidth];
  } else {
    // If custom value, maybe set slider to closest or "auto"?
    // For now, let's leave slider at a default or last known if it doesn't match standard
    // Or we could set it to "auto" (6) if it's not a standard fixed width
    widthSlider.value = 6;
  }
});

// Mode selection logic
options.forEach((el) => {
  el.addEventListener("click", () => {
    const selectedMode = el.dataset.mode;
    chrome.storage.sync.set({ mode: selectedMode });

    options.forEach((opt) => opt.classList.remove("selected"));
    el.classList.add("selected");
  });
});

// Width slider logic
widthSlider.addEventListener("input", () => {
  const step = parseInt(widthSlider.value);
  const width = stepToWidth[step];

  widthValueInput.value = width === "auto" ? "Auto" : width.replace("px", "");

  chrome.storage.sync.set({ listWidth: width });
});

// Width manual input logic
widthValueInput.addEventListener("change", () => {
  let val = widthValueInput.value.trim().toLowerCase();

  if (val === "" || val === "auto") {
    val = "auto";
    widthSlider.value = 6;
  } else {
    // Determine if it's a number
    const num = parseInt(val);
    if (!isNaN(num)) {
      val = num + "px";

      // Update slider if it matches a preset
      if (widthToStep[val]) {
        widthSlider.value = widthToStep[val];
      }
    } else {
      // invalid input fallback? or just save as is?
      // Let's assume user knows css if typing strings, but mostly they type numbers
      // For safety/simplicity, if not a number and not auto, revert?
      // Let's just treat as auto if invalid
      // But the prompt asked for "180px" ranges etc.
      // Let's simple check if it ends in px
      if (!val.endsWith("px") && !val.endsWith("%") && !val.endsWith("vw")) {
        // maybe it was "300" -> "300px"
        // already handled by parseint logic above?
        // If parseint failed, it's NaN.
      }
    }
  }

  // Double check mapped value
  if (widthToStep[val]) {
    widthSlider.value = widthToStep[val];
  }

  chrome.storage.sync.set({ listWidth: val });
  // Update view to show normalized value
  widthValueInput.value = val === "auto" ? "Auto" : val.replace("px", "");
});
