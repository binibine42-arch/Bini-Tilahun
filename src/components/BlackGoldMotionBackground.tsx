import React, { useEffect, useRef } from 'react';

export const BlackGoldMotionBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pointerX = width * 0.5;
    let pointerY = height * 0.35;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const waveCount = 8;
    const diagonalCount = 6;

    const drawFrame = (timeMs: number) => {
      if (document.hidden) {
        if (!prefersReducedMotion) {
          animationFrameId = window.requestAnimationFrame(drawFrame);
        }
        return;
      }

      const t = timeMs * 0.00045;

      // Deep obsidian black canvas
      ctx.fillStyle = '#07070A';
      ctx.fillRect(0, 0, width, height);

      // Subtle warm gold radial ambient glow near pointer
      const glow = ctx.createRadialGradient(
        pointerX,
        pointerY,
        0,
        pointerX,
        pointerY,
        Math.max(width, height) * 0.45
      );
      glow.addColorStop(0, 'rgba(212, 175, 55, 0.07)');
      glow.addColorStop(0.5, 'rgba(180, 134, 24, 0.025)');
      glow.addColorStop(1, 'rgba(7, 7, 10, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Flowing 2D gold vector ribbons
      for (let i = 0; i < waveCount; i++) {
        const ratio = i / (waveCount - 1);
        const baseY = height * (0.14 + ratio * 0.74);
        const amplitude = 28 + (i % 3) * 18;
        const speed = t * (0.85 + (i % 4) * 0.22);
        const phase = i * 0.72;

        ctx.beginPath();
        const step = Math.max(28, Math.floor(width / 30));
        for (let x = -40; x <= width + 40; x += step) {
          const nx = x / Math.max(width, 1);
          const pointerOffset =
            ((pointerY - baseY) * 0.035) *
            Math.exp(-Math.pow((x - pointerX) / (width * 0.35), 2));

          const y =
            baseY +
            Math.sin(nx * 5.2 + speed + phase) * amplitude +
            Math.cos(nx * 2.7 - speed * 0.7 + phase) * (amplitude * 0.45) +
            pointerOffset;

          if (x === -40) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        const alpha = 0.09 + (1 - Math.abs(ratio - 0.5) * 1.4) * 0.16;
        ctx.strokeStyle =
          i % 3 === 0
            ? `rgba(245, 196, 81, ${Math.max(0.08, alpha)})`
            : `rgba(212, 175, 55, ${Math.max(0.06, alpha * 0.78)})`;
        ctx.lineWidth = i % 3 === 0 ? 1.35 : 0.85;
        ctx.stroke();
      }

      // Layer 2: Drifting architectural gold diagonal lines
      for (let d = 0; d < diagonalCount; d++) {
        const progress = ((d / diagonalCount) + t * 0.08) % 1;
        const startX = -height * 0.4 + progress * (width + height * 0.9);
        const endX = startX + height * 0.55;

        const grad = ctx.createLinearGradient(startX, 0, endX, height);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
        grad.addColorStop(0.5, 'rgba(245, 196, 81, 0.14)');
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, height);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    };

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      animationFrameId = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
};
