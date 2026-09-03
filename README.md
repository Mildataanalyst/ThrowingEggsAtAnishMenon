# Throw Eggs at Anish — V5.1

A portrait-first, three-level birthday game.

## Levels

1. **Late Entry** — the clock starts at 9:30 AM; Anish arrives at 11:07 carrying two bags. The first credible throw hits, the next credible throw is compulsorily ducked, and the following credible throw hits.
2. **Money** — Anish advances from the far left toward a glowing pile of money. His first credible throw is compulsorily ducked, and he continues to duck at readable periodic intervals. Five hits stop him; reaching the money ends the attempt.
3. **Two Drinks** — Anish tries to finish a 30-second boring story. Every egg hit wipes the speech bubble and restarts the story. Five interruptions win.

## Deployment on Vercel

1. Unzip this package.
2. Upload the contents of `throw-eggs-at-anish-v5-1/` to the root of a GitHub repository.
3. Import the repository in Vercel.
4. Vercel reads `vercel.json`, runs `npm run build`, and serves `dist/`.

There are no runtime dependencies and no backend. The build script only copies the static project into `dist/`.

## Local test

```bash
npm run check
npm run build
python3 -m http.server 8080 -d dist
```

Open `http://localhost:8080`.

## Design decisions

- One canvas and one explicit state machine; no Phaser scene transitions and no query-string navigation.
- Real DOM buttons for every inter-level action.
- Black, warm white, graphite and yolk-yellow only.
- Mobile pointer controls with a visible trajectory and modest aim assistance.
- Level 2 adds a compulsory first duck plus periodic, telegraphed ducks.
- Procedural sound only; no copyrighted soundtrack.
