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
} from './types';
import { createInitialLevel } from './levelData';
import { renderBatman } from './batmanRenderer';
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

  // Viewport & Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public screenShake: number = 0;
  public width: number = 1200;
  public height: number = 700;

  // Targeting & Controls
  public mousePos: Point = { x: 0, y: 0 };
  public hoveredAnchor: GrappleAnchor | null = null;
  public activeKeys: Set<string> = new Set();
  public isDetectiveMode: boolean = false;

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
    };
  }

  public initLevel() {
    const level = createInitialLevel();
    this.rooftops = level.rooftops;
    this.enemies = level.enemies;
    this.targetX = level.targetX;
    this.batarangs = [];
    this.particles = [];
    this.comicPopups = [];
    this.batman = this.createDefaultBatman();
    this.isCompleted = false;
    this.stats = {
      timeElapsed: 0,
      hostilesDefeated: 0,
      totalHostiles: this.enemies.length,
      grapplesUsed: 0,
      batarangsThrown: 0,
      maxCombo: 0,
    };
  }

  private initRain() {
    this.rainParticles = [];
    for (let i = 0; i < 140; i++) {
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

  public restart() {
    this.initLevel();
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
    if (rect) {
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
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
      this.jump();
    }
  }

  public onKeyUp(code: string) {
    this.activeKeys.delete(code);
  }

  public onMouseMove(x: number, y: number) {
    this.mousePos = { x, y };
    this.updateHoveredAnchor();
  }

  public onMouseClick(x: number, y: number, isRightClick: boolean = false) {
    this.mousePos = { x, y };

    if (isRightClick) {
      this.tryGrappleNearest();
      return;
    }

    // If clicking an anchor, grapple to it!
    const worldX = x + this.cameraX;
    const worldY = y + this.cameraY;
    const clickedAnchor = this.findAnchorNear(worldX, worldY, 50);

    if (clickedAnchor) {
      this.grappleTo(clickedAnchor);
    } else {
      // Normal click: throw batarang or attack if enemy close
      const closeEnemy = this.enemies.find(
        (e) => e.state !== 'knocked_out' && Math.hypot(e.x - this.batman.x, e.y - this.batman.y) < 70
      );
      if (closeEnemy) {
        this.meleeAttack();
      } else {
        this.throwBatarang();
      }
    }
  }

  // Traversal & Gadgets
  public jump() {
    if (this.batman.grounded && !this.batman.grappleActive) {
      this.batman.vy = -12.8;
      this.batman.grounded = false;
      this.batman.action = 'jumping';
      soundManager.playJump();

      // Jump dust particle
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: this.batman.x + (Math.random() * 20 - 10),
          y: this.batman.y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          size: 3,
          color: 'rgba(150, 150, 150, 0.5)',
          alpha: 1,
          decay: 0.04,
          type: 'smoke',
        });
      }
    }
  }

  public throwBatarang() {
    if (this.batman.batarangCooldown > 0) return;

    this.batman.batarangCooldown = 1.0;
    this.batman.action = 'batarang_throw';
    this.batman.animTimer = 0;
    soundManager.playBatarangThrow();
    this.stats.batarangsThrown++;

    const spawnX = this.batman.x + this.batman.facing * 20;
    const spawnY = this.batman.y - 48;

    this.batarangs.push({
      id: `batarang_${Date.now()}`,
      x: spawnX,
      y: spawnY,
      vx: this.batman.facing * 14,
      vy: -0.6,
      rotation: 0,
      lifetime: 50,
      hit: false,
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
    // Find valid grapple anchor within range in front or near cursor
    const validAnchors = this.getValidAnchorsInRange();
    if (validAnchors.length === 0) return;

    // Pick best anchor: prioritized by mouse hover or forward facing
    let bestAnchor = validAnchors[0];
    let bestScore = -Infinity;

    for (const anchor of validAnchors) {
      const dx = anchor.x - this.batman.x;
      const dy = anchor.y - this.batman.y;
      const dist = Math.hypot(dx, dy);

      // Prefer forward anchors
      const forwardBonus = (dx * this.batman.facing > 0) ? 100 : 0;
      // Prefer elevated anchors
      const heightBonus = dy < 0 ? 50 : 0;
      // Distance score
      const score = 400 - dist + forwardBonus + heightBonus;

      if (score > bestScore) {
        bestScore = score;
        bestAnchor = anchor;
      }
    }

    if (bestAnchor) {
      this.grappleTo(bestAnchor);
    }
  }

  public grappleTo(anchor: GrappleAnchor) {
    this.batman.grappleActive = true;
    this.batman.grappleTarget = { x: anchor.x, y: anchor.y };
    this.batman.grappleAnchorId = anchor.id;
    this.batman.grappleProgress = 0;
    this.batman.grounded = false;
    this.batman.action = 'grappling_pull';
    this.batman.facing = anchor.x >= this.batman.x ? 1 : -1;

    const dx = anchor.x - this.batman.x;
    const dy = anchor.y - (this.batman.y - 50);
    this.batman.grappleLength = Math.hypot(dx, dy);

    this.stats.grapplesUsed++;
    soundManager.playGrappleShoot();

    setTimeout(() => {
      soundManager.playGrappleAttach();
      soundManager.playGrapplePull();
    }, 60);

    // Grapnel line spark particles at anchor
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: anchor.x,
        y: anchor.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: 3,
        color: '#e5a93c',
        alpha: 1,
        decay: 0.05,
        type: 'spark',
      });
    }

    this.screenShake = 3;
  }

  private getValidAnchorsInRange(maxRange: number = 460): GrappleAnchor[] {
    const valid: GrappleAnchor[] = [];
    for (const roof of this.rooftops) {
      for (const anc of roof.anchors) {
        const dist = Math.hypot(anc.x - this.batman.x, anc.y - (this.batman.y - 50));
        if (dist <= maxRange && dist > 30) {
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
  public damageEnemy(enemy: Enemy, damage: number = 1, comicText: string = 'HIT') {
    enemy.health -= damage;
    enemy.hitEffectTimer = 10;
    enemy.state = 'alert';
    soundManager.playHit();

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

    // Batman Batarang Cooldown
    if (this.batman.batarangCooldown > 0) {
      this.batman.batarangCooldown = Math.max(0, this.batman.batarangCooldown - 0.03);
    }

    // Combo Timer
    if (this.batman.comboTimer > 0) {
      this.batman.comboTimer--;
      if (this.batman.comboTimer <= 0) {
        this.batman.combo = 0;
      }
    }

    // 1. Batman Grappling Mechanics
    if (this.batman.grappleActive && this.batman.grappleTarget) {
      const target = this.batman.grappleTarget;
      const dx = target.x - this.batman.x;
      const dy = target.y - (this.batman.y - 45);
      const dist = Math.hypot(dx, dy);

      this.batman.action = 'grappling_pull';
      this.batman.facing = dx >= 0 ? 1 : -1;

      // Speed accelerates smoothly along the cable
      const pullSpeed = Math.min(22, Math.max(12, dist * 0.12));
      const nx = dx / dist;
      const ny = dy / dist;

      this.batman.vx = nx * pullSpeed;
      this.batman.vy = ny * pullSpeed;

      this.batman.x += this.batman.vx;
      this.batman.y += this.batman.vy;

      // Cable friction particles
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.batman.x,
          y: this.batman.y - 45,
          vx: -nx * 3 + (Math.random() - 0.5) * 2,
          vy: -ny * 3 + (Math.random() - 0.5) * 2,
          size: 2.5,
          color: '#e5a93c',
          alpha: 0.8,
          decay: 0.08,
          type: 'spark',
        });
      }

      // Reached anchor ledge!
      if (dist < 32) {
        this.batman.grappleActive = false;
        this.batman.grappleTarget = null;
        // Launch up onto roof ledge smoothly
        this.batman.vy = -6.5;
        this.batman.vx = this.batman.facing * 4.5;
        this.batman.action = 'grappling_vault';
        soundManager.playJump();

        this.addComicPopup(this.batman.x, this.batman.y - 40, 'VAULT!', '#e5a93c');
      }
    } else {
      // 2. Normal Batman Physics & Input
      const moveLeft = this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft');
      const moveRight = this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight');
      const jumpHeld = this.activeKeys.has('Space') || this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp');

      // Horizontal Acceleration
      const accel = this.batman.grounded ? 1.4 : 0.8;
      const maxSpeed = 6.8;

      if (moveLeft && !moveRight) {
        this.batman.vx = Math.max(-maxSpeed, this.batman.vx - accel);
        this.batman.facing = -1;
      } else if (moveRight && !moveLeft) {
        this.batman.vx = Math.min(maxSpeed, this.batman.vx + accel);
        this.batman.facing = 1;
      } else {
        // Friction
        this.batman.vx *= this.batman.grounded ? 0.78 : 0.94;
        if (Math.abs(this.batman.vx) < 0.1) this.batman.vx = 0;
      }

      // Gravity & Gliding
      const gravity = 0.58;
      const isGliding = !this.batman.grounded && jumpHeld && this.batman.vy > 0.5;

      if (isGliding) {
        // Glide wings spread! Slow descent, forward glide drift
        this.batman.action = 'gliding';
        this.batman.vy = Math.min(1.8, this.batman.vy + 0.05); // Terminal glide speed
        this.batman.vx += this.batman.facing * 0.25;
        this.batman.vx = Math.max(-6.0, Math.min(6.0, this.batman.vx));

        // Wind vapor trails
        if (Math.random() < 0.3) {
          this.particles.push({
            x: this.batman.x - this.batman.facing * 35,
            y: this.batman.y - 35,
            vx: -this.batman.facing * 2,
            vy: 0,
            size: 2,
            color: 'rgba(255, 255, 255, 0.4)',
            alpha: 0.6,
            decay: 0.05,
            type: 'smoke',
          });
        }
      } else {
        this.batman.vy += gravity;
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
      }

      // Reset action timers
      if (this.batman.action === 'melee_attack' && this.batman.animTimer > 0.25) {
        this.batman.action = this.batman.grounded ? 'idle' : 'jumping';
      }
      if (this.batman.action === 'batarang_throw' && this.batman.animTimer > 0.2) {
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

    // 6. Update Particles & Comic Popups
    this.updateParticles();

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

    // Callback with live stats
    this.callbacks.onStatsUpdate(this.stats, this.batman);
  }

  private checkRooftopCollisions() {
    let onGround = false;

    for (const roof of this.rooftops) {
      const footLeft = this.batman.x - 14;
      const footRight = this.batman.x + 14;
      const footY = this.batman.y;

      const roofLeft = roof.x;
      const roofRight = roof.x + roof.width;
      const roofTop = roof.y;

      // Check landing on top of rooftop
      if (footRight >= roofLeft && footLeft <= roofRight) {
        if (footY >= roofTop && footY - this.batman.vy <= roofTop + 14 && this.batman.vy >= 0) {
          this.batman.y = roofTop;
          this.batman.vy = 0;
          this.batman.grounded = true;
          onGround = true;
          break;
        }
      }
    }

    if (!onGround && this.batman.grounded && !this.batman.grappleActive) {
      this.batman.grounded = false;
    }
  }

  private updateBatarangs() {
    for (let i = this.batarangs.length - 1; i >= 0; i--) {
      const b = this.batarangs[i];
      b.x += b.vx;
      b.y += b.vy;
      b.rotation += 0.45;
      b.lifetime--;

      // Batarang trail spark
      if (Math.random() < 0.6) {
        this.particles.push({
          x: b.x,
          y: b.y,
          vx: -b.vx * 0.1,
          vy: (Math.random() - 0.5) * 1.5,
          size: 2,
          color: '#e5a93c',
          alpha: 0.8,
          decay: 0.08,
          type: 'spark',
        });
      }

      // Check hit on enemies
      for (const enemy of this.enemies) {
        if (enemy.state === 'knocked_out') continue;

        if (
          b.x >= enemy.x - enemy.width / 2 &&
          b.x <= enemy.x + enemy.width / 2 &&
          b.y >= enemy.y - enemy.height &&
          b.y <= enemy.y
        ) {
          b.hit = true;
          this.damageEnemy(enemy, 1, 'BATARANG HIT!');
          break;
        }
      }

      if (b.hit || b.lifetime <= 0) {
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
          // Alerted! Move towards Batman
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

  private updateParticles() {
    // Ambient steam from vents
    if (this.steamTimer > 200) {
      this.steamTimer = 0;
      for (const roof of this.rooftops) {
        for (const prop of roof.props) {
          if (prop.type === 'vent' && Math.abs(prop.x - this.cameraX) < this.width) {
            this.particles.push({
              x: prop.x + prop.width / 2 + (Math.random() - 0.5) * 8,
              y: prop.y - 2,
              vx: (Math.random() - 0.5) * 0.8,
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

    // Rain particles
    for (const r of this.rainParticles) {
      r.y += r.speed;
      r.x -= 2.2; // Angled rain
      if (r.y > this.height) {
        r.y = -20;
        r.x = Math.random() * (this.width + 200);
      }
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

    // Batman Character
    renderBatman(ctx, this.batman, this.isDetectiveMode);

    // Particles & Popups
    this.renderParticlesAndPopups(ctx);

    ctx.restore(); // Restore world camera

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

    ctx.restore();
  }

  private renderRooftops(ctx: CanvasRenderingContext2D) {
    for (const roof of this.rooftops) {
      ctx.save();

      // Rooftop body
      ctx.fillStyle = this.isDetectiveMode ? '#0a101d' : '#141824';
      ctx.fillRect(roof.x, roof.y, roof.width, roof.height);

      // Coping rim on roof edge
      ctx.fillStyle = this.isDetectiveMode ? '#1e293b' : '#222838';
      ctx.fillRect(roof.x - 4, roof.y - 6, roof.width + 8, 8);

      // Highlight line along top edge
      ctx.strokeStyle = this.isDetectiveMode ? '#38bdf8' : '#e5a93c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roof.x - 4, roof.y - 6);
      ctx.lineTo(roof.x + roof.width + 4, roof.y - 6);
      ctx.stroke();

      // Rooftop brick / panel seam textures
      ctx.strokeStyle = this.isDetectiveMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let px = roof.x + 30; px < roof.x + roof.width; px += 45) {
        ctx.beginPath();
        ctx.moveTo(px, roof.y);
        ctx.lineTo(px, roof.y + roof.height);
        ctx.stroke();
      }

      // Render Rooftop Props
      for (const prop of roof.props) {
        this.renderProp(ctx, prop);
      }

      // Rooftop Name Banner in detective vision
      if (this.isDetectiveMode) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`ZONE // ${roof.name}`, roof.x + 10, roof.y + 24);
      }

      ctx.restore();
    }
  }

  private renderProp(ctx: CanvasRenderingContext2D, prop: import('./types').RooftopProp) {
    ctx.save();

    if (prop.type === 'water_tower') {
      // Legs
      ctx.strokeStyle = '#333b4d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(prop.x + 10, prop.y + prop.height);
      ctx.lineTo(prop.x + 22, prop.y + 35);
      ctx.moveTo(prop.x + prop.width - 10, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width - 22, prop.y + 35);
      // Cross brace
      ctx.moveTo(prop.x + 14, prop.y + prop.height - 15);
      ctx.lineTo(prop.x + prop.width - 14, prop.y + 55);
      ctx.moveTo(prop.x + prop.width - 14, prop.y + prop.height - 15);
      ctx.lineTo(prop.x + 14, prop.y + 55);
      ctx.stroke();

      // Tank Body
      ctx.fillStyle = '#1e2433';
      ctx.fillRect(prop.x + 15, prop.y + 10, prop.width - 30, 45);

      // Conical Roof
      ctx.fillStyle = '#181d29';
      ctx.beginPath();
      ctx.moveTo(prop.x + prop.width / 2, prop.y);
      ctx.lineTo(prop.x + 10, prop.y + 12);
      ctx.lineTo(prop.x + prop.width - 10, prop.y + 12);
      ctx.closePath();
      ctx.fill();
    } else if (prop.type === 'vent') {
      ctx.fillStyle = '#222838';
      ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
      // Vent slats
      ctx.strokeStyle = '#111520';
      ctx.lineWidth = 1.5;
      for (let vy = prop.y + 4; vy < prop.y + prop.height; vy += 4) {
        ctx.beginPath();
        ctx.moveTo(prop.x + 3, vy);
        ctx.lineTo(prop.x + prop.width - 3, vy);
        ctx.stroke();
      }
    } else if (prop.type === 'gargoyle') {
      // Gothic stone gargoyle perch
      ctx.fillStyle = '#1a1f2c';
      ctx.beginPath();
      ctx.moveTo(prop.x, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width, prop.y + 5);
      ctx.lineTo(prop.x + prop.width + 10, prop.y);
      ctx.lineTo(prop.x + prop.width - 5, prop.y + prop.height);
      ctx.closePath();
      ctx.fill();
      // Eye glow
      ctx.fillStyle = this.isDetectiveMode ? '#38bdf8' : '#e5a93c';
      ctx.fillRect(prop.x + prop.width + 2, prop.y + 2, 2, 2);
    } else if (prop.type === 'billboard') {
      // Neon billboard
      ctx.fillStyle = '#0f141f';
      ctx.fillRect(prop.x, prop.y, prop.width, prop.height);
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = 2;
      ctx.strokeRect(prop.x, prop.y, prop.width, prop.height);

      // Support legs
      ctx.strokeStyle = '#333b4d';
      ctx.beginPath();
      ctx.moveTo(prop.x + 15, prop.y + prop.height);
      ctx.lineTo(prop.x + 15, prop.y + prop.height + 30);
      ctx.moveTo(prop.x + prop.width - 15, prop.y + prop.height);
      ctx.lineTo(prop.x + prop.width - 15, prop.y + prop.height + 30);
      ctx.stroke();

      // Neon Text
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = prop.extra?.includes('ACE') ? '#4ade80' : '#e5a93c';
      ctx.textAlign = 'center';
      ctx.fillText(prop.extra || 'GOTHAM', prop.x + prop.width / 2, prop.y + prop.height / 2 + 5);
      ctx.textAlign = 'left';
    } else if (prop.type === 'antenna') {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prop.x + prop.width / 2, prop.y);
      ctx.lineTo(prop.x + prop.width / 2, prop.y + prop.height);
      ctx.stroke();
      // Blinking red warning light
      const blink = Math.sin(this.animFrameId ? this.animFrameId * 0.1 : 0) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#551111';
      ctx.beginPath();
      ctx.arc(prop.x + prop.width / 2, prop.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderGrappleAiming(ctx: CanvasRenderingContext2D) {
    const validAnchors = this.getValidAnchorsInRange(460);

    for (const roof of this.rooftops) {
      for (const anc of roof.anchors) {
        const inRange = validAnchors.some((a) => a.id === anc.id);
        const isHovered = this.hoveredAnchor?.id === anc.id;

        ctx.save();
        ctx.translate(anc.x, anc.y);

        if (inRange || this.isDetectiveMode) {
          const color = isHovered ? '#38bdf8' : inRange ? '#e5a93c' : 'rgba(100, 116, 139, 0.4)';
          ctx.strokeStyle = color;
          ctx.lineWidth = isHovered ? 2 : 1.2;

          // Tactical Reticle
          ctx.beginPath();
          ctx.arc(0, 0, isHovered ? 12 : 8, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(-6, 0);
          ctx.moveTo(6, 0);
          ctx.lineTo(14, 0);
          ctx.moveTo(0, -14);
          ctx.lineTo(0, -6);
          ctx.moveTo(0, 6);
          ctx.lineTo(0, 14);
          ctx.stroke();

          // Label
          if (isHovered || this.isDetectiveMode) {
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = color;
            ctx.fillText(anc.label || 'ANCHOR', 16, 4);

            const dist = Math.round(Math.hypot(anc.x - this.batman.x, anc.y - (this.batman.y - 45)) / 10);
            ctx.fillText(`${dist}m`, 16, 14);
          }
        }

        ctx.restore();

        // Trajectory line to hovered or nearest anchor
        if (isHovered && inRange) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(this.batman.x, this.batman.y - 45);
          ctx.lineTo(anc.x, anc.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  private renderGrappleWire(ctx: CanvasRenderingContext2D) {
    if (this.batman.grappleActive && this.batman.grappleTarget) {
      ctx.save();
      const target = this.batman.grappleTarget;

      // Steel cable line
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(this.batman.x + this.batman.facing * 18, this.batman.y - 48);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Outer glow line
      ctx.strokeStyle = 'rgba(243, 193, 93, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Anchor impact ring
      ctx.fillStyle = '#e5a93c';
      ctx.beginPath();
      ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBatarangs(ctx: CanvasRenderingContext2D) {
    for (const b of this.batarangs) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // Batarang shape
      ctx.fillStyle = '#090d14';
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, -8);
      ctx.lineTo(14, -2);
      ctx.lineTo(8, 4);
      ctx.lineTo(0, 1);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-14, -2);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
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
