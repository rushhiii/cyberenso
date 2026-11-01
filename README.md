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

The term means “circular form” and belongs to the tradition of Japanese Zen
art, ink painting, and calligraphy. The brush and ink movement are related to
Japanese calligraphy and *sumi-e*. Drawing an ensō can be a contemplative
practice sometimes called *hitsuzendō*, “the way of the brush.” An open
circle may suggest movement and the beauty of imperfection; a closed circle
may suggest completeness. See the [Wikipedia article on Ensō](https://en.wikipedia.org/wiki/Ens%C5%8D)
for an overview and references.

CyberEnsō translates that idea into a digital process. The content is hashed,
and the digest becomes the digit stream for a family of layered arcs. A small
change in the input creates a different mark; the original generator also
adds small random endpoint variations so repeated renders retain an organic,
hand-made quality.

## How it works

1. The static pages share one responsive stylesheet and one browser module.
2. The editor stores title, author, text, and direction in ordinary form
   state.
3. The text is hashed in the browser with the Web Crypto SHA-256 API. The
   digest bytes become the digit stream used by the original-style arc logic.
4. The renderer emits an SVG made from 60 layered `<path>` elements. Each path
   is an open, rounded arc rather than a perfect circle.
5. The download action serializes that SVG directly. Saved work is stored in
   browser `localStorage` and can be reopened from History.

This design keeps the output crisp at any size and makes the artwork easy to
inspect: the generated SVG is the actual drawing, not a screenshot.

## Repository layout

```text
.
├── index.html                 # Home page
├── create.html                # Connected editor page
├── history.html               # Local saved-work page
├── about.html                 # Ensō and hashing explanation
├── assets/
│   ├── app.js                 # Hashing, SVG generation, and history logic
│   ├── app.css                # Shared visual system and responsive layout
│   ├── manifest.json          # PWA metadata
│   └── icons and enso.png     # Favicons and social preview artwork
├── docs/
│   ├── ARCHITECTURE.md        # Runtime and deployment notes
│   └── ENSO.md                # Cultural and visual background
└── README.md
```

The older exported bundle remains in `assets/` only as historical material;
the live pages use `app.js` and do not depend on the old daily-image URLs.

## Run locally

Serve the directory over HTTP so the ES module and asset paths work:

```powershell
py -m http.server 4173
```

Open <http://localhost:4173/>. The editor, history, and about pages are
available at `/create.html`, `/history.html`, and `/about.html`.

## Deploy

The site is deployed from the `main` branch on Vercel. It is a static project:
there is no build command, framework preset, environment variable, or
backend. Vercel serves `index.html` and the files in `assets/` directly.

- GitHub: <https://github.com/rushhiii/cyberenso>
- Production: <https://cyberenso.vercel.app>

## Credits

This project is a redesign and connected multi-page implementation inspired
by the original [CyberEnsō Ensō Generator](https://enso.utsob.me/) created by
**Utsob**. The original project introduced the idea of hashing the text as a
destructive process and an analogy for clearing the mind before painting an
Ensō. Credit and context are also documented in the app's [About page](about.html).

Further references:

- [Original CyberEnsō by Utsob](https://enso.utsob.me/)
- [Original project discussion on r/generative](https://www.reddit.com/r/generative/comments/r2joz9/an_ens%C5%8D_generator/)
- [Wikipedia: Ensō](https://en.wikipedia.org/wiki/Ens%C5%8D)

The poem content is part of the app's sample data. The background idea of an
ensō belongs to Zen calligraphy; this project is a contemporary digital
interpretation, not a replacement for the traditional practice.
