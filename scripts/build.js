#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");

function minifyCss() {
  execSync(
    `npx cleancss -o "${path.join(root, "css/style.min.css")}" "${path.join(root, "css/style.css")}"`,
    { stdio: "inherit" }
  );
  console.log("✓ css/style.min.css");
}

async function minifyJs() {
  const { minify } = require("terser");
  const src = fs.readFileSync(path.join(root, "js/main.js"), "utf8");
  const result = await minify(src, { compress: true, mangle: true });
  fs.writeFileSync(path.join(root, "js/main_min.js"), result.code);
  console.log("✓ js/main_min.js");
}

async function buildWebp() {
  const sharp = require("sharp");
  const assetsDir = path.join(root, "assets");
  const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".jpg"));
  for (const f of files) {
    const outFile = path.join(assetsDir, f.replace(/\.jpg$/, ".webp"));
    await sharp(path.join(assetsDir, f)).webp({ quality: 80 }).toFile(outFile);
    console.log(`✓ assets/${path.basename(outFile)}`);
  }
}

(async () => {
  minifyCss();
  await minifyJs();
  await buildWebp();
  console.log("Build complete.");
})();
