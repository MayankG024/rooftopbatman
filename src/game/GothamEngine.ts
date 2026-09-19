import {
  BatmanState,
  Rooftop,
  Enemy,
  GrappleAnchor,
  Batarang,
  Particle,
  ComicPopup,
  Point,
  GameStats,
  RobinState,
  LevelMeta,
} from './types';
import { createLevel, LEVELS } from './levelData';
import { renderBatman } from './batmanRenderer';
import { renderRobin } from './robinRenderer';
import { soundManager } from './audio';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats, batman: BatmanState) => void;
  onMissionComplete: (stats: GameStats) => void;
  onGameOver: () => void;
}

export class GothamEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Level & Entities
  public rooftops: Rooftop[] = [];
  public enemies: Enemy[] = [];
  public batarangs: Batarang[] = [];
  public particles: Particle[] = [];
  public comicPopups: ComicPopup[] = [];
  public rainParticles: { x: number; y: number; speed: number; len: number }[] = [];

  // Batman
  public batman: BatmanState;

  // Robin — ally NPC (random assists)
  public robin: RobinState = {
    active: false, x: 0, y: 0, vx: 0, vy: 0, facing: 1,
    phase: 'hidden', timer: 0, cooldown: 900, targetId: null, punchTimer: 0, animT: 0,
  };

  // Level
  public levelIndex: number = 0;
  public levelMeta: LevelMeta = LEVELS[0];

  // Viewport & Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public screenShake: number = 0;
  public width: number = 1200;
  public height: number = 700;
  // Realism ambience (cheap, state-driven)
  public windGust: number = 0;
  private windTimer: number = 0;
  private lightningTimer: number = 900 + Math.random() * 900;
  private lightningFlash: number = 0;
  private trafficDots: { x: number; speed: number; y: number; color: string }[] = [];
  private statThrottle: number = 0;
  private splashTimer: number = 0;

  // Targeting & Controls
  public mousePos: Point = { x: 0, y: 0 };
  public hoveredAnchor: GrappleAnchor | null = null;
  public activeKeys: Set<string> = new Set();
  public isDetectiveMode: boolean = false;
  // Mobile / touch input state
  public touchMoveDir: -1 | 0 | 1 = 0;
  public touchGlideHeld: boolean = false;
  public isTouchDevice: boolean = false;
  public lastAimAngle: number = 0; // for batarang trajectory preview
  public aimWorldPos: Point | null = null;
  public grappleRange: number = 580;
  private grappleTimer: number = 0;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  // Procedural texture caches
  private noiseSeed: number = 1234567;

  // Game Loop & Timing
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isCompleted: boolean = false;
  private targetX: number = 3220;

  // Stats
  public stats: GameStats = {
    timeElapsed: 0,
    hostilesDefeated: 0,
    totalHostiles: 7,
    grapplesUsed: 0,
    batarangsThrown: 0,
    maxCombo: 0,
    robinAssists: 0,
    robinActive: false,
  };

  // Ambient Animations
  private searchlightAngle: number = 0;
  private batSignalPulse: number = 0;
  private steamTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;

    this.batman = this.createDefaultBatman();
    this.initLevel();
    this.initRain();
    this.handleResize();
  }

  private createDefaultBatman(): BatmanState {
    return {
      x: 180,
      y: 480,
      vx: 0,
      vy: 0,
      width: 34,
      height: 68,
      facing: 1,
      grounded: true,
      action: 'idle',
      animTimer: 0,
      capeAngle: 0,
      health: 3,
      maxHealth: 3,
      batarangCooldown: 0,
      combo: 0,
      comboTimer: 0,
      grappleActive: false,
      grappleTarget: null,
      grappleAnchorId: null,
      grappleProgress: 0,
      grappleLength: 0,
      grapplePhase: 'none',
      grappleHook: null,
      grappleRopeLength: 0,
    };
  }

  public initLevel(levelIndex: number = this.levelIndex) {
    const level = createLevel(levelIndex);
    this.levelIndex = levelIndex;
    this.levelMeta = level.meta;
    this.rooftops = level.rooftops;
    this.enemies = level.enemies;
    this.targetX = level.targetX;
    this.batarangs = [];
    this.particles = [];
    this.comicPopups = [];
    this.batman = this.createDefaultBatman();
    this.robin = {
      active: false, x: 0, y: 0, vx: 0, vy: 0, facing: 1,
      phase: 'hidden', timer: 0, cooldown: 700 + Math.random() * 500,
      targetId: null, punchTimer: 0, animT: 0,
    };
    this.isCompleted = false;
    this.statThrottle = 0;
    this.stats = {
      timeElapsed: 0,
      hostilesDefeated: 0,
      totalHostiles: this.enemies.length,
      grapplesUsed: 0,
      batarangsThrown: 0,
      maxCombo: 0,
      robinAssists: 0,
      robinActive: false,
    };
    this.initTraffic();
  }

  public loadLevel(index: number) {
    this.initLevel(index);
  }

  public getLevelMeta(): LevelMeta {
    return this.levelMeta;
  }

  private initTraffic() {
    this.trafficDots = [];
    for (let i = 0; i < 10; i++) {
      this.trafficDots.push({
        x: Math.random() * 4000,
        y: this.height - 60 - Math.random() * 120,
        speed: 0.6 + Math.random() * 1.4,
        color: Math.random() > 0.5 ? 'rgba(248,113,30,0.5)' : 'rgba(255,240,200,0.45)',
      });
    }
  }

  private initRain(count: number = 140) {
    this.rainParticles = [];
    for (let i = 0; i < count; i++) {
      this.rainParticles.push({
        x: Math.random() * 2000,
        y: Math.random() * 1000,
        speed: 14 + Math.random() * 8,
        len: 12 + Math.random() * 14,
      });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public restart(levelIndex?: number) {
    this.initLevel(levelIndex ?? this.levelIndex);
    this.start();
  }

  public setDetectiveMode(active: boolean) {
    if (this.isDetectiveMode !== active) {
      this.isDetectiveMode = active;
      soundManager.playDetective(active);
      this.addComicPopup(this.batman.x, this.batman.y - 70, active ? 'DETECTIVE MODE: ON' : 'TACTICAL HUD', '#38bdf8');
    }
  }

  public toggleDetectiveMode() {
    this.setDetectiveMode(!this.isDetectiveMode);
  }

  public handleResize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect && rect.width > 10 && rect.height > 10) {
      // Cap DPR at 2 for perf on mobile, reset transform to avoid scale stacking
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Detect touch for larger reticles / aim assist
      this.isTouchDevice =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || (navigator as any).maxTouchPoints > 0);
      // Rain density scales with screen size (perf on mobile)
      const targetRain = this.isTouchDevice ? 80 : 140;
      if (this.rainParticles.length !== targetRain) this.initRain(targetRain);
    }
  }

  // ---- Mobile / touch input API (called from React HUD) ----
  public setMoveInput(dir: -1 | 0 | 1) {
    this.touchMoveDir = dir;
  }
  public setGlideHeld(held: boolean) {
    this.touchGlideHeld = held;
  }
  public pressJump() {
    this.jumpBufferTimer = 12; // buffered jump for touch latency
    this.jump();
  }
  public releaseJump() {
    // Variable jump height: cut upward velocity on early release
    if (this.batman.vy < -5) this.batman.vy *= 0.55;
    this.touchGlideHeld = false;
  }
  public isGrappleReady(): boolean {
    return this.getValidAnchorsInRange(this.grappleRange).length > 0 && !this.batman.grappleActive;
  }
  public getBatarangReady(): boolean {
    return this.batman.batarangCooldown <= 0;
  }

  // Input Handlers
  public onKeyDown(code: string) {
    this.activeKeys.add(code);

    if (code === 'KeyV') {
      this.toggleDetectiveMode();
    } else if (code === 'KeyQ') {
      this.throwBatarang();
    } else if (code === 'KeyE') {
      this.tryGrappleNearest();
    } else if (code === 'KeyF') {
      this.meleeAttack();
    } else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      this.jumpBufferTimer = 12;
      this.jump();
    }
  }

  public onKeyUp(code: string) {
    this.activeKeys.delete(code);
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      if (this.batman.vy < -5 && !this.batman.grappleActive) this.batman.vy *= 0.6;
    }
  }

  public onMouseMove(x: number, y: number) {
    this.mousePos = { x, y };
    // Track aim world pos for batarang preview
    this.aimWorldPos = { x: x + this.cameraX, y: y + this.cameraY };
    this.updateHoveredAnchor();
  }

  public onMouseClick(x: number, y: number, isRightClick: boolean = false) {
    this.mousePos = { x, y };
    this.aimWorldPos = { x: x + this.cameraX, y: y + this.cameraY };

    if (isRightClick) {
      this.tryGrappleNearest();
      return;
    }

    // Generous tap radius on touch (mobile playable)
    const tapRadius = this.isTouchDevice ? 78 : 50;
    const worldX = x + this.cameraX;
    const worldY = y + this.cameraY;
    const clickedAnchor = this.findAnchorNear(worldX, worldY, tapRadius);

    if (clickedAnchor) {
      const d = Math.hypot(clickedAnchor.x - this.batman.x, clickedAnchor.y - (this.batman.y - 45));
      if (d <= this.grappleRange) {
        this.grappleTo(clickedAnchor);
        return;
      }
    }

    // Normal click/tap: melee if enemy close, else AIMED batarang at tap point
    const closeEnemy = this.enemies.find(
      (e) => e.state !== 'knocked_out' && Math.hypot(e.x - this.batman.x, e.y - this.batman.y) < 78
    );
    // If tapping directly on an enemy, prefer batarang aimed at that point
    const tappedEnemy = this.enemies.find(
      (e) =>
        e.state !== 'knocked_out' &&
        worldX >= e.x - 34 &&
        worldX <= e.x + 34 &&
        worldY >= e.y - e.height - 12 &&
        worldY <= e.y + 8
    );
    if (tappedEnemy) {
      this.throwBatarangAtWorld(worldX, worldY);
    } else if (closeEnemy && Math.abs(worldX - this.batman.x) < 90) {
      this.meleeAttack();
    } else {
      // Aim toward tap if it's meaningfully away, else quick-throw
      const dx = worldX - this.batman.x;
      const dy = worldY - (this.batman.y - 48);
      if (Math.hypot(dx, dy) > 60) this.throwBatarangAtWorld(worldX, worldY);
      else this.throwBatarang();
    }
  }

  /** Tap-to-grapple from touch HUD (screen coords). Returns true if latched. */
  public grappleAtScreen(x: number, y: number): boolean {
    const worldX = x + this.cameraX;
    const worldY = y + this.cameraY;
    const anchor = this.findAnchorNear(worldX, worldY, this.isTouchDevice ? 90 : 55);
    if (anchor) {
      const d = Math.hypot(anchor.x - this.batman.x, anchor.y - (this.batman.y - 45));
      if (d <= this.grappleRange) {
        this.grappleTo(anchor);
        return true;
      }
    }
    // Fallback: smart nearest (mobile heavily relies on this)
    const before = this.batman.grappleAnchorId;
    this.tryGrappleNearest();
    return this.batman.grappleAnchorId !== before;
  }

  /** Aim batarang at a world position (touch drag / tap). */
  public aimAndThrow(worldX: number, worldY: number) {
    this.throwBatarangAtWorld(worldX, worldY);
  }

  public cancelGrapple() {
    if (!this.batman.grappleActive) return;
    this.batman.grappleActive = false;
    this.batman.grapplePhase = 'none';
    this.batman.grappleTarget = null;
    this.batman.grappleHook = null;
    this.batman.grappleAnchorId = null;
    this.batman.action = this.batman.grounded ? 'idle' : 'jumping';
  }

  // Traversal & Gadgets
  public jump() {
    // Vault-boost out of an active grapple — key to fun traversal
    if (this.batman.grappleActive && this.batman.grapplePhase === 'attached') {
      const b = this.batman;
      b.grappleActive = false;
      b.grapplePhase = 'none';
      b.grappleTarget = null;
      b.grappleHook = null;
      b.grappleAnchorId = null;
      b.grounded = false;
      // Preserve swing momentum + add vault pop
      b.vy = Math.min(b.vy - 4.5, -11.5);
      b.vx = Math.max(-11, Math.min(11, b.vx + b.facing * 3.2));
      b.action = 'grappling_vault';
      b.animTimer = 0;
      soundManager.playJump();
      this.addComicPopup(b.x, b.y - 46, 'VAULT BOOST!', '#e5a93c');
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: b.x + (Math.random() - 0.5) * 24,
          y: b.y - 10,
          vx: -b.vx * 0.15 + (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3,
          size: 3 + Math.random() * 3,
          color: 'rgba(229,169,60,0.7)',
          alpha: 1,
          decay: 0.06,
          type: 'spark',
        });
      }
      return;
    }
    // Cancel a firing hook with jump (feels responsive)
    if (this.batman.grappleActive && this.batman.grapplePhase === 'firing') {
      this.cancelGrapple();
    }
    const canCoyote = this.coyoteTimer > 0;
    if ((this.batman.grounded || canCoyote) && !this.batman.grappleActive) {
      this.batman.vy = -13.2;
      this.batman.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.batman.action = 'jumping';
      this.batman.animTimer = 0;
      soundManager.playJump();

      for (let i = 0; i < 7; i++) {
        this.particles.push({
          x: this.batman.x + (Math.random() * 22 - 11),
          y: this.batman.y,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -Math.random() * 2.4,
          size: 3 + Math.random() * 2,
          color: 'rgba(160,170,190,0.5)',
          alpha: 1,
          decay: 0.05,
          type: 'smoke',
        });
      }
    }
  }

  private findHomingTarget(aimAngle: number): Enemy | null {
    let best: Enemy | null = null;
    let bestScore = -Infinity;
    for (const e of this.enemies) {
      if (e.state === 'knocked_out') continue;
      const dx = e.x - this.batman.x;
      const dy = e.y - 34 - (this.batman.y - 48);
      const dist = Math.hypot(dx, dy);
      if (dist > 620 || dist < 20) continue;
      const ang = Math.atan2(dy, dx);
      let diff = Math.abs(ang - aimAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.1) continue; // ~63° cone
      const score = 600 - dist - diff * 220 + (e.type === 'target' ? 80 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  public throwBatarang(angleOverride?: number) {
    if (this.batman.batarangCooldown > 0) return;
    // Default aim: facing horizontal with slight up-tilt, assisted toward enemies
    const baseAngle = this.batman.facing === 1 ? -0.06 : Math.PI + 0.06;
    let aim = angleOverride ?? baseAngle;
    // If no explicit aim, snap toward nearest enemy in facing cone
    if (angleOverride === undefined) {
      const snap = this.findHomingTarget(baseAngle);
      if (snap) {
        aim = Math.atan2(snap.y - 30 - (this.batman.y - 48), snap.x - this.batman.x);
      }
    }
    this.spawnBatarang(aim);
  }

  public throwBatarangAtWorld(worldX: number, worldY: number) {
    if (this.batman.batarangCooldown > 0) return;
    const sx = this.batman.x;
    const sy = this.batman.y - 48;
    let aim = Math.atan2(worldY - sy, worldX - sx);
    // Clamp: don't throw straight down while grounded (feels bad)
    if (this.batman.grounded && aim > 0.9) aim = 0.9;
    if (this.batman.grounded && aim < -1.35) aim = -1.35;
    // Face the throw
    this.batman.facing = Math.cos(aim) >= 0 ? 1 : -1;
    this.spawnBatarang(aim);
  }

  private spawnBatarang(aimAngle: number) {
    this.batman.batarangCooldown = 0.45;
    this.batman.action = 'batarang_throw';
    this.batman.animTimer = 0;
    this.lastAimAngle = aimAngle;
    soundManager.playBatarangThrow();
    this.stats.batarangsThrown++;
    this.pushStats();

    const spawnX = this.batman.x + Math.cos(aimAngle) * 22;
    const spawnY = this.batman.y - 48 + Math.sin(aimAngle) * 10;
    const speed = 17.5 + Math.min(3, Math.abs(this.batman.vx) * 0.25);
    const homing = this.findHomingTarget(aimAngle);

    this.batarangs.push({
      id: `batarang_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      x: spawnX,
      y: spawnY,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      rotation: 0,
      spinSpeed: 0.55 + Math.random() * 0.1,
      lifetime: 150,
      hit: false,
      distanceTraveled: 0,
      maxDistance: 540,
      returning: false,
      damage: 1,
      piercedIds: [],
      homingTargetId: homing ? homing.id : null,
      trail: [],
    });
    // Muzzle snap particle
    this.particles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(aimAngle) * 3,
      vy: Math.sin(aimAngle) * 3,
      size: 5,
      color: 'rgba(229,169,60,0.8)',
      alpha: 0.9,
      decay: 0.12,
      type: 'spark',
    });
  }

  public meleeAttack() {
    if (this.batman.grappleActive) return;

    this.batman.action = 'melee_attack';
    this.batman.animTimer = 0;
    soundManager.playHit();

    // Check hit on nearby enemies
    const attackRange = 75;
    let hitAny = false;

    for (const enemy of this.enemies) {
      if (enemy.state === 'knocked_out') continue;

      const dx = enemy.x - this.batman.x;
      const dy = Math.abs(enemy.y - this.batman.y);

      // Facing towards enemy and within range
      const inFront = (this.batman.facing === 1 && dx > -10 && dx < attackRange) ||
                      (this.batman.facing === -1 && dx < 10 && dx > -attackRange);

      if (inFront && dy < 50) {
        // Lunge + knockback — weighty Arkham feel
        this.batman.vx += this.batman.facing * 1.6;
        enemy.x += this.batman.facing * 7;
        enemy.vx = this.batman.facing * 1.2;
        this.damageEnemy(enemy, 1, 'STRIKE');
        hitAny = true;
      }
    }

    if (!hitAny) {
      // Small fist swoosh particle
      this.particles.push({
        x: this.batman.x + this.batman.facing * 30,
        y: this.batman.y - 45,
        vx: this.batman.facing * 2,
        vy: 0,
        size: 8,
        color: 'rgba(229, 169, 60, 0.6)',
        alpha: 1,
        decay: 0.1,
        type: 'spark',
      });
    }
  }

  public tryGrappleNearest() {
    if (this.batman.grappleActive) return;
    const validAnchors = this.getValidAnchorsInRange(this.grappleRange);
    if (validAnchors.length === 0) {
      // Feedback: no anchor — small UI click so mobile doesn't feel dead
      this.addComicPopup(this.batman.x, this.batman.y - 70, 'NO ANCHOR IN RANGE', '#64748b');
      return;
    }

    // Smart scoring: hovered/tapped anchor wins, then aim direction, then forward+height
    let bestAnchor = validAnchors[0];
    let bestScore = -Infinity;
    const aimX = (this.aimWorldPos?.x ?? this.mousePos.x + this.cameraX) - this.batman.x;
    const aimY = (this.aimWorldPos?.y ?? this.mousePos.y + this.cameraY) - (this.batman.y - 45);
    const aimLen = Math.hypot(aimX, aimY) || 1;
    const aimNx = aimX / aimLen;
    const aimNy = aimY / aimLen;

    for (const anchor of validAnchors) {
      const dx = anchor.x - this.batman.x;
      const dy = anchor.y - (this.batman.y - 45);
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const aimAlign = nx * aimNx + ny * aimNy; // -1..1
      const hoverBonus = this.hoveredAnchor?.id === anchor.id ? 220 : 0;
      const forwardBonus = dx * this.batman.facing > 0 ? 110 : -40;
      const heightBonus = dy < -20 ? 70 : dy < 40 ? 20 : -30;
      const distScore = 480 - dist * 0.85;
      const score = distScore + forwardBonus + heightBonus + aimAlign * 160 + hoverBonus;
      if (score > bestScore) {
        bestScore = score;
        bestAnchor = anchor;
      }
    }

    if (bestAnchor) this.grappleTo(bestAnchor);
  }

  public grappleTo(anchor: GrappleAnchor) {
    const b = this.batman;
    // Fire hook projectile — it flies to the anchor, then latches (feels physical)
    const handX = b.x + b.facing * 14;
    const handY = b.y - 48;
    b.grappleActive = true;
    b.grapplePhase = 'firing';
    b.grappleTarget = { x: anchor.x, y: anchor.y };
    b.grappleHook = { x: handX, y: handY };
    b.grappleAnchorId = anchor.id;
    b.grappleProgress = 0;
    b.grounded = false;
    b.action = 'grappling_pull';
    b.facing = anchor.x >= b.x ? 1 : -1;
    const dx = anchor.x - b.x;
    const dy = anchor.y - (b.y - 45);
    b.grappleLength = Math.hypot(dx, dy);
    b.grappleRopeLength = b.grappleLength;
    this.grappleTimer = 0;

    this.stats.grapplesUsed++;
    soundManager.playGrappleShoot();
    this.screenShake = Math.max(this.screenShake, 2.5);
    this.pushStats();
  }

  private latchGrapple() {
    const b = this.batman;
    if (!b.grappleTarget) return;
    b.grapplePhase = 'attached';
    b.grappleRopeLength = Math.max(70, Math.hypot(b.grappleTarget.x - b.x, b.grappleTarget.y - (b.y - 45)) * 0.99);
    b.grappleHook = { ...b.grappleTarget };
    soundManager.playGrappleAttach();
    soundManager.playGrapplePull();
    // Latch sparks
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: b.grappleTarget.x,
        y: b.grappleTarget.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 2.5 + Math.random() * 2,
        color: '#f3c15d',
        alpha: 1,
        decay: 0.06,
        type: 'spark',
      });
    }
    this.screenShake = Math.max(this.screenShake, 3.5);
  }

  private updateGrapplePhysics() {
    const b = this.batman;
    if (!b.grappleActive || !b.grappleTarget) return;
    this.grappleTimer++;

    if (b.grapplePhase === 'firing') {
      // Hook projectile flies fast to anchor
      const hook = b.grappleHook!;
      const t = b.grappleTarget;
      const dx = t.x - hook.x;
      const dy = t.y - hook.y;
      const dist = Math.hypot(dx, dy);
      const speed = 26; // px/frame — snappy Arkham feel
      if (dist <= speed + 4) {
        this.latchGrapple();
      } else {
        hook.x += (dx / dist) * speed;
        hook.y += (dy / dist) * speed;
        // Slight hero pull toward shot (anticipation)
        b.vx *= 0.92;
        b.vy = Math.min(b.vy + 0.35, 6);
        b.x += b.vx * 0.35;
        b.y += b.vy * 0.35;
        if (Math.random() < 0.5) {
          this.particles.push({
            x: hook.x, y: hook.y,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            size: 2, color: 'rgba(229,169,60,0.9)', alpha: 0.9, decay: 0.12, type: 'spark',
          });
        }
      }
      b.action = 'grappling_pull';
      b.facing = t.x >= b.x ? 1 : -1;
      if (this.grappleTimer > 60) this.cancelGrapple(); // failsafe
      return;
    }

    // ---- ATTACHED: pendulum + reel physics ----
    const anchor = b.grappleTarget;
    const handX = b.x;
    const handY = b.y - 45;
    let dx = handX - anchor.x;
    let dy = handY - anchor.y;
    let dist = Math.hypot(dx, dy) || 1;

    // Input steering (keyboard + touch d-pad)
    const moveLeft = this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft') || this.touchMoveDir === -1;
    const moveRight = this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight') || this.touchMoveDir === 1;
    // Tangential pump: A/D adds swing energy
    const tx = -dy / dist; // tangent
    const ty = dx / dist;
    if (moveLeft) {
      b.vx -= 0.42 * (tx < 0 ? 1 : 0.35);
      // push along tangent
      b.vx += tx * -0.35;
      b.vy += ty * -0.35;
    }
    if (moveRight) {
      b.vx += 0.42 * (tx > 0 ? 1 : 0.35);
      b.vx += tx * 0.35;
      b.vy += ty * 0.35;
    }

    // Gravity still applies — swing feels weighty
    b.vy += 0.58;
    // Reel in the winch (faster when far, gentle when close)
    const reelSpeed = 2.6 + dist * 0.012;
    b.grappleRopeLength = Math.max(58, b.grappleRopeLength - reelSpeed);
    b.grappleLength = dist;

    // Integrate
    b.vx *= 0.995;
    b.vy *= 0.998;
    // Cap speed so it never feels out of control
    const spd = Math.hypot(b.vx, b.vy);
    const maxSpd = 19;
    if (spd > maxSpd) {
      b.vx = (b.vx / spd) * maxSpd;
      b.vy = (b.vy / spd) * maxSpd;
    }
    b.x += b.vx;
    b.y += b.vy;

    // Constrain to rope: remove radial outward velocity, snap to circle
    dx = b.x - anchor.x;
    dy = b.y - 45 - anchor.y;
    dist = Math.hypot(dx, dy) || 1;
    if (dist > b.grappleRopeLength) {
      const nx = dx / dist;
      const ny = dy / dist;
      // Project position onto circle
      b.x = anchor.x + nx * b.grappleRopeLength;
      b.y = anchor.y + ny * b.grappleRopeLength + 45;
      // Remove outward radial velocity (keep tangential swing)
      const vr = b.vx * nx + b.vy * ny;
      if (vr > 0) {
        b.vx -= nx * vr * 0.98;
        b.vy -= ny * vr * 0.98;
        // Winch adds a little inward pull for momentum
        b.vx -= nx * 0.45;
        b.vy -= ny * 0.45;
      }
    }

    b.action = 'grappling_pull';
    b.facing = anchor.x >= b.x ? 1 : -1;

    // Cable streak particles
    if (Math.random() < 0.45) {
      this.particles.push({
        x: b.x, y: b.y - 45,
        vx: -b.vx * 0.08 + (Math.random() - 0.5) * 2,
        vy: -b.vy * 0.08 + (Math.random() - 0.5) * 2,
        size: 2.2, color: 'rgba(229,169,60,0.85)', alpha: 0.8, decay: 0.09, type: 'spark',
      });
    }

    // Vault when close to anchor — launch onto ledge
    if (dist < 52) {
      b.grappleActive = false;
      b.grapplePhase = 'none';
      b.grappleTarget = null;
      b.grappleHook = null;
      b.vy = -8.8;
      b.vx = b.facing * 6.2 + Math.max(-3, Math.min(3, b.vx * 0.4));
      b.action = 'grappling_vault';
      b.animTimer = 0;
      soundManager.playJump();
      this.addComicPopup(b.x, b.y - 44, 'VAULT!', '#e5a93c');
    }
    // Timeout failsafe / landed
    if (this.grappleTimer > 260) this.cancelGrapple();
  }

  private getValidAnchorsInRange(maxRange?: number): GrappleAnchor[] {
    const range = maxRange ?? this.grappleRange;
    const valid: GrappleAnchor[] = [];
    for (const roof of this.rooftops) {
      for (const anc of roof.anchors) {
        const dist = Math.hypot(anc.x - this.batman.x, anc.y - (this.batman.y - 45));
        if (dist <= range && dist > 28) {
          valid.push(anc);
        }
      }
    }
    return valid;
  }

  private findAnchorNear(worldX: number, worldY: number, radius: number = 40): GrappleAnchor | null {
    for (const roof of this.rooftops) {
      for (const anc of roof.anchors) {
        const dist = Math.hypot(anc.x - worldX, anc.y - worldY);
        if (dist <= radius) {
          return anc;
        }
      }
    }
    return null;
  }

  private updateHoveredAnchor() {
    const worldX = this.mousePos.x + this.cameraX;
    const worldY = this.mousePos.y + this.cameraY;
    this.hoveredAnchor = this.findAnchorNear(worldX, worldY, 45);
  }

  // Damage & Combos
  public damageEnemy(enemy: Enemy, damage: number = 1, comicText: string = 'HIT', fromRobin = false) {
    enemy.health -= damage;
    enemy.hitEffectTimer = 10;
    enemy.state = 'alert';
    // Hit knockback drift (decays in patrol movement)
    enemy.x += (this.batman.x < enemy.x ? 1 : -1) * 4;
    soundManager.playHit();
    if (fromRobin) this.stats.robinAssists++;

    // Comic popup text
    const textOptions = ['WHAM!', 'POW!', 'CRACK!', 'TAKEDOWN!', 'STRIKE!'];
    const chosenText = comicText || textOptions[Math.floor(Math.random() * textOptions.length)];
    this.addComicPopup(enemy.x, enemy.y - 40, chosenText, '#e5a93c');

    // Combo system
    this.batman.combo++;
    this.batman.comboTimer = 180; // ~3 seconds
    if (this.batman.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.batman.combo;
    }

    // Spark particles
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: enemy.x,
        y: enemy.y - 30,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        size: 3.5,
        color: '#f3c15d',
        alpha: 1,
        decay: 0.04,
        type: 'spark',
      });
    }

    if (enemy.health <= 0) {
      enemy.state = 'knocked_out';
      enemy.knockoutTimer = 9999;
      this.stats.hostilesDefeated++;
      this.addComicPopup(enemy.x, enemy.y - 60, 'NEUTRALIZED', '#38bdf8');

      if (enemy.type === 'target') {
        this.triggerMissionComplete();
      }
    }

    this.screenShake = 6;
  }

  public damageBatman(damage: number = 1) {
    this.batman.health = Math.max(0, this.batman.health - damage);
    this.batman.combo = 0;
    this.screenShake = 10;
    soundManager.playHit();
    this.addComicPopup(this.batman.x, this.batman.y - 50, 'ARMOR HIT', '#ef4444');

    if (this.batman.health <= 0) {
      // Emergency smoke & revive with 1 armor on nearest safe ledge
      this.emergencyRecover();
    }
  }

  private emergencyRecover() {
    this.addComicPopup(this.batman.x, this.batman.y - 60, 'EMERGENCY GRAPNEL RECOVERY', '#38bdf8');
    soundManager.playGrapplePull();

    // Find nearest safe rooftop behind or at Batman
    const safeRoof = this.rooftops.reduce((prev, curr) => {
      return Math.abs(curr.x - this.batman.x) < Math.abs(prev.x - this.batman.x) ? curr : prev;
    });

    this.batman.x = safeRoof.x + 80;
    this.batman.y = safeRoof.y;
    this.batman.vx = 0;
    this.batman.vy = 0;
    this.batman.health = 2; // Restore some armor
    this.batman.grounded = true;
    this.batman.grappleActive = false;

    // Spawn smoke cloud
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: this.batman.x + (Math.random() - 0.5) * 40,
        y: this.batman.y - 20 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        size: 10 + Math.random() * 15,
        color: 'rgba(56, 189, 248, 0.4)',
        alpha: 0.9,
        decay: 0.02,
        type: 'smoke',
      });
    }
  }

  private triggerMissionComplete() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    soundManager.playVictory();
    this.addComicPopup(this.batman.x, this.batman.y - 80, 'TARGET INTERCEPTED!', '#22c55e');
    this.pushStats();

    setTimeout(() => {
      this.callbacks.onMissionComplete(this.stats);
    }, 1800);
  }

  private addComicPopup(x: number, y: number, text: string, color: string = '#e5a93c') {
    this.comicPopups.push({
      x,
      y,
      text,
      alpha: 1,
      scale: 1.4,
      color,
    });
  }

  // Main Loop
  private gameLoop = (timestamp: number) => {
    if (!this.isRunning) return;

    const delta = Math.min(32, timestamp - this.lastTime);
    this.lastTime = timestamp;

    this.update(delta);
    this.render();

    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  // Update Game Logic
  private update(delta: number) {
    this.stats.timeElapsed += delta / 1000;
    this.batman.animTimer += delta / 1000;
    this.searchlightAngle += 0.008;
    this.batSignalPulse += 0.03;
    this.steamTimer += delta;

    // Screen Shake Decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.4);
    }

    // Batman Batarang Cooldown (delta-based, 0.45s)
    if (this.batman.batarangCooldown > 0) {
      this.batman.batarangCooldown = Math.max(0, this.batman.batarangCooldown - delta / 1000);
    }

    // Combo Timer
    if (this.batman.comboTimer > 0) {
      this.batman.comboTimer--;
      if (this.batman.comboTimer <= 0) {
        this.batman.combo = 0;
      }
    }

    // Coyote + jump buffer timers (forgiving mobile controls)
    if (this.batman.grounded) this.coyoteTimer = 9;
    else if (this.coyoteTimer > 0) this.coyoteTimer--;
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
      if (this.batman.grounded || this.coyoteTimer > 0) this.jump();
    }

    // 1. Batman Grappling Mechanics — pendulum + reel
    if (this.batman.grappleActive && this.batman.grappleTarget) {
      this.updateGrapplePhysics();
      // Still collide with roofs while swinging (allows ledge grabs)
      this.checkRooftopCollisions(true);
      if (this.batman.grounded && this.batman.grapplePhase === 'attached') {
        // Landed while reeling — clean release with small hop
        this.cancelGrapple();
        this.batman.action = 'landing';
      }
    } else {
      // 2. Normal Batman Physics & Input (keyboard + touch d-pad)
      const moveLeft =
        this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft') || this.touchMoveDir === -1;
      const moveRight =
        this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight') || this.touchMoveDir === 1;
      const jumpHeld =
        this.activeKeys.has('Space') ||
        this.activeKeys.has('KeyW') ||
        this.activeKeys.has('ArrowUp') ||
        this.touchGlideHeld;

      // Horizontal Acceleration — snappier, higher top speed
      const accel = this.batman.grounded ? 1.55 : 0.95;
      const maxSpeed = this.batman.grounded ? 7.4 : 7.8;

      if (moveLeft && !moveRight) {
        this.batman.vx = Math.max(-maxSpeed, this.batman.vx - accel);
        this.batman.facing = -1;
      } else if (moveRight && !moveLeft) {
        this.batman.vx = Math.min(maxSpeed, this.batman.vx + accel);
        this.batman.facing = 1;
      } else {
        // Friction — less ice, more Arkham weight
        this.batman.vx *= this.batman.grounded ? 0.76 : 0.965;
        if (Math.abs(this.batman.vx) < 0.08) this.batman.vx = 0;
      }

      // Gravity & Gliding — floatier, steerable cape
      const gravity = 0.62;
      const isGliding = !this.batman.grounded && jumpHeld && this.batman.vy > -1;

      if (isGliding) {
        this.batman.action = 'gliding';
        // Terminal glide + pump with facing
        this.batman.vy = Math.min(1.7, this.batman.vy + 0.045);
        // Steer glide with move input (mobile d-pad works mid-air)
        if (moveLeft) this.batman.vx = Math.max(-7.2, this.batman.vx - 0.28);
        else if (moveRight) this.batman.vx = Math.min(7.2, this.batman.vx + 0.28);
        else this.batman.vx += this.batman.facing * 0.16;
        this.batman.vx = Math.max(-7.4, Math.min(7.4, this.batman.vx));

        if (Math.random() < 0.35) {
          this.particles.push({
            x: this.batman.x - this.batman.facing * 36,
            y: this.batman.y - 34 + (Math.random() - 0.5) * 10,
            vx: -this.batman.facing * 2.2,
            vy: 0.4,
            size: 2.4,
            color: 'rgba(220,235,255,0.45)',
            alpha: 0.6,
            decay: 0.05,
            type: 'smoke',
          });
        }
      } else {
        this.batman.vy += gravity;
        // Clamp fall speed
        if (this.batman.vy > 16) this.batman.vy = 16;
      }

      this.batman.x += this.batman.vx;
      this.batman.y += this.batman.vy;

      // Determine Animation Action
      if (this.batman.action !== 'melee_attack' && this.batman.action !== 'batarang_throw') {
        if (this.batman.grounded) {
          this.batman.action = Math.abs(this.batman.vx) > 0.8 ? 'running' : 'idle';
        } else if (!isGliding) {
          this.batman.action = this.batman.vy < 0 ? 'jumping' : 'landing';
        }
        if (this.batman.action === 'grappling_vault' && this.batman.animTimer > 0.45) {
          this.batman.action = this.batman.vy < 0 ? 'jumping' : 'landing';
        }
      }

      // Reset action timers
      if (this.batman.action === 'melee_attack' && this.batman.animTimer > 0.28) {
        this.batman.action = this.batman.grounded ? 'idle' : 'jumping';
      }
      if (this.batman.action === 'batarang_throw' && this.batman.animTimer > 0.24) {
        this.batman.action = this.batman.grounded ? 'idle' : 'jumping';
      }

      // 3. Platform Collisions with Rooftops
      this.checkRooftopCollisions();
    }

    // Check Falling Off Screen
    if (this.batman.y > 750) {
      this.damageBatman(1);
    }

    // 4. Update Batarangs
    this.updateBatarangs();

    // 5. Update Enemies
    this.updateEnemies();

    // 5b. Robin ally assist
    this.updateRobin();

    // 6. Update Particles & Comic Popups
    this.updateParticles();
    this.capParticles();

    // 7. Update Camera (Smooth tracking with subtle forward lead)
    const targetCamX = this.batman.x - this.width * 0.38 + this.batman.facing * 60;
    const targetCamY = Math.max(0, this.batman.y - this.height * 0.68);

    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    this.cameraY += (targetCamY - this.cameraY) * 0.08;

    // Check Target Proximity for Auto Victory if close enough
    if (!this.isCompleted) {
      const targetEnemy = this.enemies.find((e) => e.type === 'target');
      if (targetEnemy && targetEnemy.state !== 'knocked_out') {
        const distToTarget = Math.hypot(targetEnemy.x - this.batman.x, targetEnemy.y - this.batman.y);
        if (distToTarget < 50) {
          this.damageEnemy(targetEnemy, 2, 'TAKEDOWN!');
        }
      }
    }

    // Callback with live stats — throttled to ~12Hz so React doesn't
    // re-render every frame (major perf win, zero functional change).
    this.statThrottle -= delta;
    if (this.statThrottle <= 0) {
      this.statThrottle = 80;
      this.callbacks.onStatsUpdate(this.stats, this.batman);
    }
    // ...but push immediately on mission end so victory isn't delayed
  }

  /** Force a HUD sync (grapple/batarang/melee feedback stays snappy). */
  private pushStats() {
    this.statThrottle = 80;
    this.callbacks.onStatsUpdate(this.stats, this.batman);
  }

  private checkRooftopCollisions(fromSwing: boolean = false) {
    let onGround = false;
    const wasGrounded = this.batman.grounded;
    const fallSpeed = this.batman.vy;

    for (const roof of this.rooftops) {
      const footLeft = this.batman.x - 13;
      const footRight = this.batman.x + 13;
      const footY = this.batman.y;

      const roofLeft = roof.x - 2;
      const roofRight = roof.x + roof.width + 2;
      const roofTop = roof.y;

      if (footRight >= roofLeft && footLeft <= roofRight) {
        // Landing on top — tolerant window for high-speed swings
        const tolerance = fromSwing ? 20 : 14;
        if (footY >= roofTop - 2 && footY - this.batman.vy <= roofTop + tolerance && this.batman.vy >= -1) {
          this.batman.y = roofTop;
          // Hard landing particles + thud
          if (!wasGrounded && fallSpeed > 9) {
            this.screenShake = Math.max(this.screenShake, 4);
            for (let k = 0; k < 8; k++) {
              this.particles.push({
                x: this.batman.x + (Math.random() - 0.5) * 28,
                y: roofTop,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 2.5,
                size: 3,
                color: 'rgba(180,190,210,0.55)',
                alpha: 0.9,
                decay: 0.06,
                type: 'smoke',
              });
            }
          }
          this.batman.vy = 0;
          // Preserve some horizontal momentum on swing landings (roll feel)
          if (fromSwing) this.batman.vx *= 0.82;
          this.batman.grounded = true;
          onGround = true;
          break;
        }
        // Side bump: push out so Batman doesn't clip through facades
        if (footY > roofTop + 14 && footY < roofTop + roof.height) {
          if (this.batman.x < roofLeft + 10 && this.batman.vx > 0) {
            this.batman.x = roofLeft - 13;
            this.batman.vx *= -0.25;
          } else if (this.batman.x > roofRight - 10 && this.batman.vx < 0) {
            this.batman.x = roofRight + 13;
            this.batman.vx *= -0.25;
          }
        }
      }
    }

    if (!onGround && this.batman.grounded && !this.batman.grappleActive) {
      this.batman.grounded = false;
    }
    // Vault anim cleanup on landing
    if (onGround && this.batman.action === 'grappling_vault') {
      this.batman.action = Math.abs(this.batman.vx) > 1 ? 'running' : 'idle';
    }
  }

  private updateBatarangs() {
    for (let i = this.batarangs.length - 1; i >= 0; i--) {
      const b = this.batarangs[i];
      const speedBefore = Math.hypot(b.vx, b.vy) || 1;

      // Homing assist — gentle curve toward locked target (feels guided, not aimbot)
      if (!b.returning && b.homingTargetId) {
        const target = this.enemies.find((e) => e.id === b.homingTargetId && e.state !== 'knocked_out');
        if (target) {
          const dx = target.x - b.x;
          const dy = target.y - 30 - b.y;
          const desired = Math.atan2(dy, dx);
          const current = Math.atan2(b.vy, b.vx);
          let diff = desired - current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const steer = Math.max(-0.14, Math.min(0.14, diff));
          const na = current + steer;
          const spd = Math.min(19, speedBefore + 0.06);
          b.vx = Math.cos(na) * spd;
          b.vy = Math.sin(na) * spd;
        } else {
          b.homingTargetId = null;
        }
      }

      if (b.returning) {
        // Boomerang return — magnet to Batman's hand
        const hx = this.batman.x;
        const hy = this.batman.y - 46;
        const dx = hx - b.x;
        const dy = hy - b.y;
        const d = Math.hypot(dx, dy) || 1;
        const desired = Math.atan2(dy, dx);
        const current = Math.atan2(b.vy, b.vx);
        let diff = desired - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const steer = Math.max(-0.28, Math.min(0.28, diff));
        const na = current + steer;
        const spd = Math.min(21, speedBefore + 0.35);
        b.vx = Math.cos(na) * spd;
        b.vy = Math.sin(na) * spd;
        // Caught!
        if (d < 36) {
          this.batarangs.splice(i, 1);
          // Catch sparkle
          this.particles.push({
            x: hx, y: hy, vx: 0, vy: -1, size: 6,
            color: 'rgba(229,169,60,0.9)', alpha: 0.8, decay: 0.12, type: 'spark',
          });
          continue;
        }
      } else {
        // Outward flight: light gravity + drag for a believable arc
        b.vy += 0.09;
        b.vx *= 0.998;
        const step = Math.hypot(b.vx, b.vy);
        b.distanceTraveled += step;
        if (b.distanceTraveled >= b.maxDistance) b.returning = true;
      }

      b.x += b.vx;
      b.y += b.vy;
      b.rotation += b.spinSpeed;
      b.lifetime--;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 12) b.trail.shift();

      // Trail glow particles (throttled)
      if (Math.random() < 0.55) {
        this.particles.push({
          x: b.x + (Math.random() - 0.5) * 4,
          y: b.y + (Math.random() - 0.5) * 4,
          vx: -b.vx * 0.06,
          vy: -b.vy * 0.06,
          size: 2.2,
          color: b.returning ? 'rgba(56,189,248,0.9)' : '#e5a93c',
          alpha: 0.75,
          decay: 0.09,
          type: 'spark',
        });
      }

      // Check hit on enemies (generous hitbox for touch)
      const hitR = this.isTouchDevice ? 26 : 20;
      for (const enemy of this.enemies) {
        if (enemy.state === 'knocked_out') continue;
        if (b.piercedIds.includes(enemy.id)) continue;
        const ex = enemy.x;
        const ey = enemy.y - enemy.height / 2;
        if (Math.hypot(b.x - ex, b.y - ey) < hitR + enemy.width * 0.3) {
          b.piercedIds.push(enemy.id);
          this.damageEnemy(enemy, b.damage, b.returning ? 'RETURN STRIKE!' : 'BATARANG HIT!');
          // First hit turns it into a returning boomerang (can hit a 2nd enemy on return)
          if (!b.returning) {
            b.returning = true;
            // Bounce slightly upward on impact
            b.vy = Math.min(b.vy, -2) - 1.5;
          }
          break;
        }
      }

      if (b.lifetime <= 0 || b.y > 900 || b.x < this.cameraX - 600 || b.x > this.cameraX + this.width + 600) {
        this.batarangs.splice(i, 1);
      }
    }
  }

  private updateEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.hitEffectTimer > 0) enemy.hitEffectTimer--;

      if (enemy.state === 'knocked_out') {
        continue;
      }

      const dxToBatman = this.batman.x - enemy.x;
      const dyToBatman = this.batman.y - enemy.y;
      const distToBatman = Math.hypot(dxToBatman, dyToBatman);

      // Thug AI
      if (enemy.type === 'thug') {
        if (distToBatman < 160 && Math.abs(dyToBatman) < 60) {
          // Alerted! Move towards Batman (+ "!" ping on first spot)
          if (enemy.state !== 'alert') {
            this.addComicPopup(enemy.x, enemy.y - 62, '!', '#ef4444');
          }
          enemy.state = 'alert';
          enemy.facing = dxToBatman > 0 ? 1 : -1;
          enemy.vx = enemy.facing * 1.6;
          enemy.x += enemy.vx;

          // Attack Batman if close
          if (distToBatman < 36 && Math.random() < 0.03) {
            this.damageBatman(1);
            this.addComicPopup(enemy.x, enemy.y - 45, 'THUG PUNCH!', '#ef4444');
          }
        } else {
          // Normal patrol back and forth
          enemy.state = 'patrol';
          enemy.x += enemy.vx;
          if (enemy.x > enemy.patrolMaxX) {
            enemy.x = enemy.patrolMaxX;
            enemy.vx = -Math.abs(enemy.vx);
            enemy.facing = -1;
          } else if (enemy.x < enemy.patrolMinX) {
            enemy.x = enemy.patrolMinX;
            enemy.vx = Math.abs(enemy.vx);
            enemy.facing = 1;
          }
        }
      }

      // Gunman AI
      if (enemy.type === 'gunman') {
        enemy.facing = dxToBatman > 0 ? 1 : -1;

        // Laser Aim
        const angle = Math.atan2(this.batman.y - 35 - (enemy.y - 35), this.batman.x - enemy.x);
        enemy.laserAngle = angle;

        // If Batman is in sight line
        if (distToBatman < 380 && (dxToBatman * enemy.facing > 0)) {
          enemy.state = 'aiming';
          enemy.aimTimer += 0.016;

          if (enemy.aimTimer > 1.3) {
            // Gunshot!
            enemy.aimTimer = 0;
            soundManager.playAlert();

            // Muzzle flash particle
            this.particles.push({
              x: enemy.x + enemy.facing * 20,
              y: enemy.y - 35,
              vx: enemy.facing * 4,
              vy: 0,
              size: 6,
              color: '#ef4444',
              alpha: 1,
              decay: 0.1,
              type: 'spark',
            });

            // If Batman is not dodging/grappling
            if (!this.batman.grappleActive) {
              this.damageBatman(1);
              this.addComicPopup(this.batman.x, this.batman.y - 50, 'SNIPER SHOT!', '#ef4444');
            } else {
              this.addComicPopup(this.batman.x, this.batman.y - 50, 'EVADED!', '#38bdf8');
            }
          }
        } else {
          enemy.state = 'patrol';
          enemy.aimTimer = Math.max(0, enemy.aimTimer - 0.02);
        }
      }

      // Target Boss AI
      if (enemy.type === 'target') {
        enemy.facing = dxToBatman > 0 ? 1 : -1;
        if (distToBatman < 220) {
          enemy.state = 'alert';
          if (distToBatman < 40 && Math.random() < 0.04) {
            this.damageBatman(1);
            this.addComicPopup(enemy.x, enemy.y - 50, 'HEAVY COUNTER!', '#ef4444');
          }
        }
      }
    }
  }

  // ---- Robin ally AI: arrives at random intervals, shadows Batman, fights ----
  private updateRobin() {
    const r = this.robin;
    r.animT += 0.016;

    if (!r.active) {
      r.cooldown--;
      this.stats.robinActive = false;
      if (r.cooldown <= 0 && !this.isCompleted) {
        // Only assist when there's live trouble nearby
        const trouble = this.enemies.some(
          (e) => e.state !== 'knocked_out' && Math.abs(e.x - this.batman.x) < 750,
        );
        if (trouble) {
          r.active = true;
          r.phase = 'arrive';
          r.timer = 0;
          r.targetId = null;
          r.punchTimer = 0;
          // Drop in behind Batman, on his roof level
          r.x = this.batman.x - this.batman.facing * 420;
          r.y = this.batman.y;
          r.vx = 0;
          r.vy = 0;
          r.facing = this.batman.facing;
          this.addComicPopup(this.batman.x, this.batman.y - 92, 'ROBIN INBOUND!', '#4ade80');
          soundManager.playJump();
        } else {
          r.cooldown = 420; // check again soon
        }
      }
      return;
    }

    this.stats.robinActive = true;
    r.timer++;

    // Find nearest live enemy (Robin hunts independently)
    let prey: Enemy | null = null;
    let best = 240;
    for (const e of this.enemies) {
      if (e.state === 'knocked_out') continue;
      const d = Math.hypot(e.x - r.x, e.y - r.y);
      if (d < best) {
        best = d;
        prey = e;
      }
    }

    if (r.phase === 'arrive' || r.phase === 'follow') {
      // Shadow Batman at ~90px offset, stick to his roof height
      const anchorX = this.batman.x - this.batman.facing * 90;
      const dx = anchorX - r.x;
      r.facing = dx >= 0 ? 1 : -1;
      r.vx += Math.max(-1.2, Math.min(1.2, dx * 0.02));
      r.vx *= 0.9;
      r.vx = Math.max(-8.5, Math.min(8.5, r.vx + (prey && best < 200 ? (prey.x - r.x) * 0.008 : 0)));
      r.x += r.vx;
      // Glue to nearest rooftop top under feet (cheap: reuse batman roofs)
      r.y = this.groundYAt(r.x, r.y);
      if (prey && best < 110) {
        r.phase = 'fight';
        r.timer = 0;
        r.targetId = prey.id;
        r.punchTimer = 0;
        this.addComicPopup(r.x, r.y - 72, 'BOY WONDER!', '#4ade80');
      } else if (r.timer > 900) {
        r.phase = 'leave';
        r.timer = 0;
      } else if (r.phase === 'arrive' && Math.abs(dx) < 60) {
        r.phase = 'follow';
        r.timer = 0;
      }
    } else if (r.phase === 'fight') {
      const target = this.enemies.find((e) => e.id === r.targetId && e.state !== 'knocked_out');
      if (!target) {
        r.phase = 'follow';
        r.timer = 0;
        r.targetId = null;
      } else {
        const dx = target.x - r.x;
        r.facing = dx >= 0 ? 1 : -1;
        if (Math.abs(dx) > 34) {
          r.x += r.facing * 4.4;
          r.y = this.groundYAt(r.x, r.y);
        } else {
          // Punch flurry — real damage, credited as assist
          r.punchTimer--;
          if (r.punchTimer <= 0) {
            r.punchTimer = 30;
            this.damageEnemy(target, 1, 'ROBIN STRIKE!', true);
            for (let i = 0; i < 6; i++) {
              this.particles.push({
                x: target.x, y: target.y - 30,
                vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 4,
                size: 2.6, color: '#4ade80', alpha: 1, decay: 0.06, type: 'spark',
              });
            }
          }
        }
        if (r.timer > 420) {
          r.phase = 'leave';
          r.timer = 0;
        }
      }
    } else if (r.phase === 'leave') {
      // Dash forward and vanish
      r.x += r.facing * 9;
      r.y = this.groundYAt(r.x, r.y);
      if (r.timer > 70) {
        r.active = false;
        r.phase = 'hidden';
        r.cooldown = 1300 + Math.random() * 1400; // ~22–45s at 60fps
        r.targetId = null;
        this.stats.robinActive = false;
      }
    }
  }

  private groundYAt(x: number, fallbackY: number): number {
    for (const roof of this.rooftops) {
      if (x >= roof.x && x <= roof.x + roof.width && fallbackY <= roof.y + 60 && fallbackY >= roof.y - 160) {
        return roof.y;
      }
    }
    // No roof under feet (mid-gap): keep current height, slight fall
    return fallbackY;
  }

  private capParticles() {
    const MAX = 220;
    if (this.particles.length > MAX) {
      this.particles.splice(0, this.particles.length - MAX);
    }
  }

  private updateParticles() {
    // Wind gusts drive rain angle + cape feel
    this.windTimer -= 1;
    if (this.windTimer <= 0) {
      this.windTimer = 240 + Math.random() * 360;
      this.windGust = -3.5 + Math.random() * 5;
    }
    // Lightning storm — occasional flash + rain burst
    this.lightningTimer -= 1;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 1100 + Math.random() * 1600;
      this.lightningFlash = 9;
    }
    if (this.lightningFlash > 0) this.lightningFlash--;

    // Ambient steam from vents (culled to viewport)
    if (this.steamTimer > 200) {
      this.steamTimer = 0;
      for (const roof of this.rooftops) {
        if (roof.x + roof.width < this.cameraX - 100 || roof.x > this.cameraX + this.width + 100) continue;
        for (const prop of roof.props) {
          if (prop.type === 'vent' && Math.abs(prop.x - this.cameraX) < this.width) {
            this.particles.push({
              x: prop.x + prop.width / 2 + (Math.random() - 0.5) * 8,
              y: prop.y - 2,
              vx: (Math.random() - 0.5) * 0.8 + this.windGust * 0.1,
              vy: -1.2 - Math.random() * 1.5,
              size: 4 + Math.random() * 6,
              color: 'rgba(200, 220, 240, 0.25)',
              alpha: 0.6,
              decay: 0.015,
              type: 'smoke',
            });
          }
        }
      }
    }

    // Rain particles — gust-driven slant + rooftop splashes (throttled)
    const slant = -2.2 + this.windGust;
    for (const rp of this.rainParticles) {
      rp.y += rp.speed * (this.lightningFlash > 0 ? 1.25 : 1);
      rp.x += slant;
      if (rp.y > this.height) {
        rp.y = -20;
        rp.x = Math.random() * (this.width + 200);
      }
    }
    this.splashTimer--;
    if (this.splashTimer <= 0) {
      this.splashTimer = 6;
      // 1 cheap splash spark — probe up to 3 random roofs, no array alloc
      for (let tries = 0; tries < 3; tries++) {
        const roof = this.rooftops[(Math.random() * this.rooftops.length) | 0];
        if (!roof) break;
        if (roof.x + roof.width < this.cameraX || roof.x > this.cameraX + this.width) continue;
        const sx = roof.x + Math.random() * roof.width;
        this.particles.push({
          x: sx, y: roof.y + 1, vx: (Math.random() - 0.5) * 1.6, vy: -0.8 - Math.random(),
          size: 1.6, color: 'rgba(190,210,240,0.6)', alpha: 0.7, decay: 0.14, type: 'spark',
        });
        break;
      }
    }
    // Traffic drift (midground car lights)
    for (const td of this.trafficDots) {
      td.x += td.speed;
      if (td.x > this.cameraX + 4200) td.x = this.cameraX - 200;
    }

    // Custom particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.type === 'smoke') {
        p.size += 0.3;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Comic popups
    for (let i = this.comicPopups.length - 1; i >= 0; i--) {
      const cp = this.comicPopups[i];
      cp.y -= 0.8;
      cp.alpha -= 0.02;
      cp.scale = Math.max(1, cp.scale - 0.02);
      if (cp.alpha <= 0) {
        this.comicPopups.splice(i, 1);
      }
    }
  }

  // Canvas Rendering
  public render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    // Screen shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake * 2;
      const sy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // Detective Vision Color Filter or Noir Gotham Palette
    if (this.isDetectiveMode) {
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, w, h);
    } else {
      // Midnight Gotham Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#060911');
      skyGrad.addColorStop(0.5, '#0b111e');
      skyGrad.addColorStop(1, '#111827');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Background Layers
    this.renderMoonAndBatSignal(ctx);
    this.renderDistantSkyline(ctx);
    this.renderMidgroundRooftops(ctx);

    // Apply Camera Translation for World Entities
    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // Foreground Gameplay Rooftops & Props
    this.renderRooftops(ctx);

    // Grapple Trajectory & Aim Indicators
    this.renderGrappleAiming(ctx);

    // Active Grapple Wire
    this.renderGrappleWire(ctx);

    // Batarangs
    this.renderBatarangs(ctx);

    // Enemies
    this.renderEnemies(ctx);

    // Robin ally (culled off-screen inside renderer check)
    if (this.robin.active) {
      if (
        this.robin.x > this.cameraX - 120 &&
        this.robin.x < this.cameraX + this.width + 120
      ) {
        renderRobin(ctx, this.robin, this.isDetectiveMode);
      }
    }

    // Batman Character
    renderBatman(ctx, this.batman, this.isDetectiveMode);

    // Particles & Popups
    this.renderParticlesAndPopups(ctx);

    ctx.restore(); // Restore world camera

    // Lightning flash (storm realism, 1 rect)
    if (this.lightningFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.22, this.lightningFlash * 0.03);
      ctx.fillStyle = '#cfe4ff';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Atmospheric Rain & Fog Overlay
    this.renderAtmosphere(ctx);

    // Detective Vision Sonar Grid & Scanlines
    if (this.isDetectiveMode) {
      this.renderDetectiveOverlay(ctx);
    }

    ctx.restore();
  }

  private renderMoonAndBatSignal(ctx: CanvasRenderingContext2D) {
    // Full Moon
    const moonX = this.width * 0.78 - this.cameraX * 0.02;
    const moonY = 120;
    const moonR = 48;

    ctx.save();
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3.5);
    moonGlow.addColorStop(0, this.isDetectiveMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(254, 240, 138, 0.35)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.isDetectiveMode ? '#1e293b' : '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Iconic Bat-Signal in the Clouds!
    const signalX = this.width * 0.32 - this.cameraX * 0.04;
    const signalY = 95;
    const pulse = 1 + Math.sin(this.batSignalPulse) * 0.05;

    ctx.save();
    // Searchlight beam
    const beamGrad = ctx.createLinearGradient(signalX - 60, this.height, signalX, signalY);
    beamGrad.addColorStop(0, 'rgba(229, 169, 60, 0.0)');
    beamGrad.addColorStop(0.7, 'rgba(229, 169, 60, 0.08)');
    beamGrad.addColorStop(1, 'rgba(243, 193, 93, 0.28)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(signalX - 10, this.height);
    ctx.lineTo(signalX - 90 * pulse, signalY - 20);
    ctx.lineTo(signalX + 90 * pulse, signalY - 20);
    ctx.lineTo(signalX + 10, this.height);
    ctx.closePath();
    ctx.fill();

    // Bat-Signal Cloud Ellipse
    const cloudGlow = ctx.createRadialGradient(signalX, signalY, 15, signalX, signalY, 70 * pulse);
    cloudGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    cloudGlow.addColorStop(0.5, 'rgba(229, 169, 60, 0.6)');
    cloudGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cloudGlow;
    ctx.beginPath();
    ctx.ellipse(signalX, signalY, 65 * pulse, 45 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bat Silhouette inside the Signal
    ctx.fillStyle = '#0b0f19';
    ctx.save();
    ctx.translate(signalX, signalY);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(6, -20);
    ctx.lineTo(8, -14);
    ctx.lineTo(24, -18);
    ctx.lineTo(28, -8);
    ctx.lineTo(16, 8);
    ctx.lineTo(0, 16);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-28, -8);
    ctx.lineTo(-24, -18);
    ctx.lineTo(-8, -14);
    ctx.lineTo(-6, -20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // Moving Searchlight Beams
    ctx.save();
    const beamAngle = Math.sin(this.searchlightAngle) * 0.45;
    const beamOriginX = this.width * 0.85;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.beginPath();
    ctx.moveTo(beamOriginX, this.height);
    ctx.lineTo(beamOriginX + Math.sin(beamAngle - 0.1) * 800, 0);
    ctx.lineTo(beamOriginX + Math.sin(beamAngle + 0.1) * 800, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderDistantSkyline(ctx: CanvasRenderingContext2D) {
    const parallax = 0.12;
    const offsetX = -this.cameraX * parallax;

    ctx.save();
    ctx.fillStyle = this.isDetectiveMode ? '#08101e' : '#0d1322';

    // Gothic skyscrapers silhouette
    const buildings = [
      { x: 50, w: 90, h: 420 },
      { x: 160, w: 120, h: 480, spire: true },
      { x: 300, w: 85, h: 360 },
      { x: 410, w: 150, h: 540, wayne: true },
      { x: 580, w: 95, h: 390 },
      { x: 700, w: 140, h: 470, spire: true },
      { x: 860, w: 110, h: 410 },
      { x: 990, w: 160, h: 520 },
      { x: 1180, w: 100, h: 370 },
      { x: 1300, w: 140, h: 490 },
      { x: 1460, w: 90, h: 430 },
      { x: 1580, w: 170, h: 560, wayne: true },
    ];

    buildings.forEach((b) => {
      const bx = b.x + offsetX;
      const by = this.height - b.h;

      ctx.fillRect(bx, by, b.w, b.h);

      if (b.spire) {
        ctx.beginPath();
        ctx.moveTo(bx + b.w / 2, by - 60);
        ctx.lineTo(bx + b.w * 0.35, by);
        ctx.lineTo(bx + b.w * 0.65, by);
        ctx.closePath();
        ctx.fill();
      }

      // Windows
      ctx.fillStyle = this.isDetectiveMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(243, 193, 93, 0.12)';
      for (let wy = by + 20; wy < this.height - 40; wy += 25) {
        for (let wx = bx + 12; wx < bx + b.w - 12; wx += 16) {
          if (Math.sin(wx * 11 + wy * 7) > 0.15) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.fillStyle = this.isDetectiveMode ? '#08101e' : '#0d1322';
    });

    ctx.restore();
  }

  private renderMidgroundRooftops(ctx: CanvasRenderingContext2D) {
    const parallax = 0.35;
    const offsetX = -this.cameraX * parallax;

    ctx.save();
    ctx.fillStyle = this.isDetectiveMode ? '#0c172a' : '#131b2e';

    const midBlocks = [
      { x: 20, w: 180, h: 320 },
      { x: 230, w: 220, h: 360, sign: 'GOTHAM' },
      { x: 480, w: 160, h: 290 },
      { x: 670, w: 240, h: 380, sign: 'WAYNE' },
      { x: 940, w: 190, h: 330 },
      { x: 1160, w: 230, h: 370 },
      { x: 1420, w: 200, h: 340, sign: 'BANK' },
    ];

    midBlocks.forEach((m) => {
      const mx = m.x + offsetX;
      const my = this.height - m.h;

      ctx.fillRect(mx, my, m.w, m.h);

      // Neon sign on midground
      if (m.sign) {
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = this.isDetectiveMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(229, 169, 60, 0.4)';
        ctx.fillText(m.sign, mx + 20, my + 30);
      }

      // Windows
      ctx.fillStyle = this.isDetectiveMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(243, 193, 93, 0.2)';
      for (let wy = my + 30; wy < this.height - 20; wy += 28) {
        for (let wx = mx + 15; wx < mx + m.w - 15; wx += 22) {
          if (Math.cos(wx * 13 + wy * 5) > 0.2) {
            ctx.fillRect(wx, wy, 10, 14);
          }
        }
      }
      ctx.fillStyle = this.isDetectiveMode ? '#0c172a' : '#131b2e';
    });

    // Street traffic — distant car lights drifting through the valley (realism, ~10 rects)
    ctx.fillStyle = 'rgba(248,113,30,0.55)';
    for (let i = 0; i < this.trafficDots.length; i++) {
      const td = this.trafficDots[i];
      const sx = td.x * 0.35 + offsetX * 0.4;
      if (sx < -20 || sx > this.width + 20) continue;
      ctx.fillStyle = td.color;
      ctx.fillRect(sx, this.height - 44 - (i % 5) * 9, i % 2 ? 7 : 4, 2);
    }

    ctx.restore();
  }

  private hashNoise(x: number, y: number): number {
    let h = Math.sin(x * 127.1 + y * 311.7 + this.noiseSeed * 0.0001) * 43758.5453;
    return h - Math.floor(h);
  }

  private renderRooftops(ctx: CanvasRenderingContext2D) {
    for (const roof of this.rooftops) {
      ctx.save();
      // Cull off-screen roofs for mobile perf
      if (roof.x + roof.width < this.cameraX - 200 || roof.x > this.cameraX + this.width + 200) {
        // Still need props? skip entirely
        ctx.restore();
        continue;
      }

      // --- Body with vertical gradient + type tint ---
      const bodyGrad = ctx.createLinearGradient(0, roof.y, 0, roof.y + roof.height);
      if (this.isDetectiveMode) {
        bodyGrad.addColorStop(0, '#0d1626');
        bodyGrad.addColorStop(0.12, '#0a101d');
        bodyGrad.addColorStop(1, '#060a12');
      } else if (roof.type === 'brick') {
        bodyGrad.addColorStop(0, '#1c1a26');
        bodyGrad.addColorStop(0.1, '#171522');
        bodyGrad.addColorStop(1, '#0c0d16');
      } else if (roof.type === 'industrial') {
        bodyGrad.addColorStop(0, '#1a2029');
        bodyGrad.addColorStop(0.1, '#141a23');
        bodyGrad.addColorStop(1, '#0a0e15');
      } else if (roof.type === 'cathedral') {
        bodyGrad.addColorStop(0, '#232031');
        bodyGrad.addColorStop(0.1, '#191724');
        bodyGrad.addColorStop(1, '#0d0c14');
      } else {
        bodyGrad.addColorStop(0, '#1a2030');
        bodyGrad.addColorStop(0.1, '#141824');
        bodyGrad.addColorStop(1, '#0a0d14');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(roof.x, roof.y, roof.width, roof.height);

      // --- Rooftop surface tar-paper / concrete texture ---
      // Base surface strip (top 26px is walkable surface with detail)
      const surfGrad = ctx.createLinearGradient(0, roof.y, 0, roof.y + 30);
      surfGrad.addColorStop(0, this.isDetectiveMode ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.09)');
      surfGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = surfGrad;
      ctx.fillRect(roof.x, roof.y, roof.width, 30);

      // Speckle noise (deterministic, cheap)
      const speckleCount = Math.min(90, Math.floor(roof.width / 6));
      for (let s = 0; s < speckleCount; s++) {
        const sx = roof.x + this.hashNoise(s, roof.x) * roof.width;
        const sy = roof.y + 2 + this.hashNoise(s * 1.7, roof.y) * 26;
        const a = 0.04 + this.hashNoise(s * 3.1, sy) * 0.08;
        ctx.fillStyle = this.isDetectiveMode ? `rgba(56,189,248,${a})` : `rgba(200,210,230,${a})`;
        ctx.fillRect(sx, sy, 2, 1.4);
      }
      // Tar seams every ~55px + stains
      ctx.strokeStyle = this.isDetectiveMode ? 'rgba(56,189,248,0.10)' : 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      for (let px = roof.x + 24; px < roof.x + roof.width; px += 55) {
        ctx.beginPath();
        ctx.moveTo(px, roof.y + 1);
        ctx.lineTo(px + 4, roof.y + 30);
        ctx.stroke();
      }
      // Panel seams down the facade
      ctx.strokeStyle = this.isDetectiveMode ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let px = roof.x + 40; px < roof.x + roof.width; px += 46) {
        ctx.beginPath();
        ctx.moveTo(px, roof.y + 30);
        ctx.lineTo(px, roof.y + roof.height);
        ctx.stroke();
      }
      // Grime streaks under rim (vertical drips)
      for (let gx = roof.x + 12; gx < roof.x + roof.width; gx += 37) {
        if (this.hashNoise(gx, roof.y) > 0.55) {
          const gh = 24 + this.hashNoise(gx * 2, 1) * 60;
          const drip = ctx.createLinearGradient(0, roof.y + 8, 0, roof.y + 8 + gh);
          drip.addColorStop(0, 'rgba(0,0,0,0.28)');
          drip.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = drip;
          ctx.fillRect(gx, roof.y + 8, 3, gh);
        }
      }
      // Neon puddle reflections — Arkham wet-roof look
      const puddleN = 1 + Math.floor(this.hashNoise(roof.x, roof.width) * 2);
      for (let p = 0; p < puddleN; p++) {
        const pwx = roof.x + 40 + this.hashNoise(p * 7, roof.x) * (roof.width - 90);
        const pwy = roof.y + 8 + this.hashNoise(p * 13, roof.y) * 14;
        const pww = 34 + this.hashNoise(p, pwx) * 46;
        ctx.save();
        ctx.globalAlpha = 0.5;
        const pg = ctx.createLinearGradient(pwx, 0, pwx + pww, 0);
        pg.addColorStop(0, 'rgba(229,169,60,0)');
        pg.addColorStop(0.5, this.isDetectiveMode ? 'rgba(56,189,248,0.28)' : 'rgba(229,169,60,0.22)');
        pg.addColorStop(1, 'rgba(229,169,60,0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.ellipse(pwx + pww / 2, pwy, pww / 2, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- Facade windows (lit offices below) ---
      const winColor = this.isDetectiveMode ? 'rgba(56,189,248,0.20)' : 'rgba(243,193,93,0.16)';
      ctx.fillStyle = winColor;
      for (let wy = roof.y + 52; wy < roof.y + roof.height - 18; wy += 34) {
        for (let wx = roof.x + 16; wx < roof.x + roof.width - 16; wx += 26) {
          const lit = this.hashNoise(wx * 0.7, wy * 1.3) > 0.42;
          if (lit) {
            ctx.fillRect(wx, wy, 12, 16);
            // Window frame shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(wx, wy + 14, 12, 2);
            ctx.fillStyle = winColor;
          }
        }
      }

      // --- Coping rim + edge light + AO ---
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(roof.x - 4, roof.y + 2, roof.width + 8, 6); // AO under rim
      ctx.fillStyle = this.isDetectiveMode ? '#1b2a44' : '#262e42';
      ctx.fillRect(roof.x - 4, roof.y - 6, roof.width + 8, 8);
      // Rim top bevel
      ctx.fillStyle = this.isDetectiveMode ? '#33507a' : '#3d4a63';
      ctx.fillRect(roof.x - 4, roof.y - 6, roof.width + 8, 2);
      // Neon edge highlight
      ctx.strokeStyle = this.isDetectiveMode ? '#38bdf8' : '#e5a93c';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = this.isDetectiveMode ? 'rgba(56,189,248,0.8)' : 'rgba(229,169,60,0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(roof.x - 4, roof.y - 6);
      ctx.lineTo(roof.x + roof.width + 4, roof.y - 6);
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (const prop of roof.props) {
        this.renderProp(ctx, prop);
      }

      if (this.isDetectiveMode) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`ZONE // ${roof.name}`, roof.x + 10, roof.y + 24);
      } else {
        // Subtle stencil zone tag on facade (Arkham graffiti feel)
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(160,175,200,0.20)';
        ctx.fillText(roof.name.slice(0, 22), roof.x + 12, roof.y + 46);
      }

      ctx.restore();
    }
  }

  private renderProp(ctx: CanvasRenderingContext2D, prop: import('./types').RooftopProp) {
    ctx.save();
    // Cull
    if (prop.x + prop.width < this.cameraX - 100 || prop.x > this.cameraX + this.width + 100) {
      ctx.restore();
      return;
    }

    if (prop.type === 'water_tower') {
      ctx.strokeStyle = '#3a4358';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(prop.x + 10, prop.y + prop.height);
      ctx.lineTo(prop.x + 22, prop.y + 35);
      ctx.moveTo(prop.x + prop.width - 10, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width - 22, prop.y + 35);
      ctx.moveTo(prop.x + 14, prop.y + prop.height - 15);
      ctx.lineTo(prop.x + prop.width - 14, prop.y + 55);
      ctx.moveTo(prop.x + prop.width - 14, prop.y + prop.height - 15);
      ctx.lineTo(prop.x + 14, prop.y + 55);
      ctx.stroke();
      // Tank with wood-plank gradient + metal bands
      const tankGrad = ctx.createLinearGradient(prop.x, 0, prop.x + prop.width, 0);
      tankGrad.addColorStop(0, '#171c28');
      tankGrad.addColorStop(0.25, '#2a3348');
      tankGrad.addColorStop(0.5, '#232b3e');
      tankGrad.addColorStop(1, '#12161f');
      ctx.fillStyle = tankGrad;
      ctx.fillRect(prop.x + 15, prop.y + 10, prop.width - 30, 45);
      // Plank lines
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      for (let py = prop.y + 16; py < prop.y + 52; py += 7) {
        ctx.beginPath();
        ctx.moveTo(prop.x + 15, py);
        ctx.lineTo(prop.x + prop.width - 15, py);
        ctx.stroke();
      }
      // Metal bands with rivets
      ctx.fillStyle = '#0d1119';
      ctx.fillRect(prop.x + 15, prop.y + 18, prop.width - 30, 3);
      ctx.fillRect(prop.x + 15, prop.y + 42, prop.width - 30, 3);
      ctx.fillStyle = 'rgba(229,169,60,0.5)';
      for (let rx = prop.x + 20; rx < prop.x + prop.width - 18; rx += 10) {
        ctx.fillRect(rx, prop.y + 19, 1.5, 1.5);
      }
      // Conical roof with rim light
      ctx.fillStyle = '#10141d';
      ctx.beginPath();
      ctx.moveTo(prop.x + prop.width / 2, prop.y);
      ctx.lineTo(prop.x + 10, prop.y + 12);
      ctx.lineTo(prop.x + prop.width - 10, prop.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,170,210,0.35)';
      ctx.beginPath();
      ctx.moveTo(prop.x + prop.width / 2, prop.y);
      ctx.lineTo(prop.x + prop.width - 10, prop.y + 12);
      ctx.stroke();
    } else if (prop.type === 'vent') {
      const vg = ctx.createLinearGradient(prop.x, prop.y, prop.x, prop.y + prop.height);
      vg.addColorStop(0, '#2c3549');
      vg.addColorStop(0.25, '#222838');
      vg.addColorStop(1, '#12161f');
      ctx.fillStyle = vg;
      ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
      // Top highlight
      ctx.fillStyle = 'rgba(200,215,240,0.22)';
      ctx.fillRect(prop.x, prop.y, prop.width, 2);
      ctx.strokeStyle = '#0b0e15';
      ctx.lineWidth = 1.5;
      for (let vy = prop.y + 5; vy < prop.y + prop.height; vy += 4) {
        ctx.beginPath();
        ctx.moveTo(prop.x + 3, vy);
        ctx.lineTo(prop.x + prop.width - 3, vy);
        ctx.stroke();
      }
      // Side shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(prop.x + prop.width - 4, prop.y, 4, prop.height);
    } else if (prop.type === 'gargoyle') {
      // Stone body with chiseled shading
      const gg = ctx.createLinearGradient(prop.x, 0, prop.x + prop.width, 0);
      gg.addColorStop(0, '#12161f');
      gg.addColorStop(0.5, '#2b3449');
      gg.addColorStop(1, '#141a26');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(prop.x, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width, prop.y + 5);
      ctx.lineTo(prop.x + prop.width + 10, prop.y);
      ctx.lineTo(prop.x + prop.width + 14, prop.y + 6);
      ctx.lineTo(prop.x + prop.width - 5, prop.y + prop.height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,205,235,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Wing notch
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(prop.x + 8, prop.y + prop.height - 6);
      ctx.lineTo(prop.x + prop.width - 2, prop.y + 12);
      ctx.stroke();
      // Eye glow with halo
      const ex = prop.x + prop.width + 6;
      const ey = prop.y + 4;
      ctx.shadowColor = this.isDetectiveMode ? '#38bdf8' : '#e5a93c';
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.isDetectiveMode ? '#38bdf8' : '#f3c15d';
      ctx.fillRect(ex, ey, 2.6, 2.6);
      ctx.shadowBlur = 0;
    } else if (prop.type === 'billboard') {
      // Support legs
      ctx.strokeStyle = '#3a4358';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(prop.x + 15, prop.y + prop.height);
      ctx.lineTo(prop.x + 15, prop.y + prop.height + 30);
      ctx.moveTo(prop.x + prop.width - 15, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width - 15, prop.y + prop.height + 30);
      ctx.stroke();
      // Panel with subtle vignette
      const bg = ctx.createLinearGradient(0, prop.y, 0, prop.y + prop.height);
      bg.addColorStop(0, '#141a27');
      bg.addColorStop(1, '#090d15');
      ctx.fillStyle = bg;
      ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
      const neon = prop.extra?.includes('ACE') ? '#4ade80' : prop.extra?.includes('CHRONICLE') ? '#38bdf8' : '#e5a93c';
      // Flicker (Arkham neon buzz)
      const flick = Math.sin((performance.now() / 240) + prop.x) > -0.92 ? 1 : 0.35;
      ctx.save();
      ctx.globalAlpha = flick;
      ctx.shadowColor = neon;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = neon;
      ctx.lineWidth = 2;
      ctx.strokeRect(prop.x, prop.y, prop.width, prop.height);
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = neon;
      ctx.textAlign = 'center';
      ctx.fillText(prop.extra || 'GOTHAM', prop.x + prop.width / 2, prop.y + prop.height / 2 + 5);
      ctx.restore();
      ctx.textAlign = 'left';
      // Light spill onto roof
      ctx.fillStyle = neon + '22';
      ctx.fillRect(prop.x - 6, prop.y + prop.height, prop.width + 12, 8);
    } else if (prop.type === 'antenna') {
      const cx = prop.x + prop.width / 2;
      ctx.strokeStyle = '#5b6b87';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, prop.y + prop.height);
      ctx.lineTo(cx, prop.y);
      ctx.stroke();
      // Cross arms + dish
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 7, prop.y + 14);
      ctx.lineTo(cx + 7, prop.y + 14);
      ctx.moveTo(cx - 5, prop.y + 26);
      ctx.lineTo(cx + 5, prop.y + 26);
      ctx.stroke();
      ctx.fillStyle = '#1b2334';
      ctx.beginPath();
      ctx.arc(cx + 6, prop.y + 20, 5, -0.6, 1.4);
      ctx.fill();
      const blink = Math.sin(performance.now() / 380 + prop.x) > 0;
      if (blink) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = blink ? '#ef4444' : '#4a1518';
      ctx.beginPath();
      ctx.arc(cx, prop.y - 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // pipes / skylight fallback with texture
      ctx.fillStyle = '#222838';
      ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
      ctx.fillStyle = 'rgba(200,215,240,0.18)';
      ctx.fillRect(prop.x, prop.y, prop.width, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.strokeRect(prop.x, prop.y, prop.width, prop.height);
    }

    ctx.restore();
  }

  private renderGrappleAiming(ctx: CanvasRenderingContext2D) {
    const validAnchors = this.getValidAnchorsInRange(this.grappleRange);
    const validIds = new Set(validAnchors.map((a) => a.id));

    // Range ring around Batman on touch (mobile readability)
    if (this.isTouchDevice && !this.batman.grappleActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(229,169,60,0.16)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(this.batman.x, this.batman.y - 45, this.grappleRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const roof of this.rooftops) {
      for (const anc of roof.anchors) {
        // Cull far anchors
        if (anc.x < this.cameraX - 120 || anc.x > this.cameraX + this.width + 120) continue;
        const inRange = validIds.has(anc.id);
        const isHovered = this.hoveredAnchor?.id === anc.id;

        ctx.save();
        ctx.translate(anc.x, anc.y);

        if (inRange || this.isDetectiveMode) {
          const color = isHovered ? '#38bdf8' : inRange ? '#e5a93c' : 'rgba(100,116,139,0.4)';
          const R = isHovered ? (this.isTouchDevice ? 16 : 12) : this.isTouchDevice ? 12 : 8;
          // Pulsing halo for in-range anchors (mobile affordance)
          if (inRange && !this.batman.grappleActive) {
            const pulse = 1 + Math.sin(performance.now() / 320 + anc.x) * 0.12;
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, (R + 5) * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = isHovered ? 2.2 : 1.4;
          ctx.shadowColor = color;
          ctx.shadowBlur = inRange ? 8 : 0;
          ctx.beginPath();
          ctx.arc(0, 0, R, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          // Rotating ticks
          const rot = performance.now() / 900;
          ctx.save();
          ctx.rotate(rot);
          ctx.beginPath();
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            ctx.moveTo(Math.cos(a) * (R + 3), Math.sin(a) * (R + 3));
            ctx.lineTo(Math.cos(a) * (R + 7), Math.sin(a) * (R + 7));
          }
          ctx.stroke();
          ctx.restore();
          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(-R - 6, 0);
          ctx.lineTo(-R + 2, 0);
          ctx.moveTo(R - 2, 0);
          ctx.lineTo(R + 6, 0);
          ctx.moveTo(0, -R - 6);
          ctx.lineTo(0, -R + 2);
          ctx.moveTo(0, R - 2);
          ctx.lineTo(0, R + 6);
          ctx.stroke();

          if (isHovered || this.isDetectiveMode || (this.isTouchDevice && inRange)) {
            ctx.font = '700 9px "JetBrains Mono", monospace';
            // Pill background
            const label = anc.label || 'ANCHOR';
            const dist = Math.round(Math.hypot(anc.x - this.batman.x, anc.y - (this.batman.y - 45)) / 10);
            const txt = `${label} · ${dist}m`;
            const tw = ctx.measureText(txt).width;
            ctx.fillStyle = 'rgba(5,8,14,0.82)';
            ctx.fillRect(12, -8, tw + 12, 22);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(12, -8, tw + 12, 22);
            ctx.fillStyle = color;
            ctx.fillText(txt, 18, 6);
          }
        }

        ctx.restore();

        if (isHovered && inRange && !this.batman.grappleActive) {
          // Dotted predicted cable + swing arc hint
          ctx.save();
          ctx.strokeStyle = 'rgba(56,189,248,0.7)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(this.batman.x, this.batman.y - 45);
          ctx.lineTo(anc.x, anc.y);
          ctx.stroke();
          ctx.setLineDash([]);
          // Swing arc preview (small arc under anchor)
          ctx.strokeStyle = 'rgba(56,189,248,0.35)';
          ctx.beginPath();
          ctx.arc(anc.x, anc.y, Math.hypot(anc.x - this.batman.x, anc.y - (this.batman.y - 45)) * 0.55, 0.4, 1.4);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Batarang trajectory preview (short dotted line from hand along last aim / facing)
    if (!this.batman.grappleActive && this.batman.batarangCooldown <= 0.1) {
      const ang =
        this.aimWorldPos && Math.hypot(this.aimWorldPos.x - this.batman.x, this.aimWorldPos.y - this.batman.y) > 80
          ? Math.atan2(this.aimWorldPos.y - (this.batman.y - 48), this.aimWorldPos.x - this.batman.x)
          : this.batman.facing === 1
            ? -0.08
            : Math.PI + 0.08;
      ctx.save();
      ctx.strokeStyle = 'rgba(229,169,60,0.4)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      let px = this.batman.x + Math.cos(ang) * 26;
      let py = this.batman.y - 48 + Math.sin(ang) * 8;
      let vx = Math.cos(ang) * 17.5;
      let vy = Math.sin(ang) * 17.5;
      ctx.moveTo(px, py);
      for (let s = 0; s < 14; s++) {
        vy += 0.09;
        px += vx * 0.55;
        py += vy * 0.55;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderGrappleWire(ctx: CanvasRenderingContext2D) {
    const b = this.batman;
    if (!b.grappleActive || !b.grappleTarget) return;
    ctx.save();
    const handX = b.x + b.facing * 16;
    const handY = b.y - 48;
    const target = b.grapplePhase === 'firing' && b.grappleHook ? b.grappleHook : b.grappleTarget;

    // Sag control point (catenary feel when attached)
    const mx = (handX + target.x) / 2;
    const my = (handY + target.y) / 2;
    const sag = b.grapplePhase === 'attached' ? 14 : 2;

    // Glow underlay
    ctx.strokeStyle = 'rgba(243,193,93,0.35)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(mx, my + sag, target.x, target.y);
    ctx.stroke();
    // Steel core with braided dashes
    ctx.strokeStyle = '#f3c15d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(mx, my + sag, target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,15,0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(mx, my + sag, target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hook head (firing) or claw (attached)
    if (b.grapplePhase === 'firing') {
      ctx.save();
      ctx.translate(target.x, target.y);
      ctx.rotate(Math.atan2(target.y - handY, target.x - handX));
      ctx.fillStyle = '#e5a93c';
      ctx.shadowColor = '#e5a93c';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-4, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-4, 2);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Anchor claw + impact ring
      ctx.fillStyle = '#e5a93c';
      ctx.shadowColor = '#e5a93c';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.grappleTarget.x, b.grappleTarget.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(243,193,93,0.8)';
      ctx.lineWidth = 1.5;
      const ringR = 8 + ((performance.now() / 300) % 10);
      ctx.globalAlpha = Math.max(0, 1 - ringR / 18);
      ctx.beginPath();
      ctx.arc(b.grappleTarget.x, b.grappleTarget.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  private renderBatarangs(ctx: CanvasRenderingContext2D) {
    for (const b of this.batarangs) {
      // Trail ribbon
      if (b.trail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let s = 1; s < b.trail.length; s++) {
          const t = s / b.trail.length;
          ctx.strokeStyle = b.returning
            ? `rgba(56,189,248,${0.08 + t * 0.4})`
            : `rgba(229,169,60,${0.08 + t * 0.45})`;
          ctx.lineWidth = 1 + t * 3.2;
          ctx.beginPath();
          ctx.moveTo(b.trail[s - 1].x, b.trail[s - 1].y);
          ctx.lineTo(b.trail[s].x, b.trail[s].y);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      // Glow halo
      ctx.shadowColor = b.returning ? '#38bdf8' : '#e5a93c';
      ctx.shadowBlur = 12;
      ctx.rotate(b.rotation);
      // Metallic body with gradient
      const bg = ctx.createLinearGradient(-14, 0, 14, 0);
      bg.addColorStop(0, '#1a2233');
      bg.addColorStop(0.5, '#0a0e16');
      bg.addColorStop(1, '#232f45');
      ctx.fillStyle = bg;
      ctx.strokeStyle = b.returning ? '#7dd3fc' : '#f3c15d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.lineTo(4.5, -8.5);
      ctx.lineTo(15, -2);
      ctx.lineTo(8.5, 4.5);
      ctx.lineTo(0, 1.2);
      ctx.lineTo(-8.5, 4.5);
      ctx.lineTo(-15, -2);
      ctx.lineTo(-4.5, -8.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Center gem + edge glint
      ctx.fillStyle = b.returning ? '#38bdf8' : '#e5a93c';
      ctx.beginPath();
      ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -3.5);
      ctx.lineTo(-3, -6);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      // Cull far off-screen enemies (level 2 has 15 — big win)
      if (enemy.x < this.cameraX - 420 || enemy.x > this.cameraX + this.width + 420) continue;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.scale(enemy.facing, 1);

      const isKO = enemy.state === 'knocked_out';

      if (isKO) {
        // Knocked out on ground
        ctx.fillStyle = this.isDetectiveMode ? '#334155' : '#1e2433';
        ctx.fillRect(-22, -8, 44, 8);
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Zzz', 6, -14);
        ctx.restore();
        continue;
      }

      // Sniper Laser Sight
      if (enemy.type === 'gunman' && enemy.laserAngle !== undefined) {
        ctx.save();
        const laserColor = enemy.state === 'aiming' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = laserColor;
        ctx.lineWidth = enemy.state === 'aiming' ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(15, -34);
        ctx.lineTo(Math.cos(enemy.laserAngle) * 350, Math.sin(enemy.laserAngle) * 350);
        ctx.stroke();
        ctx.restore();
      }

      // Enemy Body Rendering
      if (enemy.type === 'thug') {
        // Street Thug (Jacket & mask)
        ctx.fillStyle = this.isDetectiveMode ? '#475569' : '#334155';
        ctx.fillRect(-10, -48, 20, 24); // Torso

        ctx.fillStyle = this.isDetectiveMode ? '#1e293b' : '#1f2937';
        ctx.fillRect(-9, -24, 8, 24); // Left leg
        ctx.fillRect(1, -24, 8, 24); // Right leg

        // Head
        ctx.fillStyle = this.isDetectiveMode ? '#64748b' : '#d97706';
        ctx.beginPath();
        ctx.arc(0, -53, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pipe / Crowbar
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -38);
        ctx.lineTo(18, -48);
        ctx.stroke();
      } else if (enemy.type === 'gunman') {
        // Marksman (tactical vest & sniper rifle)
        ctx.fillStyle = this.isDetectiveMode ? '#334155' : '#1e293b';
        ctx.fillRect(-10, -48, 20, 24); // Torso

        // Legs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -24, 8, 24);
        ctx.fillRect(1, -24, 8, 24);

        // Head with balaclava
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -53, 7, 0, Math.PI * 2);
        ctx.fill();

        // Sniper Rifle
        ctx.fillStyle = '#020617';
        ctx.fillRect(4, -36, 24, 5);
        ctx.fillRect(14, -40, 10, 3); // Scope
      } else if (enemy.type === 'target') {
        // Crime Boss Target (Heavy armor, glowing tech briefcase)
        ctx.fillStyle = this.isDetectiveMode ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(-14, -52, 28, 28); // Heavy chest armor

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, -24, 10, 24);
        ctx.fillRect(2, -24, 10, 24);

        // Boss Head & cybernetic eyepiece
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, -58, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red optic eye
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2, -60, 4, 3);

        // Tactical Briefcase
        ctx.fillStyle = '#090d14';
        ctx.fillRect(12, -32, 14, 12);
        ctx.fillStyle = '#e5a93c';
        ctx.fillRect(15, -28, 8, 3); // Stolen intel glow
      }

      // Detective Vision Skeleton / Threat Box
      if (this.isDetectiveMode) {
        ctx.strokeStyle = enemy.type === 'target' ? '#ef4444' : '#f97316';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-16, -65, 32, 65);

        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = enemy.type === 'target' ? '#ef4444' : '#f97316';
        ctx.fillText(enemy.type === 'target' ? 'HIGH VALUE TARGET' : 'HOSTILE', -20, -70);
      }

      ctx.restore();
    }
  }

  private renderParticlesAndPopups(ctx: CanvasRenderingContext2D) {
    // Custom particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Comic popups
    for (const cp of this.comicPopups) {
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.scale(cp.scale, cp.scale);
      ctx.globalAlpha = Math.max(0, cp.alpha);

      ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(cp.text, 0, 0);

      // Text
      ctx.fillStyle = cp.color;
      ctx.fillText(cp.text, 0, 0);

      ctx.restore();
    }
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D) {
    // Rain
    ctx.save();
    ctx.strokeStyle = this.isDetectiveMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 1;

    for (const r of this.rainParticles) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 3, r.y + r.len);
      ctx.stroke();
    }

    // Rolling fog gradient in street valleys
    const fog = ctx.createLinearGradient(0, this.height - 90, 0, this.height);
    fog.addColorStop(0, 'rgba(11, 14, 20, 0)');
    fog.addColorStop(1, this.isDetectiveMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(11, 14, 20, 0.85)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, this.height - 90, this.width, 90);

    ctx.restore();
  }

  private renderDetectiveOverlay(ctx: CanvasRenderingContext2D) {
    const w = this.width;
    const h = this.height;

    ctx.save();
    // Sonar grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Screen border corner brackets
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const bSize = 30;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(20, 20 + bSize);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + bSize, 20);
    // Top-right
    ctx.moveTo(w - 20 - bSize, 20);
    ctx.lineTo(w - 20, 20);
    ctx.lineTo(w - 20, 20 + bSize);
    // Bottom-left
    ctx.moveTo(20, h - 20 - bSize);
    ctx.lineTo(20, h - 20);
    ctx.lineTo(20 + bSize, h - 20);
    // Bottom-right
    ctx.moveTo(w - 20 - bSize, h - 20);
    ctx.lineTo(w - 20, h - 20);
    ctx.lineTo(w - 20, h - 20 - bSize);
    ctx.stroke();

    // Top Detective Mode Banner
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('DETECTIVE MODE // SONAR RECON ACTIVE', 35, 36);

    ctx.restore();
  }

  public getRemainingDistance(): number {
    return Math.max(0, Math.round(this.targetX - this.batman.x));
  }
}
