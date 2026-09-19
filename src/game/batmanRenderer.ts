import { BatmanState } from './types';

export function renderBatman(
  ctx: CanvasRenderingContext2D,
  batman: BatmanState,
  isDetectiveMode: boolean = false
) {
  ctx.save();
  ctx.translate(batman.x, batman.y);
  ctx.scale(batman.facing, 1);

  const t = batman.animTimer;
  const isMoving = Math.abs(batman.vx) > 0.5;
  const isGrounded = batman.grounded;
  const isGliding = batman.action === 'gliding';
  const isGrappling = batman.action === 'grappling_pull' || batman.action === 'grappling_launch';
  const isThrowing = batman.action === 'batarang_throw';
  const isAttacking = batman.action === 'melee_attack';

  // Colors
  const suitCharcoal = isDetectiveMode ? '#1e293b' : '#141821';
  const suitHighlight = isDetectiveMode ? '#38bdf8' : '#283042';
  const armorPlate = isDetectiveMode ? '#0f172a' : '#0d1017';
  const beltAmber = isDetectiveMode ? '#38bdf8' : '#e5a93c';
  const beltDark = isDetectiveMode ? '#0284c7' : '#926315';
  const capeColor = isDetectiveMode ? '#0b1120' : '#080a0e';
  const capeInner = isDetectiveMode ? '#131e36' : '#10141c';
  const eyeGlow = isDetectiveMode ? '#38bdf8' : '#ffffff';
  const skinTone = isDetectiveMode ? '#64748b' : '#c9a082';

  // Cape rendering (Behind Batman)
  ctx.save();
  ctx.fillStyle = capeColor;
  ctx.strokeStyle = capeInner;
  ctx.lineWidth = 1.5;

  if (isGliding) {
    // Large spreading Bat-Wings
    ctx.beginPath();
    ctx.moveTo(0, -56);
    // Left wing
    ctx.bezierCurveTo(-35, -55, -55, -45, -65, -30);
    // Scallops
    ctx.bezierCurveTo(-50, -22, -45, -12, -40, -10);
    ctx.bezierCurveTo(-32, -18, -25, -12, -20, -10);
    ctx.bezierCurveTo(-15, -18, -10, -15, 0, -20);
    // Right wing
    ctx.bezierCurveTo(10, -15, 15, -18, 20, -10);
    ctx.bezierCurveTo(25, -12, 32, -18, 40, -10);
    ctx.bezierCurveTo(45, -12, 50, -22, 65, -30);
    ctx.bezierCurveTo(55, -45, 35, -55, 0, -56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing rib lines
    ctx.strokeStyle = isDetectiveMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(-60, -32);
    ctx.moveTo(0, -52);
    ctx.lineTo(-40, -12);
    ctx.moveTo(0, -52);
    ctx.lineTo(-20, -12);
    ctx.moveTo(0, -52);
    ctx.lineTo(20, -12);
    ctx.moveTo(0, -52);
    ctx.lineTo(40, -12);
    ctx.moveTo(0, -52);
    ctx.lineTo(60, -32);
    ctx.stroke();
  } else if (isGrappling) {
    // Aerodynamic slipstream cape trailing straight back
    const flutter = Math.sin(t * 15) * 4;
    ctx.beginPath();
    ctx.moveTo(-4, -54);
    ctx.bezierCurveTo(-35, -50 + flutter, -65, -45 - flutter, -75, -40);
    ctx.bezierCurveTo(-65, -30, -55, -25, -50, -22);
    ctx.bezierCurveTo(-45, -28, -35, -24, -30, -20);
    ctx.bezierCurveTo(-20, -30, -10, -35, 4, -40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (isMoving && isGrounded) {
    // Dynamic running cape
    const runCycle = Math.sin(t * 10);
    const trailX = -25 - Math.abs(batman.vx) * 3;
    ctx.beginPath();
    ctx.moveTo(-6, -55);
    ctx.bezierCurveTo(trailX * 0.8, -50, trailX * 1.2, -35 + runCycle * 6, trailX * 1.5, -20);
    ctx.bezierCurveTo(trailX * 1.1, -15, trailX * 0.9, -12, trailX * 0.7, -10);
    ctx.bezierCurveTo(trailX * 0.5, -18, trailX * 0.3, -15, 0, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (!isGrounded) {
    // Falling / Jumping cape flare
    const flutter = Math.sin(t * 12) * 3;
    ctx.beginPath();
    ctx.moveTo(-8, -55);
    ctx.bezierCurveTo(-30, -55, -45, -35 + flutter, -50, -20);
    ctx.bezierCurveTo(-40, -15, -32, -18, -25, -10);
    ctx.bezierCurveTo(-18, -16, -10, -12, 0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Idle noble drape with subtle wind flutter
    const wind = Math.sin(t * 2.5) * 2;
    ctx.beginPath();
    ctx.moveTo(-7, -54);
    ctx.bezierCurveTo(-16 + wind, -40, -20 + wind * 1.5, -20, -18 + wind * 2, -2);
    // Scallops
    ctx.bezierCurveTo(-14, -6, -10, -3, -6, 0);
    ctx.bezierCurveTo(-3, -5, 1, -4, 4, 0);
    ctx.bezierCurveTo(8, -5, 12, -4, 15 + wind, -3);
    ctx.bezierCurveTo(14, -20, 10, -40, 7, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Legs and Boots
  ctx.save();
  ctx.fillStyle = suitCharcoal;
  ctx.strokeStyle = armorPlate;
  ctx.lineWidth = 1;

  let leftKneeY = -18;
  let rightKneeY = -18;
  let leftFootX = -6;
  let rightFootX = 6;
  let leftFootY = 0;
  let rightFootY = 0;

  if (isMoving && isGrounded) {
    const stride = Math.sin(t * 10);
    leftFootX = stride * 12;
    rightFootX = -stride * 12;
    leftFootY = Math.max(0, -Math.cos(t * 10) * 6);
    rightFootY = Math.max(0, Math.cos(t * 10) * 6);
  } else if (!isGrounded) {
    // Aerial pose
    leftFootX = -10;
    rightFootX = 8;
    leftFootY = -4;
    rightFootY = -8;
  }

  // Left Leg (Back)
  ctx.beginPath();
  ctx.moveTo(-5, -30);
  ctx.lineTo(leftFootX - 2, leftKneeY);
  ctx.lineTo(leftFootX, leftFootY);
  ctx.lineTo(leftFootX + 6, leftFootY);
  ctx.lineTo(leftFootX + 3, leftKneeY);
  ctx.lineTo(0, -30);
  ctx.closePath();
  ctx.fill();

  // Right Leg (Front)
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(rightFootX - 2, rightKneeY);
  ctx.lineTo(rightFootX, rightFootY);
  ctx.lineTo(rightFootX + 7, rightFootY);
  ctx.lineTo(rightFootX + 4, rightKneeY);
  ctx.lineTo(5, -30);
  ctx.closePath();
  ctx.fill();

  // Knee armor guards
  ctx.fillStyle = armorPlate;
  ctx.fillRect(leftFootX - 1, leftKneeY - 3, 5, 6);
  ctx.fillRect(rightFootX - 1, rightKneeY - 3, 5, 6);
  ctx.restore();

  // Torso / Armored Bodysuit
  ctx.save();
  ctx.fillStyle = suitCharcoal;
  ctx.strokeStyle = suitHighlight;
  ctx.lineWidth = 1;

  // Athletic V-taper
  ctx.beginPath();
  ctx.moveTo(-13, -54);
  ctx.lineTo(13, -54);
  ctx.lineTo(9, -32);
  ctx.lineTo(-9, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armor segmentation lines on abs/chest
  ctx.strokeStyle = isDetectiveMode ? 'rgba(56, 189, 248, 0.5)' : '#0d1017';
  ctx.lineWidth = 1.2;
  // Pectoral lines
  ctx.beginPath();
  ctx.moveTo(-11, -48);
  ctx.lineTo(0, -45);
  ctx.lineTo(11, -48);
  ctx.moveTo(0, -45);
  ctx.lineTo(0, -34);
  // Ab plates
  ctx.moveTo(-7, -41);
  ctx.lineTo(7, -41);
  ctx.moveTo(-6, -37);
  ctx.lineTo(6, -37);
  ctx.stroke();

  // Iconic Bat Emblem on Chest
  ctx.fillStyle = armorPlate;
  ctx.strokeStyle = beltAmber;
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  // Stylized Bat Emblem
  ctx.moveTo(0, -52);
  ctx.lineTo(3, -53);
  ctx.lineTo(4, -51);
  ctx.lineTo(8, -52);
  ctx.lineTo(9, -49);
  ctx.lineTo(6, -46);
  ctx.lineTo(0, -44);
  ctx.lineTo(-6, -46);
  ctx.lineTo(-9, -49);
  ctx.lineTo(-8, -52);
  ctx.lineTo(-4, -51);
  ctx.lineTo(-3, -53);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Utility Belt (Amber / Gold with technical pouches)
  ctx.save();
  ctx.fillStyle = beltAmber;
  ctx.fillRect(-10, -32, 20, 4);

  // Belt Buckle (Dark with Bat relief)
  ctx.fillStyle = beltDark;
  ctx.fillRect(-3, -33, 6, 6);

  // Belt Pouches
  ctx.fillStyle = beltAmber;
  for (let bx = -9; bx <= 7; bx += 4) {
    if (Math.abs(bx) > 2) {
      ctx.fillRect(bx, -33, 3, 6);
      ctx.strokeStyle = beltDark;
      ctx.strokeRect(bx, -33, 3, 6);
    }
  }
  ctx.restore();

  // Head and Cowl
  ctx.save();
  const headY = -58;

  // Neck
  ctx.fillStyle = suitCharcoal;
  ctx.fillRect(-5, headY + 2, 10, 5);

  // Cowl
  ctx.fillStyle = armorPlate;
  ctx.beginPath();
  // Left ear
  ctx.moveTo(-6, headY);
  ctx.lineTo(-8, headY - 14); // Tall pointed ear!
  ctx.lineTo(-4, headY - 4);
  // Brow center
  ctx.lineTo(0, headY - 5);
  // Right ear
  ctx.lineTo(4, headY - 4);
  ctx.lineTo(8, headY - 14); // Tall pointed ear!
  ctx.lineTo(6, headY);
  // Jaw
  ctx.lineTo(5, headY + 7);
  ctx.lineTo(-5, headY + 7);
  ctx.closePath();
  ctx.fill();

  // Exposed lower face / jaw
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.moveTo(-3, headY + 3);
  ctx.lineTo(3, headY + 3);
  ctx.lineTo(2.5, headY + 6.5);
  ctx.lineTo(-2.5, headY + 6.5);
  ctx.closePath();
  ctx.fill();

  // Determined mouth line
  ctx.strokeStyle = '#4a2c20';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-2, headY + 4.8);
  ctx.lineTo(2, headY + 4.8);
  ctx.stroke();

  // Cowl nose bridge
  ctx.fillStyle = armorPlate;
  ctx.beginPath();
  ctx.moveTo(-1.5, headY + 1);
  ctx.lineTo(1.5, headY + 1);
  ctx.lineTo(0, headY + 3.2);
  ctx.closePath();
  ctx.fill();

  // Iconic Glowing White Eye Lenses
  ctx.fillStyle = eyeGlow;
  ctx.shadowColor = isDetectiveMode ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = isDetectiveMode ? 8 : 4;

  // Left Eye (angled slit)
  ctx.beginPath();
  ctx.moveTo(-4.5, headY - 0.5);
  ctx.lineTo(-1.5, headY);
  ctx.lineTo(-3.5, headY + 1.2);
  ctx.closePath();
  ctx.fill();

  // Right Eye (angled slit)
  ctx.beginPath();
  ctx.moveTo(1.5, headY);
  ctx.lineTo(4.5, headY - 0.5);
  ctx.lineTo(3.5, headY + 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Arms & Gauntlets with signature blades
  ctx.save();
  ctx.fillStyle = suitCharcoal;
  ctx.strokeStyle = armorPlate;

  if (isGrappling) {
    // Aiming / Holding grapnel gun forward
    ctx.beginPath();
    ctx.moveTo(8, -50);
    ctx.lineTo(24, -52);
    ctx.lineTo(23, -46);
    ctx.lineTo(8, -44);
    ctx.closePath();
    ctx.fill();

    // Grapnel Gun
    ctx.fillStyle = '#222';
    ctx.fillRect(22, -54, 8, 5);
    ctx.fillStyle = beltAmber;
    ctx.fillRect(28, -53, 3, 3); // Grapnel tip

    // Left arm holding line
    ctx.fillStyle = suitCharcoal;
    ctx.beginPath();
    ctx.moveTo(-8, -48);
    ctx.lineTo(12, -45);
    ctx.lineTo(10, -40);
    ctx.lineTo(-8, -42);
    ctx.closePath();
    ctx.fill();
  } else if (isThrowing) {
    // Whip throw forward
    ctx.beginPath();
    ctx.moveTo(8, -50);
    ctx.lineTo(22, -56);
    ctx.lineTo(24, -48);
    ctx.lineTo(8, -44);
    ctx.closePath();
    ctx.fill();

    // Gauntlet fins
    renderGauntletFins(ctx, 16, -53, 0.4);
  } else if (isAttacking) {
    // Punch / Strike forward
    ctx.beginPath();
    ctx.moveTo(8, -50);
    ctx.lineTo(26, -48);
    ctx.lineTo(25, -42);
    ctx.lineTo(8, -42);
    ctx.closePath();
    ctx.fill();

    // Gauntlet blades
    renderGauntletFins(ctx, 18, -47, 0);

    // Fist strike impact aura
    ctx.strokeStyle = beltAmber;
    ctx.beginPath();
    ctx.arc(28, -45, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Normal / running arm swing
    const armSwing = isMoving ? Math.sin(t * 10) * 8 : 0;
    // Front arm
    ctx.beginPath();
    ctx.moveTo(10, -50);
    ctx.lineTo(12 + armSwing, -38);
    ctx.lineTo(14 + armSwing * 1.2, -26);
    ctx.lineTo(10 + armSwing * 1.2, -26);
    ctx.lineTo(8 + armSwing, -38);
    ctx.lineTo(6, -50);
    ctx.closePath();
    ctx.fill();

    // 3 signature gauntlet fins on forearm!
    renderGauntletFins(ctx, 11 + armSwing, -34, 0.2);
  }
  ctx.restore();

  ctx.restore();
}

function renderGauntletFins(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#080a0e';
  ctx.strokeStyle = '#283042';
  ctx.lineWidth = 0.6;

  // 3 sharp triangular fins
  for (let i = 0; i < 3; i++) {
    const finY = i * 4 - 4;
    ctx.beginPath();
    ctx.moveTo(-2, finY);
    ctx.lineTo(-7, finY - 2);
    ctx.lineTo(-3, finY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
