# Second Brain

Personal knowledge management system — Obsidian vault + published session log site.

**Site:** https://nicksteffens.github.io/second-brain/

## How It Works

### Two audiences, one repo

**You in Obsidian** — see everything. Browse sessions, jot in the inbox, build the wiki, search across all notes.

**The world on GitHub Pages** — sees only `01-sessions/` and `02-projects/`. Astro/Starlight renders those as a browsable site with timeline, tags, and stats.

### Knowledge lifecycle

```
Capture → Log → Distill → Retrieve
```

1. **Capture** — raw thoughts land in `00-inbox/` via `/capture` or manually in Obsidian
2. **Log** — session logs accumulate in `01-sessions/` with structured frontmatter (wins, improvements, decisions)
3. **Distill** — periodically, Claude reads recent session logs and extracts durable knowledge into `03-wiki/`
4. **Retrieve** — in future sessions, Claude reads the vault via `--add-dir` to surface relevant decisions, patterns, and learnings

## Structure

| Folder | Visibility | Purpose |
|--------|-----------|---------|
| `00-inbox/` | Private | Quick capture, unsorted thoughts |
| `01-sessions/` | Public | Session logs (one per Claude Code session) |
| `02-projects/` | Public | Project dashboards |
| `03-wiki/` | Private | Distilled knowledge — decisions, patterns, learnings, retros |
| `04-archive/` | Private | Completed projects, old notes |
| `site/` | — | Astro/Starlight site (builds from public folders) |
| `templates/` | — | Obsidian note templates (session-log, inbox-capture, decision-record) |

## Claude Integration

### Skills

| Skill | What it does |
|-------|-------------|
| `/capture <note>` | Drops a timestamped note into `00-inbox/` |
| `/session-log` | Creates a session log — extracts context, asks for your assessment |

### Vault access

Add `--add-dir ~/github/nicksteffens/second-brain` when starting Claude sessions to give read/write access to the vault.

### Sync

Obsidian Git plugin auto-commits and pushes every 10 minutes. GitHub Actions rebuilds the site on each push.

## Setup

### Obsidian

Open this directory as a vault in Obsidian. Required community plugins:

- **Git** (by Vinzent) — auto-sync to GitHub
- **Templater** — note templates (set template folder to `templates`)
- **Dataview** — query and filter notes
- **Calendar** — visual navigation by date

### Site development

```bash
cd site
npm install
npm run dev      # local dev server
npm run build    # production build
```

## Session log schema

```yaml
---
title: "Short description"
date: 2026-04-14
session: 1
duration: "2h"
rating: 8
objective: "Full description of what was worked on"
repos: ["ui", "front-end"]
tags: ["design-system", "refactor"]
role: "collaborating"
shortcut: "sc-12345"
wins:
  - "What went well"
improvements:
  - "What should be better next time"
decisions:
  - "Key decisions made"
---
```
