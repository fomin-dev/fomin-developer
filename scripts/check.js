#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const index = fs.readFileSync(indexPath, 'utf8');
const languages = ['ru', 'en', 'uk'];
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`✗ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

const translationKeys = new Set();
for (const match of index.matchAll(/data-i18n(?:-aria-label|-alt)?="([^"]+)"/g)) {
  translationKeys.add(match[1]);
}

for (const language of languages) {
  const dictionaryPath = path.join(root, 'i18n', `${language}.json`);
  let dictionary;

  try {
    dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  } catch (error) {
    fail(`i18n/${language}.json is not valid JSON: ${error.message}`);
    continue;
  }

  const missingKeys = [...translationKeys].filter((key) => !dictionary[key] || !String(dictionary[key]).trim());
  if (missingKeys.length) {
    fail(`i18n/${language}.json misses ${missingKeys.join(', ')}`);
  } else {
    pass(`i18n/${language}.json includes all ${translationKeys.size} interface keys`);
  }
}

if (fs.existsSync(path.join(root, 'i18n', 'ua.json'))) {
  fail('i18n/ua.json should not exist; Ukrainian uses the standard uk language code.');
} else {
  pass('Ukrainian dictionary uses the standard uk language code');
}

const assetReferences = new Set([...index.matchAll(/assets\/([A-Za-z0-9_.-]+)/g)].map((match) => match[1]));
const missingAssets = [...assetReferences].filter((asset) => !fs.existsSync(path.join(root, 'assets', asset)));
if (missingAssets.length) {
  fail(`Missing referenced assets: ${missingAssets.join(', ')}`);
} else {
  pass(`All ${assetReferences.size} referenced assets exist`);
}

for (const file of ['css/style.min.css', 'js/main_min.js', 'sw.js', '_headers']) {
  if (!fs.existsSync(path.join(root, file))) fail(`${file} is missing`);
}
if (failures === 0) pass('Project checks passed');
process.exitCode = failures ? 1 : 0;
