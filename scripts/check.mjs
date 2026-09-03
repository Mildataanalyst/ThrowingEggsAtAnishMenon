import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  LEVEL_THREE_HIT_PAUSE_MAX_MS,
  LEVEL_THREE_HIT_PAUSE_MIN_MS,
  LEVEL_THREE_HITS_REQUIRED,
  LEVEL_THREE_STORY_DURATION_MS,
  LEVEL_TWO_DURATION_MS,
  modeForAttempt,
  normalAssistFor,
  SHOT_PATTERNS
} from '../src/difficulty.js';

const root = resolve(import.meta.dirname, '..');
const required = [
  'index.html', 'styles.css', 'src/game.js', 'src/audio.js', 'src/difficulty.js',
  'public/assets/anish.png', 'public/assets/stage-background.jpg',
  'public/favicon.svg', 'public/manifest.webmanifest', 'vercel.json'
];
for (const file of required) await access(resolve(root, file));

const game = await readFile(resolve(root, 'src/game.js'), 'utf8');
const index = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'styles.css'), 'utf8');
const audio = await readFile(resolve(root, 'src/audio.js'), 'utf8');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

const checks = [
  ['fullscreen request', 'requestFullscreen()'],
  ['portrait orientation lock', "screen.orientation.lock('portrait')"],
  ['preparing eggs loading screen', 'PREPARING EGGS'],
  ['old-style loading egg animation', 'loading-egg'],
  ['old-style thick sling outline', 'ctx.lineWidth = 22'],
  ['old-style sling core', 'ctx.lineWidth = 7'],
  ['old-style impact noise', 'this.noise({ duration: 0.19'],
  ['impact flash', 'this.impactFlash = 0.19'],
  ['impact zoom', 'this.impactZoom = 1.022'],
  ['opening strong dialogue', 'OPENING STRONG AANU.'],
  ['opening strong subline', 'reviews pending'],
  ['mid-flight attempt promotion', 'promoteShotToThreat(shot)'],
  ['collision bypass closed', 'No actual collision can bypass the scripted order.'],
  ['story is Level 2', "eyebrow: 'LEVEL 2'"],
  ['cash is final Level 3', "eyebrow: 'FINAL LEVEL · LEVEL 3'"],
  ['Level 1 routes to story', 'onClick: () => this.showLevel3Intro()'],
  ['story routes to cash', 'onClick: () => this.showLevel2Intro()'],
  ['coherent restaurant setup', 'apparently before anyone had told the restaurant there was an activation'],
  ['waiter scans QR payoff', 'exactly one person scanned the QR code. It was the waiter.'],
  ['cash duration hidden from intro', 'Make sure he does not reach the money.'],
  ['cash completion card', 'THE CAPITALIST<br>HAS BEEN KEPT AWAY<br>FROM THE MONEY.'],
  ['cash completion impossibility joke', 'previously believed to be impossible for Anish'],
  ['cash completion routes to birthday', 'onClick: () => this.showFinalNote()'],
  ['separate final note method', 'showFinalNote()'],
  ['final birthday copy', 'may many more eggs be thrown at your face'],
  ['global counter label', 'EGGS THROWN AT ANISH SO FAR'],
  ['global counter read endpoint', 'COUNTER_GET_URL'],
  ['global counter hit endpoint', 'COUNTER_HIT_URL'],
  ['counter increments on every throw', 'this.recordEggThrow();'],
  ['counter local fallback', 'anish_eggs_thrown_local_v1'],
  ['30-second story copy', '30-second restaurant-activation story'],
  ['non-restarting story copy', 'The story does not restart when you hit him'],
  ['story continues from same point', 'Math.max(this.storyResumeAt, this.now) + pauseMs'],
  ['clock 9:00', "value: '9:00 AM'"],
  ['clock 9:30', "value: '9:30 AM'"],
  ['clock 10:00', "value: '10:00 AM'"],
  ['clock 10:30', "value: '10:30 AM'"],
  ['clock 11:00', "value: '11:00 AM'"],
  ['clock 11:07', "value: '11:07 AM'"],
  ['cache-busted source', 'game.js?v=8.7.0'],
  ['counter colour', '#global-egg-count']
];

