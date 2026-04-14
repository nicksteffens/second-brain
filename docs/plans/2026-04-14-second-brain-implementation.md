# Second Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a unified Obsidian vault + Astro/Starlight site in `nicksteffens/second-brain`, migrating all 173 existing session entries from `claude-log` (originally sourced from `~/.claude/daily-logs/`).

**Architecture:** Private GitHub repo serving dual purpose: (1) Obsidian vault with private wiki, inbox, and archive folders, (2) Astro/Starlight site built from public folders (`01-sessions/`, `02-projects/`) deployed to GitHub Pages. Claude integration via skills and a session-end hook.

**Tech Stack:** Obsidian (local vault), Astro 6 + Starlight 0.38, TypeScript (migration script, content config), GitHub Actions (deploy), Claude Code skills + hooks.

**Spec:** `docs/2026-04-14-second-brain-design.md`

---

## File Structure

```
~/github/nicksteffens/second-brain/
├── .github/
│   └── workflows/
│       └── deploy.yml                    # GitHub Pages deployment (from site/)
├── .gitignore                            # Obsidian cache, node_modules, dist, .env
├── .obsidian/                            # Obsidian config (created by app on first open)
├── 00-inbox/
│   └── .gitkeep
├── 01-sessions/                          # Migrated session logs (PUBLIC - Astro reads this)
│   ├── 2025/
│   │   ├── 08/                           # 39 sessions
│   │   ├── 09/                           # 21 sessions
│   │   ├── 10/                           # 2 sessions
│   │   ├── 11/                           # 3 sessions
│   │   └── 12/                           # 26 sessions
│   └── 2026/
│       ├── 01/                           # 10 sessions
│       ├── 02/                           # 25 sessions
│       ├── 03/                           # 37 sessions
│       └── 04/                           # 10 sessions
├── 02-projects/
│   └── .gitkeep
├── 03-wiki/
│   ├── _index.md                         # Wiki table of contents
│   ├── decisions/
│   │   └── .gitkeep
│   ├── patterns/
│   │   └── .gitkeep
│   ├── learnings/
│   │   └── .gitkeep
│   └── retros/
│       └── .gitkeep
├── 04-archive/
│   └── .gitkeep
├── docs/
│   ├── 2026-04-14-second-brain-design.md # Design spec (already exists)
│   └── plans/
│       └── 2026-04-14-second-brain-implementation.md  # This plan
├── README.md
├── site/                                 # Astro/Starlight site
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── content.config.ts             # Session schema + content loader
│       ├── content/
│       │   └── docs/
│       │       └── index.mdx             # Homepage with stats
│       ├── components/
│       │   └── StatsCard.astro
│       └── pages/
│           ├── timeline.astro
│           └── tags/
│               ├── index.astro
│               └── [tag].astro
├── scripts/
│   └── migrate.ts                        # Migration script (adapted from claude-log)
└── templates/
    ├── session-log.md                    # Obsidian Templater template
    ├── inbox-capture.md
    └── decision-record.md
```

---

## Task 1: Create GitHub repo and initialize vault structure

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `00-inbox/.gitkeep`
- Create: `02-projects/.gitkeep`
- Create: `03-wiki/_index.md`
- Create: `03-wiki/decisions/.gitkeep`
- Create: `03-wiki/patterns/.gitkeep`
- Create: `03-wiki/learnings/.gitkeep`
- Create: `03-wiki/retros/.gitkeep`
- Create: `04-archive/.gitkeep`

- [ ] **Step 1: Create private GitHub repo**

```bash
cd ~/github/nicksteffens/second-brain
git init
gh repo create nicksteffens/second-brain --private --source=. --push=false
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
# Obsidian
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/plugins/obsidian-git/data.json

# Astro
site/dist/
site/.astro/
site/node_modules/

# Dependencies
node_modules/

# Logs
npm-debug.log*

# Environment
.env
.env.production

# macOS
.DS_Store
```

- [ ] **Step 3: Create `README.md`**

