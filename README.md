# BATMAN: ARKHAM NIGHT PATROL

A 2D rooftop-traversal action game set in Gotham City. Sprint, glide, and grapple across rain-soaked rooftops, neutralize armed hostiles with batarangs and melee combos, and intercept high-value targets — with Robin fighting beside you and Bane waiting at the end.

Unofficial fan project. Batman, Robin, Bane, and Gotham City are trademarks of DC Comics. Not for commercial use.

## Features

### Traversal
- Momentum-based running with acceleration, friction, and variable jump height
- Cape gliding: hold jump mid-air to slow your descent and steer across wide gaps
- Coyote time and jump buffering for forgiving, responsive controls
- Pendulum grapple physics: the hook flies to gargoyles, masts, and ledges, latches on, then swings with reel-in. Steer mid-swing and press jump to vault-boost off the line

### Gadgets and combat
- Aimed batarangs with gravity arcs, enemy homing assist, and boomerang return that can strike a second target on the way back
- Melee strikes with lunge, knockback, and a combo system that rewards chained takedowns
- Grapple vaults, glide strikes broken by landing dust, and armor pips with emergency grapnel recovery instead of a hard game over
- Detective vision: sonar-grid overlay that highlights anchors, hostiles, and zones

### Batman dialogue and voiceover
- Batman speaks his plan at the start of every level
- Contextual one-liners while fighting: strike quips, takedown closers, hurt retorts, glide lines, and exchanges with Robin
- Spoken voiceover uses the platform speech engine with a low, gravelly delivery, paced so lines never overlap combat. Muting the game silences voice immediately. Where speech is unavailable, lines still appear as caption popups

### Robin
- AI ally who drops in at random intervals when there is trouble nearby
- Shadows Batman across rooftops, engages the nearest hostile with a punch flurry, and earns credited assists
- Live HUD indicator while active, assist count on the results screen

### Enemies
- Thugs: patrol, spot Batman with an alert ping, and close in to brawl. Brutes take two hits
- Gunmen: track Batman with visible laser sights and fire unless he is swinging on the grapple
- Couriers and operatives: armored mission targets
- Bane (Level 3 boss): stomps the arena, telegraphs a trampling shoulder charge, slams the ground in an area attack, and triggers a faster venom surge at half health. Melee barely moves him — wear him down and dodge the charge

### Levels
- LVL 01 NIGHT PATROL: District 07, 7 hostiles, tutorial-length traversal
- LVL 02 NIGHT SIEGE: Narrows blackout zone, 15 hostiles, crossfire snipers, tougher brutes, wider gaps
- LVL 03 BREAKING THE BAT: Sionis foundry, 12 hostiles, Bane boss arena. Finish all three to clear the game

### Presentation and mobile
- Procedural Gotham: layered parallax skyline, Bat-Signal, moon, searchlights, burning horizon, rain with wind gusts and rooftop splashes, lightning flashes, street traffic, neon billboards, steam vents, and film grain
- Fully playable on touch devices: thumb D-pad, hold-to-glide jump button, large grapple/batarang/strike buttons, tap-to-aim on the canvas, landscape prompt, safe-area aware layout

## Controls

### Desktop
- A / D or Arrow keys: move (also steers grapple swings and glides)
- Space / W / Up: jump, hold to glide, press mid-swing to vault-boost
- E or Right-click: smart grapple to the best anchor
- Left-click an anchor reticle: grapple that point
- Q or Left-click elsewhere: throw an aimed batarang (click an enemy to snipe it)
- F: melee strike
- V: detective vision
- 1 / 2 / 3: start the corresponding level from the title screen

### Touch
- Left / Right pads: hold to run and steer
- Jump/Glide: tap to jump, hold to glide, tap mid-swing to vault
- Grapple: smart-targets the best anchor, or tap any glowing reticle
- Batarang: tap to throw, or tap an enemy directly
- Strike: close-range melee

## Getting started

Requirements: Node.js 18 or newer, npm.

- Install: `npm install`
- Develop: `npm run dev`, then open the printed local URL
- Build: `npm run build` (single-file `dist/index.html`)
- Preview the build: `npm run preview`
- Typecheck: `npx tsc --noEmit`

## Project structure

- `src/App.tsx`: game state machine (title, playing, complete), level progression, HUD wiring
- `src/components/MissionBriefing.tsx`: title screen with logo and level select
- `src/components/MissionComplete.tsx`: results screen with next-level flow
- `src/components/BatHud.tsx`: HUD and touch controls
- `src/components/GameCanvas.tsx`: canvas host, keyboard/mouse/touch input, resize handling
- `src/components/BatLogo.tsx`: gold bat emblem vector
- `src/game/GothamEngine.ts`: game loop, physics, grapple/batarang systems, enemy and Robin AI, Bane boss, dialogue triggers, canvas rendering
- `src/game/levelData.ts`: the three level definitions
- `src/game/types.ts`: shared game types
- `src/game/batmanRenderer.ts`, `src/game/robinRenderer.ts`: character art
- `src/game/audio.ts`: synthesized sound effects and Batman voiceover

## Gameplay notes

- Gunmen cannot hit Batman while he is swinging — keep moving under fire
- Batarangs return to hand and can hit on the way back; thrown batarangs briefly turn the trail blue
- Combos decay after about three seconds without a hit; damage taken resets the combo
- Falling into the streets costs one armor pip and triggers an emergency recovery to the nearest roof
- On Bane: bait the charge, punish the recovery, glide clear of slams, and save batarangs for safe damage during his surge

## Performance

- HUD updates throttle to roughly 12 Hz instead of every frame; combat actions push immediate updates so controls stay snappy
- Off-screen rooftops, props, and enemies are culled from rendering; particles are capped
- Device pixel ratio is capped at 2 and rain density scales down on touch devices

## Credits

- Design and code: MayankG024
- Characters and setting: DC Comics
- Sound: synthesized in code with the Web Audio API; voiceover via the platform speech engine
