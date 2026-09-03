# V8.5 — Level 3: Ten-Hit Interruption

This release changes **Level 3 only**. Levels 1 and 2 retain the V8.4 enforced-difficulty behaviour and old-version game feel.

## New Level 3 objective

- Anish begins telling the story immediately.
- The base story length is **25 seconds**.
- The player must land **10 successful egg hits** before he finishes.
- Anish stops telling the story only after the tenth successful hit.

## Exact forced-dodge sequence

For threatening / credible Level 3 throws:

1. forced dodge
2. normal strict shot
3. forced dodge
4. normal strict shot
5. normal strict shot
6. normal strict shot
7. forced dodge
8 onward: normal strict shots

Only threatening attempts advance this sequence. Wild throws do not consume a scripted dodge.

## Story interruption behaviour

- A successful hit pauses Anish's narration for a random **2–3 seconds**.
- The narration does **not** return to the beginning.
- When the pause ends, the next word continues from the exact prior story position.
- If another egg lands while he is already interrupted, that hit adds another 2–3 seconds to the delay.
- Anish continues swaying and moving while the narration is paused.
- The story card visibly displays `INTERRUPTED` and the remaining pause time.

## Feedback

- The HUD now shows `HITS 0/10` and the objective `10 HITS BEFORE THE STORY ENDS`.
- Anish becomes progressively more irritated as hits accumulate.
- The fifth hit produces the frustration beat, but he stubbornly continues.
- The tenth hit produces `FINE. STORY OVER.` and completes the campaign.
