# Tray Workshop

Tray Workshop is a browser-based STL generator for simple square-base rank-and-file fantasy wargaming movement trays.

It runs entirely client-side. Tray geometry is generated in the browser with Three.js and exported as an STL using the browser Blob download flow.

## Current Scope

- Flat rectangular infantry movement trays
- Square or rectangular base dimensions
- Configurable columns, rows, tolerance, floor thickness, rail thickness, and rail height
- Optional front, rear, left, and right rails
- Top-down SVG preview
- ASCII STL download
- Colour theme selector

## Out of Scope for V1

- Backend services
- Accounts
- Payments
- Official game data
- Faction or unit presets
- Logos, art, protected rules text, or publisher-owned material
- Cavalry, round bases, sockets, magnet holes, character slots, or split trays

## Development

```bash
pnpm install
pnpm run dev
```

## Production Build

```bash
pnpm run build
```

The static build is written to `dist/`.

## Deployment

This project is a static Vite app and can be hosted on GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

For GitHub Pages, this repo includes a workflow at `.github/workflows/deploy-pages.yml`. In the GitHub repository settings, set Pages to use **GitHub Actions** as the source, then push to the default branch.

## Disclaimer

Unofficial fan-made utility. Not affiliated with or endorsed by any tabletop wargame publisher.
