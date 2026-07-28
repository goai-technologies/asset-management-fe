import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "public", "assets");
const publicDir = path.join(root, "public");
const sourcePng = path.join(assetsDir, "goai-logo-source.png");

if (!fs.existsSync(sourcePng)) {
  console.error("Missing source logo at public/assets/goai-logo-source.png");
  process.exit(1);
}

const pngBuffer = fs.readFileSync(sourcePng);
const base64 = pngBuffer.toString("base64");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" role="img" aria-label="goAI">
  <title>goAI</title>
  <image width="400" height="400" xlink:href="data:image/png;base64,${base64}" />
</svg>
`;

fs.writeFileSync(path.join(assetsDir, "favicon.svg"), svg);

execSync(
  `npx --yes png-to-ico "${path.join(assetsDir, "favicon-16x16.png")}" "${path.join(assetsDir, "favicon-32x32.png")}" > "${path.join(publicDir, "favicon.ico")}"`,
  { stdio: "inherit", cwd: root },
);

console.log("Generated favicon.svg and favicon.ico");
