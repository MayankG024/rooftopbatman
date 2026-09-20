export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EnemyType = 'thug' | 'gunman' | 'target' | 'bane';

export type EnemyState = 'patrol' | 'alert' | 'aiming' | 'attacking' | 'knocked_out' | 'falling';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  patrolMinX: number;
  patrolMaxX: number;
  facing: 1 | -1;
  state: EnemyState;
  health: number;
  maxHealth: number;
  alertTimer: number;
  aimTimer: number;
  laserAngle?: number;
  knockoutTimer: number;
  hitEffectTimer: number;
  name: string;
  // Boss flags (Bane) — optional so existing constructors keep working
  surged?: boolean;
  aggroed?: boolean;
}

export interface GrappleAnchor {
  id: string;
  x: number;
  y: number;
  type: 'gargoyle' | 'ledge' | 'antenna' | 'crane' | 'billboard' | 'vent';
  label?: string;
  rooftopIndex: number;
}

export interface Rooftop {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  type: 'brick' | 'concrete' | 'industrial' | 'cathedral';
  props: RooftopProp[];
  anchors: GrappleAnchor[];
}

export interface RooftopProp {
  type: 'water_tower' | 'vent' | 'antenna' | 'pipes' | 'billboard' | 'gargoyle' | 'skylight';
  x: number;
  y: number;
  width: number;
  height: number;
  extra?: string;
}

export type GrapplePhase = 'none' | 'firing' | 'attached';

export interface Batarang {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spinSpeed: number;
  lifetime: number;
  hit: boolean;
  distanceTraveled: number;
  maxDistance: number;
  returning: boolean;
  damage: number;
  piercedIds: string[];
  homingTargetId: string | null;
  trail: Point[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type?: 'smoke' | 'spark' | 'rain' | 'hit' | 'scanline';
}

export interface ComicPopup {
  x: number;
  y: number;
  text: string;
  alpha: number;
  scale: number;
  color: string;
}

export type BatmanAction =
  | 'idle'
  | 'running'
  | 'jumping'
  | 'gliding'
  | 'grappling_launch'
  | 'grappling_pull'
  | 'grappling_vault'
  | 'batarang_throw'
  | 'melee_attack'
  | 'landing';

export interface BatmanState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  grounded: boolean;
  action: BatmanAction;
  animTimer: number;
  capeAngle: number;
  health: number;
  maxHealth: number;
  batarangCooldown: number; // 0 to 1
  combo: number;
  comboTimer: number;
  // Grappling hook details — pendulum + reel physics
  grappleActive: boolean;
  grappleTarget: Point | null;
  grappleAnchorId: string | null;
  grappleProgress: number; // 0 to 1 (legacy, kept for HUD)
  grappleLength: number;
  grapplePhase: GrapplePhase;
  grappleHook: Point | null; // flying hook head position
  grappleRopeLength: number; // current constraint length while attached
}

export type RobinPhase = 'hidden' | 'arrive' | 'follow' | 'fight' | 'leave';

export interface RobinState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  phase: RobinPhase;
  timer: number; // frames in current phase
  cooldown: number; // frames until next assist
  targetId: string | null;
  punchTimer: number;
  animT: number;
}

export interface LevelMeta {
  index: number;
  name: string;
  subtitle: string;
  hostiles: number;
  difficulty: string;
  tag: string;
}

export interface LevelData {
  rooftops: Rooftop[];
  enemies: Enemy[];
  levelLength: number;
  targetX: number;
  meta: LevelMeta;
}

export interface GameStats {
  timeElapsed: number;
  hostilesDefeated: number;
  totalHostiles: number;
  grapplesUsed: number;
  batarangsThrown: number;
  maxCombo: number;
  robinAssists: number;
  robinActive: boolean;
}
