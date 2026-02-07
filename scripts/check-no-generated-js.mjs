import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const restrictedDirs = ['src', path.join('tests', 'e2e')];
const allowedFilenames = new Set(['vite.config.js', 'vitest.config.js', 'playwright.config.js']);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

const violations = [];

for (const relativeDir of restrictedDirs) {
  const absoluteDir = path.join(workspaceRoot, relativeDir);
  if (!statSync(absoluteDir, { throwIfNoEntry: false })?.isDirectory()) {
    continue;
  }

  for (const filePath of walk(absoluteDir)) {
    if (filePath.endsWith('.js')) {
      violations.push(path.relative(workspaceRoot, filePath));
    }
  }
}

for (const filename of allowedFilenames) {
  const target = path.join(workspaceRoot, filename);
  if (statSync(target, { throwIfNoEntry: false })?.isFile()) {
    violations.push(path.relative(workspaceRoot, target));
  }
}

if (violations.length > 0) {
  console.error('Generated JavaScript files were found in restricted paths:');
  for (const violation of violations.sort()) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log('No generated JavaScript files found in restricted frontend paths.');
