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

const checks = [
  ['fullscreen request', 'requestFullscreen()'],
  ['portrait orientation lock', "screen.orientation.lock('portrait')"],
  ['preparing eggs loading screen', 'PREPARING EGGS'],
  ['old-style loading egg animation', 'loading-egg'],
  ['old-style thick sling outline', 'ctx.lineWidth = 22'],
  ['old-style sling core', 'ctx.lineWidth = 7'],
  ['old-style sling fork circles', 'ctx.arc(leftForkX, forkY, 12'],
  ['old-style impact noise', 'this.noise({ duration: 0.19'],
  ['impact flash', 'this.impactFlash = 0.19'],
  ['impact zoom', 'this.impactZoom = 1.022'],
  ['opening strong dialogue', 'OPENING STRONG AANU.'],
  ['opening strong subline', 'reviews pending'],
  ['mid-flight attempt promotion', 'promoteShotToThreat(shot)'],
  ['collision bypass closed', 'No actual collision can bypass the scripted order.'],
  ['strict Level 1 hitbox', 'rx = 44'],
  ['strict Level 2 hitbox', 'rx = 39'],
  ['strict Level 3 hitbox', 'rx = 40'],
  ['Level 2 hard deadline', 'this.l2DeadlineAt = this.now + LEVEL_TWO_DURATION_MS'],
  ['Level 2 money dodge line', 'MONEY MAKES ME QUICK.'],
  ['Level 3 ten-hit HUD', '10 HITS BEFORE THE STORY ENDS'],
  ['Level 3 ten-hit completion', 'this.l3Hits >= LEVEL_THREE_HITS_REQUIRED'],
  ['Level 3 interruption stacking', 'Math.max(this.storyResumeAt, this.now) + pauseMs'],
  ['Level 3 interrupted status', "'INTERRUPTED · ' + pauseSeconds.toFixed(1) + 'S'"],
  ['Level 3 story starts immediately', 'this.storyResumeAt = this.now;'],
  ['cache-busted source', 'game.js?v=8.5.0'],
  ['final birthday copy', 'Continue being this annoying.']
];
for (const [label, token] of checks) {
  const haystack = label.includes('loading') || label.includes('preparing') || label.includes('cache')
    ? `${index}\n${css}`
    : label.includes('noise') ? audio : game;
  if (!haystack.includes(token)) throw new Error(`Missing check: ${label}`);
}

assert.equal(LEVEL_TWO_DURATION_MS, 10_000);
assert.equal(LEVEL_THREE_STORY_DURATION_MS, 25_000);
assert.equal(LEVEL_THREE_HITS_REQUIRED, 10);
assert.equal(LEVEL_THREE_HIT_PAUSE_MIN_MS, 2_000);
assert.equal(LEVEL_THREE_HIT_PAUSE_MAX_MS, 3_000);

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
  [1, 2, 3, 4, 5, 6].map((index) => modeForAttempt('l1_play', index)),
  ['forceHit', 'forceDodge', 'normal', 'forceDodge', 'forceDodge', 'normal']
);
assert.deepEqual(
  [1, 2, 3, 4, 5].map((index) => modeForAttempt('l2_play', index)),
  ['forceDodge', 'normal', 'normal', 'forceDodge', 'normal']
);
assert.deepEqual(
  Array.from({ length: 10 }, (_, index) => modeForAttempt('l3_play', index + 1)),
  ['forceDodge', 'normal', 'forceDodge', 'normal', 'normal', 'normal', 'forceDodge', 'normal', 'normal', 'normal']
);

assert.ok(normalAssistFor('l1_play') < 0.1);
assert.ok(normalAssistFor('l2_play') < 0.05);
assert.ok(normalAssistFor('l3_play') <= 0.015);

const l3HitStart = game.indexOf("} else if (this.state === 'l3_play') {", game.indexOf('registerHit('));
const l3HitEnd = game.indexOf('\n    }\n  }\n\n  addCharacterSplat', l3HitStart);
assert.ok(l3HitStart > -1 && l3HitEnd > l3HitStart, 'Could not isolate Level 3 hit branch');
const l3HitBranch = game.slice(l3HitStart, l3HitEnd);
assert.ok(!l3HitBranch.includes('this.storyProgress = 0'), 'Level 3 hit must not restart the story');
assert.ok(l3HitBranch.includes('this.storyResumeAt = Math.max'), 'Every Level 3 hit must extend the interruption');

const l3UpdateStart = game.indexOf('  updateL3Play(dt) {');
const l3UpdateEnd = game.indexOf('\n  updateParticles(dt) {', l3UpdateStart);
assert.ok(l3UpdateStart > -1 && l3UpdateEnd > l3UpdateStart, 'Could not isolate Level 3 update loop');
const l3Update = game.slice(l3UpdateStart, l3UpdateEnd);
assert.ok(!l3Update.includes('this.triggerDuck('), 'Level 3 should have only the scripted 1st, 3rd and 7th dodges');
assert.ok(l3Update.includes('this.character.x += this.character.vx * dt'), 'Anish must keep moving while the story is paused');

console.log(
  `Validation passed: ${required.length} files, ${checks.length} feature checks, ` +
  'exact Level 1/2/3 shot sequences, ten-hit Level 3, and non-resetting 2–3 second interruptions.'
);
