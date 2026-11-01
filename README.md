# CyberEnsō

CyberEnsō is a small, browser-only tool for creating a digital **ensō**:
a single circular brushstroke used in Zen calligraphy as a record of a
moment. Add a poem or a thought, then turn it into a unique generative mark
that you can download as SVG or PNG.

The app is intentionally private-by-default: text is processed in the
browser and no server or database is required.

## What is an ensō?

An ensō (円相, “circle form”) is a Zen ink painting made in one spontaneous
stroke. It can represent emptiness, fullness, imperfection, movement, and the
state of the person who made it. The open gap is meaningful too: the circle
does not need to be geometrically complete to feel complete.

CyberEnsō translates that idea into a deterministic digital process. The
content is hashed, and the hash becomes the seed for a family of slightly
different arcs. A small change in the input creates a different mark, while
the same input creates the same mark again.

## How it works

1. The Vue runtime mounts the app into `#app`.
2. The editor stores title, author, source style, text, and direction as
   reactive state.
3. The text is hashed in the browser. The resulting values control arc
   radius, endpoints, and subtle variation.
4. The renderer emits an SVG made from layered `<path>` elements. Each path
   is an open, rounded arc rather than a perfect circle.
5. The download actions serialize that SVG directly or rasterize a copy to
   PNG with the browser canvas.

This design keeps the output crisp at any size and makes the artwork easy to
inspect: the generated SVG is the actual drawing, not a screenshot.

## Repository layout

```text
.
├── index.html                 # Static app entry point and metadata
├── assets/
│   ├── index-CF1CkH1m.js     # Production Vue bundle
│   ├── index-Bpd4tjvV.css     # Visual system and responsive layout
│   ├── manifest.json          # PWA metadata
│   └── icons and enso.png     # Favicons and social preview artwork
├── docs/
│   ├── ARCHITECTURE.md        # Runtime and deployment notes
│   └── ENSO.md                # Cultural and visual background
└── README.md
```

The JavaScript bundle is currently kept as a production artifact because this
repository started from a static export. The CSS is maintained separately so
the visual design can evolve without changing the generator logic. A future
source rebuild can replace the bundle while keeping the same public entry
point.

## Run locally

Serve the directory over HTTP so the ES module and asset paths work:

```powershell
py -m http.server 4173
```

Open <http://localhost:4173/>.

## Deploy

The site is deployed from the `main` branch on Vercel. It is a static project:
there is no build command, framework preset, environment variable, or
backend. Vercel serves `index.html` and the files in `assets/` directly.

- GitHub: <https://github.com/rushhiii/cyberenso>
- Production: <https://cyberenso.vercel.app>

## Credits

The poem content is part of the app's sample data. The background idea of an
ensō belongs to Zen calligraphy; CyberEnsō is a contemporary digital
interpretation, not a replacement for the traditional practice.
