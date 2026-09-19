import { Rooftop, Enemy, LevelData, LevelMeta } from './types';

export const LEVELS: LevelMeta[] = [
  { index: 0, name: 'NIGHT PATROL', subtitle: 'District 07 rooftops', hostiles: 7, difficulty: 'PATROL', tag: 'LVL 01' },
  { index: 1, name: 'NIGHT SIEGE', subtitle: 'Narrows blackout zone', hostiles: 13, difficulty: 'SIEGE', tag: 'LVL 02' },
];

function thug(
  id: string, x: number, y: number, minX: number, maxX: number,
  name: string, hp = 1, vx = 0.9, facing: 1 | -1 = 1,
): Enemy {
  return {
    id, type: 'thug', x, y, width: 28, height: 52, vx, vy: 0,
    patrolMinX: minX, patrolMaxX: maxX, facing, state: 'patrol',
    health: hp, maxHealth: hp, alertTimer: 0, aimTimer: 0,
    knockoutTimer: 0, hitEffectTimer: 0, name,
  };
}

function gunman(id: string, x: number, y: number, name: string, facing: 1 | -1 = -1): Enemy {
  return {
    id, type: 'gunman', x, y, width: 28, height: 52, vx: 0, vy: 0,
    patrolMinX: x - 20, patrolMaxX: x + 20, facing, state: 'patrol',
    health: 1, maxHealth: 1, alertTimer: 0, aimTimer: Math.random(),
    laserAngle: facing === 1 ? 0 : Math.PI, knockoutTimer: 0, hitEffectTimer: 0, name,
  };
}