```markdown
# Second Brain

Personal knowledge management system — Obsidian vault + published session log site.

## Structure

| Folder | Visibility | Purpose |
|--------|-----------|---------|
| `00-inbox/` | Private | Quick capture, unsorted thoughts |
| `01-sessions/` | Public | Session logs (one per Claude Code session) |
| `02-projects/` | Public | Project dashboards |
| `03-wiki/` | Private | Distilled knowledge — decisions, patterns, learnings |
| `04-archive/` | Private | Completed projects, old notes |
| `site/` | — | Astro/Starlight site (builds from public folders) |
| `templates/` | — | Obsidian note templates |

## Usage

Open this directory in Obsidian as a vault. Session logs and the published site are managed via Claude Code skills.

## Site

Published to GitHub Pages: https://nicksteffens.github.io/second-brain/
```

- [ ] **Step 4: Create vault folder structure with `.gitkeep` files**

```bash
mkdir -p 00-inbox 01-sessions 02-projects 03-wiki/decisions 03-wiki/patterns 03-wiki/learnings 03-wiki/retros 04-archive templates scripts
touch 00-inbox/.gitkeep 02-projects/.gitkeep 03-wiki/decisions/.gitkeep 03-wiki/patterns/.gitkeep 03-wiki/learnings/.gitkeep 03-wiki/retros/.gitkeep 04-archive/.gitkeep
```

- [ ] **Step 5: Create `03-wiki/_index.md`**

```markdown
# Wiki Index

Knowledge distilled from session logs. Updated by `/distill`.

## Decisions

## Patterns

## Learnings

## Retros
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore README.md 00-inbox/ 01-sessions/ 02-projects/ 03-wiki/ 04-archive/ templates/ scripts/ docs/
git commit -m "feat: initialize second-brain vault structure"
```

---

## Task 2: Migrate 173 session entries from claude-log

**Files:**
- Create: `scripts/migrate.ts`
- Create: `site/package.json` (needed for tsx dependency)
- Populate: `01-sessions/2025/**/*.md` and `01-sessions/2026/**/*.md`

The migration script copies the already-processed session files from `claude-log/src/content/docs/` into `01-sessions/`. These files already have correct frontmatter — no re-parsing of raw daily logs needed. The raw daily logs at `~/.claude/daily-logs/` are the upstream source but `claude-log` has already processed them via its own `migrate.ts`.

- [ ] **Step 1: Write migration script**

Create `scripts/migrate.ts`:

```typescript
/**
 * Migration script: copies session files from claude-log repo
 * into 01-sessions/, preserving directory structure and content.
 *
 * Usage: npx tsx scripts/migrate.ts
 */

import { cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SOURCE = join(homedir(), 'github', 'nicksteffens', 'claude-log', 'src', 'content', 'docs');
const DEST = join(import.meta.dirname, '..', '01-sessions');

function copySessionFiles(srcDir: string, destDir: string, depth = 0): number {
  let count = 0;
  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Only recurse into year/month directories (2025/, 2026/, 08/, 09/, etc.)
      if (/^\d{2,4}$/.test(entry.name)) {
        count += copySessionFiles(srcPath, destPath, depth + 1);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name.match(/^\d{4}-\d{2}-\d{2}-session-/)) {
      cpSync(srcPath, destPath, { recursive: true });
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

  const count = copySessionFiles(SOURCE, DEST);
  console.log(`\nMigrated ${count} session files.`);
}

main();
```

- [ ] **Step 2: Create a minimal package.json for the scripts**

Create `scripts/package.json`:

```json
{
  "type": "module",
  "devDependencies": {
    "tsx": "^4.21.0"
  }
}
```

- [ ] **Step 3: Install tsx and run migration**

```bash
cd ~/github/nicksteffens/second-brain/scripts
npm install
npx tsx migrate.ts
```

Expected output: `Migrated 173 session files.`

- [ ] **Step 4: Verify migration**

```bash
find ~/github/nicksteffens/second-brain/01-sessions -name "*.md" | wc -l
# Expected: 173

# Spot check a few files
head -15 ~/github/nicksteffens/second-brain/01-sessions/2026/04/2026-04-13-session-5.md
head -15 ~/github/nicksteffens/second-brain/01-sessions/2025/08/2025-08-11-session-1.md
```

