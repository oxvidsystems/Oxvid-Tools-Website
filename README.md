# Toolworks — Oxvid Tools Website

A React + Vite conversion of the original single-file Toolworks HTML site: 146
client-side utilities (PDF, image, text, developer, calculator, SEO, finance,
generator and color/design tools) across a proper multi-page app.

## Stack

- **React 19** + **React Router 7** for the app shell, routing and pages.
- **Vite 8** for dev/build tooling.
- Plain CSS (`src/styles.css`), extracted from the original site with no
  changes to visual design.

## Project structure

```
src/
  core/engine.js       Framework-agnostic tool engines (145 tools), extracted
                        from the original file. Calculators, canvas-based
                        image editors, PDF tools (pdf-lib/pdf.js/jsPDF loaded
                        on demand from a CDN), text/dev utilities, etc. These
                        mount into a plain DOM container — see
                        components/ToolWorkspace.jsx for the React bridge.
  components/          Header, Footer, Layout, SearchBox, ToolCard,
                        CategoryCard, ToolWorkspace, PlatformBadge, Section
  pages/                Home, AllTools, Categories, Category, ToolPage,
                        About, Contact, Privacy, Terms, NotFound
  hooks/                useTheme (light/dark), useVisualEffects (scroll
                        reveal, counters, card tilt)
  data/staticCopy.js    About/Privacy/Terms copy
```

Routing uses real paths (`/tool/word-counter`) via `BrowserRouter` rather
than the original's `#/...` hash routes — `vercel.json` adds the SPA rewrite
this requires.

## Scope note

Of 146 registered tools, 145 have real, working implementations (matching
the original site). The one exception — a live HTTP status checker — needs
a server-side proxy a static site can't provide, and is honestly marked
"Coming soon" rather than faked, exactly as in the source file.

## Development

```bash
npm install
npm run dev       # start dev server
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
npm run lint      # oxlint
```