function buildLevel1(): LevelData {
  const rooftops: Rooftop[] = [
    {
      id: 'roof_1', x: 60, y: 480, width: 440, height: 400,
      name: 'WAYNE APPLIED SCIENCES // WEST PERCH', type: 'concrete',
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
    {
      id: 'roof_2', x: 580, y: 500, width: 420, height: 380,
      name: 'DISTRICT 07 WAREHOUSE #12', type: 'brick',
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
    {
      id: 'roof_3', x: 1080, y: 420, width: 460, height: 460,
      name: 'GOTHAM MUNICIPAL WATER & POWER', type: 'industrial',
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
    {
      id: 'roof_4', x: 1620, y: 510, width: 520, height: 380,
      name: 'ACE CHEMICALS // PROCESSING DIV', type: 'industrial',
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
    {
      id: 'roof_5', x: 2240, y: 400, width: 480, height: 480,
      name: 'BANK OF GOTHAM METROPOLITAN', type: 'concrete',
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
    {
      id: 'roof_6', x: 2800, y: 440, width: 650, height: 450,
      name: 'ST. MICHAEL CATHEDRAL // CLOCKTOWER ROOF', type: 'cathedral',
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
    thug('enemy_1', 740, 500, 640, 880, 'FALCONE THUG'),
    gunman('enemy_2', 1360, 420, 'ROOFTOP SNIPER'),
    thug('enemy_3', 1720, 510, 1650, 1800, 'ENFORCER #1', 1, 0.8, -1),
    thug('enemy_4', 1940, 510, 1840, 2060, 'ENFORCER #2', 1, -1.0, -1),
    gunman('enemy_5', 2540, 400, 'TOWER MARKSMAN'),
    thug('enemy_6', 2360, 400, 2300, 2460, 'HEAVY ENFORCER'),
    {
      id: 'target_boss', type: 'target', x: 3220, y: 440, width: 34, height: 56,
      vx: 0, vy: 0, patrolMinX: 3180, patrolMaxX: 3260, facing: -1, state: 'alert',
      health: 2, maxHealth: 2, alertTimer: 0, aimTimer: 0,
      knockoutTimer: 0, hitEffectTimer: 0, name: 'ARMORED OPERATIVE // TARGET',
    },
  ];

  return { rooftops, enemies, levelLength: 3500, targetX: 3220, meta: LEVELS[0] };
}

// LEVEL 02 — longer, wider gaps (glide/grapple required), 13 hostiles,
// tougher brutes (2 HP), crossfire snipers, guarded boss (3 HP).
function buildLevel2(): LevelData {
  const rooftops: Rooftop[] = [
    {
      id: 's2_roof_1', x: 60, y: 470, width: 380, height: 410,
      name: 'NARROWS INTAKE // BLACKOUT EDGE', type: 'industrial',
      props: [
        { type: 'antenna', x: 150, y: 420, width: 12, height: 50 },
        { type: 'gargoyle', x: 400, y: 445, width: 30, height: 28 },
        { type: 'vent', x: 260, y: 448, width: 42, height: 22 },
      ],
      anchors: [
        { id: 's2_a11', x: 210, y: 415, type: 'antenna', label: 'RELAY MAST', rooftopIndex: 0 },
        { id: 's2_a12', x: 415, y: 450, type: 'gargoyle', label: 'INLET GARGOYLE', rooftopIndex: 0 },
      ],
    },
    {
      id: 's2_roof_2', x: 520, y: 520, width: 340, height: 360,
      name: 'COBALT DOCKS // CRANE YARD', type: 'brick',
      props: [
        { type: 'vent', x: 600, y: 495, width: 44, height: 25 },
        { type: 'pipes', x: 720, y: 505, width: 60, height: 15 },
      ],
      anchors: [
        { id: 's2_a21', x: 545, y: 512, type: 'ledge', label: 'DOCK CORNICE', rooftopIndex: 1 },
        { id: 's2_a22', x: 700, y: 488, type: 'vent', label: 'STACK VENT', rooftopIndex: 1 },
        { id: 's2_a23', x: 835, y: 508, type: 'ledge', label: 'YARD HOOK', rooftopIndex: 1 },
      ],
    },
    {
      id: 's2_roof_3', x: 960, y: 400, width: 420, height: 480,
      name: 'GOTHAM TRANSIT // SIGNAL GANTRY', type: 'concrete',
      props: [
        { type: 'water_tower', x: 1080, y: 290, width: 80, height: 110 },
        { type: 'antenna', x: 1300, y: 350, width: 14, height: 50 },
      ],
      anchors: [
        { id: 's2_a31', x: 985, y: 392, type: 'gargoyle', label: 'GANTRY WEST', rooftopIndex: 2 },
        { id: 's2_a32', x: 1120, y: 288, type: 'crane', label: 'TANK RIG', rooftopIndex: 2 },
        { id: 's2_a33', x: 1355, y: 392, type: 'ledge', label: 'GANTRY EAST', rooftopIndex: 2 },
      ],
    },
    {
      id: 's2_roof_4', x: 1480, y: 520, width: 400, height: 360,
      name: 'SPHINX CARGO // LOCKER ROW', type: 'brick',
      props: [
        { type: 'billboard', x: 1560, y: 410, width: 150, height: 66, extra: 'SPHINX CARGO' },
        { type: 'vent', x: 1780, y: 495, width: 40, height: 25 },
      ],
      anchors: [
        { id: 's2_a41', x: 1500, y: 512, type: 'ledge', label: 'LOCKER LEDGE', rooftopIndex: 3 },
        { id: 's2_a42', x: 1635, y: 402, type: 'billboard', label: 'CARGO GANTRY', rooftopIndex: 3 },
        { id: 's2_a43', x: 1855, y: 512, type: 'ledge', label: 'EAST LOCKER', rooftopIndex: 3 },
      ],
    },
    {
      id: 's2_roof_5', x: 1980, y: 390, width: 440, height: 490,
      name: 'WAYNE POWER // SUBSTATION 9', type: 'industrial',
      props: [
        { type: 'antenna', x: 2080, y: 330, width: 15, height: 60 },
        { type: 'water_tower', x: 2240, y: 280, width: 78, height: 110 },
        { type: 'gargoyle', x: 2380, y: 368, width: 30, height: 25 },
      ],
      anchors: [
        { id: 's2_a51', x: 2000, y: 382, type: 'gargoyle', label: 'SUBSTATION WEST', rooftopIndex: 4 },
        { id: 's2_a52', x: 2280, y: 278, type: 'crane', label: 'PYLON RIG', rooftopIndex: 4 },
        { id: 's2_a53', x: 2395, y: 380, type: 'ledge', label: 'SUBSTATION EAST', rooftopIndex: 4 },
      ],
    },
    {
      id: 's2_roof_6', x: 2520, y: 520, width: 380, height: 360,
      name: 'BLACKGATE TRANSFER // DEPOT', type: 'brick',
      props: [
        { type: 'vent', x: 2600, y: 495, width: 44, height: 25 },
        { type: 'skylight', x: 2740, y: 512, width: 70, height: 8 },
      ],
      anchors: [
        { id: 's2_a61', x: 2540, y: 512, type: 'ledge', label: 'DEPOT WEST', rooftopIndex: 5 },
        { id: 's2_a62', x: 2720, y: 488, type: 'vent', label: 'DEPOT STACK', rooftopIndex: 5 },
        { id: 's2_a63', x: 2875, y: 512, type: 'ledge', label: 'DEPOT EAST', rooftopIndex: 5 },
      ],
    },
    {
      id: 's2_roof_7', x: 3000, y: 400, width: 460, height: 480,
      name: 'GOTHAM GAZETTE // PRINT HALL', type: 'concrete',
      props: [
        { type: 'billboard', x: 3120, y: 290, width: 170, height: 76, extra: 'GAZETTE' },
        { type: 'antenna', x: 3360, y: 340, width: 15, height: 60 },
        { type: 'gargoyle', x: 3010, y: 380, width: 30, height: 25 },
      ],
      anchors: [
        { id: 's2_a71', x: 3020, y: 390, type: 'gargoyle', label: 'PRESS GARGOYLE', rooftopIndex: 6 },
        { id: 's2_a72', x: 3205, y: 282, type: 'billboard', label: 'PRESS GANTRY', rooftopIndex: 6 },
        { id: 's2_a73', x: 3435, y: 390, type: 'ledge', label: 'PRESS EAST', rooftopIndex: 6 },
      ],
    },
    {
      id: 's2_roof_8', x: 3560, y: 440, width: 700, height: 450,
      name: 'ARKHAM SPILLWAY // FLOODGATE LAIR', type: 'cathedral',
      props: [
        { type: 'gargoyle', x: 3580, y: 415, width: 35, height: 30 },
        { type: 'billboard', x: 3880, y: 320, width: 160, height: 80, extra: 'GOTHAM CHRONICLE' },
        { type: 'antenna', x: 4180, y: 360, width: 18, height: 80 },
        { type: 'vent', x: 3720, y: 415, width: 44, height: 25 },
      ],
      anchors: [
        { id: 's2_a81', x: 3590, y: 428, type: 'gargoyle', label: 'SPILLWAY GARGOYLE', rooftopIndex: 7 },
        { id: 's2_a82', x: 3960, y: 310, type: 'crane', label: 'FLOODGATE SPIRE', rooftopIndex: 7 },
        { id: 's2_a83', x: 4235, y: 430, type: 'ledge', label: 'NORTH BALCONY', rooftopIndex: 7 },
      ],
    },
  ];

  const enemies: Enemy[] = [
    thug('s2_e1', 640, 520, 560, 800, 'DOCK THUG', 1, 1.0, 1),
    thug('s2_e2', 780, 520, 560, 800, 'DOCK BRUTE', 2, 0.7, -1),
    gunman('s2_e3', 1240, 400, 'GANTRY SNIPER'),
    thug('s2_e4', 1100, 400, 1010, 1230, 'TRANSIT ENFORCER'),
    gunman('s2_e5', 1310, 400, 'GANTRY MARKSMAN', 1),
    thug('s2_e6', 1600, 520, 1520, 1700, 'LOCKER THUG', 1, 0.9, -1),
    thug('s2_e7', 1740, 520, 1700, 1840, 'LOCKER BRUTE', 2, 0.65, 1),
    gunman('s2_e8', 2200, 390, 'SUBSTATION SNIPER'),
    thug('s2_e9', 2100, 390, 2020, 2260, 'SUBSTATION GUARD'),
    thug('s2_e10', 2640, 520, 2560, 2780, 'DEPOT ENFORCER', 1, 1.1, -1),
    gunman('s2_e11', 3300, 400, 'PRESS SNIPER'),
    thug('s2_e12', 3150, 400, 3040, 3280, 'PRESS BRUTE', 2, 0.7, 1),
    {
      id: 's2_target', type: 'target', x: 4060, y: 440, width: 36, height: 58,
      vx: 0, vy: 0, patrolMinX: 4020, patrolMaxX: 4100, facing: -1, state: 'alert',
      health: 3, maxHealth: 3, alertTimer: 0, aimTimer: 0,
      knockoutTimer: 0, hitEffectTimer: 0, name: 'BLACKGATE WARDEN // TARGET',
    },
    thug('s2_bodyguard1', 3960, 440, 3900, 4020, 'WARDEN GUARD', 2, 1.0, -1),
    thug('s2_bodyguard2', 4160, 440, 4100, 4220, 'WARDEN GUARD', 1, 1.0, -1),
  ];

  return { rooftops, enemies, levelLength: 4300, targetX: 4060, meta: { ...LEVELS[1], hostiles: enemies.length } };
}

export function createLevel(index: number): LevelData {
  if (index === 1) return buildLevel2();
  return buildLevel1();
}

// Back-compat for existing engine/tests
export function createInitialLevel(): {
  rooftops: Rooftop[];
  enemies: Enemy[];
  levelLength: number;
  targetX: number;
} {
  const l = buildLevel1();
  return { rooftops: l.rooftops, enemies: l.enemies, levelLength: l.levelLength, targetX: l.targetX };
}
