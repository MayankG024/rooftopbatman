import { GameStats } from '../game/types';
import { LEVELS } from '../game/levelData';
import { RotateCcw, ChevronRight, Home } from 'lucide-react';
import { BatLogo } from './BatLogo';

interface MissionCompleteProps {
  stats: GameStats;
  levelIndex: number;
  hasNextLevel: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  onTitle: () => void;
}

export const MissionComplete: React.FC<MissionCompleteProps> = ({
  stats,
  levelIndex,
  hasNextLevel,
  onRestart,
  onNextLevel,
  onTitle,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };
  const meta = LEVELS[levelIndex] ?? LEVELS[0];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 font-mono select-none overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/25 bg-[#0a0d14]/95 p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(229,169,60,0.15)] overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-[#e5a93c]/15 blur-3xl pointer-events-none" />

        <div className="flex justify-center">
          <BatLogo size={96} />
        </div>

        <div className="mt-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {meta.tag} COMPLETE
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
            TARGET INTERCEPTED
          </h2>
          <p className="text-[11px] tracking-[0.25em] text-amber-400/80">{meta.name}</p>
        </div>

        <div className="my-5 rounded-xl border border-slate-800 bg-[#080d16] p-4 text-xs">
          <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-4 text-center">
            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">TIME</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">{formatTime(stats.timeElapsed)}</div>
            </div>
            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">HOSTILES</div>
              <div className="text-sm font-bold text-[#e5a93c] mt-0.5">
                {stats.hostilesDefeated} / {stats.totalHostiles}
              </div>
            </div>
            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">ROBIN HITS</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{stats.robinAssists}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">COMBO</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">×0{stats.maxCombo || 1}</div>
            </div>
          </div>
        </div>

        <p className="text-xs italic tracking-wider text-slate-400">“Gotham is quiet tonight.”</p>

        {hasNextLevel ? (
          <button
            onClick={onNextLevel}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e5a93c] to-[#f3c15d] py-3 text-sm font-black tracking-wider text-slate-950 transition hover:brightness-110 active:scale-[0.99] shadow-[0_0_25px_rgba(229,169,60,0.4)] cursor-pointer"
          >
            <span>NEXT: {LEVELS[levelIndex + 1].name}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onRestart}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e5a93c] to-[#f3c15d] py-3 text-sm font-black tracking-wider text-slate-950 transition hover:brightness-110 active:scale-[0.99] shadow-[0_0_25px_rgba(229,169,60,0.4)] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>PATROL AGAIN</span>
          </button>
        )}
        <div className="mt-2 flex gap-2">
          {hasNextLevel && (
            <button
              onClick={onRestart}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-black/50 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-500 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>REPLAY</span>
            </button>
          )}
          <button
            onClick={onTitle}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-black/50 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-500 cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
