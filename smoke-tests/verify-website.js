const fs = require("fs");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");
const websiteRoot = path.join(backendRoot, "website");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "robots.txt",
  "sitemap.xml",
  "assets/chinky-logo.png",
  "assets/chinky-friends.png",
  ".well-known/assetlinks.json",
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(websiteRoot, relativePath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) {
    throw new Error(`Missing or empty website file: ${relativePath}`);
  }
}

const indexHtml = fs.readFileSync(path.join(websiteRoot, "index.html"), "utf8");
for (const expected of [
  '<html lang="en"',
  'name="viewport"',
  '<link rel="canonical" href="https://chinkyapp.com/"',
  'href="styles.css"',
  'src="app.js"',
]) {
  if (!indexHtml.includes(expected)) {
    throw new Error(`Website index is missing required markup: ${expected}`);
  }
}

const ids = [...indexHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Website index contains duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);
}

for (const imageTag of indexHtml.match(/<img\b[^>]*>/g) || []) {
  if (!/\salt="[^"]*"/.test(imageTag)) {
    throw new Error(`Website image is missing alt text: ${imageTag}`);
  }
  if (!/\swidth="\d+"/.test(imageTag) || !/\sheight="\d+"/.test(imageTag)) {
    throw new Error(`Website image is missing intrinsic dimensions: ${imageTag}`);
  }
}

const localReferences = [...indexHtml.matchAll(/(?:src|href)="((?:assets\/)[^"]+|styles\.css|app\.js)"/g)]
  .map((match) => match[1]);
for (const relativePath of localReferences) {
  if (!fs.existsSync(path.join(websiteRoot, relativePath))) {
    throw new Error(`Website markup references a missing file: ${relativePath}`);
  }
}

const styles = fs.readFileSync(path.join(websiteRoot, "styles.css"), "utf8");
for (const breakpoint of ["@media (max-width: 1050px)", "@media (max-width: 800px)", "@media (max-width: 560px)"]) {
  if (!styles.includes(breakpoint)) {
    throw new Error(`Website styles are missing responsive breakpoint: ${breakpoint}`);
  }
}

const assetLinks = JSON.parse(
  fs.readFileSync(path.join(websiteRoot, ".well-known", "assetlinks.json"), "utf8"),
);
const androidTarget = assetLinks.find(
  (entry) => entry?.target?.namespace === "android_app"
    && entry.target.package_name === "com.chinky.social",
);
if (!androidTarget || androidTarget.target.sha256_cert_fingerprints.length === 0) {
  throw new Error("assetlinks.json is missing the com.chinky.social certificate fingerprint");
}

const sitemap = fs.readFileSync(path.join(websiteRoot, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://chinkyapp.com/")) {
  throw new Error("sitemap.xml is missing the production domain");
}

console.log(`Website build verified (${requiredFiles.length} required files).`);