Verify frontmatter is intact with `title`, `date`, `session`, `duration`, `rating`, `objective`, `repos`, `tags`, `role`, and optional `shortcut`.

- [ ] **Step 5: Commit**

```bash
cd ~/github/nicksteffens/second-brain
git add 01-sessions/ scripts/
git commit -m "feat: migrate 173 session entries from claude-log"
```

---

## Task 3: Set up Astro/Starlight site

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/content.config.ts`
- Create: `site/src/content/docs/index.mdx`
- Create: `site/src/components/StatsCard.astro`
- Create: `site/src/pages/timeline.astro`
- Create: `site/src/pages/tags/index.astro`
- Create: `site/src/pages/tags/[tag].astro`

- [ ] **Step 1: Create `site/package.json`**

```json
{
  "name": "second-brain-site",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.38.3",
    "astro": "^6.0.1",
    "sharp": "^0.34.2"
  }
}
```

- [ ] **Step 2: Create `site/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 3: Create `site/astro.config.mjs`**

The key change from claude-log: content lives outside `site/` in `../01-sessions/` and `../02-projects/`. Starlight's `docsLoader` reads from `src/content/docs/` by default. We need to symlink or configure the content directory.

The simplest approach: symlink the session content into where Starlight expects it.

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nicksteffens.github.io',
  base: '/second-brain',
  integrations: [
    starlight({
      title: 'Second Brain',
      description: 'Session logs and project notes by Nick Steffens',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/nicksteffens/second-brain' },
      ],
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'Timeline', link: '/timeline/' },
        { label: 'Tags', link: '/tags/' },
        {
          label: '2026',
          autogenerate: { directory: '2026', collapsed: true },
        },
        {
          label: '2025',
          autogenerate: { directory: '2025', collapsed: true },
        },
      ],
    }),
  ],
});
```

- [ ] **Step 4: Create symlinks for content**

Starlight expects content at `site/src/content/docs/`. Symlink the session folders and keep `index.mdx` as a real file:

```bash
mkdir -p site/src/content/docs site/src/components site/src/pages/tags site/public
ln -s ../../../../01-sessions/2025 site/src/content/docs/2025
ln -s ../../../../01-sessions/2026 site/src/content/docs/2026
```

- [ ] **Step 5: Create `site/src/content.config.ts`**

Extended from claude-log's schema with optional `wins`, `improvements`, `decisions` fields:

```typescript
import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        date: z.coerce.date().optional(),
        session: z.number().default(1).optional(),
        duration: z.string().optional(),
        rating: z.number().min(0).max(10).optional(),
        objective: z.string().optional(),
        repos: z.array(z.string()).default([]).optional(),
        tags: z.array(z.string()).default([]).optional(),
        role: z.string().optional(),
        shortcut: z.string().optional(),
        // Second-brain additions (optional, empty default for backward compat)
        wins: z.array(z.string()).default([]).optional(),
        improvements: z.array(z.string()).default([]).optional(),
        decisions: z.array(z.string()).default([]).optional(),
      }),
    }),
  }),
};
```

- [ ] **Step 6: Create `site/src/content/docs/index.mdx`**

```mdx
---
title: Second Brain
description: Session logs and knowledge base by Nick Steffens
template: splash
hero:
  title: Second Brain
  tagline: A record of AI-assisted development — session by session, insight by insight.
  actions:
    - text: Browse Sessions
      link: /second-brain/timeline/
      icon: right-arrow
---

import { getCollection } from 'astro:content';
import StatsCard from '../../../components/StatsCard.astro';

export const sessions = await getCollection('docs', (entry) => entry.data.rating !== undefined);
export const totalSessions = sessions.length;
export const avgRating = (sessions.reduce((sum, s) => sum + (s.data.rating || 0), 0) / totalSessions).toFixed(1);
export const allRepos = [...new Set(sessions.flatMap(s => s.data.repos || []))];
export const dateRange = sessions.length > 0
  ? `${sessions.sort((a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime())[0].data.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — ${sessions[sessions.length - 1].data.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  : '';

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 2rem 0;">
  <StatsCard label="Total Sessions" value={totalSessions} />
  <StatsCard label="Avg Rating" value={`${avgRating}/10`} />
  <StatsCard label="Repos" value={allRepos.length} />
  <StatsCard label="Date Range" value={dateRange} />
</div>
```

