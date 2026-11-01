# CyberEnsō

CyberEnsō is a browser-based generator for creating a daily Ensō. It is
packaged as a static site and can be deployed directly to Vercel or any
static hosting provider.

## Run locally

Because the app loads JavaScript as an ES module, serve the project through a
local HTTP server instead of opening the HTML file directly:

```powershell
py -m http.server 4173
```

Then open <http://localhost:4173/>.

## Deploy

Import this repository into Vercel and leave the framework preset as
**Other**. The project has no build step; Vercel serves `index.html` and the
static assets from the repository root.
