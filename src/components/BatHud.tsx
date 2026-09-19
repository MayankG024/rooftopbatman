import { BatmanState, GameStats } from '../game/types';
import { Shield, Eye, Volume2, VolumeX, Crosshair, Zap, Compass, RotateCcw } from 'lucide-react';

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
}

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
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 select-none font-mono">
      {/* Top Header Bar */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-[#0d121c]/90 px-4 py-2.5 backdrop-blur-md shadow-2xl">
        {/* Left: Bat Emblem & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-[#e5a93c]/50 bg-[#e5a93c]/10 text-[#e5a93c]">
            {/* Bat Shape SVG */}
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 4.5c.7 1.2 1.8 1.8 3.2 1.6 1.4-.2 2.8-.9 4.3-.9 1.1 0 2 .5 2.5 1.5-.7 1.5-1.9 2.5-3.5 3 2.5 1 3.5 3.5 1.5 6.5-1.5 2.2-3.8 2.8-6 1.5-1 .9-2.2.9-3 0-2.2 1.3-4.5.7-6-1.5-2-3-1-5.5 1.5-6.5-1.6-.5-2.8-1.5-3.5-3 .5-1 1.4-1.5 2.5-1.5 1.5 0 2.9.7 4.3.9 1.4.2 2.5-.4 3.2-1.6l1.2.7 1.2-.7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-slate-100">BATMAN</span>
              <span className="rounded bg-[#e5a93c]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#e5a93c]">
                MK-VII TACTICAL
              </span>
            </div>
            <div className="text-[10px] text-slate-400">WAYNE ENTERPRISES // APPLIED SCIENCES</div>
          </div>
        </div>

        {/* Center: Location & Time */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">GOTHAM // DISTRICT 07</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">02:47 AM</div>
          <span className="text-slate-600">|</span>
          <div className="text-[#38bdf8] text-[11px]">RAIN // 11°C</div>
        </div>

        {/* Right: Armor Shields & Quick Controls */}
        <div className="flex items-center gap-3">
          {/* Batsuit Armor Pips */}
          <div className="flex items-center gap-1.5 bg-[#080d16] px-2.5 py-1 rounded border border-slate-800">
            <Shield className="h-3.5 w-3.5 text-[#e5a93c]" />
            <span className="text-[10px] text-slate-400 mr-1">ARMOR</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((idx) => {
                const filled = idx < batman.health;
                return (
                  <div
                    key={idx}
                    className={`h-2.5 w-3.5 rounded-xs transition-all duration-300 ${
                      filled
                        ? 'bg-[#e5a93c] shadow-[0_0_8px_rgba(229,169,60,0.8)]'
                        : 'bg-slate-800 border border-slate-700/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detective Mode Button */}
          <button
            onClick={onToggleDetective}
            title="Toggle Detective Vision [V]"
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs transition cursor-pointer ${
              isDetectiveMode
                ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[10px]">DETECTIVE [V]</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-[#080d16] text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-[#e5a93c]" />}
          </button>

          {/* Reset Mission Button */}
          <button
            onClick={onRestart}
            title="Restart Patrol"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-[#080d16] text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Middle Row: Floating Objective Widget (Top-Right) & Combo Counter (Left) */}
      <div className="flex items-start justify-between">
        {/* Left: Combo Counter */}
        <div className="transition-all duration-300">
          {batman.combo > 1 && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-[#e5a93c]/50 bg-[#0d121c]/90 px-3 py-1.5 shadow-xl backdrop-blur-md animate-pulse">
              <Zap className="h-4 w-4 text-[#e5a93c]" />
              <div>
                <div className="text-xs font-bold text-[#e5a93c]">COMBO ×0{batman.combo}</div>
                <div className="text-[9px] text-slate-400">TACTICAL MOMENTUM</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Primary Objective Tracker */}
        <div className="pointer-events-auto rounded-lg border border-slate-800 bg-[#0d121c]/90 p-3 shadow-xl backdrop-blur-md text-right max-w-[240px]">
          <div className="flex items-center justify-end gap-1.5 text-[10px] tracking-wider text-[#e5a93c]">
            <Crosshair className="h-3 w-3 animate-spin" />
            <span>PRIMARY OBJECTIVE</span>
          </div>
          <div className="mt-0.5 text-xs font-bold text-slate-100">INTERCEPT THE TARGET</div>

          {/* Live Distance */}
          <div className="mt-2 flex items-baseline justify-end gap-1.5">
            <span className="text-[10px] text-slate-400">DISTANCE</span>
            <span className="text-base font-black tracking-tight text-[#38bdf8]">
              {remainingDistance}m
            </span>
          </div>

          {/* Distance progress track */}
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-[#e5a93c] to-[#38bdf8] transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(5, (1 - remainingDistance / 3200) * 100))}%`,
              }}
            />
          </div>

          {/* Hostiles Counter */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span>HOSTILES:</span>
            <span className="font-semibold text-slate-300">
              {stats.hostilesDefeated} / {stats.totalHostiles}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Game Controls & Traversal Actions */}
      <footer className="pointer-events-auto mt-auto flex flex-col items-center gap-2">
        {/* Subtle Guidance prompt */}
        <div className="text-[11px] text-slate-400 bg-[#090d15]/80 px-3 py-1 rounded-full border border-slate-800/60 backdrop-blur-sm hidden sm:flex items-center gap-2">
          <Compass className="h-3 w-3 text-[#e5a93c]" />
          <span>Click gargoyles to Grapple • Hold Space to Glide • Press Q for Batarang</span>
        </div>

        {/* Action Buttons Panel */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-[#0d121c]/95 p-2 backdrop-blur-md shadow-2xl">
          {/* Move Keys Badge */}
          <div className="flex items-center gap-1 rounded bg-[#080d16] px-2.5 py-1.5 border border-slate-800 text-xs">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">A</kbd>
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">D</kbd>
            <span className="ml-1 text-[11px] text-slate-400">MOVE</span>
          </div>

          {/* Jump / Glide */}
          <button
            onClick={onTriggerJump}
            className="flex items-center gap-1.5 rounded bg-[#080d16] px-3 py-1.5 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <kbd className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">SPACE</kbd>
            <span className="text-[11px] font-medium">JUMP / GLIDE</span>
          </button>

          {/* Grapple Hook (Signature Button) */}
          <button
            onClick={onTriggerGrapple}
            className="flex items-center gap-1.5 rounded bg-[#e5a93c]/15 px-3 py-1.5 border border-[#e5a93c]/60 hover:bg-[#e5a93c]/25 text-xs text-[#e5a93c] transition shadow-[0_0_12px_rgba(229,169,60,0.2)] cursor-pointer"
          >
            <kbd className="rounded bg-[#e5a93c]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#e5a93c]">E</kbd>
            <span className="text-[10px] text-slate-400">/ RMB</span>
            <span className="text-[11px] font-bold">GRAPPLE</span>
          </button>

          {/* Batarang Button */}
          <button
            onClick={onTriggerBatarang}
            disabled={batman.batarangCooldown > 0}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 border text-xs transition cursor-pointer ${
              batman.batarangCooldown > 0
                ? 'border-slate-800 bg-[#080d16]/50 text-slate-600'
                : 'border-slate-800 bg-[#080d16] hover:border-[#38bdf8]/50 text-slate-300 hover:text-[#38bdf8]'
            }`}
          >
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">Q</kbd>
            <span className="text-[11px] font-medium">BATARANG</span>
            {batman.batarangCooldown > 0 && (
              <span className="text-[9px] text-[#e5a93c]">
                {Math.ceil(batman.batarangCooldown * 10) / 10}s
              </span>
            )}
          </button>

          {/* Strike / Melee */}
          <button
            onClick={onTriggerMelee}
            className="flex items-center gap-1.5 rounded bg-[#080d16] px-3 py-1.5 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">F</kbd>
            <span className="text-[11px] font-medium">MELEE</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
