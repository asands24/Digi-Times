#!/usr/bin/env node
/**
 * Remove generated artifacts to keep the repo lightweight.
 * Usage:
 *   npm run clean          # remove build outputs, coverage, etc.
 *   npm run clean -- --all # also remove node_modules
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const baseTargets = [
  'build',
  'coverage',
  'Library',
  '.DS_Store',
  'src/.DS_Store',
  'build.log',
  'build_attempt.log',
  'src/components/ui.zip'
];

const extraTargets = ['node_modules'];
const includeExtras =
  process.argv.includes('--all') || process.argv.includes('--deps');

const targets = includeExtras
  ? [...baseTargets, ...extraTargets]
  : baseTargets;

const removed = [];

for (const relPath of targets) {
  const absolutePath = path.join(root, relPath);
  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  const stats = fs.statSync(absolutePath);
  const options =
    stats.isDirectory() ? { recursive: true, force: true } : { force: true };

  fs.rmSync(absolutePath, options);
  removed.push(relPath);
}

if (!removed.length) {
  console.log('Nothing to clean.');
} else {
  for (const entry of removed) {
    console.log(`Removed ${entry}`);
  }
}

if (!includeExtras) {
  console.log('Pass --all to also remove node_modules.');
}
