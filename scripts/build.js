#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');

function minifyCss() {
  execSync(
    `npx cleancss -o "${path.join(root, 'css/style.min.css')}" "${path.join(root, 'css/style.css')}"`,
    { stdio: 'inherit' }
  );
  console.log('✓ css/style.min.css');
}

async function minifyJs() {
  const { minify } = require('terser');
  const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  const result = await minify(source, { compress: true, mangle: true });
  fs.writeFileSync(path.join(root, 'js/main_min.js'), result.code);
  console.log('✓ js/main_min.js');
}

function getResponsiveWidths(fileName, width, height) {
  if (fileName === 'logo.jpg') return [96, 192].filter((size) => size < width);
  if (height > width) return [320].filter((size) => size < width);
  return [480, 960].filter((size) => size < width);
}

async function buildWebp() {
  const files = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.jpg'));

  for (const fileName of files) {
    const input = path.join(assetsDir, fileName);
    const { width, height } = await sharp(input).metadata();
    const fullSizeOutput = path.join(assetsDir, fileName.replace(/\.jpg$/, '.webp'));

    await sharp(input).webp({ quality: 80, effort: 5 }).toFile(fullSizeOutput);
    console.log(`✓ assets/${path.basename(fullSizeOutput)}`);

    for (const responsiveWidth of getResponsiveWidths(fileName, width, height)) {
      const output = path.join(assetsDir, fileName.replace(/\.jpg$/, `-${responsiveWidth}.webp`));
      await sharp(input)
        .resize({ width: responsiveWidth, withoutEnlargement: true })
        .webp({ quality: 76, effort: 5 })
        .toFile(output);
      console.log(`✓ assets/${path.basename(output)}`);
    }
  }
}

(async () => {
  minifyCss();
  await minifyJs();
  await buildWebp();
  console.log('Build complete.');
})();
