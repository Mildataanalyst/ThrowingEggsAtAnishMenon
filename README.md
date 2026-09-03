# Throw Eggs at Anish Menon — V8.7 Final

A portrait-first, three-level birthday game.

## Campaign

1. **Office arrival:** Anish reaches work late and gets welcomed with eggs.
2. **Two drinks:** stop a painfully boring restaurant-activation story with ten successful hits.
3. **Capital pursuit:** keep Anish away from the money.

## V8.7 changes

- Rewrote the restaurant-activation story so it has a clear setup, delay, eventual launch, and waiter-only QR-code payoff.
- Tightened the final cash chase without displaying the hidden deadline anywhere in the interface.
- Added a separate Level 3 completion card before the birthday note.
- Added a global **EGGS THROWN AT ANISH SO FAR** counter under **START THROWING**.
- The counter uses a public aggregate counter when available and falls back to a persistent browser-local count if the network request fails.

## Deploy on Vercel

- Framework preset: **Other**
- Build command: `npm run build`
- Output directory: `dist`

The repository root should contain `package.json`, `index.html`, `src/`, `public/`, and `vercel.json`.
