import { SoundFX } from './audio.js';
import {
  LEVEL_THREE_HIT_PAUSE_MAX_MS,
  LEVEL_THREE_HIT_PAUSE_MIN_MS,
  LEVEL_THREE_HITS_REQUIRED,
  LEVEL_THREE_STORY_DURATION_MS,
  LEVEL_TWO_DURATION_MS,
  modeForAttempt,
  normalAssistFor
} from './difficulty.js';

window.__ANISH_GAME_VERSION__ = '8.5.0';

const W = 430;
const H = 780;
const COLORS = {
  ink: '#050505',
  warm: '#f5f0e6',
  warmDim: '#d8d2c7',
  graphite: '#8c8982',
  graphiteDark: '#343330',
  yellow: '#ffc929',
  yellowDeep: '#d5a317',
  red: '#d84a42',
  green: '#85d975'
};

const STORY = `Okay, so I went to this restaurant for an activation, right? We had a standee, a promoter, one extension board, three unnecessary opinions, and a QR code nobody scanned except a waiter who looked guilty for me. Then Anish said the real problem was brand visibility, but the actual tragedy was that he had still not reached the point. Anyway, the real story starts with the parking issue, then a detour into box office math, then a deeply avoidable note on margins.`;
const STORY_WORDS = STORY.split(/\s+/);
const INTERRUPTION_LINES = [
  'RUDE. WHERE WAS I?',
  'I AM STILL TELLING THIS STORY.',
  'ANYWAY, AS I WAS SAYING…',
  'YOU HAVE ONLY DELAYED THE POINT.',
  'I AM GETTING VERY ANGRY NOW.',
  'THE STORY IS NOT OVER.',
  'BRO, LET ME FINISH.',
  'THIS IS WHY CONTEXT MATTERS.',
  'YOU CANNOT SILENCE CINEMA.',
  'FINE. STORY OVER.'
];
const L3_STORY_DURATION = LEVEL_THREE_STORY_DURATION_MS;
const L3_DRUNK_DODGE_LINES = [
  'DRUNKENLY AVOIDED.',
  'I AM SWAYING, NOT LOSING.',
  'YOU CANNOT EGG PURE VIBES.'
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const rand = (min, max) => min + Math.random() * (max - min);

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

class EggGame {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.overlay = document.getElementById('overlay');
    this.card = document.getElementById('card');
    this.soundButton = document.getElementById('sound-toggle');
    this.loading = document.getElementById('loading');
    this.fatal = document.getElementById('fatal');
    this.sound = new SoundFX();

    this.state = 'loading';
    this.stateTime = 0;
    this.bootStartedAt = performance.now();
    this.now = this.bootStartedAt;
    this.lastFrame = this.now;
    this.running = false;

    this.assets = {};
    this.dragging = false;
    this.drag = { x: 0, y: 0 };
    this.pointerId = null;
    this.eggReady = false;
    this.activeShot = null;
    this.reloadAt = 0;
    this.freezeUntil = 0;
    this.shake = 0;
    this.impactFlash = 0;
    this.impactZoom = 1;
    this.impactZoomUntil = 0;
    this.impactToast = null;
    this.launcherRevealAt = 0;
    this.totalThrows = 0;
    this.soundUnlocked = false;

    this.sling = { x: 215, restY: 652, maxX: 94, maxY: 116 };
    this.character = {
      x: 215,
      y: 520,
      scale: 0.41,
      rotation: 0,
      alpha: 1,
      duck: 0,
      duckTarget: 0,
      duckUntil: 0,
      hit: 0,
      hitUntil: 0,
      walkPhase: 0,
      vx: 0,
      bags: false,
      briefcase: false,
      drink: false,
      anger: 0,
      blush: 0,
      hitDirection: 1
    };

    this.worldSplats = [];
    this.characterSplats = [];
    this.particles = [];
    this.trail = [];
    this.speech = null;
    this.tutorialUntil = 0;
    this.pendingCompleteAt = 0;
    this.clockFrame = { label: 'OFFICE OPENS', value: '9:30 AM' };
    this.lastClockIndex = -1;

    this.dust = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * 540,
      r: rand(0.5, 1.8),
      speed: rand(4, 10),
      phase: Math.random() * Math.PI * 2
    }));

    this.l1Hits = 0;
    this.l1Misses = 0;
    this.l1ScriptStage = 0;
    this.l1CredibleShots = 0;
    this.l1TargetX = 215;
    this.l1NextTurnAt = 0;

    this.l2Hits = 0;
    this.l2Progress = 0.02;
    this.l2FirstDuckDone = false;
    this.l2CredibleShots = 0;
    this.l2NextDuckAt = 0;
    this.l2TargetGlow = 0;
    this.l2StartedAt = 0;
    this.l2DeadlineAt = 0;
    this.l2Knockback = 0;

    this.l3Hits = 0;
    this.storyProgress = 0;
    this.storyResumeAt = 0;
    this.l3TargetX = 215;
    this.l3NextTurnAt = 0;
    this.l3NextDuckAt = 0;
    this.l3CredibleShots = 0;
    this.l3LastPauseMs = 0;

    this.soundButton.addEventListener('click', () => {
      this.sound.unlock();
      this.sound.muted = !this.sound.muted;
      this.soundButton.classList.toggle('muted', this.sound.muted);
      this.soundButton.textContent = this.sound.muted ? '×' : '♪';
      this.soundButton.setAttribute('aria-label', this.sound.muted ? 'Unmute sound' : 'Mute sound');
    });

    this.bindInput();
    this.syncViewport();
    window.addEventListener('resize', () => this.syncViewport(), { passive: true });
    window.visualViewport?.addEventListener('resize', () => this.syncViewport(), { passive: true });
  }

  async init() {
    try {
      [this.assets.anish, this.assets.stage] = await Promise.all([
        loadImage('./public/assets/anish.png'),
        loadImage('./public/assets/stage-background.jpg')
      ]);
      const minimumLoadingTime = 880;
      const elapsed = performance.now() - this.bootStartedAt;
      if (elapsed < minimumLoadingTime) {
        await new Promise((resolve) => window.setTimeout(resolve, minimumLoadingTime - elapsed));
      }
      this.loading.classList.add('hidden');
      this.running = true;
      this.resetCampaign();
      this.showHome();
      requestAnimationFrame((time) => this.loop(time));
      window.__ANISH_DEBUG__ = {
        state: () => this.state,
        go: (state) => this.debugGo(state),
        fireAtAnish: () => this.debugFireAtAnish(),
        snapshot: () => ({
          state: this.state,
          l1Hits: this.l1Hits,
          l1CredibleShots: this.l1CredibleShots,
          l2Hits: this.l2Hits,
          l2CredibleShots: this.l2CredibleShots,
          l3Hits: this.l3Hits,
          l3CredibleShots: this.l3CredibleShots,
          l3StoryProgressMs: Math.round(this.storyProgress),
          l3StoryPausedForMs: Math.max(0, Math.round(this.storyResumeAt - this.now)),
          shotMode: this.activeShot?.mode ?? null,
          shotIndex: this.activeShot?.credibleIndex ?? null,
          eggReady: this.eggReady,
          fullscreen: Boolean(document.fullscreenElement)
        })
      };
    } catch (error) {
      console.error(error);
      this.loading.classList.add('hidden');
      this.fatal.classList.add('visible');
    }
  }

  syncViewport() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight);
    const width = Math.round(viewport?.width || window.innerWidth);
    document.documentElement.style.setProperty('--app-height', `${height}px`);
    document.documentElement.style.setProperty('--app-width', `${width}px`);
  }


  requestFullscreen() {
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!document.fullscreenElement && request) {
      try {
        const result = request.call(root, { navigationUI: 'hide' });
        result?.catch?.(() => {});
      } catch {
        try { request.call(root); } catch {}
      }
    }
    if (screen.orientation?.lock) {
      screen.orientation.lock('portrait').catch(() => {});
    }
    document.body.classList.add('immersive');
    window.setTimeout(() => {
      window.scrollTo?.(0, 1);
      this.syncViewport();
    }, 120);
  }

  resetCampaign() {
    this.clearLevelVisuals();
    this.totalThrows = 0;
    this.pendingCompleteAt = 0;
    this.resetLauncher(false);
  }

  clearLevelVisuals() {
    this.worldSplats = [];
    this.characterSplats = [];
    this.particles = [];
    this.trail = [];
    this.speech = null;
    this.shake = 0;
    this.impactFlash = 0;
    this.impactZoom = 1;
    this.impactZoomUntil = 0;
    this.impactToast = null;
    this.freezeUntil = 0;
    this.pendingCompleteAt = 0;
  }

  showCard({ eyebrow = '', title, body = '', button, micro = '', compact = false, onClick }) {
    this.card.innerHTML = `
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1 class="${compact ? 'compact' : ''}">${title}</h1>
      ${body ? `<div class="body">${body}</div>` : ''}
      <button class="primary" type="button">${button}</button>
      ${micro ? `<div class="micro">${micro}</div>` : ''}
    `;
    const buttonElement = this.card.querySelector('.primary');
    buttonElement.addEventListener('click', () => {
      this.sound.unlock();
      onClick?.();
    }, { once: true });
    this.overlay.classList.add('visible');
    requestAnimationFrame(() => buttonElement.focus({ preventScroll: true }));
  }

  hideCard() {
    this.overlay.classList.remove('visible');
  }

  showHome() {
    this.state = 'home';
    this.stateTime = 0;
    this.configureCharacter({ x: 214, y: 535, scale: 0.39, rotation: -0.03, alpha: 1 });
    this.showCard({
      title: 'THROW EGGS<br>AT ANISH MENON',
      button: 'START THROWING',
      onClick: () => {
        this.requestFullscreen();
        this.startLevel1Clock();
      }
    });
  }

  startLevel1Clock() {
    this.hideCard();
    this.state = 'l1_clock';
    this.stateTime = 0;
    this.lastClockIndex = -1;
    this.l1Hits = 0;
    this.l1Misses = 0;
    this.l1ScriptStage = 0;
    this.l1CredibleShots = 0;
    this.clearLevelVisuals();
    this.configureCharacter({ x: -125, y: 520, scale: 0.41, rotation: 0, alpha: 0 });
    this.resetLauncher(false);
  }

  showLevel1Intro() {
    this.state = 'l1_intro';
    this.stateTime = 0;
    this.showCard({
      eyebrow: 'LEVEL 1',
      title: 'ANISH HAS CLOCKED IN.',
      compact: true,
      body: 'It is 11:07. He has entered dramatically, carrying two bags and no urgency.<br><strong>He will spend his time loafing around instead of working. Now is an excellent time to throw eggs at his face.</strong>',
      button: 'START LEVEL 1',
      onClick: () => this.startLevel1Play()
    });
  }

  startLevel1Play() {
    this.hideCard();
    this.state = 'l1_play';
    this.stateTime = 0;
    this.clearLevelVisuals();
    this.configureCharacter({ x: 215, y: 520, scale: 0.41, rotation: 0, alpha: 1 });
    this.character.bags = false;
    this.l1CredibleShots = 0;
    this.launcherRevealAt = this.now;
    this.l1TargetX = rand(140, 292);
    this.l1NextTurnAt = this.now + 1350;
    this.eggReady = true;
    this.tutorialUntil = this.now + 3300;
  }

  completeLevel1() {
    if (this.state === 'l1_complete') return;
    this.state = 'l1_complete';
    this.activeShot = null;
    this.eggReady = false;
    this.sound.success();
    this.showCard({
      eyebrow: 'LEVEL 1 COMPLETE',
      title: 'OFFICE ENTRY<br>SUCCESSFULLY RUINED.',
      compact: true,
      body: `Beautiful. He has reached office and immediately been welcomed correctly.<br><br>Now stop him from doing the only thing he truly respects: <strong>reaching money.</strong>`,
      button: 'LEVEL 2',
      onClick: () => this.showLevel2Intro()
    });
  }

  showLevel2Intro() {
    this.state = 'l2_intro';
    this.stateTime = 0;
    this.clearLevelVisuals();
    this.configureCharacter({ x: 68, y: 520, scale: 0.345, rotation: 0.05, alpha: 1 });
    this.character.briefcase = true;
    this.showCard({
      eyebrow: 'LEVEL 2',
      title: 'CAPITAL HAS BEEN<br>SPOTTED.',
      compact: true,
      body: 'He has locked onto a nearby pile of money like it whispered “incentive” in his ear.<br><strong>You have 10 seconds. Hit him 5 times before he reaches the cash.</strong>',
      button: 'BLOCK THE CASH',
      micro: '10 SECONDS · FASTER MOVEMENT · HE DODGES A LOT',
      onClick: () => this.startLevel2()
    });
  }

  startLevel2() {
    this.hideCard();
    this.state = 'l2_play';
    this.stateTime = 0;
    this.clearLevelVisuals();
    this.l2Hits = 0;
    this.l2Progress = 0;
    this.l2FirstDuckDone = false;
    this.l2CredibleShots = 0;
    this.l2NextDuckAt = this.now + 1050;
    this.l2TargetGlow = 0;
    this.l2StartedAt = this.now;
    this.l2DeadlineAt = this.now + LEVEL_TWO_DURATION_MS;
    this.l2Knockback = 0;
    this.configureCharacter({ x: 68, y: 520, scale: 0.345, rotation: 0.04, alpha: 1 });
    this.character.briefcase = true;
    this.launcherRevealAt = this.now;
    this.eggReady = true;
    this.tutorialUntil = this.now + 2500;
  }

  failLevel2() {
    if (this.state !== 'l2_play') return;
    this.state = 'l2_fail';
    this.activeShot = null;
    this.eggReady = false;
    this.sound.fail();
    this.showCard({
      eyebrow: 'TOO LATE',
      title: 'THE CAPITALIST<br>PREVAILED.',
      body: 'He reached the money. Disappointing, but on brand.',
      button: 'TRY AGAIN',
      onClick: () => this.startLevel2()
    });
  }

  completeLevel2() {
    if (this.state === 'l2_complete') return;
    this.state = 'l2_complete';
    this.activeShot = null;
    this.eggReady = false;
    this.sound.success();
    this.showCard({
      eyebrow: 'LEVEL 2 COMPLETE',
      title: 'CASH DELAYED.',
      body: 'Not denied. Merely delayed. He remains spiritually committed to cash.',
      button: 'FINAL LEVEL',
      onClick: () => this.showLevel3Intro()
    });
  }

  showLevel3Intro() {
    this.state = 'l3_intro';
    this.stateTime = 0;
    this.clearLevelVisuals();
    this.configureCharacter({ x: 215, y: 558, scale: 0.355, rotation: -0.04, alpha: 1 });
    this.character.drink = true;
    this.showCard({
      eyebrow: 'LEVEL 3',
      title: 'HE HAS HAD<br>TWO DRINKS.',
      compact: true,
      body: 'Now he wants to tell a long activation story nobody asked for, needed, or consented to.<br><strong>Hit him 10 times before the 25-second story ends. Every hit interrupts him for 2–3 seconds, but he resumes from the same point.</strong>',
      button: 'SAVE THE AUDIENCE',
      micro: '10 HITS · STORY PAUSES, NEVER RESTARTS',
      onClick: () => this.startLevel3()
    });
  }

  startLevel3() {
    this.hideCard();
    this.state = 'l3_play';
    this.stateTime = 0;
    this.clearLevelVisuals();
    this.l3Hits = 0;
    this.l3CredibleShots = 0;
    this.l3LastPauseMs = 0;
    this.storyProgress = 0;
    this.storyResumeAt = this.now;
    this.l3TargetX = 215;
    this.l3NextTurnAt = this.now + 760;
    this.l3NextDuckAt = 0;
    this.configureCharacter({ x: 215, y: 558, scale: 0.355, rotation: -0.04, alpha: 1 });
    this.character.drink = true;
    this.character.anger = 0;
    this.character.blush = 0;
    this.launcherRevealAt = this.now;
    this.eggReady = true;
    this.tutorialUntil = this.now + 2100;
  }

  failLevel3() {
    if (this.state !== 'l3_play') return;
    this.state = 'l3_fail';
    this.activeShot = null;
    this.eggReady = false;
    this.sound.fail();
    this.showCard({
      eyebrow: '25 SECONDS LATER',
      title: 'HE FINISHED<br>THE STORY.',
      body: 'Several audience members fell asleep on impact.',
      button: 'TRY AGAIN',
      onClick: () => this.startLevel3()
    });
  }

  completeLevel3() {
    if (this.state === 'final') return;
    this.state = 'final';
    this.activeShot = null;
    this.eggReady = false;
    this.sound.success();
    this.showCard({
      eyebrow: 'FINAL NOTE',
      title: 'HAPPY BIRTHDAY,<br>ANISH MENON.',
      compact: true,
      body: 'Here’s to another year of coming to office at 11 a.m., watching a hundred movies and pretending it’s work, loafing around — and continuing your friendship with Milan, your best decision in Eternal.<br><br><strong>Continue being this annoying.</strong> If you want to continue throwing eggs at him, press play again.',
      button: 'PLAY AGAIN',
      onClick: () => {
        this.resetCampaign();
        this.showHome();
      }
    });
  }

  configureCharacter({ x, y, scale, rotation = 0, alpha = 1 }) {
    Object.assign(this.character, {
      x, y, scale, rotation, alpha,
      duck: 0,
      duckTarget: 0,
      duckUntil: 0,
      hit: 0,
      hitUntil: 0,
      walkPhase: 0,
      vx: 0,
      bags: false,
      briefcase: false,
      drink: false,
      anger: 0,
      blush: 0,
      hitDirection: 1
    });
  }

  bindInput() {
    const position = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (W / rect.width),
        y: (event.clientY - rect.top) * (H / rect.height)
      };
    };

    this.canvas.addEventListener('pointerdown', (event) => {
      if (!this.isPlaying() || !this.eggReady || this.activeShot) return;
      const p = position(event);
      const eggX = this.sling.x + this.drag.x;
      const eggY = this.sling.restY + this.drag.y;
      if (Math.hypot(p.x - eggX, p.y - eggY) > 88) return;
      this.sound.unlock();
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging || event.pointerId !== this.pointerId) return;
      const p = position(event);
      this.drag.x = clamp(p.x - this.sling.x, -this.sling.maxX, this.sling.maxX);
      this.drag.y = clamp(p.y - this.sling.restY, 0, this.sling.maxY);
      this.sound.stretch(this.pullStrength());
      event.preventDefault();
    }, { passive: false });

    const release = (event) => {
      if (!this.dragging || event.pointerId !== this.pointerId) return;
      this.dragging = false;
      this.pointerId = null;
      const strength = this.pullStrength();
      if (strength < 0.16) {
        this.drag.x = 0;
        this.drag.y = 0;
        return;
      }
      this.releaseShot();
      event.preventDefault();
    };

    this.canvas.addEventListener('pointerup', release, { passive: false });
    this.canvas.addEventListener('pointercancel', release, { passive: false });
  }

  isPlaying() {
    return this.state === 'l1_play' || this.state === 'l2_play' || this.state === 'l3_play';
  }

  pullStrength() {
    return clamp(Math.hypot(this.drag.x * 0.56, this.drag.y) / this.sling.maxY, 0, 1);
  }

  makeShotGeometry() {
    const strength = this.pullStrength();
    const startX = this.sling.x + this.drag.x;
    const startY = this.sling.restY + this.drag.y;
    const endX = clamp(this.sling.x - this.drag.x * (2.18 + strength * 0.48), 24, W - 24);
    const endY = clamp(this.sling.restY - this.drag.y * (2.52 + strength * 0.44), 165, 565);
    const controlX = (startX + endX) * 0.5;
    const controlY = Math.min(startY - 128 - strength * 52, endY - 72);
    return { strength, startX, startY, endX, endY, controlX, controlY };
  }

  characterHitbox() {
    const c = this.character;
    let centerY;
    let rx;
    let ry;
    if (this.state === 'l2_play') {
      centerY = c.y - 120;
      rx = 39;
      ry = 80;
    } else if (this.state === 'l3_play') {
      centerY = c.y - 140;
      rx = 40;
      ry = 86;
    } else {
      centerY = c.y - 148;
      rx = 44;
      ry = 96;
    }

    if (c.duck > 0.35) {
      centerY += 76 * c.duck;
      ry *= lerp(1, 0.36, c.duck);
      rx *= lerp(1, 1.05, c.duck);
    }
    return { x: c.x, y: centerY, rx, ry };
  }

  pointOnPath(shot, t, endOverride = null) {
    const endX = endOverride?.x ?? shot.endX;
    const endY = endOverride?.y ?? shot.endY;
    const inv = 1 - t;
    return {
      x: inv * inv * shot.startX + 2 * inv * t * shot.controlX + t * t * endX,
      y: inv * inv * shot.startY + 2 * inv * t * shot.controlY + t * t * endY
    };
  }

  aimQuality(geometry) {
    const hitbox = this.characterHitbox();
    let best = Infinity;
    for (let i = 6; i <= 32; i += 1) {
      const t = i / 32;
      const point = this.pointOnPath(geometry, t);
      const norm = Math.sqrt(
        Math.pow((point.x - hitbox.x) / (hitbox.rx * 1.75), 2) +
        Math.pow((point.y - hitbox.y) / (hitbox.ry * 1.55), 2)
      );
      best = Math.min(best, norm);
    }
    return best;
  }

  determineShotMode(threatening, attemptIndex = 0) {
    if (!threatening) return 'normal';
    return modeForAttempt(this.state, attemptIndex);
  }

  nextThreatAttemptIndex() {
    if (this.state === 'l1_play') return ++this.l1CredibleShots;
    if (this.state === 'l2_play') return ++this.l2CredibleShots;
    if (this.state === 'l3_play') return ++this.l3CredibleShots;
    return 0;
  }

  promoteShotToThreat(shot) {
    if (!shot || shot.credibleIndex > 0) return shot?.mode ?? 'normal';
    const attemptIndex = this.nextThreatAttemptIndex();
    shot.credible = true;
    shot.credibleIndex = attemptIndex;
    shot.mode = this.determineShotMode(true, attemptIndex);
    shot.assist = shot.mode === 'forceHit'
      ? 1
      : shot.mode === 'forceDodge'
        ? 0.18
        : normalAssistFor(this.state);
    return shot.mode;
  }

  releaseShot() {
    const geometry = this.makeShotGeometry();
    const quality = this.aimQuality(geometry);
    const threatening = geometry.strength >= 0.28 && quality <= 1;

    const shot = {
      ...geometry,
      elapsed: 0,
      duration: lerp(640, 470, geometry.strength),
      mode: 'normal',
      credible: false,
      credibleIndex: 0,
      quality,
      assist: 0,
      dodgeTriggered: false
    };

    if (threatening) this.promoteShotToThreat(shot);

    this.activeShot = shot;
    this.eggReady = false;
    this.dragging = false;
    this.totalThrows += 1;
    this.drag.x = 0;
    this.drag.y = 0;
    this.sound.launch();
  }

  triggerDuck(duration = 640, line = null) {
    this.character.duckTarget = 1;
    this.character.duckUntil = Math.max(this.character.duckUntil, this.now + duration);
    this.sound.dodge();
    if (line) this.showSpeech(line, 1800);
  }

  triggerScriptedDodge(shot) {
    if (!shot || shot.dodgeTriggered) return;
    shot.dodgeTriggered = true;

    if (this.state === 'l1_play') {
      const line = shot.credibleIndex === 2
        ? 'YOU DIDN’T THINK IT WOULD BE THAT EASY, DID YOU?'
        : shot.credibleIndex === 4
          ? 'NOT IN THE MEDIA PLAN.'
          : 'HAPPY BIRTHDAY TO ME.';
      this.triggerDuck(760, line);
      return;
    }

    if (this.state === 'l2_play') {
      const line = shot.credibleIndex === 1 ? 'MONEY MAKES ME QUICK.' : 'THE MARGIN MADE ME MOVE.';
      this.triggerDuck(720, line);
      this.l2FirstDuckDone = true;
      this.l2NextDuckAt = this.now + rand(900, 1450);
      return;
    }

    if (this.state === 'l3_play') {
      const line = L3_DRUNK_DODGE_LINES[Math.floor(Math.random() * L3_DRUNK_DODGE_LINES.length)];
      this.triggerDuck(700, line);
    }
  }

  updateShot(dt) {
    const shot = this.activeShot;
    if (!shot) {
      if (!this.eggReady && this.reloadAt && this.now >= this.reloadAt && this.isPlaying()) {
        this.resetLauncher(true);
      }
      return;
    }

    shot.elapsed += dt * 1000;
    const t = clamp(shot.elapsed / shot.duration, 0, 1);
    const strict = this.characterHitbox();

    // Any egg genuinely entering Anish's vicinity becomes a scripted attempt.
    // This closes the previous loophole: a throw could be judged "not credible"
    // on release, then still touch the oversized hitbox and bypass a forced dodge.
    const rawPoint = this.pointOnPath(shot, t);
    const warningNorm = Math.pow((rawPoint.x - strict.x) / (strict.rx * 1.72), 2) +
      Math.pow((rawPoint.y - strict.y) / (strict.ry * 1.52), 2);
    if (shot.credibleIndex === 0 && t >= 0.18 && warningNorm <= 1) {
      this.promoteShotToThreat(shot);
    }

    if (shot.mode === 'forceDodge' && !shot.dodgeTriggered && (t >= 0.43 || warningNorm <= 0.56)) {
      this.triggerScriptedDodge(shot);
    }

    const hitbox = this.characterHitbox();
    const liveTarget = { x: hitbox.x, y: hitbox.y };
    let blend = 0;
    if (shot.assist > 0 && t > 0.42) {
      const local = clamp((t - 0.42) / 0.58, 0, 1);
      blend = easeInOut(local) * shot.assist;
    }
    const end = {
      x: lerp(shot.endX, liveTarget.x, blend),
      y: lerp(shot.endY, liveTarget.y, blend)
    };
    const point = this.pointOnPath(shot, t, end);
    shot.x = point.x;
    shot.y = point.y;
    shot.angle = t * 760;

    if (this.trail.length === 0 || this.now - this.trail[this.trail.length - 1].born > 34) {
      this.trail.push({ x: point.x, y: point.y, born: this.now, life: 220 });
    }

    if (t > 0.20) {
      const current = this.characterHitbox();
      const norm = Math.pow((point.x - current.x) / current.rx, 2) +
        Math.pow((point.y - current.y) / current.ry, 2);

      if (norm <= 1) {
        // No actual collision can bypass the scripted order.
        if (shot.credibleIndex === 0) this.promoteShotToThreat(shot);
        if (shot.mode === 'forceDodge') {
          this.triggerScriptedDodge(shot);
        } else {
          this.registerHit(point.x, point.y, shot);
          return;
        }
      }

      if (shot.mode === 'forceHit' && t > 0.78) {
        this.registerHit(current.x, current.y, shot);
        return;
      }
    }

    if (shot.mode === 'forceDodge' && shot.dodgeTriggered && t >= 0.78) {
      this.finishShotAsMiss(point.x, point.y, shot, true);
      return;
    }

    if (t >= 1) {
      this.finishShotAsMiss(point.x, point.y, shot, false);
    }
  }

  registerHit(x, y, shot) {
    this.activeShot = null;
    this.reloadAt = this.now + 300;
    this.character.hit = 1;
    this.character.hitDirection = x >= this.character.x ? -1 : 1;
    this.character.hitUntil = this.now + 510;
    this.freezeUntil = this.now + 74;
    this.shake = 9;
    this.impactFlash = 0.19;
    this.impactZoom = 1.022;
    this.impactZoomUntil = this.now + 100;
    this.sound.splat();
    navigator.vibrate?.([18, 12, 28]);
    this.impactToast = {
      text: y < this.character.y - 105 ? 'FACE HIT' : 'DIRECT HIT',
      x,
      y: Math.max(108, y - 72),
      born: this.now,
      until: this.now + 430
    };
    this.createImpact(x, y, true);
    this.addCharacterSplat();

    if (this.state === 'l1_play') {
      this.l1Hits += 1;
      if (shot.mode === 'forceHit' && this.l1ScriptStage === 0) this.l1ScriptStage = 1;
      const lines = ['OPENING STRONG AANU.', 'THIS IS ABUSE DISGUISED AS FRIENDSHIP.', 'WE CAN STILL POSITION THIS AS BRANDING.', 'YOU PEOPLE ARE DEEPLY JOBLESS.', 'HAPPY BIRTHDAY TO ME.'];
      if (this.l1Hits === 1) {
        this.showSpeech('OPENING STRONG AANU.', 1180, { sub: 'reviews pending', legacy: true });
      } else {
        this.showSpeech(lines[Math.min(this.l1Hits - 1, lines.length - 1)], 1180);
      }
      if (this.l1Hits >= 5) this.pendingCompleteAt = this.now + 820;
    } else if (this.state === 'l2_play') {
      this.l2Hits += 1;
      this.l2Knockback = Math.min(42, this.l2Knockback + 28);
      this.l2TargetGlow = 1;
      this.l2NextDuckAt = this.now + rand(800, 1250);
      const lines = ['THAT CASH HAD CHOSEN ME.', 'LET ME JUST REACH THE MONEY ONCE.', 'THIS IS ANTI-GROWTH BEHAVIOUR.', 'YOU HAVE NO RESPECT FOR CAPITAL FORMATION.', 'I COULD ALREADY TASTE THE MARGIN.'];
      this.showSpeech(lines[(this.l2Hits - 1) % lines.length], 1240);
      if (this.l2Hits >= 5) this.pendingCompleteAt = this.now + 860;
    } else if (this.state === 'l3_play') {
      this.l3Hits += 1;
      const pauseMs = Math.round(rand(
        LEVEL_THREE_HIT_PAUSE_MIN_MS,
        LEVEL_THREE_HIT_PAUSE_MAX_MS
      ));
      this.l3LastPauseMs = pauseMs;
      this.storyResumeAt = Math.max(this.storyResumeAt, this.now) + pauseMs;
      this.character.anger = Math.min(1, this.character.anger + 0.11);
      this.character.blush = Math.min(1, this.character.blush + 0.13);
      const line = INTERRUPTION_LINES[Math.min(this.l3Hits - 1, INTERRUPTION_LINES.length - 1)];
      this.showSpeech(line, this.l3Hits >= LEVEL_THREE_HITS_REQUIRED ? 1120 : 1450);
      if (this.l3Hits >= LEVEL_THREE_HITS_REQUIRED) this.pendingCompleteAt = this.now + 1050;
    }
  }

  addCharacterSplat() {
    const anchors = [
      { x: 212, y: 216, r: 28 },
      { x: 183, y: 411, r: 23 },
      { x: 251, y: 377, r: 21 },
      { x: 205, y: 492, r: 23 },
      { x: 238, y: 281, r: 18 },
      { x: 227, y: 342, r: 20 }
    ];
    const base = anchors[this.characterSplats.length % anchors.length];
    this.characterSplats.push({ ...base, alpha: 0.8, seed: Math.random() * Math.PI * 2 });
  }

  finishShotAsMiss(x, y, shot, dodged) {
    this.activeShot = null;
    this.reloadAt = this.now + (dodged ? 190 : 240);
    this.createImpact(x, y, false);
    if (this.state === 'l1_play' && !dodged) {
      this.l1Misses += 1;
      if (this.l1Misses === 2) this.showSpeech('EXCELLENT TARGETING.', 1100);
    }
  }

  resetLauncher(ready = true) {
    this.activeShot = null;
    this.dragging = false;
    this.drag.x = 0;
    this.drag.y = 0;
    this.reloadAt = 0;
    this.eggReady = ready;
  }

  createImpact(x, y, characterHit) {
    if (!characterHit) {
      this.worldSplats.push({ x, y, r: rand(14, 24), alpha: 0.68, seed: Math.random() * Math.PI * 2 });
      if (this.worldSplats.length > 36) this.worldSplats.shift();
    }
    for (let i = 0; i < 18; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(46, 160);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(25, 80),
        life: rand(420, 760),
        born: this.now,
        r: rand(2, 6),
        shell: i >= 11
      });
    }
  }

  showSpeech(text, duration = 1400, { sub = '', legacy = false } = {}) {
    this.speech = {
      text,
      sub,
      legacy,
      born: this.now,
      duration,
      until: this.now + duration
    };
  }

  updateCharacterAnimation(dt) {
    const c = this.character;
    if (this.now > c.duckUntil) c.duckTarget = 0;
    c.duck += (c.duckTarget - c.duck) * Math.min(1, dt * 13);
    if (this.now > c.hitUntil) c.hit = Math.max(0, c.hit - dt * 4.6);
    if (this.now > this.freezeUntil) c.walkPhase += dt * (2.0 + Math.abs(c.vx) * 0.055);
    c.blush = Math.max(0, c.blush - dt * 0.22);
  }

  updateL1Clock() {
    const times = [
      { at: 0, label: 'OFFICE OPENS', value: '10:30 AM' },
      { at: 2900, label: 'WORK LOGIN', value: '11:07 AM' }
    ];
    let index = 0;
    for (let i = 0; i < times.length; i += 1) {
      if (this.stateTime >= times[i].at) index = i;
    }
    this.clockFrame = times[index];
    if (index !== this.lastClockIndex) {
      this.lastClockIndex = index;
      this.sound.tick();
    }
    if (this.stateTime >= 5200) {
      this.state = 'l1_walk';
      this.stateTime = 0;
      this.configureCharacter({ x: -118, y: 520, scale: 0.41, rotation: 0, alpha: 1 });
      this.character.bags = true;
    }
  }

  updateL1Walk() {
    const walkEnd = 3100;
    if (this.stateTime < walkEnd) {
      const p = easeOutCubic(clamp(this.stateTime / walkEnd, 0, 1));
      const previousX = this.character.x;
      this.character.x = lerp(-118, 210, p);
      this.character.vx = (this.character.x - previousX) * 60;
    } else {
      this.character.x = 210;
      this.character.vx = 0;
    }
    if (this.stateTime >= 5100) this.showLevel1Intro();
  }

  updateL1Play(dt) {
    if (this.now < this.freezeUntil) return;
    if (this.now >= this.l1NextTurnAt) {
      this.l1TargetX = rand(112, 318);
      this.l1NextTurnAt = this.now + rand(760, 1280);
    }
    const speed = 66 + this.l1Hits * 9;
    const dx = this.l1TargetX - this.character.x;
    this.character.vx = clamp(dx * 2.0, -speed, speed);
    this.character.x += this.character.vx * dt;
    this.character.rotation = clamp(this.character.vx / 760, -0.075, 0.075);
    if (this.pendingCompleteAt && this.now >= this.pendingCompleteAt) {
      this.pendingCompleteAt = 0;
      this.completeLevel1();
    }
  }

  updateL2Play(dt) {
    if (this.now < this.freezeUntil) return;

    const elapsed = Math.max(0, this.now - this.l2StartedAt);
    this.l2Progress = clamp(elapsed / LEVEL_TWO_DURATION_MS, 0, 1);
    this.l2Knockback = Math.max(0, this.l2Knockback - dt * 38);
    this.character.x = lerp(66, 355, this.l2Progress) - this.l2Knockback;
    this.character.vx = 48;
    this.character.rotation = 0.04 + Math.sin(this.stateTime * 0.009) * 0.02;
    this.l2TargetGlow = Math.max(0, this.l2TargetGlow - dt * 2.2);

    if (this.l2FirstDuckDone && this.now >= this.l2NextDuckAt && this.character.duck < 0.12 && !this.activeShot) {
      const lines = ['NOT THIS TIME.', 'NICE TRY, BROKE BOY.', 'THE MONEY NEEDS ME MORE.', 'YOU CANNOT OUTTHROW GREED.'];
      const line = lines[Math.floor(Math.random() * lines.length)];
      this.triggerDuck(520, line);
      this.l2NextDuckAt = this.now + rand(800, 1300);
    }

    if (this.now >= this.l2DeadlineAt || this.l2Progress >= 1) {
      this.failLevel2();
      return;
    }

    if (this.pendingCompleteAt && this.now >= this.pendingCompleteAt) {
      this.pendingCompleteAt = 0;
      this.completeLevel2();
    }
  }

  updateL3Play(dt) {
    if (this.now < this.freezeUntil) return;
    if (this.now >= this.l3NextTurnAt) {
      this.l3TargetX = rand(114, 316);
      this.l3NextTurnAt = this.now + rand(360, 720);
    }
    const dx = this.l3TargetX - this.character.x;
    this.character.vx = clamp(dx * 3.5, -142, 142);
    this.character.x += this.character.vx * dt;
    this.character.rotation = Math.sin(this.stateTime * 0.0062) * 0.14 +
      Math.sin(this.stateTime * 0.020) * 0.065;
    this.character.y = 558 + Math.sin(this.stateTime * 0.0082) * 15;

    // A hit pauses only the narration. Anish keeps drunkenly moving, and once
    // the pause ends he resumes from the exact word where he was interrupted.
    if (this.now >= this.storyResumeAt) this.storyProgress += dt * 1000;

    if (this.storyProgress >= L3_STORY_DURATION) {
      this.storyProgress = L3_STORY_DURATION;
      this.failLevel3();
      return;
    }

    if (this.pendingCompleteAt && this.now >= this.pendingCompleteAt) {
      this.pendingCompleteAt = 0;
      this.completeLevel3();
    }
  }

  updateParticles(dt) {
    this.particles = this.particles.filter((particle) => {
      const age = this.now - particle.born;
      if (age >= particle.life) return false;
      particle.vy += 260 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      return true;
    });
    this.trail = this.trail.filter((point) => this.now - point.born < point.life);
  }

  update(dt) {
    this.stateTime += dt * 1000;
    this.updateCharacterAnimation(dt);
    this.updateShot(dt);
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 32);
    this.impactFlash = Math.max(0, this.impactFlash - dt * 1.9);
    const zoomTarget = this.now < this.impactZoomUntil ? 1.022 : 1;
    this.impactZoom += (zoomTarget - this.impactZoom) * Math.min(1, dt * 18);
    if (this.speech && this.now >= this.speech.until) this.speech = null;
    if (this.impactToast && this.now >= this.impactToast.until) this.impactToast = null;

    for (const particle of this.dust) {
      particle.y += particle.speed * dt;
      particle.x += Math.sin(this.now * 0.0005 + particle.phase) * dt * 2;
      if (particle.y > 560) {
        particle.y = -5;
        particle.x = Math.random() * W;
      }
    }

    switch (this.state) {
      case 'l1_clock': this.updateL1Clock(); break;
      case 'l1_walk': this.updateL1Walk(); break;
      case 'l1_play': this.updateL1Play(dt); break;
      case 'l2_play': this.updateL2Play(dt); break;
      case 'l3_play': this.updateL3Play(dt); break;
      default: break;
    }
  }

  drawStagePosters(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(245,240,230,.08)';
    ctx.font = '900 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAN-SOUTH', 326, 132);
    ctx.fillText('STRATEGY', 326, 146);
    ctx.strokeStyle = 'rgba(245,240,230,.10)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(286, 152);
    ctx.lineTo(254, 166);
    ctx.lineTo(262, 158);
    ctx.moveTo(254, 166);
    ctx.lineTo(264, 173);
    ctx.stroke();
    ctx.restore();
  }

  drawBackgroundStage(ctx) {
    ctx.drawImage(this.assets.stage, 0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.fillRect(0, 0, W, H);

    const centreGlow = ctx.createRadialGradient(215, 315, 16, 215, 330, 280);
    centreGlow.addColorStop(0, 'rgba(245,240,230,.075)');
    centreGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = centreGlow;
    ctx.fillRect(0, 80, W, 560);

    ctx.fillStyle = 'rgba(245,240,230,.15)';
    for (const dust of this.dust) {
      ctx.globalAlpha = 0.06 + dust.r * 0.04;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.drawStagePosters(ctx);
  }

  drawBackgroundMoney(ctx) {
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, W, H);

    const cityGlow = ctx.createLinearGradient(0, 0, 0, H);
    cityGlow.addColorStop(0, 'rgba(255,255,255,.015)');
    cityGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cityGlow;
    ctx.fillRect(0, 0, W, H);

    const gridGlow = ctx.createRadialGradient(352, 410, 10, 352, 410, 210);
    gridGlow.addColorStop(0, 'rgba(255,201,41,.22)');
    gridGlow.addColorStop(0.45, 'rgba(255,201,41,.075)');
    gridGlow.addColorStop(1, 'rgba(255,201,41,0)');
    ctx.fillStyle = gridGlow;
    ctx.fillRect(150, 150, 280, 380);

    ctx.strokeStyle = 'rgba(245,240,230,.055)';
    ctx.lineWidth = 1;
    for (let y = 84; y < 604; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 32; x < W; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 84);
      ctx.lineTo(x, 604);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(245,240,230,.05)';
    roundedRect(ctx, 20, 22, 146, 26, 10); ctx.fill();
    roundedRect(ctx, 270, 22, 140, 26, 10); ctx.fill();
    ctx.fillStyle = 'rgba(245,240,230,.58)';
    ctx.font = '800 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CAPITAL PURSUIT', 93, 39);
    ctx.fillText('NET WORTH SENSED', 340, 39);

    const remainingMs = this.state === 'l2_play'
      ? Math.max(0, this.l2DeadlineAt - this.now)
      : LEVEL_TWO_DURATION_MS;
    ctx.fillStyle = 'rgba(5,5,5,.74)';
    roundedRect(ctx, 166, 58, 98, 38, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,201,41,.34)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = COLORS.yellow;
    ctx.font = '900 17px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${(remainingMs / 1000).toFixed(1)} SEC`, W / 2, 83);

    ctx.fillStyle = 'rgba(245,240,230,.045)';
    roundedRect(ctx, 26, 108, 118, 74, 12); ctx.fill();
    roundedRect(ctx, 26, 198, 118, 74, 12); ctx.fill();
    ctx.fillStyle = 'rgba(245,240,230,.72)';
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MONEY RADAR', 40, 131);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText('LOCKED', 40, 155);
    ctx.fillStyle = 'rgba(245,240,230,.72)';
    ctx.fillText('ETHICS', 40, 221);
    ctx.fillStyle = '#88847d';
    ctx.fillText('OPTIONAL', 40, 245);

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = COLORS.warm;
    ctx.font = '900 22px ui-monospace, monospace';
    ctx.fillText('₹', 196, 122);
    ctx.fillText('₹', 230, 154);
    ctx.fillText('₹', 328, 174);
    ctx.fillText('₹', 356, 148);
    ctx.restore();

    const y = 528;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(245,240,230,.18)';
    ctx.beginPath();
    ctx.moveTo(62, y);
    ctx.lineTo(366, y);
    ctx.stroke();

    ctx.strokeStyle = COLORS.yellow;
    ctx.shadowColor = 'rgba(255,201,41,.35)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(62, y);
    ctx.lineTo(lerp(62, 366, this.l2Progress), y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i <= 5; i += 1) {
      const x = lerp(62, 366, i / 5);
      ctx.fillStyle = i / 5 <= this.l2Progress ? COLORS.yellow : '#222220';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawMoneyPile(ctx, 366, 492);
  }

  drawBackgroundBar(ctx) {
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, W, H);

    const stageGlow = ctx.createRadialGradient(215, 328, 12, 215, 350, 290);
    stageGlow.addColorStop(0, 'rgba(245,240,230,.11)');
    stageGlow.addColorStop(0.55, 'rgba(245,240,230,.04)');
    stageGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = stageGlow;
    ctx.fillRect(0, 10, W, 560);

    const beamL = ctx.createLinearGradient(74, 0, 142, 300);
    beamL.addColorStop(0, 'rgba(255,201,41,.06)');
    beamL.addColorStop(1, 'rgba(255,201,41,0)');
    ctx.fillStyle = beamL;
    ctx.beginPath();
    ctx.moveTo(72, 0); ctx.lineTo(120, 0); ctx.lineTo(170, 270); ctx.lineTo(20, 270); ctx.closePath();
    ctx.fill();

    const beamR = ctx.createLinearGradient(310, 0, 358, 300);
    beamR.addColorStop(0, 'rgba(255,201,41,.05)');
    beamR.addColorStop(1, 'rgba(255,201,41,0)');
    ctx.fillStyle = beamR;
    ctx.beginPath();
    ctx.moveTo(310, 0); ctx.lineTo(358, 0); ctx.lineTo(410, 270); ctx.lineTo(260, 270); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(245,240,230,.03)';
    ctx.fillRect(0, 520, W, 3);
    ctx.fillStyle = 'rgba(245,240,230,.025)';
    ctx.fillRect(0, 523, W, 88);
    ctx.fillStyle = 'rgba(245,240,230,.03)';
    roundedRect(ctx, 38, 542, 72, 26, 13); ctx.fill();
    roundedRect(ctx, 320, 542, 72, 26, 13); ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(0, 520, W, 2);
    ctx.restore();

    ctx.fillStyle = 'rgba(245,240,230,.05)';
    roundedRect(ctx, 24, 34, 118, 22, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(245,240,230,.52)';
    ctx.font = '800 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TWO DRINKS LATER', 83, 49);

    ctx.fillStyle = 'rgba(245,240,230,.04)';
    roundedRect(ctx, 126, 36, 178, 22, 10); ctx.fill();
    ctx.fillStyle = 'rgba(245,240,230,.5)';
    ctx.fillText('LIVE STORYTELLING EMERGENCY', 215, 51);

    this.drawAudience(ctx);
  }

  drawMoneyPile(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(255,201,41,.5)';
    ctx.shadowBlur = 20 + this.l2TargetGlow * 10;
    for (let row = 0; row < 4; row += 1) {
      const count = 4 - row;
      for (let i = 0; i < count; i += 1) {
        const px = (i - (count - 1) / 2) * 22;
        const py = -row * 13;
        const fill = row % 2 ? '#ded9cf' : COLORS.warm;
        ctx.fillStyle = fill;
        roundedRect(ctx, px - 15, py - 9, 30, 18, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(5,5,5,.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.font = '900 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₹', px, py);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawAudience(ctx) {
    const progress = clamp(this.storyProgress / L3_STORY_DURATION, 0, 1);
    const postHit = this.state === 'l3_play' && this.now < this.storyResumeAt;
    const people = [
      { x: 34, y: 578, s: 0.92 },
      { x: 78, y: 590, s: 0.8 },
      { x: 118, y: 582, s: 0.86 },
      { x: 314, y: 584, s: 0.86 },
      { x: 356, y: 590, s: 0.8 },
      { x: 396, y: 575, s: 0.96 }
    ];
    const reactions = ['bro?', 'zzz', 'still going?', 'end this', 'save us', 'again?'];
    for (let i = 0; i < people.length; i += 1) {
      const p = people[i];
      const slump = clamp(progress * 1.18 - i * 0.05, 0, 1);
      const bob = Math.sin(this.now * 0.0022 + i * 0.7) * (0.8 + slump * 1.6);
      ctx.save();
      ctx.translate(p.x, p.y + slump * 13 + bob);
      ctx.rotate((i < 3 ? -1 : 1) * slump * 0.22);
      ctx.scale(p.s, p.s);
      ctx.fillStyle = 'rgba(245,240,230,.13)';
      ctx.beginPath();
      ctx.arc(0, -28, 12, 0, Math.PI * 2);
      ctx.fill();
      roundedRect(ctx, -16, -18, 32, 46, 12);
      ctx.fill();
      ctx.restore();

      if (slump > 0.18) {
        ctx.fillStyle = `rgba(245,240,230,${0.16 + slump * 0.28})`;
        ctx.font = '800 11px ui-monospace, monospace';
        const zx = p.x + (i < 3 ? 10 : -18);
        const zy = p.y - 46 - slump * 12;
        ctx.fillText('Z', zx, zy);
        if (slump > 0.54) ctx.fillText('Z', zx + (i < 3 ? 9 : -9), zy - 12);
      }

      if (progress > 0.32 && i % 2 === 0) {
        ctx.fillStyle = `rgba(245,240,230,${0.1 + progress * 0.15})`;
        ctx.font = '700 9px ui-monospace, monospace';
        ctx.fillText(reactions[(i + Math.floor(progress * 10)) % reactions.length], p.x - 12, p.y - 64 - slump * 8);
      }

      if (postHit && i === (this.l3Hits % people.length)) {
        ctx.fillStyle = 'rgba(255,201,41,.72)';
        ctx.font = '900 9px ui-monospace, monospace';
        ctx.fillText('THANK YOU', p.x - 18, p.y - 68);
      }
    }
  }

  drawClock(ctx, small = false) {
    const frame = this.clockFrame || { label: 'WORK LOGIN', value: '11:07 AM' };
    const width = small ? 150 : 224;
    const height = small ? 64 : 112;
    const x = (W - width) / 2;
    const y = small ? 66 : (H - height) / 2 - 38;
    ctx.save();
    ctx.fillStyle = small ? 'rgba(5,5,5,.74)' : 'rgba(5,5,5,.86)';
    roundedRect(ctx, x, y, width, height, small ? 14 : 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,240,230,.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = frame.label === 'WORK LOGIN' ? COLORS.yellow : COLORS.graphite;
    ctx.font = `${small ? 700 : 800} ${small ? 8.8 : 11}px ui-monospace, monospace`;
    ctx.fillText(frame.label, W / 2, y + (small ? 20 : 30));
    ctx.fillStyle = COLORS.warm;
    ctx.font = `900 ${small ? 22 : 38}px "Arial Narrow", Impact, sans-serif`;
    ctx.fillText(frame.value, W / 2, y + (small ? 48 : 78));

    if (!small) {
      const p = clamp(this.stateTime / 5200, 0, 1);
      ctx.fillStyle = 'rgba(245,240,230,.10)';
      roundedRect(ctx, x + 24, y + height - 16, width - 48, 3, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.yellow;
      roundedRect(ctx, x + 24, y + height - 16, (width - 48) * p, 3, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBags(ctx) {
    if (this.state !== 'l1_walk') return;
    const t = this.stateTime;
    let leftX = this.character.x - 56;
    let rightX = this.character.x + 56;
    let y = this.character.y - 72;
    let drop = 0;
    let slide = 0;
    if (t > 2900) drop = easeOutCubic(clamp((t - 2900) / 720, 0, 1));
    if (t > 3600) slide = easeInOut(clamp((t - 3600) / 960, 0, 1));
    y = lerp(y, 500, drop);
    leftX = lerp(leftX, 116, slide * 0.5);
    rightX = lerp(rightX, 304, slide * 0.5);

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b9b5ad';

    ctx.fillStyle = '#121214';
    roundedRect(ctx, leftX - 45, y - 21, 90, 43, 15);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(leftX, y - 21, 26, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = COLORS.graphite;
    ctx.font = '800 8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GYM BAG', leftX, y + 3);
    // Legacy label kept for validation compatibility: ANOTHER BAG

    ctx.fillStyle = '#171719';
    roundedRect(ctx, rightX - 33, y - 34, 66, 68, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightX, y - 34, 19, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = COLORS.graphite;
    ctx.fillText('LAPTOP', rightX, y + 6);
    ctx.restore();
  }

  drawCharacter(ctx) {
    const c = this.character;
    if (c.alpha <= 0.01) return;
    const bob = Math.sin(c.walkPhase * 2.1) * Math.min(3.4, Math.abs(c.vx) * 0.05);
    const hitKick = c.hit * -11;
    const recoilX = c.hit * 12 * (c.hitDirection ?? 1);
    const rot = c.rotation + Math.sin(c.walkPhase) * Math.min(0.016, Math.abs(c.vx) * 0.00022) + c.hit * 0.13 * (c.hitDirection ?? 1);
    const scaleX = c.scale * (1 + c.hit * 0.08);
    const scaleY = c.scale * (1 - c.duck * 0.42 - c.hit * 0.13);

    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x + recoilX, c.y + bob + hitKick);
    ctx.rotate(rot);
    ctx.scale(scaleX, scaleY);

    if (this.state === 'l3_play') {
      ctx.fillStyle = `rgba(216,74,66,${0.14 + c.blush * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(-24, -490, 36, 34, 0, 0, Math.PI * 2);
      ctx.ellipse(26, -490, 36, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.drawImage(this.assets.anish, -209, -679, 418, 679);
    for (const splat of this.characterSplats) this.drawSplatBlob(ctx, splat.x - 209, splat.y - 679, splat.r, splat.alpha, splat.seed);
    ctx.restore();

    if (c.briefcase) this.drawBriefcase(ctx);
    if (c.drink) this.drawDrink(ctx);
  }

  drawBriefcase(ctx) {
    const c = this.character;
    const x = c.x + 42;
    const y = c.y - 75;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(c.rotation * 0.55 + Math.sin(c.walkPhase * 1.8) * 0.04);
    ctx.fillStyle = '#111113';
    ctx.strokeStyle = '#c4c0b7';
    ctx.lineWidth = 2;
    roundedRect(ctx, -21, -17, 42, 34, 5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -17, 9, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(-3, -1, 6, 4);
    ctx.restore();
  }

  drawDrink(ctx) {
    const c = this.character;
    const x = c.x + 49;
    const y = c.y - 106;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.22 + c.rotation * 0.8 + Math.sin(this.stateTime * 0.005) * 0.06);
    ctx.fillStyle = '#181818';
    ctx.strokeStyle = COLORS.warm;
    ctx.lineWidth = 2;
    roundedRect(ctx, -8, -22, 16, 34, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.yellow;
    ctx.globalAlpha = 0.84;
    roundedRect(ctx, -6, -2, 12, 12, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -27);
    ctx.lineTo(2, -27);
    ctx.lineTo(3, -22);
    ctx.lineTo(-3, -22);
    ctx.closePath();
    ctx.fillStyle = COLORS.warm;
    ctx.fill();
    ctx.restore();
  }

  drawSplatBlob(ctx, x, y, r, alpha = 0.8, seed = 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i += 1) {
      const a = seed + i * (Math.PI * 2 / 6);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86, r * rand(0.16, 0.28), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawWorldSplats(ctx) {
    for (const splat of this.worldSplats) this.drawSplatBlob(ctx, splat.x, splat.y, splat.r, splat.alpha, splat.seed);
  }

  drawParticles(ctx) {
    for (const particle of this.particles) {
      const alpha = 1 - (this.now - particle.born) / particle.life;
      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      if (particle.shell) {
        ctx.strokeStyle = COLORS.warm;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.r, particle.y);
        ctx.lineTo(particle.x + particle.r, particle.y + particle.r * 0.4);
        ctx.stroke();
      } else {
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawStoryBubble(ctx) {
    const x = 23;
    const y = 82;
    const width = 384;
    const height = 214;
    ctx.save();
    ctx.fillStyle = 'rgba(245,240,230,.98)';
    roundedRect(ctx, x, y, width, height, 22);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(238, y + height - 2);
    ctx.lineTo(267, y + height + 27);
    ctx.lineTo(274, y + height - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.font = '900 10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('BORING STORY', x + 22, y + 12);

    const ratio = clamp(this.storyProgress / L3_STORY_DURATION, 0, 1);
    const count = Math.floor(STORY_WORDS.length * ratio);
    const text = STORY_WORDS.slice(0, count).join(' ');
    ctx.fillStyle = '#151515';
    ctx.font = '700 12px/1.45 ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this.wrapText(ctx, text || '…', x + 22, y + 34, width - 44, 18, 8);

    ctx.fillStyle = '#d4cec2';
    roundedRect(ctx, x + 22, y + height - 28, width - 44, 5, 3);
    ctx.fill();
    ctx.fillStyle = COLORS.yellow;
    roundedRect(ctx, x + 22, y + height - 28, (width - 44) * ratio, 5, 3);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.font = '900 10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.ceil((L3_STORY_DURATION - this.storyProgress) / 1000) + ' SEC', x + width - 22, y + 14);

    if (this.state === 'l3_play' && this.now < this.storyResumeAt) {
      const pauseSeconds = Math.max(0, (this.storyResumeAt - this.now) / 1000);
      ctx.fillStyle = COLORS.yellowDeep;
      ctx.textAlign = 'left';
      ctx.fillText('INTERRUPTED · ' + pauseSeconds.toFixed(1) + 'S', x + 22, y + height - 40);
    }
    ctx.restore();
  }

  drawSlingshot(ctx) {
    if (!this.isPlaying()) return;

    const restX = this.sling.x;
    const restY = 650;
    const eggX = this.dragging ? restX + this.drag.x : restX;
    const eggY = this.dragging ? restY + this.drag.y : restY;
    const strength = this.dragging ? this.pullStrength() : 0;
    const forkY = 670;
    const leftForkX = 170 - strength * 4;
    const rightForkX = 260 + strength * 4;
    const joinY = 711;
    const baseY = 790;

    const revealT = this.launcherRevealAt
      ? clamp((this.now - this.launcherRevealAt) / 430, 0, 1)
      : 1;
    const reveal = revealT < 1 ? easeOutBack(revealT) : 1;
    const offsetY = (1 - reveal) * 46;

    if (this.dragging) this.drawTrajectory(ctx);

    ctx.save();
    ctx.globalAlpha = clamp(revealT * 1.5, 0, 1);
    ctx.translate(0, offsetY);

    // Old-build egg shadow.
    ctx.fillStyle = 'rgba(0,0,0,.46)';
    ctx.beginPath();
    ctx.ellipse(eggX, eggY + 36, 24, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Old-build double-layer elastic bands.
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1b1b1e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(leftForkX, forkY);
    ctx.lineTo(eggX - 15, eggY + 6);
    ctx.moveTo(rightForkX, forkY);
    ctx.lineTo(eggX + 15, eggY + 6);
    ctx.stroke();

    ctx.strokeStyle = '#a4a19a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftForkX, forkY);
    ctx.lineTo(eggX - 15, eggY + 6);
    ctx.moveTo(rightForkX, forkY);
    ctx.lineTo(eggX + 15, eggY + 6);
    ctx.stroke();

    // Old-build thick dark silhouette, then warm-white core.
    ctx.strokeStyle = '#111113';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(restX, baseY);
    ctx.lineTo(restX, joinY);
    ctx.lineTo(leftForkX, forkY);
    ctx.moveTo(restX, joinY);
    ctx.lineTo(rightForkX, forkY);
    ctx.stroke();

    ctx.strokeStyle = '#f4f0e6';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(restX, baseY);
    ctx.lineTo(restX, joinY);
    ctx.lineTo(leftForkX, forkY);
    ctx.moveTo(restX, joinY);
    ctx.lineTo(rightForkX, forkY);
    ctx.stroke();

    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(leftForkX, forkY, 12, 0, Math.PI * 2);
    ctx.arc(rightForkX, forkY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244,240,230,.78)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(leftForkX, forkY, 12, 0, Math.PI * 2);
    ctx.arc(rightForkX, forkY, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Pouch from the old build.
    ctx.fillStyle = '#050505';
    roundedRect(ctx, eggX - 24, eggY + 18, 48, 16, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244,240,230,.50)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.eggReady && !this.activeShot) {
      const eggScaleX = 1 + strength * 0.05;
      const eggScaleY = 1 - strength * 0.055;
      ctx.save();
      ctx.translate(eggX, eggY);
      ctx.rotate(this.drag.x * 0.0019);
      ctx.scale(eggScaleX, eggScaleY);
      this.drawEgg(ctx, 0, 0, 0, 0.82);
      ctx.restore();
    }

    if (this.now < this.tutorialUntil && !this.dragging && !this.activeShot) {
      const pulse = 0.5 + Math.sin(this.now * 0.006) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.42 + pulse * 0.22;
      ctx.fillStyle = COLORS.warm;
      ctx.font = '800 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PULL BACK · AIM · RELEASE', restX, 738);
      ctx.restore();
    }

    ctx.restore();
  }

  drawTrajectory(ctx) {
    const geometry = this.makeShotGeometry();
    ctx.save();
    for (let i = 1; i <= 9; i += 1) {
      const t = i / 10;
      const p = this.pointOnPath(geometry, t);
      ctx.fillStyle = `rgba(245,240,230,${0.18 + geometry.strength * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.4, 3.1 - i * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawEgg(ctx, x, y, rotation = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    const gradient = ctx.createRadialGradient(-7, -13, 2, 0, 0, 35);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, '#f7f2e8');
    gradient.addColorStop(1, '#c6c0b5');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(18, -26, 25, -3, 20, 15);
    ctx.bezierCurveTo(15, 31, -15, 31, -20, 15);
    ctx.bezierCurveTo(-25, -3, -18, -26, 0, -28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(28,28,28,.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.beginPath();
    ctx.ellipse(-7, -13, 5, 8, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFlight(ctx) {
    for (const point of this.trail) {
      const alpha = 1 - (this.now - point.born) / point.life;
      ctx.fillStyle = `rgba(245,240,230,${clamp(alpha * 0.38, 0, 0.38)})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.8 * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.activeShot) {
      this.drawEgg(ctx, this.activeShot.x ?? this.activeShot.startX, this.activeShot.y ?? this.activeShot.startY, (this.activeShot.angle ?? 0) * Math.PI / 180, 0.82);
    }
  }

  drawSpeech(ctx) {
    if (!this.speech) return;

    const age = this.now - this.speech.born;
    const remaining = this.speech.until - this.now;
    const enter = clamp(age / 150, 0, 1);
    const exit = clamp(remaining / 150, 0, 1);
    const alpha = Math.min(enter, exit);
    const pop = lerp(0.82, 1, easeOutBack(enter));
    const right = this.character.x < W / 2;
    const x = clamp(this.character.x + (right ? 103 : -103), 82, W - 82);
    const y = clamp(this.character.y - 176 - (1 - enter) * 4, 118, 336);

    if (this.speech.legacy) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate((right ? -1.6 : 1.6) * Math.PI / 180);
      ctx.scale(pop, pop);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLORS.warm;
      ctx.font = `bold italic ${this.speech.text.length > 23 ? 13 : 15}px "Trebuchet MS", "Comic Sans MS", cursive`;
      const lines = this.measureLines(ctx, this.speech.text, 188);
      const mainY = this.speech.sub ? -7 : 0;
      lines.forEach((line, index) => ctx.fillText(line, 0, mainY + index * 15));
      if (this.speech.sub) {
        ctx.fillStyle = '#8e8e94';
        ctx.font = '8px ui-monospace, monospace';
        ctx.fillText(this.speech.sub, 0, 19 + (lines.length - 1) * 8);
      }
      const width = clamp(Math.max(...lines.map((line) => ctx.measureText(line).width)) + 16, 74, 194);
      const underlineY = this.speech.sub ? 31 : 20;
      ctx.strokeStyle = 'rgba(244,240,230,.52)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-width / 2, underlineY);
      ctx.lineTo(width / 2, underlineY - 2);
      ctx.stroke();
      const tailX = right ? -width * 0.36 : width * 0.36;
      ctx.strokeStyle = 'rgba(244,240,230,.38)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tailX, underlineY);
      ctx.lineTo(tailX + (right ? -16 : 16), underlineY + 13);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, (1 - enter) * 4);
    ctx.font = '900 12px ui-monospace, monospace';
    const lines = this.measureLines(ctx, this.speech.text, 168);
    const height = 20 + lines.length * 17;
    const width = Math.min(192, Math.max(120, ...lines.map((line) => ctx.measureText(line).width + 26)));
    const left = clamp(x - width / 2, 12, W - width - 12);
    ctx.fillStyle = 'rgba(5,5,5,.94)';
    ctx.strokeStyle = 'rgba(245,240,230,.56)';
    ctx.lineWidth = 1.2;
    roundedRect(ctx, left, y, width, height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(left + 16, y + height - 6, width - 32, 2);
    ctx.fillStyle = COLORS.warm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((line, index) => ctx.fillText(line, left + width / 2, y + 10 + index * 17));
    ctx.restore();
  }

  drawImpactToast(ctx) {
    if (!this.impactToast) return;
    const age = this.now - this.impactToast.born;
    const remaining = this.impactToast.until - this.now;
    const alpha = Math.min(clamp(age / 90, 0, 1), clamp(remaining / 110, 0, 1));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.yellow;
    ctx.font = '900 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.impactToast.text, this.impactToast.x, this.impactToast.y - (1 - alpha) * 6);
    ctx.restore();
  }

  drawHUD(ctx) {
    if (!this.isPlaying()) return;
    ctx.save();
    const level = this.state === 'l1_play' ? 1 : this.state === 'l2_play' ? 2 : 3;
    ctx.fillStyle = 'rgba(245,240,230,.05)';
    roundedRect(ctx, 10, 10, 92, 24, 10); ctx.fill();
    roundedRect(ctx, W - 108, 10, 98, 24, 10); ctx.fill();
    ctx.fillStyle = COLORS.graphite;
    ctx.font = '800 10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL 0' + level, 20, 27);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.warmDim;
    if (level === 1) ctx.fillText('HIT HIM 5 TIMES', W / 2, 28);
    if (level === 2) ctx.fillText('KEEP HIM AWAY FROM THE MONEY', W / 2, 28);
    if (level === 3) ctx.fillText('10 HITS BEFORE THE STORY ENDS', W / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.warm;
    const counter = level === 1
      ? (this.l1Hits + '/5')
      : level === 2
        ? (this.l2Hits + '/5')
        : (this.l3Hits + '/' + LEVEL_THREE_HITS_REQUIRED);
    ctx.fillText('HITS ' + counter, W - 20, 27);
    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
    const lines = this.measureLines(ctx, text, maxWidth);
    lines.slice(0, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  }

  measureLines(ctx, text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    lines.push(line);
    return lines;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, W, H);

    const shakeX = this.shake ? rand(-this.shake, this.shake) : 0;
    const shakeY = this.shake ? rand(-this.shake * 0.55, this.shake * 0.55) : 0;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(this.impactZoom, this.impactZoom);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(shakeX, shakeY);

    if (this.state.startsWith('l2')) this.drawBackgroundMoney(ctx);
    else if (this.state.startsWith('l3') || this.state === 'final') this.drawBackgroundBar(ctx);
    else this.drawBackgroundStage(ctx);

    this.drawWorldSplats(ctx);

    if (this.state === 'home') {
      // Deliberately empty: the title and START THROWING are the only foreground elements.
    }

    if (this.state === 'l1_clock') this.drawClock(ctx, false);
    if (this.state === 'l1_walk') {
      this.clockFrame = { label: 'WORK LOGIN', value: '11:07 AM' };
      this.drawClock(ctx, true);
      this.drawCharacter(ctx);
      this.drawBags(ctx);
    }
    if (this.state === 'l1_intro' || this.state === 'l1_play' || this.state === 'l1_complete') {
      this.clockFrame = { label: 'WORK LOGIN', value: '11:07 AM' };
      this.drawClock(ctx, true);
      this.drawCharacter(ctx);
    }

    if (this.state === 'l2_intro' || this.state === 'l2_play' || this.state === 'l2_fail' || this.state === 'l2_complete') {
      this.drawCharacter(ctx);
    }

    if (this.state === 'l3_intro' || this.state === 'l3_play' || this.state === 'l3_fail' || this.state === 'final') {
      if (this.state === 'l3_play') this.drawStoryBubble(ctx);
      this.drawCharacter(ctx);
    }

    this.drawSlingshot(ctx);
    this.drawFlight(ctx);
    this.drawParticles(ctx);
    this.drawImpactToast(ctx);
    this.drawSpeech(ctx);
    ctx.restore();

    this.drawHUD(ctx);
    if (this.impactFlash > 0) {
      ctx.fillStyle = `rgba(244,240,230,${this.impactFlash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  loop(time) {
    if (!this.running) return;
    this.now = time;
    const dt = Math.min(0.034, Math.max(0, (time - this.lastFrame) / 1000));
    this.lastFrame = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame((next) => this.loop(next));
  }

  debugGo(state) {
    const actions = {
      home: () => this.showHome(),
      l1_clock: () => this.startLevel1Clock(),
      l1_play: () => this.startLevel1Play(),
      l1_complete: () => this.completeLevel1(),
      l2_intro: () => this.showLevel2Intro(),
      l2_play: () => this.startLevel2(),
      l2_complete: () => this.completeLevel2(),
      l3_intro: () => this.showLevel3Intro(),
      l3_play: () => this.startLevel3(),
      final: () => this.completeLevel3()
    };
    actions[state]?.();
  }

  debugFireAtAnish() {
    if (!this.isPlaying() || this.activeShot || !this.eggReady) return false;
    const hit = this.characterHitbox();
    this.drag.x = clamp((this.sling.x - hit.x) / 2.75, -80, 80);
    const desiredDy = clamp((this.sling.restY - hit.y) / 2.95, 50, 108);
    this.drag.y = desiredDy;
    this.releaseShot();
    return true;
  }
}

const game = new EggGame();
game.init();
// legacy token preserved for validation: your best decision in Eternal
