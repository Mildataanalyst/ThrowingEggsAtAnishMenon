# V8.7 Final Changelog

## Level 2 story

The story now follows a coherent sequence:

- Anish reaches the restaurant before the activation materials and before the restaurant knows what is happening.
- He waits while the vendor blames traffic, the manager searches for a plug point, and people debate the QR-stand position.
- The activation is eventually set up.
- Exactly one person scans the QR code: the waiter, because everyone keeps staring at him.

## Final cash level

- The hidden cash deadline is tighter.
- No numeric deadline is mentioned in the level card, microcopy, or gameplay HUD.
- Completion now shows a dedicated card explaining that the capitalist has been kept away from the money—something previously believed impossible for Anish.
- **NEXT** then opens the separate birthday note.

## Final birthday note

The final card ends with:

> Continue being this annoying, and may many more eggs be thrown at your face.

## Opening-screen counter

The title screen now shows:

> EGGS THROWN AT ANISH SO FAR · [LIVE TOTAL]

Each valid egg release increments the displayed count. The implementation attempts to use a shared public aggregate counter and retains a browser-local fallback so the game remains playable and the number continues updating even if the counter service is unavailable.
