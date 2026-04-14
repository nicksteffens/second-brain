/**
 * Migration script: copies session files from claude-log repo
 * into 01-sessions/, preserving directory structure and content.
 *
 * Usage: npx tsx scripts/migrate.ts
 */

import { cpSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SOURCE = join(homedir(), 'github', 'nicksteffens', 'claude-log', 'src', 'content', 'docs');
const DEST = join(import.meta.dirname, '..', '01-sessions');

function copySessionFiles(srcDir: string, destDir: string): number {
  let count = 0;

  if (!existsSync(srcDir)) return count;

  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Only recurse into year/month directories (2025/, 2026/, 08/, 09/, etc.)
      if (/^\d{2,4}$/.test(entry.name)) {
        mkdirSync(destPath, { recursive: true });
        count += copySessionFiles(srcPath, destPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name.match(/^\d{4}-\d{2}-\d{2}-session-/)) {
      cpSync(srcPath, destPath);
      count++;
    }
  }

  return count;
}

function main() {
  console.log('=== Session Migration ===\n');
  console.log(`Source: ${SOURCE}`);
  console.log(`Destination: ${DEST}\n`);

  if (!existsSync(SOURCE)) {
    console.error(`Source directory not found: ${SOURCE}`);
    process.exit(1);
  }

  mkdirSync(DEST, { recursive: true });
  const count = copySessionFiles(SOURCE, DEST);
  console.log(`\nMigrated ${count} session files.`);
}

main();
