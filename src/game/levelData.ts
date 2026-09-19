import { Rooftop, Enemy } from './types';

export function createInitialLevel(): {
  rooftops: Rooftop[];
  enemies: Enemy[];
  levelLength: number;
  targetX: number;
} {
  const rooftops: Rooftop[] = [
    // Rooftop 1: Starting Perch (Wayne Logistics Hub)
    {
      id: 'roof_1',
      x: 60,
      y: 480,
      width: 440,
      height: 400,
      name: 'WAYNE APPLIED SCIENCES // WEST PERCH',
      type: 'concrete',
      props: [
        { type: 'antenna', x: 180, y: 430, width: 12, height: 50 },
        { type: 'vent', x: 290, y: 455, width: 40, height: 25 },
        { type: 'gargoyle', x: 470, y: 450, width: 30, height: 30 },
      ],
      anchors: [
        { id: 'anc_1_1', x: 260, y: 420, type: 'antenna', label: 'COMMS MAST', rooftopIndex: 0 },
        { id: 'anc_1_2', x: 480, y: 460, type: 'gargoyle', label: 'GARGOYLE PERCH', rooftopIndex: 0 },
      ],
    },

    // Rooftop 2: Low warehouse with patrolling thug
    {
      id: 'roof_2',
      x: 580,
      y: 500,
      width: 420,
      height: 380,
      name: 'DISTRICT 07 WAREHOUSE #12',
      type: 'brick',
      props: [
        { type: 'pipes', x: 620, y: 485, width: 60, height: 15 },
        { type: 'vent', x: 780, y: 475, width: 45, height: 25 },
        { type: 'skylight', x: 880, y: 492, width: 70, height: 8 },
      ],
      anchors: [
        { id: 'anc_2_1', x: 600, y: 495, type: 'ledge', label: 'ROOF CORNICE', rooftopIndex: 1 },
        { id: 'anc_2_2', x: 800, y: 470, type: 'vent', label: 'EXHAUST STACK', rooftopIndex: 1 },
      ],
    },

    // Rooftop 3: Elevated Water Tower with Gunman
    {
      id: 'roof_3',
      x: 1080,
      y: 420,
      width: 460,
      height: 460,
      name: 'GOTHAM MUNICIPAL WATER & POWER',
      type: 'industrial',
      props: [
        { type: 'water_tower', x: 1200, y: 310, width: 80, height: 110 },
        { type: 'antenna', x: 1440, y: 370, width: 14, height: 50 },
        { type: 'gargoyle', x: 1090, y: 400, width: 28, height: 25 },
      ],
      anchors: [
        { id: 'anc_3_1', x: 1100, y: 410, type: 'gargoyle', label: 'STONE GARGOYLE', rooftopIndex: 2 },
        { id: 'anc_3_2', x: 1240, y: 310, type: 'crane', label: 'WATER TOWER RIG', rooftopIndex: 2 },
        { id: 'anc_3_3', x: 1460, y: 415, type: 'ledge', label: 'EAST LEDGE', rooftopIndex: 2 },
      ],
    },

    // Rooftop 4: Ace Chemicals Depot with Billboard & 2 Thugs
    {
      id: 'roof_4',
      x: 1620,
      y: 510,
      width: 520,
      height: 380,
      name: 'ACE CHEMICALS // PROCESSING DIV',
      type: 'industrial',
      props: [
        { type: 'billboard', x: 1760, y: 390, width: 160, height: 75, extra: 'ACE CHEMICALS' },
        { type: 'vent', x: 1660, y: 480, width: 45, height: 30 },
        { type: 'vent', x: 2020, y: 485, width: 40, height: 25 },
      ],
      anchors: [
        { id: 'anc_4_1', x: 1640, y: 505, type: 'ledge', label: 'WEST LEDGE', rooftopIndex: 3 },
        { id: 'anc_4_2', x: 1840, y: 380, type: 'billboard', label: 'BILLBOARD GANTRY', rooftopIndex: 3 },
        { id: 'anc_4_3', x: 2110, y: 505, type: 'gargoyle', label: 'CRANE HOOK', rooftopIndex: 3 },
      ],
    },

    // Rooftop 5: High-Rise Financial Plaza (Wide gap traversal)
    {
      id: 'roof_5',
      x: 2240,
      y: 400,
      width: 480,
      height: 480,
      name: 'BANK OF GOTHAM METROPOLITAN',
      type: 'concrete',
      props: [
        { type: 'gargoyle', x: 2250, y: 380, width: 30, height: 25 },
        { type: 'skylight', x: 2360, y: 393, width: 90, height: 10 },
        { type: 'antenna', x: 2580, y: 340, width: 15, height: 60 },
        { type: 'gargoyle', x: 2690, y: 380, width: 30, height: 25 },
      ],
      anchors: [
        { id: 'anc_5_1', x: 2260, y: 390, type: 'gargoyle', label: 'WEST GARGOYLE', rooftopIndex: 4 },
        { id: 'anc_5_2', x: 2450, y: 370, type: 'crane', label: 'HVAC GANTRY', rooftopIndex: 4 },
        { id: 'anc_5_3', x: 2695, y: 390, type: 'gargoyle', label: 'EAST CORNER PERCH', rooftopIndex: 4 },
      ],
    },

    // Rooftop 6: Final Cathedral / Clocktower (Target Lair)
    {
      id: 'roof_6',
      x: 2800,
      y: 440,
      width: 650,
      height: 450,
      name: 'ST. MICHAEL CATHEDRAL // CLOCKTOWER ROOF',
      type: 'cathedral',
      props: [
        { type: 'gargoyle', x: 2820, y: 415, width: 35, height: 30 },
        { type: 'billboard', x: 3100, y: 320, width: 150, height: 80, extra: 'GOTHAM CHRONICLE' },
        { type: 'antenna', x: 3380, y: 360, width: 18, height: 80 },
      ],
      anchors: [
        { id: 'anc_6_1', x: 2830, y: 430, type: 'gargoyle', label: 'CATHEDRAL GARGOYLE', rooftopIndex: 5 },
        { id: 'anc_6_2', x: 3175, y: 310, type: 'crane', label: 'CLOCKTOWER SPIRE', rooftopIndex: 5 },
        { id: 'anc_6_3', x: 3400, y: 430, type: 'ledge', label: 'NORTH BALCONY', rooftopIndex: 5 },
      ],
    },
  ];

  const enemies: Enemy[] = [
    // Enemy on Rooftop 2
    {
      id: 'enemy_1',
      type: 'thug',
      x: 740,
      y: 500,
      width: 28,
      height: 52,
      vx: 0.9,
      vy: 0,
      patrolMinX: 640,
      patrolMaxX: 880,
      facing: 1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'FALCONE THUG',
    },

    // Sniper on Rooftop 3
    {
      id: 'enemy_2',
      type: 'gunman',
      x: 1360,
      y: 420,
      width: 28,
      height: 52,
      vx: 0,
      vy: 0,
      patrolMinX: 1340,
      patrolMaxX: 1380,
      facing: -1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      laserAngle: Math.PI,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'ROOFTOP SNIPER',
    },

    // 2 Thugs on Rooftop 4
    {
      id: 'enemy_3',
      type: 'thug',
      x: 1720,
      y: 510,
      width: 28,
      height: 52,
      vx: 0.8,
      vy: 0,
      patrolMinX: 1650,
      patrolMaxX: 1800,
      facing: -1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'ENFORCER #1',
    },
    {
      id: 'enemy_4',
      type: 'thug',
      x: 1940,
      y: 510,
      width: 28,
      height: 52,
      vx: -1.0,
      vy: 0,
      patrolMinX: 1840,
      patrolMaxX: 2060,
      facing: -1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'ENFORCER #2',
    },

    // Sniper + Thug on Rooftop 5
    {
      id: 'enemy_5',
      type: 'gunman',
      x: 2540,
      y: 400,
      width: 28,
      height: 52,
      vx: 0,
      vy: 0,
      patrolMinX: 2520,
      patrolMaxX: 2560,
      facing: -1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      laserAngle: Math.PI,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'TOWER MARKSMAN',
    },
    {
      id: 'enemy_6',
      type: 'thug',
      x: 2360,
      y: 400,
      width: 28,
      height: 52,
      vx: 0.9,
      vy: 0,
      patrolMinX: 2300,
      patrolMaxX: 2460,
      facing: 1,
      state: 'patrol',
      health: 1,
      maxHealth: 1,
      alertTimer: 0,
      aimTimer: 0,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'HEAVY ENFORCER',
    },

    // Final Target Boss on Rooftop 6
    {
      id: 'target_boss',
      type: 'target',
      x: 3220,
      y: 440,
      width: 34,
      height: 56,
      vx: 0,
      vy: 0,
      patrolMinX: 3180,
      patrolMaxX: 3260,
      facing: -1,
      state: 'alert',
      health: 2,
      maxHealth: 2,
      alertTimer: 0,
      aimTimer: 0,
      knockoutTimer: 0,
      hitEffectTimer: 0,
      name: 'ARMORED OPERATIVE // TARGET',
    },
  ];

  return {
    rooftops,
    enemies,
    levelLength: 3500,
    targetX: 3220,
  };
}