- [ ] **Step 7: Create `site/src/components/StatsCard.astro`**

```astro
---
interface Props {
  label: string;
  value: string | number;
}
const { label, value } = Astro.props;
---

<div class="stats-card">
  <span class="stats-value">{value}</span>
  <span class="stats-label">{label}</span>
</div>

<style>
  .stats-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 0.5rem;
    background: var(--sl-color-gray-7);
  }
  .stats-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--sl-color-white);
  }
  .stats-label {
    font-size: 0.875rem;
    color: var(--sl-color-gray-2);
  }
</style>
```

- [ ] **Step 8: Create `site/src/pages/timeline.astro`**

```astro
---
import { getCollection } from 'astro:content';
import StarlightPage from '@astrojs/starlight/components/StarlightPage.astro';

const allDocs = await getCollection('docs');
const sessions = allDocs
  .filter(entry => entry.data.rating !== undefined)
  .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
---

<StarlightPage frontmatter={{ title: 'Timeline', description: 'All sessions in reverse chronological order' }}>
  <div class="timeline">
    {sessions.map(session => (
      <article class="timeline-entry">
        <div class="timeline-meta">
          <time>{session.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
          <span class="rating">{'*'.repeat(Math.min(Math.round(session.data.rating / 2), 5))}</span>
          <span class="duration">{session.data.duration}</span>
        </div>
        <h3>
          <a href={`/second-brain/${session.id}/`}>{session.data.title}</a>
        </h3>
        <p class="objective">{session.data.objective}</p>
        {session.data.repos?.length > 0 && (
          <div class="repos">
            {session.data.repos.map(repo => <span class="chip">{repo}</span>)}
          </div>
        )}
      </article>
    ))}
  </div>
</StarlightPage>

<style>
  .timeline { display: flex; flex-direction: column; gap: 1.5rem; }
  .timeline-entry { border-left: 3px solid var(--sl-color-accent); padding-left: 1rem; }
  .timeline-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: var(--sl-color-gray-2); }
  .objective { color: var(--sl-color-gray-3); margin: 0.25rem 0; }
  .repos { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .chip { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 1rem; background: var(--sl-color-gray-6); color: var(--sl-color-gray-1); }
</style>
```

- [ ] **Step 9: Create `site/src/pages/tags/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import StarlightPage from '@astrojs/starlight/components/StarlightPage.astro';

const allDocs = await getCollection('docs');
const sessions = allDocs.filter(entry => entry.data.tags?.length > 0);

const tagCounts = new Map<string, number>();
for (const session of sessions) {
  for (const tag of session.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}
const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
---

<StarlightPage frontmatter={{ title: 'Tags', description: 'Browse sessions by topic' }}>
  <div class="tag-cloud">
    {sortedTags.map(([tag, count]) => (
      <a href={`/second-brain/tags/${tag}/`} class="tag-chip">
        {tag} <span class="count">({count})</span>
      </a>
    ))}
  </div>
</StarlightPage>

<style>
  .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .tag-chip {
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    background: var(--sl-color-gray-6);
    color: var(--sl-color-gray-1);
    text-decoration: none;
    font-size: 0.875rem;
    transition: background 0.2s;
  }
  .tag-chip:hover { background: var(--sl-color-accent); color: var(--sl-color-white); }
  .count { color: var(--sl-color-gray-3); }
</style>
```

- [ ] **Step 10: Create `site/src/pages/tags/[tag].astro`**

