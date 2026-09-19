import { useEffect, useState } from 'react';
import { BatmanState, GameStats } from '../game/types';
import {
  Shield,
  Eye,
  Volume2,
  VolumeX,
  Crosshair,
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  Anchor,
  Moon,
} from 'lucide-react';
import { BatLogo } from './BatLogo';

interface BatHudProps {
  batman: BatmanState;
  stats: GameStats;
  remainingDistance: number;
  isDetectiveMode: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  onToggleDetective: () => void;
  onRestart: () => void;
  onTriggerGrapple: () => void;
  onTriggerBatarang: () => void;
  onTriggerMelee: () => void;
  onTriggerJump: () => void;
  onPressJump?: () => void;
  onReleaseJump?: () => void;
  onSetMove?: (dir: -1 | 0 | 1) => void;
  onSetGlide?: (held: boolean) => void;
  onCancelGrapple?: () => void;
}

function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsTouch(
        typeof window !== 'undefined' &&
          ('ontouchstart' in window ||
            (navigator as any).maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches)
      );
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isTouch;
}

const holdProps = (onDown: () => void, onUp?: () => void) => ({
  onPointerDown: (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onDown();
  },
  onPointerUp: (e: React.PointerEvent) => {
    e.preventDefault();
    onUp?.();
  },
  onPointerCancel: () => onUp?.(),
  onPointerLeave: () => onUp?.(),
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
});

