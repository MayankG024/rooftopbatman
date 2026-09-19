import { useEffect } from 'react';
import { Crosshair, AlertTriangle, Play } from 'lucide-react';

interface MissionBriefingProps {
  onStart: () => void;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070a10]/90 backdrop-blur-md p-4 font-mono select-none">
      {/* Background Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Briefing Terminal Card */}
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0c111a]/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Terminal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#e5a93c] animate-ping" />
            <span className="text-xs font-bold tracking-wider text-[#e5a93c]">
              WAYNE TECH // BATCOMPUTER UPLINK
            </span>
          </div>
          <span className="text-[11px] text-slate-500">MK-VII // ACTIVE</span>
        </div>

        {/* Batman Insignia Watermark */}
        <div className="my-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5a93c]/40 bg-[#e5a93c]/10 text-[#e5a93c] shadow-[0_0_20px_rgba(229,169,60,0.25)]">
            <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 4.5c.7 1.2 1.8 1.8 3.2 1.6 1.4-.2 2.8-.9 4.3-.9 1.1 0 2 .5 2.5 1.5-.7 1.5-1.9 2.5-3.5 3 2.5 1 3.5 3.5 1.5 6.5-1.5 2.2-3.8 2.8-6 1.5-1 .9-2.2.9-3 0-2.2 1.3-4.5.7-6-1.5-2-3-1-5.5 1.5-6.5-1.6-.5-2.8-1.5-3.5-3 .5-1 1.4-1.5 2.5-1.5 1.5 0 2.9.7 4.3.9 1.4.2 2.5-.4 3.2-1.6l1.2.7 1.2-.7z" />
            </svg>
          </div>

          <h2 className="text-lg font-black tracking-tight text-slate-100 sm:text-xl">
            BATMAN // GOTHAM NIGHT PATROL
          </h2>
          <p className="mt-1 text-xs text-[#38bdf8]">DISTRICT 07 — UPPER HARBOR ROOFTOPS</p>
        </div>

        {/* Mission Dossier Box */}
        <div className="space-y-3 rounded-lg border border-slate-800 bg-[#080c14] p-4 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#e5a93c]" />
            <div>
              <div className="text-[11px] font-bold text-slate-300">THREAT DETECTED</div>
              <p className="mt-0.5 text-slate-400 leading-relaxed text-[11px]">
                Armored crime courier has fled across District 07 rooftops with stolen military drive.
                Multiple armed scouts and snipers established on perimeters.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t border-slate-800/80 pt-2.5">
            <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-[#38bdf8]" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">TACTICAL OBJECTIVE</div>
              <p className="mt-0.5 text-[#38bdf8] font-semibold text-[11px]">
                TRAVERSE ROOFTOPS • NEUTRALIZE HOSTILES • INTERCEPT THE TARGET
              </p>
            </div>
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400 border border-slate-800/60 rounded-lg p-2.5 bg-[#090e18]">
          <div><span className="text-slate-200 font-bold">[ A / D ]</span> Move across roofs</div>
          <div><span className="text-slate-200 font-bold">[ SPACE ]</span> Jump / Hold to Glide</div>
          <div><span className="text-[#e5a93c] font-bold">[ E / RMB ]</span> Grapple to Gargoyles</div>
          <div><span className="text-[#38bdf8] font-bold">[ Q ]</span> Throw Batarang</div>
        </div>

        {/* Launch Button */}
        <button
          onClick={onStart}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#e5a93c] to-[#f3c15d] py-3 text-sm font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.99] shadow-[0_0_25px_rgba(229,169,60,0.4)] cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>BEGIN PATROL</span>
          <span className="text-[10px] opacity-75 font-normal ml-1">(PRESS SPACE)</span>
        </button>
      </div>
    </div>
  );
};
