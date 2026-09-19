import { RobinState } from './types';

// Robin — Boy Wonder, color scheme matched to the LEGO reference:
// red vest with gold R + buttons, green sleeves/legs, yellow cape,
// skin face, black domino mask + black swoop hair, gold utility belt.
export function renderRobin(
  ctx: CanvasRenderingContext2D,
  robin: RobinState,
  isDetectiveMode = false,
) {
  if (!robin.active) return;
  // Fade out during leave
  const fade = robin.phase === 'leave' ? Math.max(0, 1 - robin.timer / 70) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(robin.x, robin.y);
  ctx.scale(robin.facing, 1);

  const t = robin.animT;
  const running = robin.phase === 'arrive' || robin.phase === 'follow';
  const fighting = robin.phase === 'fight';
  const stride = running ? Math.sin(t * 13) : 0;

  const red = isDetectiveMode ? '#3f4b63' : '#c81e2b';
  const redDark = isDetectiveMode ? '#2b3547' : '#8f1420';
  const green = isDetectiveMode ? '#274058' : '#1f7a37';
  const greenDark = isDetectiveMode ? '#1a2f42' : '#145626';
  const yellow = isDetectiveMode ? '#38bdf8' : '#f2bc0d';
  const skin = isDetectiveMode ? '#8fa3bd' : '#f2c79b';
  const black = '#0b0d12';

  // --- Cape (yellow, fluttering behind) ---
  ctx.fillStyle = yellow;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  const flutter = Math.sin(t * (running ? 16 : 6)) * (running ? 4 : 1.6);
  ctx.beginPath();
  ctx.moveTo(-5, -42);
  ctx.bezierCurveTo(-16, -36 + flutter, -22, -22, -20 + flutter * 0.5, -4);
  ctx.lineTo(-12, -6);
  ctx.lineTo(-8, -2);
  ctx.lineTo(-4, -6);
  ctx.lineTo(0, -2);
  ctx.lineTo(2, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // --- Legs (green tights + boots) ---
  const lfx = running ? stride * 9 : -4;
  const rfx = running ? -stride * 9 : 4;
  ctx.fillStyle = green;
  ctx.fillRect(lfx - 3.5, -20, 7, 14); // left leg
  ctx.fillRect(rfx - 3.5, -20, 7, 14); // right leg
  ctx.fillStyle = black; // pixie boots
  ctx.fillRect(lfx - 4, -7, 8, 7);
  ctx.fillRect(rfx - 4, -7, 8, 7);

  // --- Torso: red vest with gold buttons + R ---
  const vestGrad = ctx.createLinearGradient(0, -42, 0, -20);
  vestGrad.addColorStop(0, red);
  vestGrad.addColorStop(1, redDark);
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(-9, -42);
  ctx.lineTo(9, -42);
  ctx.lineTo(7, -22);
  ctx.lineTo(-7, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  // Gold buttons down the chest
  ctx.fillStyle = '#f7d47a';
  for (let by = -38; by <= -26; by += 4) {
    ctx.beginPath();
    ctx.arc(0, by, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // R emblem (left chest)
  ctx.font = 'bold 7px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0b0d12';
  ctx.fillText('R', -7.5, -31);

  // --- Utility belt (gold) ---
  ctx.fillStyle = '#d9a521';
  ctx.fillRect(-8, -24, 16, 3.4);
  ctx.fillStyle = '#7a5410';
  ctx.fillRect(-2.5, -24.6, 5, 4.6);

  // --- Arms ---
  ctx.fillStyle = green;
  if (fighting) {
    // Punch extended forward, other arm guarding
    const punch = Math.sin(t * 18) > 0 ? 20 : 16;
    ctx.save();
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.moveTo(6, -38);
    ctx.lineTo(punch, -34);
    ctx.lineTo(punch - 1, -29);
    ctx.lineTo(6, -32);
    ctx.closePath();
    ctx.fill();
    // Fist
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(punch + 1, -31.5, 3.4, 0, Math.PI * 2);
    ctx.fill();
    // Guard arm
    ctx.fillStyle = green;
    ctx.fillRect(-11, -36, 6, 12);
    ctx.restore();
    // Impact star on punch frames
    if (Math.sin(t * 18) > 0.6) {
      ctx.strokeStyle = yellow;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(punch + 5, -32, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    const swing = running ? stride * 7 : 0;
    // Front arm
    ctx.fillRect(6, -38 + swing * 0.4, 6, 13);
    ctx.fillStyle = black; // glove
    ctx.fillRect(6, -27 + swing * 0.4, 6, 5);
    // Back arm
    ctx.fillStyle = greenDark;
    ctx.fillRect(-12, -38 - swing * 0.4, 6, 13);
  }

  // --- Head: skin + black hair + domino mask (LEGO ref) ---
  // Neck
  ctx.fillStyle = skin;
  ctx.fillRect(-3.5, -46, 7, 4.5);
  // Face
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -50, 6.4, 0, Math.PI * 2);
  ctx.fill();
  // Domino mask
  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.moveTo(-6.2, -51.5);
  ctx.lineTo(-1, -50.4);
  ctx.lineTo(-4.5, -48.6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1, -50.4);
  ctx.lineTo(6.2, -51.5);
  ctx.lineTo(4.5, -48.6);
  ctx.closePath();
  ctx.fill();
  // White eye slits
  ctx.fillStyle = '#fff';
  ctx.fillRect(-5, -50.8, 2.6, 1.4);
  ctx.fillRect(2.4, -50.8, 2.6, 1.4);
  // Grin
  ctx.strokeStyle = 'rgba(60,30,20,0.8)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, -46.5, 2.6, 0.25, Math.PI - 0.25);
  ctx.stroke();
  // Black swoop hair
  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.moveTo(-6.8, -50);
  ctx.bezierCurveTo(-8, -58, -2, -60.5, 2, -59.5);
  ctx.bezierCurveTo(7, -58.5, 7.5, -53, 6.4, -50.5);
  ctx.lineTo(4.5, -54);
  ctx.lineTo(1.5, -52.5);
  ctx.lineTo(-1, -54.5);
  ctx.lineTo(-3.5, -52);
  ctx.closePath();
  ctx.fill();

  // Detective outline
  if (isDetectiveMode) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.strokeRect(-13, -58, 26, 58);
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('ALLY', -11, -60);
  }

  ctx.restore();
}
