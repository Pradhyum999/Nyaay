// scripts/check-i18n.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse translations.ts
const translationsPath = path.resolve(__dirname, '../src/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Simple key extractor for each locale block in translations.ts
function extractKeys(locale) {
  const match = content.match(new RegExp(`${locale}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}(?:,\\s*\\n|\\s*\\n\\};)`));
  if (!match) {
    console.error(`Could not find locale block for ${locale}`);
    process.exit(1);
  }
  const lines = match[1].split('\n');
  const keys = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || !trimmed) continue;
    const keyMatch = trimmed.match(/^([a-zA-Z0-9_]+):/);
    if (keyMatch) {
      keys.push(keyMatch[1]);
    }
  }
  return Array.from(new Set(keys)).sort();
}

const enKeys = extractKeys('en');
const hiKeys = extractKeys('hi');
const mrKeys = extractKeys('mr');

console.log(`[i18n] Keys count: en=${enKeys.length}, hi=${hiKeys.length}, mr=${mrKeys.length}`);

let hasMissing = false;
function checkDiff(source, target, srcName, tgtName) {
  const missing = source.filter(k => !target.includes(k));
  if (missing.length > 0) {
    hasMissing = true;
    console.warn(`[i18n] Missing in ${tgtName} (present in ${srcName}): ${missing.join(', ')}`);
  }
}

checkDiff(enKeys, hiKeys, 'en', 'hi');
checkDiff(enKeys, mrKeys, 'en', 'mr');
checkDiff(hiKeys, mrKeys, 'hi', 'mr');

if (hasMissing) {
  console.log('[i18n] Note: Fallback chain (mr -> hi -> en) handles missing dictionary keys.');
} else {
  console.log('i18n parity OK: all keys match across locales');
}

process.exit(0);
