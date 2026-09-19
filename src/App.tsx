import { useState, useRef, useCallback } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { BatHud } from './components/BatHud';
import { MissionBriefing } from './components/MissionBriefing';
import { MissionComplete } from './components/MissionComplete';
import { BatmanState, GameStats } from './game/types';
import { LEVELS } from './game/levelData';
import { soundManager } from './game/audio';

const initialStats: GameStats = {
  timeElapsed: 0,
  hostilesDefeated: 0,
  totalHostiles: 7,
  grapplesUsed: 0,
  batarangsThrown: 0,
  maxCombo: 0,
  robinAssists: 0,
  robinActive: false,
};

const initialBatman: BatmanState = {
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
  grapplePhase: 'none',
  grappleHook: null,
  grappleRopeLength: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<'briefing' | 'playing' | 'completed'>('briefing');
  const [isMuted, setIsMuted] = useState(false);
  const [isDetectiveMode, setIsDetectiveMode] = useState(false);
  const [remainingDist, setRemainingDist] = useState(3200);
  const [levelIndex, setLevelIndex] = useState(0);

  const [stats, setStats] = useState<GameStats>(initialStats);
  const [batman, setBatman] = useState<BatmanState>(initialBatman);

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

  const handleStartMission = useCallback((level: number) => {
    setLevelIndex(level);
    setIsDetectiveMode(false);
    setGameState('playing');
    // loadLevel after state set — engine restarts on next tick
    requestAnimationFrame(() => canvasHandleRef.current?.restart(level));
  }, []);

  const handleRestart = useCallback(() => {
    setIsDetectiveMode(false);
    setGameState('playing');
    requestAnimationFrame(() => canvasHandleRef.current?.restart(levelIndex));
  }, [levelIndex]);

  const handleNextLevel = useCallback(() => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevelIndex(next);
    setIsDetectiveMode(false);
    setGameState('playing');
    requestAnimationFrame(() => canvasHandleRef.current?.restart(next));
  }, [levelIndex]);

  const handleBackToTitle = useCallback(() => {
    setGameState('briefing');
  }, []);

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
    <div
      className="relative w-screen overflow-hidden bg-black text-slate-100 select-none"
      style={{ height: '100dvh', touchAction: 'none', overscrollBehavior: 'none' }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="absolute inset-0">
        <GameCanvas
          ref={canvasHandleRef}
          onStatsUpdate={handleStatsUpdate}
          onMissionComplete={handleMissionComplete}
          onGameOver={handleGameOver}
          isStarted={gameState === 'playing'}
        />
      </div>

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
          onPressJump={() => canvasHandleRef.current?.pressJump()}
          onReleaseJump={() => canvasHandleRef.current?.releaseJump()}
          onSetMove={(dir) => canvasHandleRef.current?.setMoveInput(dir)}
          onSetGlide={(held) => canvasHandleRef.current?.setGlideHeld(held)}
          onCancelGrapple={() => canvasHandleRef.current?.cancelGrapple()}
        />
      )}

      {gameState === 'briefing' && <MissionBriefing onStart={handleStartMission} />}

      {gameState === 'completed' && (
        <MissionComplete
          stats={stats}
          levelIndex={levelIndex}
          hasNextLevel={levelIndex < LEVELS.length - 1}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          onTitle={handleBackToTitle}
        />
      )}
    </div>
  );
}
