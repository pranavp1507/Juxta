# Juxta

**Juxta — a fast, self-hostable, open-source side-by-side text & code diff tool. An open alternative to text-compare.com.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Features

- **Split & unified views** — side-by-side or stacked diff rendering with smooth transitions
- **Syntax highlighting** — TypeScript/JS, HTML, CSS, JSON, and plain text with auto-detection
- **Word & character inline diff** — configurable granularity for intra-line changes
- **Search with navigation** — highlight matches and jump prev/next across both panes
- **Whitespace / wrap / line-number toggles** — per-session display controls
- **Soft & high-contrast colour schemes** — light and dark theme variants
- **Per-side text transforms** — lowercase, sort lines, remove excess whitespace, replace line breaks
- **Swap & clear** — one-click input management
- **4-format export** — download diff as HTML, TXT, Markdown, or JSON
- **Persisted preferences** — all settings saved in localStorage, restored on reload
- **Keyboard shortcuts** — full Alt-key shortcut set; discoverable via Alt+K modal
- **Sample loader** — built-in example diffs to explore features immediately
- **Light / dark theme** — auto-follows system preference, manually overridable
- **Analytics bar** — live counts of additions, deletions, and changed lines
- **Responsive layout** — adapts gracefully from mobile to widescreen

---

## Self-Host Quickstart

### Docker (recommended)

Build the image from source, then run it:

```bash
docker build -t juxta:latest .
docker run -p 3000:3000 juxta:latest
```

Then open [http://localhost:3000](http://localhost:3000).

**Environment variables:**

| Variable | Default   | Purpose                                                                                  |
| -------- | --------- | ---------------------------------------------------------------------------------------- |
| `PORT`   | `3000`    | HTTP port the server listens on                                                          |
| `ORIGIN` | _(unset)_ | Public URL (required for CSRF protection in production, e.g. `https://diff.example.com`) |

### Docker Compose

Create a `docker-compose.yml`:

```yaml
services:
  juxta:
    image: juxta:latest
    ports:
      - "3000:3000"
    environment:
      ORIGIN: https://diff.example.com
    restart: unless-stopped
```

Then:

```bash
docker compose up -d
```

---

## Local Development

**Prerequisite:** [Bun](https://bun.sh) ≥ 1.0

```bash
# Install dependencies
bun install

# Start dev server (hot reload, port 3000)
bun run dev

# Production build
bun run build

# Unit tests
bun test

# End-to-end tests (requires Playwright browsers installed)
bun run test:e2e

# Type-check
bun run check
```

---

## Tech Stack

| Layer                     | Technology                                                           |
| ------------------------- | -------------------------------------------------------------------- |
| Framework                 | [SvelteKit](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) |
| Runtime / package manager | [Bun](https://bun.sh)                                                |
| Styling                   | [Tailwind CSS v4](https://tailwindcss.com)                           |
| Diff engine               | Custom pure-TS LCS diff (no runtime deps)                            |
| Testing                   | Bun test + Playwright                                                |

---

## License

Juxta is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](./LICENSE) for the full text.

> In short: you can use, modify, and self-host Juxta freely. If you distribute a modified version or run it as a network service, you must release your modifications under the same licence.
