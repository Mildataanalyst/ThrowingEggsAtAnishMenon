# V8.4 — Enforced Difficulty Fix

This build fixes the actual gameplay loophole rather than merely listing the intended pattern.

## Root cause fixed
The previous build decided whether a throw was “credible” only when the egg was released. A throw could fail that early test, later touch the large collision area, and register as a hit without ever entering the scripted dodge sequence.

## Exact enforced sequences

### Level 1 threatening / credible attempts
1. forced hit — OPENING STRONG AANU.
2. forced dodge
3. strict normal shot
4. forced dodge
5. forced dodge — HAPPY BIRTHDAY TO ME.
6 onward: strict normal shots until 5 successful hits

### Level 2 threatening / credible attempts
1. forced dodge — MONEY MAKES ME QUICK.
2. strict normal shot
3. strict normal shot
4. forced dodge
5 onward: strict normal shots

## Difficulty changes
- Any egg that actually enters the target zone is promoted into the scripted sequence mid-flight.
- No collision can bypass a required dodge.
- Normal homing assistance reduced to 7.5% in Level 1 and 3.5% in Level 2.
- Hitboxes reduced substantially.
- Level 1 lateral movement increased.
- Level 2 now uses an absolute 10-second deadline; successful hits do not extend the timer.
- A visible countdown has been added to Level 2.
- Cache-busted JS/CSS and no-store Vercel headers prevent an older build from being served after redeploying.
