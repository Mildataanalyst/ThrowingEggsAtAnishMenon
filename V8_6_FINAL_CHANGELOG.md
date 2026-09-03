# V8.6 Final — Office → Story → Cash

This release keeps the V8.5 old-feel slingshot, fullscreen behaviour, loading screen, sound design, hit-stop, camera shake, impact flash, egg splats, and enforced scripted dodges.

## Final campaign order

1. **Level 1 — Office arrival**
2. **Level 2 — Two Drinks / Boring Story**
3. **Level 3 — Cash Chase**

The cash level is now last because it is the hardest challenge.

## Office clock

The centred office clock now visibly advances through:

- 9:00 AM
- 9:30 AM
- 10:00 AM
- 10:30 AM
- 11:00 AM
- 11:07 AM — Work Login

Anish then walks in with both bags before Level 1 begins.

## Level 2 — Story challenge

- Restored the earlier restaurant-activation story.
- Story duration: **30 seconds**.
- Required successful hits: **10**.
- Scripted compulsory dodges remain on threatening attempts **1, 3 and 7**.
- A hit pauses narration for only **1 second**.
- The pause is not displayed or counted down on screen.
- The story resumes from the same word and never restarts.
- Anish continues moving and swaying while narration is briefly paused.

## Level 3 — Cash chase

- Duration increased from 10 seconds to **20 seconds**.
- Required successful hits: **5**.
- Scripted compulsory dodges remain on threatening attempts **1 and 4**.
- Completion opens the final birthday note and **PLAY AGAIN**.

## Validation

- JavaScript syntax validation passed.
- Exact forced-dodge sequences passed.
- Office → story → cash route assertions passed.
- 30-second story and invisible one-second pause assertions passed.
- 20-second money deadline assertion passed.
- Production static build completed successfully.