export const BatHud: React.FC<BatHudProps> = ({
  batman,
  stats,
  remainingDistance,
  isDetectiveMode,
  isMuted,
  onToggleSound,
  onToggleDetective,
  onRestart,
  onTriggerGrapple,
  onTriggerBatarang,
  onTriggerMelee,
  onTriggerJump,
  onPressJump,
  onReleaseJump,
  onSetMove,
  onSetGlide,
  onCancelGrapple,
}) => {
  const isTouch = useIsTouch();
  const [moveHeld, setMoveHeld] = useState<-1 | 0 | 1>(0);
  const grappling = batman.grappleActive;
  const batarangReady = batman.batarangCooldown <= 0;

  const setMove = (dir: -1 | 0 | 1) => {
    setMoveHeld(dir);
    onSetMove?.(dir);
  };

  const pressJump = () => {
    onSetGlide?.(true);
    (onPressJump ?? onTriggerJump)();
  };
  const releaseJump = () => {
    onSetGlide?.(false);
    onReleaseJump?.();
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-4 select-none font-mono touch-none">
      {/* Top Header Bar — compact on mobile */}
      <header className="pointer-events-auto flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-[#0d121c]/92 px-2.5 py-2 backdrop-blur-md shadow-2xl sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 sm:h-8 items-center justify-center rounded border border-[#e5a93c]/50 bg-black/70 px-1.5 text-[#e5a93c]">
            <BatLogo size={30} glow={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-100">BATMAN</span>
              {!isTouch && (
                <span className="rounded bg-[#e5a93c]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#e5a93c]">
                  MK-VII
                </span>
              )}
            </div>
            {!isTouch && <div className="text-[10px] text-slate-400">WAYNE TECH // APPLIED SCIENCES</div>}
          </div>
        </div>

        {!isTouch && (
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">GOTHAM // DISTRICT 07</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-slate-400">02:47 AM</div>
            <span className="text-slate-600">|</span>
            <div className="text-[#38bdf8] text-[11px]">RAIN // 11°C</div>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-[#080d16] px-2 py-1 rounded border border-slate-800">
            <Shield className="h-3.5 w-3.5 text-[#e5a93c]" />
            <div className="flex gap-1">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`h-2.5 w-3 sm:w-3.5 rounded-xs transition-all duration-300 ${
                    idx < batman.health
                      ? 'bg-[#e5a93c] shadow-[0_0_8px_rgba(229,169,60,0.8)]'
                      : 'bg-slate-800 border border-slate-700/50'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onToggleDetective}
            title="Detective Vision"
            className={`flex items-center justify-center h-8 w-8 sm:h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded border text-xs transition cursor-pointer ${
              isDetectiveMode
                ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                : 'border-slate-800 bg-[#080d16] text-slate-400'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {!isTouch && <span className="hidden md:inline text-[10px] ml-1">DETECTIVE [V]</span>}
          </button>
          <button
            onClick={onToggleSound}
            className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded border border-slate-800 bg-[#080d16] text-slate-400 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-[#e5a93c]" />}
          </button>
          <button
            onClick={onRestart}
            className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded border border-slate-800 bg-[#080d16] text-slate-400 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Middle Row */}
      <div className="flex items-start justify-between gap-2 mt-2">
        <div className="transition-all duration-300">
          {batman.combo > 1 && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-[#e5a93c]/50 bg-[#0d121c]/90 px-3 py-1.5 shadow-xl backdrop-blur-md animate-pulse">
              <Zap className="h-4 w-4 text-[#e5a93c]" />
              <div>
                <div className="text-xs font-bold text-[#e5a93c]">COMBO ×0{batman.combo}</div>
                {!isTouch && <div className="text-[9px] text-slate-400">TACTICAL MOMENTUM</div>}
              </div>
            </div>
          )}
          {grappling && (
            <div className="mt-2 pointer-events-auto flex items-center gap-2 rounded-lg border border-[#38bdf8]/50 bg-[#0d121c]/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
              <Anchor className="h-3.5 w-3.5 text-[#38bdf8] animate-pulse" />
              <div className="text-[10px] font-bold text-[#38bdf8]">
                {batman.grapplePhase === 'firing' ? 'HOOK AWAY…' : 'SWINGING — JUMP TO VAULT'}
              </div>
            </div>
          )}
          {stats.robinActive && (
            <div className="mt-2 pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-[#0d121c]/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[10px] font-bold text-emerald-300">
                ROBIN ACTIVE{stats.robinAssists > 0 ? ` · ${stats.robinAssists} HITS` : ''}
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-auto rounded-lg border border-slate-800 bg-[#0d121c]/90 p-2.5 sm:p-3 shadow-xl backdrop-blur-md text-right w-[168px] sm:max-w-[240px] sm:w-auto shrink-0">
          <div className="flex items-center justify-end gap-1.5 text-[10px] tracking-wider text-[#e5a93c]">
            <Crosshair className="h-3 w-3 animate-spin" />
            <span>OBJECTIVE</span>
          </div>
          {!isTouch && <div className="mt-0.5 text-xs font-bold text-slate-100">INTERCEPT THE TARGET</div>}
          <div className="mt-1 flex items-baseline justify-end gap-1.5">
            <span className="text-[10px] text-slate-400">DIST</span>
            <span className="text-base font-black tracking-tight text-[#38bdf8]">{remainingDistance}m</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-[#e5a93c] to-[#38bdf8] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, (1 - remainingDistance / 3200) * 100))}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span>HOSTILES:</span>
            <span className="font-semibold text-slate-300">
              {stats.hostilesDefeated} / {stats.totalHostiles}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <footer className="pointer-events-auto mt-auto flex flex-col items-center gap-2 pb-[env(safe-area-inset-bottom)]">
        {/* Portrait rotate hint */}
        {isTouch && (
          <div className="portrait-only text-[10px] text-amber-300/90 bg-[#090d15]/85 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm flex items-center gap-1.5">
            <Moon className="h-3 w-3" />
            <span>ROTATE TO LANDSCAPE FOR BEST PATROL</span>
          </div>
        )}

        {/* Desktop control bar */}
        {!isTouch && (
          <>
            <div className="text-[11px] text-slate-400 bg-[#090d15]/80 px-3 py-1 rounded-full border border-slate-800/60 backdrop-blur-sm hidden sm:flex items-center gap-2">
              <span>Click gargoyles to Grapple • Hold Space to Glide • Q = aimed Batarang • E = smart Grapple</span>
            </div>
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-[#0d121c]/95 p-2 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-1 rounded bg-[#080d16] px-2.5 py-1.5 border border-slate-800 text-xs">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">A</kbd>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">D</kbd>
                <span className="ml-1 text-[11px] text-slate-400">MOVE</span>
              </div>
              <button
                onClick={onTriggerJump}
                className="flex items-center gap-1.5 rounded bg-[#080d16] px-3 py-1.5 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                <kbd className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">SPACE</kbd>
                <span className="text-[11px] font-medium">JUMP / GLIDE</span>
              </button>
              <button
                onClick={onTriggerGrapple}
                className="flex items-center gap-1.5 rounded bg-[#e5a93c]/15 px-3 py-1.5 border border-[#e5a93c]/60 hover:bg-[#e5a93c]/25 text-xs text-[#e5a93c] transition shadow-[0_0_12px_rgba(229,169,60,0.2)] cursor-pointer"
              >
                <kbd className="rounded bg-[#e5a93c]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#e5a93c]">E</kbd>
                <span className="text-[10px] text-slate-400">/ RMB</span>
                <span className="text-[11px] font-bold">GRAPPLE</span>
              </button>
              <button
                onClick={onTriggerBatarang}
                disabled={!batarangReady}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 border text-xs transition cursor-pointer ${
                  !batarangReady
                    ? 'border-slate-800 bg-[#080d16]/50 text-slate-600'
                    : 'border-slate-800 bg-[#080d16] hover:border-[#38bdf8]/50 text-slate-300 hover:text-[#38bdf8]'
                }`}
              >
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">Q</kbd>
                <span className="text-[11px] font-medium">BATARANG</span>
              </button>
              <button
                onClick={onTriggerMelee}
                className="flex items-center gap-1.5 rounded bg-[#080d16] px-3 py-1.5 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">F</kbd>
                <span className="text-[11px] font-medium">MELEE</span>
              </button>
            </div>
          </>
        )}

        {/* Mobile touch controls — thumb zones */}
        {isTouch && (
          <div className="w-full flex items-end justify-between gap-2 px-1">
            {/* Left: move + glide-hold jump */}
            <div className="flex items-end gap-2">
              <div className="flex gap-2">
                <button
                  {...holdProps(
                    () => setMove(-1),
                    () => moveHeld === -1 && setMove(0)
                  )}
                  className={`flex h-[64px] w-[64px] items-center justify-center rounded-2xl border backdrop-blur-md active:scale-95 transition ${
                    moveHeld === -1
                      ? 'border-[#e5a93c] bg-[#e5a93c]/25 text-[#e5a93c]'
                      : 'border-slate-700 bg-[#0d121c]/85 text-slate-200'
                  }`}
                  aria-label="Move left"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  {...holdProps(
                    () => setMove(1),
                    () => moveHeld === 1 && setMove(0)
                  )}
                  className={`flex h-[64px] w-[64px] items-center justify-center rounded-2xl border backdrop-blur-md active:scale-95 transition ${
                    moveHeld === 1
                      ? 'border-[#e5a93c] bg-[#e5a93c]/25 text-[#e5a93c]'
                      : 'border-slate-700 bg-[#0d121c]/85 text-slate-200'
                  }`}
                  aria-label="Move right"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </div>
              <button
                {...holdProps(pressJump, releaseJump)}
                className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#0d121c]/85 text-slate-200 backdrop-blur-md active:scale-95 transition"
                aria-label="Jump or hold to glide"
              >
                <ArrowBigUp className="h-6 w-6 text-[#38bdf8]" />
                <span className="text-[8px] font-bold tracking-wider mt-0.5">JUMP/GLIDE</span>
                <span className="text-[7px] text-slate-500">HOLD = GLIDE</span>
              </button>
            </div>

            {/* Right: grapple / batarang / strike */}
            <div className="flex items-end gap-2">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onTriggerMelee();
                }}
                className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#0d121c]/85 text-slate-200 backdrop-blur-md active:scale-95 transition"
                aria-label="Melee strike"
              >
                <Zap className="h-5 w-5 text-slate-300" />
                <span className="text-[8px] font-bold mt-0.5">STRIKE</span>
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onTriggerBatarang();
                }}
                disabled={!batarangReady}
                className={`flex h-[60px] w-[60px] flex-col items-center justify-center rounded-2xl border backdrop-blur-md active:scale-95 transition ${
                  !batarangReady
                    ? 'border-slate-800 bg-[#080d16]/60 text-slate-600'
                    : 'border-[#38bdf8]/60 bg-[#38bdf8]/15 text-[#38bdf8]'
                }`}
                aria-label="Throw batarang"
              >
                <Moon className="h-5 w-5" />
                <span className="text-[8px] font-bold mt-0.5">BATARANG</span>
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (grappling) onCancelGrapple?.();
                  else onTriggerGrapple();
                }}
                className={`flex h-[76px] w-[76px] flex-col items-center justify-center rounded-2xl border-2 backdrop-blur-md active:scale-95 transition shadow-[0_0_18px_rgba(229,169,60,0.35)] ${
                  grappling
                    ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8]'
                    : 'border-[#e5a93c] bg-[#e5a93c]/20 text-[#e5a93c] animate-pulse'
                }`}
                aria-label="Grapple"
              >
                <Anchor className="h-6 w-6" />
                <span className="text-[9px] font-black mt-0.5">{grappling ? 'DROP' : 'GRAPPLE'}</span>
                <span className="text-[7px] opacity-70">TAP ● TO AIM</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
