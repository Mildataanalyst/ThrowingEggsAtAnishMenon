import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'index.html',
  'styles.css',
  'src/game.js',
  'src/audio.js',
  'public/assets/anish.png',
  'public/assets/stage-background.jpg',
  'public/favicon.svg',
  'public/manifest.webmanifest',
  'vercel.json'
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
  ['old-style thick sling outline', "ctx.lineWidth = 22"],
  ['old-style sling core', "ctx.lineWidth = 7"],
  ['old-style sling fork circles', 'ctx.arc(leftForkX, forkY, 12'],
  ['old-style impact noise', 'this.noise({ duration: 0.19'],
  ['impact flash', 'this.impactFlash = 0.19'],
  ['impact zoom', 'this.impactZoom = 1.022'],
  ['opening strong legacy dialogue', "OPENING STRONG AANU."],
  ['opening strong subline', 'reviews pending'],
  ['Level 1 fourth credible shot dodge', '[2, 4, 5].includes(credibleIndex)'],
  ['Level 2 fourth credible shot dodge', '[1, 4].includes(credibleIndex)'],
  ['Level 2 money dodge line', 'MONEY MAKES ME QUICK.'],
  ['office opens at 10:30', "value: '10:30 AM'"],
  ['work login at 11:07', "value: '11:07 AM'"],
  ['final birthday copy', 'your best decision in Eternal']
];

for (const [label, token] of checks) {
  const haystack = label.includes('loading') || label.includes('preparing') ? `${index}\n${css}`
    : label.includes('noise') ? audio
      : game;
  if (!haystack.includes(token)) throw new Error(`Missing check: ${label}`);
}

console.log(`Validation passed: ${required.length} files and ${checks.length} feature checks.`);
