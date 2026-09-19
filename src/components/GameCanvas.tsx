import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GothamEngine } from '../game/GothamEngine';
import { BatmanState, GameStats } from '../game/types';

export interface GameCanvasHandle {
  throwBatarang: () => void;
  throwBatarangAtScreen?: (sx: number, sy: number) => void;
  tryGrappleNearest: () => void;
  meleeAttack: () => void;
  jump: () => void;
  pressJump: () => void;
  releaseJump: () => void;
  setMoveInput: (dir: -1 | 0 | 1) => void;
  setGlideHeld: (held: boolean) => void;
  cancelGrapple: () => void;
  toggleDetectiveMode: () => void;
  restart: (levelIndex?: number) => void;
  loadLevel: (levelIndex: number) => void;
  getRemainingDistance: () => number;
  isGrappleReady: () => boolean;
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
    const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

    useImperativeHandle(ref, () => ({
      throwBatarang: () => {
        engineRef.current?.throwBatarang();
      },
      throwBatarangAtScreen: (_sx: number, _sy: number) => {
        const engine = engineRef.current;
        if (!engine) return;
        void _sx;
        void _sy;
        engine.throwBatarang();
      },
      tryGrappleNearest: () => {
        engineRef.current?.tryGrappleNearest();
      },
      meleeAttack: () => {
        engineRef.current?.meleeAttack();
      },
      jump: () => {
        engineRef.current?.pressJump();
      },
      pressJump: () => {
        engineRef.current?.pressJump();
      },
      releaseJump: () => {
        engineRef.current?.releaseJump();
      },
      setMoveInput: (dir: -1 | 0 | 1) => {
        engineRef.current?.setMoveInput(dir);
      },
      setGlideHeld: (held: boolean) => {
        engineRef.current?.setGlideHeld(held);
      },
      cancelGrapple: () => {
        engineRef.current?.cancelGrapple();
      },
      toggleDetectiveMode: () => {
        engineRef.current?.toggleDetectiveMode();
      },
      restart: (levelIndex?: number) => {
        engineRef.current?.restart(levelIndex);
      },
      loadLevel: (levelIndex: number) => {
        engineRef.current?.loadLevel(levelIndex);
      },
      getRemainingDistance: () => {
        return engineRef.current ? engineRef.current.getRemainingDistance() : 3200;
      },
      isGrappleReady: () => {
        return engineRef.current ? engineRef.current.isGrappleReady() : false;
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
        e.preventDefault();
      };

      // ---- Touch: tap = smart grapple/batarang, drag = aim preview ----
      const toLocal = (t: Touch) => {
        const rect = canvas.getBoundingClientRect();
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      };
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const p = toLocal(t);
        touchStartRef.current = { x: p.x, y: p.y, t: performance.now() };
        engine.onMouseMove(p.x, p.y);
      };
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const p = toLocal(t);
        engine.onMouseMove(p.x, p.y);
      };
      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        const p = toLocal(t);
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start) return;
        const moved = Math.hypot(p.x - start.x, p.y - start.y);
        const dt = performance.now() - start.t;
        // Tap (not swipe) → smart click. Swipe/drag just updates aim, no fire.
        if (moved < 26 && dt < 450) {
          engine.onMouseClick(p.x, p.y, false);
        } else {
          engine.onMouseMove(p.x, p.y);
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('contextmenu', handleContextMenu);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }

      // Initial sizing after mount (parent has size by now)
      requestAnimationFrame(() => engine.handleResize());

      if (isStarted) {
        engine.start();
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('contextmenu', handleContextMenu);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        }
        engine.stop();
      };
    }, []);

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
      <div className="relative h-full w-full overflow-hidden bg-[#0a0d14] cursor-crosshair touch-none">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" style={{ touchAction: 'none' }} />
      </div>
    );
  }
);
