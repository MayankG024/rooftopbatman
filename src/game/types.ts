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

export type EnemyType = 'thug' | 'gunman' | 'target';

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

export interface Batarang {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  lifetime: number;
  hit: boolean;
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
  // Grappling hook details
  grappleActive: boolean;
  grappleTarget: Point | null;
  grappleAnchorId: string | null;
  grappleProgress: number; // 0 to 1
  grappleLength: number;
}

export interface GameStats {
  timeElapsed: number;
  hostilesDefeated: number;
  totalHostiles: number;
  grapplesUsed: number;
  batarangsThrown: number;
  maxCombo: number;
}
