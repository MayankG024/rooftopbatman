import { useState, useRef, useCallback } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { BatHud } from './components/BatHud';
import { MissionBriefing } from './components/MissionBriefing';
import { MissionComplete } from './components/MissionComplete';
import { BatmanState, GameStats } from './game/types';
import { soundManager } from './game/audio';

export default function App() {
  const [gameState, setGameState] = useState<'briefing' | 'playing' | 'completed'>('briefing');
  const [isMuted, setIsMuted] = useState(false);
  const [isDetectiveMode, setIsDetectiveMode] = useState(false);
  const [remainingDist, setRemainingDist] = useState(3200);

  const [stats, setStats] = useState<GameStats>({
    timeElapsed: 0,
    hostilesDefeated: 0,
    totalHostiles: 7,
    grapplesUsed: 0,
    batarangsThrown: 0,
    maxCombo: 0,
  });

  const [batman, setBatman] = useState<BatmanState>({
    x: 180,
    y: 480,
    vx: 0,
    vy: 0,
    width: 34,
    height: 68,
    facing: 1,
    grounded: true,
    action: 'idle',
    animTimer: 0,
    capeAngle: 0,
    health: 3,
    maxHealth: 3,
    batarangCooldown: 0,
    combo: 0,
    comboTimer: 0,
    grappleActive: false,
    grappleTarget: null,
    grappleAnchorId: null,
    grappleProgress: 0,
    grappleLength: 0,
  });

  const canvasHandleRef = useRef<GameCanvasHandle | null>(null);

  const handleStatsUpdate = useCallback((newStats: GameStats, newBatman: BatmanState) => {
    setStats({ ...newStats });
    setBatman({ ...newBatman });
    if (canvasHandleRef.current) {
      setRemainingDist(canvasHandleRef.current.getRemainingDistance());
    }
  }, []);

  const handleMissionComplete = useCallback((finalStats: GameStats) => {
    setStats({ ...finalStats });
    setGameState('completed');
  }, []);

  const handleGameOver = useCallback(() => {
    // Batman has automatic emergency recovery in-game
  }, []);

  const handleStartMission = () => {
    setGameState('playing');
    canvasHandleRef.current?.restart();
  };

  const handleRestart = () => {
    setGameState('playing');
    canvasHandleRef.current?.restart();
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setEnabled(!nextMuted);
  };

  const handleToggleDetective = () => {
    setIsDetectiveMode((prev) => !prev);
    canvasHandleRef.current?.toggleDetectiveMode();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070a10] text-slate-100 select-none">
      {/* Batcomputer Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main Canvas Gameplay Area */}
      <div className="absolute inset-0">
        <GameCanvas
          ref={canvasHandleRef}
          onStatsUpdate={handleStatsUpdate}
          onMissionComplete={handleMissionComplete}
          onGameOver={handleGameOver}
          isStarted={gameState === 'playing'}
        />
      </div>

      {/* Minimal Batcomputer HUD */}
      {gameState === 'playing' && (
        <BatHud
          batman={batman}
          stats={stats}
          remainingDistance={remainingDist}
          isDetectiveMode={isDetectiveMode}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onToggleDetective={handleToggleDetective}
          onRestart={handleRestart}
          onTriggerGrapple={() => canvasHandleRef.current?.tryGrappleNearest()}
          onTriggerBatarang={() => canvasHandleRef.current?.throwBatarang()}
          onTriggerMelee={() => canvasHandleRef.current?.meleeAttack()}
          onTriggerJump={() => canvasHandleRef.current?.jump()}
        />
      )}

      {/* Mission Briefing Initialization Modal */}
      {gameState === 'briefing' && (
        <MissionBriefing onStart={handleStartMission} />
      )}

      {/* Mission Complete Victory Modal */}
      {gameState === 'completed' && (
        <MissionComplete stats={stats} onRestart={handleRestart} />
      )}
    </div>
  );
}
