const fs = require("fs");
const readline = require("readline");
const archiver = require("archiver"); // Needs: npm install archiver

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// List only the files needed for the store
const FILES_TO_PACK = [
  "manifest.json", // The one we just generated
  "background.js",
  "popup.html",
  "popup.js",
  "styling-compact.css",
  "styling-tiny.css",
  "icon-48.png",
  "icon-128.png",
];

rl.question("Build for (c)hrome or (f)irefox? ", (answer) => {
  const target = answer.trim().toLowerCase();
  const isFirefox = target.startsWith("f");

  // --- 1. GENERATE MANIFEST ---
  const manifest = JSON.parse(fs.readFileSync("manifest-original.json", "utf8"));

  if (isFirefox) {
    console.log("🦊 Configuring manifest for Firefox...");
    manifest.background = { scripts: ["background.js"] };
    manifest.browser_specific_settings = {
      gecko: {
        id: "{b9ac93ea-92fe-4967-b792-66d201824333}",
        strict_min_version: "109.0",
        data_collection_permissions: { required: ["none"] },
      },
    };
  } else {
    console.log("🟣 Configuring manifest for Chrome...");
    manifest.background = { service_worker: "background.js" };
    delete manifest.browser_specific_settings;
  }

  // Write the temporary manifest.json used for packing
  fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

  // --- 2. ZIP FILES ---
  const zipName = isFirefox ? "trello-compact-firefox.zip" : "trello-compact-chrome.zip";
  const output = fs.createWriteStream(zipName);
  const archive = archiver("zip", { zlib: { level: 9 } }); // Best compression

  output.on("close", () => {
    console.log(`📦 Created ${zipName} (${archive.pointer()} bytes)`);
    console.log("✨ Ready to upload!");
    rl.close();
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add each file to the zip
  FILES_TO_PACK.forEach((file) => {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
    } else {
      console.warn(`⚠️  Warning: Missing file ${file}`);
    }
  });

  archive.finalize();
});