```astro
---
import { getCollection } from 'astro:content';
import StarlightPage from '@astrojs/starlight/components/StarlightPage.astro';

export async function getStaticPaths() {
  const allDocs = await getCollection('docs');
  const sessions = allDocs.filter(entry => entry.data.tags?.length > 0);

  const tags = new Set<string>();
  for (const session of sessions) {
    for (const tag of session.data.tags) {
      tags.add(tag);
    }
  }

  return [...tags].map(tag => ({
    params: { tag },
    props: {
      sessions: sessions
        .filter(s => s.data.tags.includes(tag))
        .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()),
    },
  }));
}

const { tag } = Astro.params;
const { sessions } = Astro.props;
---

<StarlightPage frontmatter={{ title: `Tag: ${tag}`, description: `Sessions tagged with "${tag}"` }}>
  <p>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
  <div class="session-list">
    {sessions.map(session => (
      <article class="session-entry">
        <time>{session.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
        <h3>
          <a href={`/second-brain/${session.id}/`}>{session.data.title}</a>
        </h3>
        <p>{session.data.objective}</p>
        <span class="rating">{session.data.rating}/10</span>
      </article>
    ))}
  </div>
</StarlightPage>

<style>
  .session-list { display: flex; flex-direction: column; gap: 1rem; }
  .session-entry { border-bottom: 1px solid var(--sl-color-gray-6); padding-bottom: 1rem; }
  .session-entry time { font-size: 0.875rem; color: var(--sl-color-gray-3); }
  .session-entry p { margin: 0.25rem 0; color: var(--sl-color-gray-2); }
  .rating { font-size: 0.875rem; color: var(--sl-color-accent); }
</style>
```

- [ ] **Step 11: Install dependencies and verify build**

```bash
cd ~/github/nicksteffens/second-brain/site
npm install
npm run build
```

Expected: Build succeeds, `dist/` populated with static site.

- [ ] **Step 12: Run dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321/second-brain/` and verify:
- Homepage shows stats (173 sessions, average rating, repo count, date range)
- Timeline shows sessions in reverse chronological order
- Tags page shows tag cloud with counts
- Clicking a tag filters correctly
- Individual session pages render with correct frontmatter and body
- Sidebar shows 2025/2026 year navigation with collapsed month sections

- [ ] **Step 13: Commit**

```bash
cd ~/github/nicksteffens/second-brain
git add site/
git commit -m "feat: set up Astro/Starlight site with session content"
```

---

## Task 4: Set up GitHub Actions deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: site/package-lock.json
      - run: npm ci
        working-directory: site
      - run: npm run build
        working-directory: site
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Pages deployment workflow"
```

- [ ] **Step 3: Push to GitHub and enable Pages**

```bash
git push -u origin main
```

Then enable GitHub Pages in repo settings (Settings > Pages > Source: GitHub Actions).

- [ ] **Step 4: Verify deployment**

Wait for the Actions workflow to complete, then visit `https://nicksteffens.github.io/second-brain/` and verify the site loads correctly.

---

## Task 5: Create Obsidian templates

**Files:**
- Create: `templates/session-log.md`
- Create: `templates/inbox-capture.md`
- Create: `templates/decision-record.md`

- [ ] **Step 1: Create `templates/session-log.md`**

This is a Templater template. `<% %>` tags are Templater syntax.

```markdown
---
title: "<% tp.file.cursor(1) %>"
date: <% tp.date.now("YYYY-MM-DD") %>
session: <% tp.file.cursor(2) %>
duration: "<% tp.file.cursor(3) %>"
rating: <% tp.file.cursor(4) %>
objective: "<% tp.file.cursor(5) %>"
repos: []
tags: []
role: "<% tp.file.cursor(6) %>"
shortcut: ""
wins: []
improvements: []
decisions: []
---

### What We Accomplished

### Challenges Encountered

### Most Valuable Collaboration

### Key Insight

### Follow-Up Items

### Role Distribution
**Human:**
**Claude:**

### Success Factors
```

- [ ] **Step 2: Create `templates/inbox-capture.md`**

```markdown
---
captured: <% tp.date.now("YYYY-MM-DD HH:mm") %>
---

<% tp.file.cursor(1) %>
```

- [ ] **Step 3: Create `templates/decision-record.md`**

