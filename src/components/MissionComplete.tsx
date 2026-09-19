
import { GameStats } from '../game/types';
import { RotateCcw } from 'lucide-react';

interface MissionCompleteProps {
  stats: GameStats;
  onRestart: () => void;
}

export const MissionComplete: React.FC<MissionCompleteProps> = ({ stats, onRestart }) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070a10]/95 backdrop-blur-lg p-4 font-mono select-none">
      {/* Background Graphic: Bat Silhouette & Skyline glow */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c121d]/95 p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-[#e5a93c]/15 blur-3xl pointer-events-none" />

        {/* Batman Hero Illustration on Gargoyle Perch */}
        <div className="relative mx-auto mb-4 flex h-36 w-full items-center justify-center">
          <svg className="h-36 w-64 overflow-visible" viewBox="0 0 200 120">
            {/* Moon in background */}
            <circle cx="100" cy="40" r="28" fill="#fef08a" opacity="0.3" />

            {/* Distant building silhouette */}
            <rect x="20" y="55" width="25" height="65" fill="#0b101c" />
            <rect x="50" y="40" width="30" height="80" fill="#0e1524" />
            <rect x="125" y="45" width="28" height="75" fill="#0e1524" />
            <rect x="158" y="60" width="24" height="60" fill="#0b101c" />

            {/* Gothic Gargoyle Perch */}
            <path
              d="M 60 120 L 75 90 L 110 88 L 125 78 L 135 85 L 115 105 L 120 120 Z"
              fill="#1a2333"
            />
            {/* Gargoyle Claw */}
            <circle cx="125" cy="78" r="4" fill="#253248" />

            {/* Batman Standing Heroically */}
            {/* Cape flowing back in wind */}
            <path
              d="M 98 52 C 75 56 60 70 45 95 C 60 88 72 90 85 86 C 92 84 96 75 98 68 Z"
              fill="#06090f"
            />
            {/* Body */}
            <rect x="96" y="50" width="14" height="28" rx="2" fill="#121824" />
            {/* Legs */}
            <rect x="97" y="74" width="5" height="18" fill="#0d131f" />
            <rect x="105" y="74" width="5" height="18" fill="#0d131f" />
            {/* Utility Belt */}
            <rect x="95" y="66" width="16" height="3" fill="#e5a93c" />
            {/* Chest Bat Emblem */}
            <path
              d="M 100 55 L 103 57 L 106 55 L 105 59 L 103 61 L 101 59 Z"
              fill="#e5a93c"
            />
            {/* Cowl with pointed ears */}
            <path
              d="M 99 50 L 98 40 L 101 45 L 105 45 L 108 40 L 107 50 Z"
              fill="#06090f"
            />
            {/* White slit eyes */}
            <ellipse cx="101" cy="46" rx="1.2" ry="0.6" fill="#fff" />
            <ellipse cx="105" cy="46" rx="1.2" ry="0.6" fill="#fff" />
          </svg>
        </div>

        {/* Mission Status Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            MISSION COMPLETE
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
            TARGET INTERCEPTED
          </h2>
          <p className="text-xs text-slate-400">CLASSIFIED MILITARY INTEL RECOVERED</p>
        </div>

        {/* Clean Results Table */}
        <div className="my-5 rounded-xl border border-slate-800 bg-[#080d16] p-4 text-xs">
          <div className="grid grid-cols-2 gap-y-2.5 sm:grid-cols-4 text-center">
            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">TIME</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {formatTime(stats.timeElapsed)}
              </div>
            </div>

            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">HOSTILES</div>
              <div className="text-sm font-bold text-[#e5a93c] mt-0.5">
                {stats.hostilesDefeated} / {stats.totalHostiles}
              </div>
            </div>

            <div className="border-r border-slate-800/80">
              <div className="text-[10px] text-slate-400">BATARANGS</div>
              <div className="text-sm font-bold text-[#38bdf8] mt-0.5">
                {stats.batarangsThrown}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400">MAX COMBO</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                ×0{stats.maxCombo || 1}
              </div>
            </div>
          </div>
        </div>

        {/* Noir Gotham Quote */}
        <p className="text-xs italic tracking-wider text-slate-400">
          “Gotham is quiet tonight.”
        </p>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e5a93c] to-[#f3c15d] py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.99] shadow-[0_0_25px_rgba(229,169,60,0.4)] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>PATROL AGAIN</span>
        </button>
      </div>
    </div>
  );
};
