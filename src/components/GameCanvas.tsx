import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GothamEngine } from '../game/GothamEngine';
import { BatmanState, GameStats } from '../game/types';

export interface GameCanvasHandle {
  throwBatarang: () => void;
  tryGrappleNearest: () => void;
  meleeAttack: () => void;
  jump: () => void;
  toggleDetectiveMode: () => void;
  restart: () => void;
  getRemainingDistance: () => number;
}

interface GameCanvasProps {
  onStatsUpdate: (stats: GameStats, batman: BatmanState) => void;
  onMissionComplete: (stats: GameStats) => void;
  onGameOver: () => void;
  isStarted: boolean;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ onStatsUpdate, onMissionComplete, onGameOver, isStarted }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<GothamEngine | null>(null);

    useImperativeHandle(ref, () => ({
      throwBatarang: () => {
        engineRef.current?.throwBatarang();
      },
      tryGrappleNearest: () => {
        engineRef.current?.tryGrappleNearest();
      },
      meleeAttack: () => {
        engineRef.current?.meleeAttack();
      },
      jump: () => {
        engineRef.current?.jump();
      },
      toggleDetectiveMode: () => {
        engineRef.current?.toggleDetectiveMode();
      },
      restart: () => {
        engineRef.current?.restart();
      },
      getRemainingDistance: () => {
        return engineRef.current ? engineRef.current.getRemainingDistance() : 3200;
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const engine = new GothamEngine(canvas, {
        onStatsUpdate,
        onMissionComplete,
        onGameOver,
      });
      engineRef.current = engine;

      const handleResize = () => {
        engine.handleResize();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent default spacebar page scrolling
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
          e.preventDefault();
        }
        engine.onKeyDown(e.code);
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        engine.onKeyUp(e.code);
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        engine.onMouseMove(e.clientX - rect.left, e.clientY - rect.top);
      };

      const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const isRightClick = e.button === 2;
        engine.onMouseClick(e.clientX - rect.left, e.clientY - rect.top, isRightClick);
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault(); // allow right-click grapple without browser menu
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('contextmenu', handleContextMenu);

      // Start engine if already started
      if (isStarted) {
        engine.start();
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('contextmenu', handleContextMenu);
        engine.stop();
      };
    }, []);

    // Control engine start/stop based on isStarted prop
    useEffect(() => {
      if (engineRef.current) {
        if (isStarted) {
          engineRef.current.start();
        } else {
          engineRef.current.stop();
        }
      }
    }, [isStarted]);

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#0a0d14] cursor-crosshair">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    );
  }
);