```markdown
---
title: "<% tp.file.cursor(1) %>"
date: <% tp.date.now("YYYY-MM-DD") %>
status: "accepted"
---

## Context

<% tp.file.cursor(2) %>

## Decision

<% tp.file.cursor(3) %>

## Consequences

<% tp.file.cursor(4) %>

## Related Sessions

- 
```

- [ ] **Step 4: Commit**

```bash
git add templates/
git commit -m "feat: add Obsidian Templater templates for session, inbox, and decisions"
```

---

## Task 6: Build `/capture` skill

**Files:**
- Create: `~/.claude/skills/capture/SKILL.md`

- [ ] **Step 1: Create the skill file**

Create `~/.claude/skills/capture/SKILL.md`:

```markdown
---
name: capture
description: "Quick capture a thought, link, or snippet into the second-brain inbox. Zero friction — just type /capture followed by your note."
argument-hint: "<your note>"
---

# Capture

Drop a timestamped note into the second-brain inbox.

## Behavior

1. Take the user's argument text as the note body
2. Generate a filename from the current timestamp: `YYYY-MM-DD-HHmm-<slugified-first-5-words>.md`
3. Write the file to `~/github/nicksteffens/second-brain/00-inbox/` with this format:

```markdown
---
captured: YYYY-MM-DD HH:mm
---

<user's note text>
```

4. Confirm with the filename and a one-line summary

## Rules

- No questions asked — just capture it
- If no argument is provided, ask "What do you want to capture?"
- Keep the filename short and readable
- Do not organize, categorize, or edit the note — that happens during review
```

- [ ] **Step 2: Verify skill loads**

In a Claude Code session:
```
/capture Test note — verifying skill works
```

Expected: A file appears in `~/github/nicksteffens/second-brain/00-inbox/` with today's timestamp.

- [ ] **Step 3: Commit the skill**

```bash
cd ~/.claude
git add skills/capture/
git commit -m "feat: add /capture skill for second-brain inbox"
```

---

## Task 7: Build `/session-log` skill

**Files:**
- Create: `~/.claude/skills/session-log/SKILL.md`

- [ ] **Step 1: Create the skill file**

Create `~/.claude/skills/session-log/SKILL.md`:

```markdown
---
name: session-log
description: "Create a new session log entry in the second-brain. Extracts context from the current session and asks for your assessment."
---

# Session Log

Create a session log entry in `~/github/nicksteffens/second-brain/01-sessions/`.

## Behavior

1. **Determine session number**: Look at existing files in `01-sessions/YYYY/MM/` for today's date. Count existing sessions and increment.

2. **Extract from conversation context**:
   - Objective (what were we working on)
   - Duration (estimate from session start to now)
   - Repos touched (from file paths and git operations in the session)
   - Tags (infer from work done — use tag keywords from the migrate.ts patterns)
   - What was accomplished (summarize key actions)
   - Challenges encountered
   - Key insight

3. **Ask the user** (batch these questions):
   - Rating (1-10)
   - Role (directing, collaborating, reviewing, learning)
   - Wins (what went well — for future distillation)
   - Improvements (what should be better next time)
   - Any key decisions made
   - Follow-up items

4. **Write the file**: `01-sessions/YYYY/MM/YYYY-MM-DD-session-N.md` using the session log template format with frontmatter matching the schema in `site/src/content.config.ts`.

5. **Commit**: Stage and commit the new session log file.

## File Format

```yaml
---
title: "<truncated objective, max 80 chars>"
date: YYYY-MM-DD
session: N
duration: "<duration>"
rating: N
objective: "<full objective>"
repos: ["repo1", "repo2"]
tags: ["tag1", "tag2"]
role: "<role>"
shortcut: "<sc-NNNNN if applicable>"
wins:
  - "<win 1>"
improvements:
  - "<improvement 1>"
decisions:
  - "<decision 1>"
---

### What We Accomplished
<bulleted list>

### Challenges Encountered
<bulleted list>

### Most Valuable Collaboration
<paragraph>

### Key Insight
<paragraph>

### Follow-Up Items
- [ ] <item>

### Role Distribution
**Human:** <description>
**Claude:** <description>

