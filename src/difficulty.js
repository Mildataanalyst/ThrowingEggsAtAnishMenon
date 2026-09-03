export const SHOT_PATTERNS = Object.freeze({
  l1_play: Object.freeze({
    1: 'forceHit',
    2: 'forceDodge',
    4: 'forceDodge',
    5: 'forceDodge'
  }),
  // Internal l2 is the cash chase, displayed as Level 3 in V8.7.
  l2_play: Object.freeze({
    1: 'forceDodge',
    4: 'forceDodge'
  }),
  // Internal l3 is the drunk story, displayed as Level 2 in V8.7.
  l3_play: Object.freeze({
    1: 'forceDodge',
    3: 'forceDodge',
    7: 'forceDodge'
  })
});

export function modeForAttempt(state, attemptIndex) {
  if (!Number.isInteger(attemptIndex) || attemptIndex < 1) return 'normal';
  return SHOT_PATTERNS[state]?.[attemptIndex] ?? 'normal';
}

export function normalAssistFor(state) {
  if (state === 'l1_play') return 0.075;
  if (state === 'l2_play') return 0.035;
  if (state === 'l3_play') return 0.015;
  return 0;
}

export const LEVEL_TWO_DURATION_MS = 13_000;
export const LEVEL_THREE_STORY_DURATION_MS = 30_000;
export const LEVEL_THREE_HITS_REQUIRED = 10;
export const LEVEL_THREE_HIT_PAUSE_MIN_MS = 1_000;
export const LEVEL_THREE_HIT_PAUSE_MAX_MS = 1_000;