for (const [label, token] of checks) {
  const haystack = label.includes('loading') || label.includes('preparing') || label.includes('cache')
    ? `${index}\n${css}`
    : label.includes('noise') ? audio
      : label.includes('counter colour') ? css
        : game;
  if (!haystack.includes(token)) throw new Error(`Missing check: ${label}`);
}

assert.equal(packageJson.version, '8.7.0');
assert.equal(LEVEL_TWO_DURATION_MS, 13_000);
assert.equal(LEVEL_THREE_STORY_DURATION_MS, 30_000);
assert.equal(LEVEL_THREE_HITS_REQUIRED, 10);
assert.equal(LEVEL_THREE_HIT_PAUSE_MIN_MS, 1_000);
assert.equal(LEVEL_THREE_HIT_PAUSE_MAX_MS, 1_000);

// The cash deadline must be concealed from all user-facing source strings.
const userFacingSource = `${game}\n${index}\n${css}`;
assert.ok(!userFacingSource.includes('13 SECONDS'));
assert.ok(!userFacingSource.includes('13 seconds'));
assert.ok(!game.includes("toFixed(1)} SEC"), 'Cash screen must not show a numeric countdown');
assert.ok(!game.includes('You have 20 seconds'));
assert.ok(!game.includes('20 SECONDS · 5 HITS'));

assert.deepEqual(SHOT_PATTERNS.l1_play, {
  1: 'forceHit', 2: 'forceDodge', 4: 'forceDodge', 5: 'forceDodge'
});
assert.deepEqual(SHOT_PATTERNS.l2_play, {
  1: 'forceDodge', 4: 'forceDodge'
});
assert.deepEqual(SHOT_PATTERNS.l3_play, {
  1: 'forceDodge', 3: 'forceDodge', 7: 'forceDodge'
});

assert.deepEqual(
  [1, 2, 3, 4, 5, 6].map((n) => modeForAttempt('l1_play', n)),
  ['forceHit', 'forceDodge', 'normal', 'forceDodge', 'forceDodge', 'normal']
);
assert.deepEqual(
  [1, 2, 3, 4, 5].map((n) => modeForAttempt('l2_play', n)),
  ['forceDodge', 'normal', 'normal', 'forceDodge', 'normal']
);
assert.deepEqual(
  Array.from({ length: 10 }, (_, index) => modeForAttempt('l3_play', index + 1)),
  ['forceDodge', 'normal', 'forceDodge', 'normal', 'normal', 'normal', 'forceDodge', 'normal', 'normal', 'normal']
);

assert.ok(normalAssistFor('l1_play') < 0.1);
assert.ok(normalAssistFor('l2_play') < 0.05);
assert.ok(normalAssistFor('l3_play') <= 0.015);

const completion1 = game.indexOf('  completeLevel1() {');
const completion3 = game.indexOf('  completeLevel3() {');
const completion2 = game.indexOf('  completeLevel2() {');
const finalNote = game.indexOf('  showFinalNote() {');
assert.ok(completion1 > -1 && completion3 > -1 && completion2 > -1 && finalNote > -1);
assert.ok(
  game.slice(completion1, game.indexOf('  showLevel2Intro()', completion1)).includes('this.showLevel3Intro()'),
  'Level 1 must route to story Level 2'
);
assert.ok(
  game.slice(completion3, game.indexOf('  configureCharacter(', completion3)).includes('this.showLevel2Intro()'),
  'Story Level 2 must route to cash Level 3'
);
assert.ok(
  game.slice(completion2, finalNote).includes('this.showFinalNote()'),
  'Cash completion must route to a separate birthday note'
);

const storyHitStart = game.indexOf("} else if (this.state === 'l3_play') {", game.indexOf('registerHit('));
const storyHitEnd = game.indexOf('\n    }\n  }\n\n  addCharacterSplat', storyHitStart);
assert.ok(storyHitStart > -1 && storyHitEnd > storyHitStart, 'Could not isolate story hit branch');
const storyHitBranch = game.slice(storyHitStart, storyHitEnd);
assert.ok(!storyHitBranch.includes('this.storyProgress = 0'), 'Story must never restart on a hit');
assert.ok(storyHitBranch.includes('this.storyResumeAt = Math.max'), 'A hit must pause narration for one second');

console.log(
  `Validation passed: ${required.length} files, ${checks.length} feature checks, ` +
  'global egg counter, coherent story, hidden cash deadline, separate completion/final cards, and existing difficulty sequences.'
);
