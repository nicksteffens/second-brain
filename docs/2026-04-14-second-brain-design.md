# Second Brain: Design Spec

**Date:** 2026-04-14
**Status:** Draft
**Repo:** `nicksteffens/second-brain` (private)

---

## Overview

A personal knowledge management system built as an Obsidian vault backed by a private GitHub repo. It serves two audiences:

1. **Private vault** — Nick's working memory: quick captures, wiki knowledge, project context, archived notes
2. **Published site** — An Astro/Starlight site on GitHub Pages showing session logs and project dashboards (carries forward from the existing `claude-log` repo)

Claude operates as a proactive partner — reading, writing, distilling, and surfacing knowledge across sessions.

## Principles

- **One source of truth** — everything lives in this repo. No parallel systems to sync.
- **Sessions are the atomic unit** — not days. Multiple sessions per day, each its own log.
- **The wiki grows from work** — never pre-populated. Knowledge is distilled from session logs over time.
- **Folder-level privacy** — certain folders are public (built into the site), others are private (vault-only). No per-file flags.
- **Start useful, get powerful** — the vault should be valuable on day one with just session logs and inbox capture. The wiki compounds over weeks.

## Vault Structure

```
~/github/nicksteffens/second-brain/
│
│── ── PRIVATE (vault-only, never published) ── ──
├── 00-inbox/                    # Quick capture, unsorted thoughts
├── 03-wiki/                     # Distilled, durable knowledge
│   ├── _index.md               # Auto-maintained table of contents
│   ├── decisions/              # "We chose X because Y" (ADR-lite)
│   ├── patterns/               # Code patterns, architecture notes
│   ├── learnings/              # Concepts, research, book notes
│   └── retros/                 # Extracted wins/improvements trends
├── 04-archive/                  # Completed projects, old notes
│
│── ── PUBLIC (Astro builds from these) ── ──
├── 01-sessions/                 # Session logs (one per Claude session)
│   ├── 2025/
│   │   └── 09/
│   │       ├── 2025-09-02-session-1.md
│   │       └── ...
│   └── 2026/
│       └── 04/
│           ├── 2026-04-14-session-1.md
│           └── ...
├── 02-projects/                 # Project dashboards
│
│── ── INFRASTRUCTURE ── ──
├── site/                        # Astro/Starlight site
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── content.config.ts   # Session schema definition
│   │   └── components/         # Custom homepage, timeline, etc.
│   ├── package.json
│   └── public/
├── templates/                   # Obsidian note templates
├── .obsidian/                   # Obsidian config + plugins
├── .gitignore
└── README.md
```

### Folder Descriptions

**`00-inbox/`** — Zero-friction capture. Timestamped markdown files. Anything goes: a thought, a link, a snippet, a question. Claude can write here via `/capture`. Sorted into other folders during review.

**`01-sessions/`** (public) — One file per Claude Code session. Carries forward the existing `claude-log` schema and all 80+ historical entries. This is what the Astro site renders. Organized by `YYYY/MM/` subdirectories.

**`02-projects/`** (public) — Dashboard notes for active projects. Links to relevant session logs, wiki entries, and decisions. One markdown file per project.

**`03-wiki/`** (private) — The long-term knowledge base. Atomic notes, one concept per file, interlinked with `[[wikilinks]]`. Subfolders by type:
- `decisions/` — Architecture Decision Records (ADR-lite). "We chose X because Y." Linked from session logs where the decision was made.
- `patterns/` — Code patterns, architecture notes, reusable approaches.
- `learnings/` — Concepts from reading, courses, exploration.
- `retros/` — Synthesized trends from session wins/improvements over time. Not individual session retros, but patterns that emerge across sessions.

**`04-archive/`** (private) — Completed projects and aged-out notes. Nothing gets deleted, just moved here.

## Session Log Schema

Carries forward from existing `claude-log` with additions for second-brain integration:

```yaml
---
title: "Studio component migration"
date: 2026-04-14
session: 1
duration: "2h"
rating: 7
objective: "Migrate Button component to new design tokens"
repos: ["ui", "front-end"]
tags: ["design-system", "migration"]
role: "collaborating"
shortcut: "sc-12345"
# Second-brain additions:
wins:
  - "Token mapping went smoothly once we found the right approach"
improvements:
  - "Should have checked the existing token docs before starting"
decisions:
  - "Use CSS custom properties over Sass variables for runtime theming"
---
```

**Body** remains free-form markdown: accomplishments, challenges, insights, follow-up items.

The `wins`, `improvements`, and `decisions` frontmatter fields are structured data that `/distill` can aggregate across sessions to populate the wiki.

## Claude Integration

### Vault Access

Claude accesses the vault via `--add-dir ~/github/nicksteffens/second-brain`. This should be added to the shell alias or global CLAUDE.md so it's automatic in every session.

### Skills

| Skill | Trigger | What it does |
|---|---|---|
| `/capture` | Manual | Drops a timestamped note into `00-inbox/`. Args become the note body. Zero friction. |
| `/session-log` | Manual | Creates a new session log from template. Optionally distills from the raw Claude session log. |
| `/distill` | Manual | Reads recent session logs. Extracts durable knowledge into `03-wiki/` entries with backlinks. Creates or updates wiki pages. Updates `_index.md`. |
| `/review` | Manual | Weekly review. Surfaces: incomplete follow-ups across sessions, recurring themes in wins/improvements, orphaned inbox items, stale wiki entries. |

