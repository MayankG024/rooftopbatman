import { useEffect, useState } from 'react';
import { Play, ChevronRight, Gamepad2, Zap, Users } from 'lucide-react';
import { LEVELS } from '../game/levelData';
import { BatLogo } from './BatLogo';

interface MissionBriefingProps {
  onStart: (levelIndex: number) => void;
}

function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (navigator as any).maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches)
    );
  }, []);
  return isTouch;
}

// AAA-minimal title screen: logo, title, one-line objective,
// level select, deploy. Nothing else.
export const MissionBriefing: React.FC<MissionBriefingProps> = ({ onStart }) => {
  const isTouch = useIsTouch();
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart(level);
      }
      if (e.code === 'Digit1') onStart(0);
      if (e.code === 'Digit2') onStart(1);
      if (e.code === 'Digit3') onStart(2);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart, level]);

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-black font-mono select-none" style={{ touchAction: 'pan-y' }}>
      {/* ===== Backdrop: black + embers + rain + skyline + letterbox ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-black">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(110% 50% at 50% 108%, rgba(234,88,12,0.35) 0%, rgba(154,38,8,0.16) 30%, rgba(0,0,0,0) 62%),
              linear-gradient(to bottom, #000 0%, #05070c 55%, #0b0a08 85%, #120b05 100%)
            `,
          }}
        />
        <div className="absolute inset-0 briefing-rain opacity-50" />
        <div className="absolute inset-0 flex justify-center">
          <div className="briefing-beam h-full w-[340px] sm:w-[480px] opacity-80" />
        </div>
        {/* Single skyline silhouette */}
        <svg
          className="absolute bottom-0 left-0 h-[30%] w-full min-w-[900px]"
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMax slice"
        >
          <path
            d="M0,200 L0,140 L50,140 L50,100 L90,100 L90,120 L150,120 L150,70 L210,70 L210,130 L270,130 L270,60 L290,60 L290,30 L305,30 L305,60 L325,60 L325,130 L390,130 L390,95 L450,95 L450,135 L510,135 L510,65 L580,65 L580,130 L650,130 L650,90 L720,90 L720,135 L790,135 L790,60 L810,60 L810,30 L830,30 L830,60 L850,60 L850,130 L920,130 L920,100 L990,100 L990,135 L1060,135 L1060,95 L1130,95 L1130,130 L1200,130 L1200,200 Z"
            fill="#05080f"
          />
          <g fill="rgba(251,191,36,0.30)">
            {Array.from({ length: 44 }).map((_, i) => {
              const x = (i * 271) % 1180 + 12;
              const y = 80 + ((i * 67) % 90);
              return <rect key={i} x={x} y={y} width="4" height="6" opacity={0.2 + ((i * 41) % 50) / 100} />;
            })}
          </g>
        </svg>
        <div className="absolute inset-0 briefing-embers" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(85% 70% at 50% 42%, transparent 55%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.06] briefing-grain" />
        {/* Letterbox */}
        <div className="absolute top-0 h-12 w-full bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* ===== Content: centered column ===== */}
      <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-5 py-8 text-center">
        {/* Logo — the user's emblem, large on black */}
        <div className="briefing-logo-in">
          <BatLogo size={150} />
        </div>

        <h1 className="mt-4 font-black leading-none tracking-tight text-slate-100">
          <span className="block text-6xl sm:text-7xl" style={{ textShadow: '0 0 44px rgba(229,169,60,0.4), 0 4px 0 #000' }}>
            BATMAN
          </span>
          <span className="mt-2 block text-sm sm:text-base font-bold tracking-[0.42em] text-amber-400/90">
            ARKHAM NIGHT PATROL
          </span>
        </h1>

        <p className="mt-3 max-w-sm text-[12px] sm:text-[13px] leading-relaxed text-slate-400">
          {level === 2
            ? 'Break into the foundry. Break Bane.'
            : 'Intercept the courier across Gotham\u2019s rooftops.'}
        </p>

        {/* Level select — the only choice on this screen */}
        <div className="mt-6 grid w-full max-w-lg grid-cols-2 sm:grid-cols-3 gap-2">
          {LEVELS.map((m) => {
            const selected = level === m.index;
            const span = m.index === LEVELS.length - 1 ? 'col-span-2 sm:col-span-1' : '';
            return (
              <button
                key={m.index}
                onClick={() => setLevel(m.index)}
                className={`group rounded-xl border p-3 text-left transition-all cursor-pointer active:scale-[0.98] ${span} ${
                  selected
                    ? 'border-amber-400/80 bg-amber-400/10 shadow-[0_0_28px_rgba(229,169,60,0.3)]'
                    : 'border-slate-800 bg-black/60 hover:border-slate-600'
                }`}
              >
                <div className={`text-[9px] font-bold tracking-[0.3em] ${selected ? 'text-amber-300' : 'text-slate-500'}`}>
                  {m.tag} · {m.difficulty}
                </div>
                <div className={`mt-1 text-sm font-black ${selected ? 'text-slate-100' : 'text-slate-300'}`}>
                  {m.name}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <Users className="h-3 w-3" />
                  <span>{m.hostiles} hostiles</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Deploy */}
        <button
          onClick={() => onStart(level)}
          className="group relative mt-4 flex w-full max-w-md items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 py-4 text-sm font-black tracking-[0.2em] text-black transition-all hover:brightness-110 active:scale-[0.99] shadow-[0_0_40px_rgba(229,169,60,0.5)] cursor-pointer"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[briefing-sheen_3s_ease_infinite]" />
          <Play className="h-4 w-4 fill-current" />
          <span>{isTouch ? 'TAP TO DEPLOY' : 'DEPLOY'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* One-line controls */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600">
          <Gamepad2 className="h-3.5 w-3.5" />
          {isTouch ? (
            <span>D-PAD move · hold JUMP to glide · TAP reticles to grapple</span>
          ) : (
            <span>A/D move · SPACE glide · E grapple · Q batarang · 1/2/3 level</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-700">
          <Zap className="h-3 w-3" />
          <span>Robin fights beside you — watch for green</span>
        </div>
      </div>
    </div>
  );
};