### Success Factors
<paragraph>
```

## Rules

- Always check for existing sessions today before assigning a session number
- Frontmatter must be valid YAML — quote strings with special characters
- Tags should use the established vocabulary: bug-fix, feature, refactor, testing, infrastructure, eslint, design-system, api, documentation, debugging, performance, upgrade, automation, multi-repo, research, review
- The session log file path must match the pattern `01-sessions/YYYY/MM/YYYY-MM-DD-session-N.md`
```

- [ ] **Step 2: Commit**

```bash
cd ~/.claude
git add skills/session-log/
git commit -m "feat: add /session-log skill for second-brain"
```

---

## Task 8: Add `--add-dir` to Claude Code workflow

**Files:**
- Modify: `~/.claude/CLAUDE.md`

- [ ] **Step 1: Add second-brain `--add-dir` instruction to global CLAUDE.md**

Add this section to `~/.claude/CLAUDE.md`:

```markdown
## Second Brain

The second-brain vault lives at `~/github/nicksteffens/second-brain/`. When starting sessions in work repos, use `--add-dir ~/github/nicksteffens/second-brain` to give Claude read/write access to the vault for session logging, captures, and knowledge retrieval.
```

- [ ] **Step 2: Commit**

```bash
cd ~/.claude
git add CLAUDE.md
git commit -m "docs: add second-brain --add-dir instructions to global CLAUDE.md"
```

---

## Task 9: Open vault in Obsidian and configure plugins

This task is manual — performed by the user in the Obsidian app.

- [ ] **Step 1: Open vault in Obsidian**

Open Obsidian → "Open folder as vault" → select `~/github/nicksteffens/second-brain/`

- [ ] **Step 2: Install community plugins**

Settings → Community Plugins → Browse:
- **Obsidian Git** — enable, configure auto-commit interval (e.g., every 10 minutes)
- **Templater** — enable, set template folder to `templates/`
- **Dataview** — enable
- **Calendar** — enable

- [ ] **Step 3: Configure Obsidian Git**

Settings → Obsidian Git:
- Auto pull interval: 10 minutes
- Auto push interval: 10 minutes
- Commit message: `vault: auto-save {{date}}`

- [ ] **Step 4: Configure Templater**

Settings → Templater:
- Template folder location: `templates`
- Enable folder templates if desired (e.g., new files in `00-inbox/` use inbox template)

- [ ] **Step 5: Verify vault works**

- Browse existing session logs in `01-sessions/`
- Create a test note in `00-inbox/` via Templater
- Verify Obsidian Git shows the repo status
- Check Calendar plugin shows dates with session logs

---

## Task 10: Push to GitHub and verify end-to-end

- [ ] **Step 1: Push all commits**

```bash
cd ~/github/nicksteffens/second-brain
git push -u origin main
```

- [ ] **Step 2: Enable GitHub Pages**

Go to `https://github.com/nicksteffens/second-brain/settings/pages` and set Source to "GitHub Actions".

- [ ] **Step 3: Verify GitHub Actions deployment**

```bash
gh run list --repo nicksteffens/second-brain --limit 1
```

Wait for the workflow to complete successfully.

- [ ] **Step 4: Verify live site**

Visit `https://nicksteffens.github.io/second-brain/` and confirm:
- Homepage loads with correct session count (173)
- Timeline, tags, and individual session pages all work
- No broken links

- [ ] **Step 5: Test `/capture` skill end-to-end**

```
/capture Testing the full pipeline — inbox capture from a live session
```

Verify the file appears in `00-inbox/`, Obsidian sees it, and Obsidian Git commits it.

---

## Future Tasks (Phase 4 — not part of this plan)

These are documented here for reference but should be planned and implemented separately once the vault has accumulated enough content:

- **`/distill` skill** — reads recent session logs, extracts durable knowledge into `03-wiki/`
- **`/review` skill** — weekly review surfacing trends, orphaned inbox items, stale wiki entries
- **Session-end hook** — auto-appends session summary to today's session log on `Stop` event
- **Retire `claude-log`** — redirect GitHub Pages, archive old repo