### Hooks

| Hook | Trigger | Action |
|---|---|---|
| Session end | `Stop` event | Appends a session summary block to today's session log — wins, decisions, open questions extracted from the session. |

Hooks are intentionally minimal. Distillation and review are manual because the user should be in the loop for knowledge curation.

### Wiki Growth Pattern

The wiki is never pre-populated. Growth flow:

1. Sessions happen, session logs accumulate with structured `wins`, `improvements`, `decisions` frontmatter
2. User runs `/distill` periodically (suggested weekly)
3. Claude reads recent session logs, identifies:
   - Recurring patterns (same struggle appearing across sessions)
   - Significant decisions worth preserving
   - Learnings that would be useful in future sessions
4. Creates or updates atomic wiki entries in the appropriate `03-wiki/` subfolder
5. Adds `[[wikilinks]]` between related entries and back-references to source session logs
6. Updates `03-wiki/_index.md`

**Example:** Three session logs mention debugging Ember's `@tracked` invalidation behavior. `/distill` creates `03-wiki/patterns/ember-tracked-invalidation.md`, linking back to the three sessions as sources. Future sessions where Claude encounters Ember reactivity issues can surface this wiki entry.

## Obsidian Plugin Stack

| Plugin | Purpose |
|---|---|
| **Obsidian Git** | Auto-commit on timer + manual push. Free sync to GitHub. |
| **Templater** | Session log template, inbox capture template, decision record template |
| **Dataview** | Queries for session stats, tag breakdowns, open follow-ups |
| **Calendar** | Visual navigation of session logs by date |

No task management plugins — that's Shortcut's job. The vault is for knowledge, not tickets.

## Astro/Starlight Site

### Content Sources

Astro reads from two public folders:
- `01-sessions/` — session log entries (primary content)
- `02-projects/` — project dashboard pages

Everything else (`00-inbox/`, `03-wiki/`, `04-archive/`) is excluded from the build.

### Features (carried from existing claude-log)

- **Homepage** — total sessions, average rating, repos worked on, date range
- **Timeline** — chronological view of all sessions
- **Tags** — filter sessions by tag
- **Year navigation** — collapsible year/month sections
- **Session detail** — full session content with frontmatter rendered as metadata

### Deployment

GitHub Pages via GitHub Actions. Builds on push to `main`, deploys `site/` output.

## Migration Plan

### From `claude-log` to `second-brain`

1. Copy all session markdown files from `claude-log/src/content/docs/` into `01-sessions/`, preserving the `YYYY/MM/` directory structure
2. Verify frontmatter schema compatibility — the existing schema carries forward, new fields (`wins`, `improvements`, `decisions`) are optional and default to empty
3. Rebuild Astro config in `site/` pointing at `01-sessions/` as content source
4. Port custom components (homepage stats, timeline, tag filtering)
5. Deploy to GitHub Pages from new repo
6. Verify all 80+ historical entries render correctly
7. Update GitHub Pages DNS/config to point at `second-brain` instead of `claude-log`
8. Archive `claude-log` repo (read-only)

### Data Integrity

- No session entries are deleted or modified during migration
- Git history of the original `claude-log` repo is preserved (archived, not deleted)
- All frontmatter fields from the original schema are maintained
- New optional fields are added with empty defaults so existing entries work without modification

## Rollout Phases

### Phase 1 — Foundation
- Create `nicksteffens/second-brain` private repo on GitHub
- Initialize Obsidian vault with folder structure
- Create templates (session log, inbox capture, decision record)
- Install Obsidian plugins (Git, Templater, Dataview, Calendar)
- Set up `.gitignore` (Obsidian workspace cache, `.obsidian/workspace.json`, etc.)

### Phase 2 — Migration
- Migrate all 80+ session entries from `claude-log`
- Set up Astro/Starlight in `site/`
- Port homepage, timeline, tag features
- Deploy to GitHub Pages
- Verify everything renders

### Phase 3 — Claude Integration
- Build `/capture` skill
- Build `/session-log` skill (session log creation + distillation from raw session logs)
- Add session-end hook
- Add `--add-dir` to workflow
- Test the capture → log → distill loop

### Phase 4 — Wiki Layer (week 2+)
- Build `/distill` skill
- Start growing `03-wiki/` from accumulated session logs
- Build `/review` skill once there's enough content to review

### Phase 5 — Retire claude-log
- Redirect GitHub Pages
- Archive old repo

## Sources & Research

- [Kevin T'Syen: How I Built My Second Brain with Obsidian](https://medium.com/@kevin.tsyen/how-i-built-my-second-brain-with-obsidian-54edad2ecc44) — inspiration for folder structure and plugin stack
- [Cole Medin: Second Brain Starter](https://github.com/coleam00/second-brain-starter) — PRD generation approach, SOUL.md/USER.md/MEMORY.md pattern
- [AI Never Sleeps: Claude Code Brain That Never Forgets](https://aineversleeps.substack.com/p/i-gave-claude-code-a-brain-that-never) — wiki-first approach, "one concept per file," periodic lint passes
- [Claude Code Memory Docs](https://code.claude.com/docs/en/memory) — official auto memory architecture, CLAUDE.md best practices, .claude/rules/ system
- [MindStudio: Self-Evolving Claude Code Memory with Obsidian](https://www.mindstudio.ai/blog/self-evolving-claude-code-memory-obsidian-hooks) — hooks-based automated capture
