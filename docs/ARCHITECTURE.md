# Architecture

## Runtime

CyberEnsō is a static single-page application. `index.html` loads the bundled
Vue runtime from `assets/index-CF1CkH1m.js` and the maintained design layer from
`assets/index-Bpd4tjvV.css`. Vue mounts into the empty `#app` element and owns
the interactive DOM after startup.

The bundle contains the generator, editor, daily view, and download actions.
The stylesheet is intentionally separate from the bundle so layout, color,
type, responsive behavior, and visual polish can be changed without
rebuilding the generator.

## Data flow

```text
editor fields
    ↓
reactive app state
    ↓
text hash / seeded values
    ↓
SVG arc paths
    ↓
screen preview → SVG download
                 → canvas → PNG download
```

No user text is sent to an API. The browser does all hashing and rendering.

## Deployment

Vercel serves the repository root as a static site. There is no build step.
The `main` branch is connected to the production project, so a push to
GitHub triggers a new deployment automatically.

When adding assets, place them in `assets/` and reference them from
`index.html` with a relative `./assets/...` URL. Keep the root entry point
named `index.html` so static hosts can discover it.
