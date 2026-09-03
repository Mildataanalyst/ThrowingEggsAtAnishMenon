# Throw Eggs at Anish Menon — Polish / Rebuild Notes (V6)

## 1) What was wrong in the last version

The last build had the right *premise* but the wrong *feel*.

Main issues:

1. **Visual hierarchy was weak**
   - The intro card sat on top of a dull background.
   - Level 2 and Level 3 looked functionally correct but emotionally flat.
   - The slingshot and hit effects looked like placeholders instead of shipped game art.

2. **The “game feel” regressed**
   - The throw loop felt less satisfying than earlier iterations.
   - The slingshot had low visual credibility.
   - Projectiles, impacts, and movement feedback did not feel sharp enough.

3. **Level identity was muddy**
   - Level 1 needed stronger “movie marketing / south India / office arrival” flavor.
   - Level 2 needed more readable money-chasing behavior and clearer humor.
   - Level 3 had the strongest concept, but the weakest staging and audience presence.

4. **Progression and onboarding needed to be clearer**
   - The player should immediately understand what is happening and why it is funny.
   - The opening should set up the joke before the first throw.

---

## 2) Research / principles used for the rebuild

I used a lightweight research pass focused on **web game feel**, **readability**, and **mobile touch polish**.

### Principles applied

1. **Animation should be frame-time driven**
   - Motion needs to stay consistent across devices and refresh rates.
   - This is why the game continues to use a requestAnimationFrame loop with time-based delta updates.

2. **Input should feel unified and touch-friendly**
   - Mobile games need clean pointer interaction, consistent pull distance, and forgiving aiming.
   - The slingshot loop should feel readable before it feels difficult.

3. **Good game feel comes from layered feedback**
   - Hit stop
   - screen shake
   - splat particles
   - trail
   - faster reload
   - clearer objective text
   - stronger anticipation and dodge timing

4. **Each level should have a distinct visual promise**
   - Level 1 = office entry + movie marketing vibe
   - Level 2 = money pursuit + growth / ambition joke
   - Level 3 = drunk story + audience fatigue + visible irritation

### Reference categories consulted

- MDN docs for frame-timed animation (`requestAnimationFrame`)
- web platform pointer interaction guidance
- standard “juice / game feel” patterns used in small arcade games
- camera shake / feedback conventions used in action and slingshot-style games

(Implementation remains pure HTML/CSS/Canvas — no framework migration.)

---

## 3) Design direction for the rebuild

### Global direction

- Keep the monochrome + warm white + yellow accent system.
- Make the game look more intentional and more “shipped”.
- Preserve the caricature cutout of Anish as the central joke.
- Make the UI feel editorial, premium, and slightly absurd.

### Home / intro screen

**Problem:** looked generic and dead.

**Fix:**
- Keep the film / marketing stage background.
- Strengthen the card styling with a glassy editorial panel.
- Keep the setup minimal but clearer.
- Preserve the comedy premise from the first screen.

### Level 1 — Office arrival

**Desired fantasy:**
Anish takes forever to show up, finally reaches office at 11:07, arrives with two bags, and obviously will not be working.

**Fixes shipped:**
- Slower 9:30 → 11:07 clock progression.
- He walks into the office/stage space.
- Two bags are shown: **gym bag** and **laptop bag**.
- A clearer pre-play card sets up the joke:
  - “Anish has reached office.”
  - “He will not be working anytime soon.”
  - “Now is a great time to throw eggs at his face.”

### Level 2 — Money chase

**Desired fantasy:**
He sees money and becomes more alive than he has been all day.

**Fixes shipped:**
- Cleaner, more premium money scene.
- Stronger progress lane from left to right.
- Glowing money pile.
- Faster forward movement.
- Character splats reset on level start.
- First credible shot still forces a dodge.
- Subsequent random / timed dodges remain to keep the level alive.
- Dialogue leans into the money-minded joke.
- Completion copy changed from weak “Capital delayed” to a stronger “Cash Flow Obstructed.”

### Level 3 — Drunk boring story

**Desired fantasy:**
This is the strongest comedic level: he is tipsy, trying to tell a boring story, the audience is visibly dying, and every hit makes him angrier.

**Fixes shipped:**
- Stronger spotlight/stage staging.
- Audience silhouettes are visible.
- Audience progressively slumps and snores.
- Story bubble is cleaner and more readable.
- Anish sways constantly to reflect drunken instability.
- Beer glass is retained and animated more clearly.
- After repeated interruptions, his face gets redder / angrier.

---

## 4) Gameplay changes shipped

### Throw loop
- Reworked slingshot drawing so it no longer looks like a placeholder.
- Cleaner wood / band treatment.
- Better throw arc readability.
- Stronger projectile trail.
- Faster throw pacing.
- Faster reload after shot resolution.

### Hit feedback
- Egg splats are more organic.
- Ground splats look better.
- Particle burst improved.
- Existing hit-stop and shake preserved and made more readable.

### Difficulty / fairness
- The game is still playful, but more forgiving than a harsh skill test.
- Level 1 eases the player in.
- Level 2 is more active but not obnoxious.
- Level 3 is harder mainly because the target sways and the timer keeps pressure on.

---

## 5) Files changed

### Core files edited
- `src/game.js`
- `styles.css`

### What changed in code
- Stronger state copy and transitions
- Improved Level 1 onboarding and pacing
- Revised Level 2 motion / dodge / humor
- Revised Level 3 animation and audience staging
- Improved slingshot rendering
- Better splat rendering
- Sound toggle moved away from HUD clutter
- Cleaner overlay card styling

---

## 6) Remaining optional upgrades (if you want a V7 later)

If you want to keep pushing quality, the next upgrades should be:

1. **Sprite-sheet character animation**
   - Separate head / torso / limbs instead of transforming one cutout.

2. **Custom illustrated backgrounds**
   - One bespoke background for each level.

3. **More granular Level 3 audience reactions**
   - eye-rolls, head-drops, speech bubbles, louder snore escalation.

4. **Light stats / end screen summary**
   - total throws, hit rate, “economic damage prevented”, “stories interrupted”.

5. **Camera easing / micro zoom on hit**
   - would add one more layer of juice.

---

## 7) Deliverable summary

This rebuild is not a new concept — it is a **polish-first reimplementation** of the strongest parts of the current three-level game.

The main goal was:

> keep the joke, keep the structure, fix the feel.

That is what this version is optimized for.
