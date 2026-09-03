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

for (const file of required) {
  await access(resolve(root, file));
}

const game = await readFile(resolve(root, 'src/game.js'), 'utf8');
const checks = [
  ['single-state Level 2 transition', "showLevel2Intro()"],
  ['Level 2 forced first duck', "!this.l2FirstDuckDone"],
  ['periodic Level 2 duck', "this.l2NextDuckAt"],
  ['Level 1 forced duck line', "YOU DIDN’T THINK IT WOULD BE THAT EASY"],
  ['slow 9:30 clock', "value: '9:30 AM'"],
  ['two bags', "ANOTHER BAG"],
  ['drunk story reset', "this.storyProgress = 0"],
  ['final Eternal copy', "your best decision in Eternal"]
];

for (const [label, token] of checks) {
  if (!game.includes(token)) throw new Error(`Missing check: ${label}`);
}

console.log(`Validation passed: ${required.length} files and ${checks.length} gameplay checks.`);
