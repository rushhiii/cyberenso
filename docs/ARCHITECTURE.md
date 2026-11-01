# Architecture

## Runtime

CyberEnsō is a static multi-page application. `index.html`, `create.html`,
`history.html`, and `about.html` are separate entry points connected by the
shared navigation. Each page loads `assets/app.js` and `assets/app.css`.
There is no framework runtime or server dependency.

The old compiled export in `assets/index-CF1CkH1m.js` is not used by the live
pages. Keeping the current logic in a small readable module makes the hashing,
SVG generation, navigation, and history behavior easy to maintain.

## Data flow

```text
editor fields
    ↓
browser form state
    ↓
browser digest / digit stream
    ↓
SVG arc paths
    ↓
screen preview → SVG download
                 → localStorage history
```

No user text is sent to an API. The browser does all hashing, rendering, and
history storage. An item in History links back to the editor with its local
record ID.

The current readable implementation uses Web Crypto SHA-256 for the local
digest and preserves the original 60-path arc geometry. The original
CyberEnsō bundle used a BLAKE2b digest; the bundled legacy code remains
available as reference, but the live app does not load that compiled shell.

## Deployment

Vercel serves the repository root as a static site. There is no build step.
The `main` branch is connected to the production project, so a push to
GitHub triggers a new deployment automatically.

When adding assets, place them in `assets/` and reference them from
`index.html` with a relative `./assets/...` URL. Keep the root entry point
named `index.html` so static hosts can discover it.
