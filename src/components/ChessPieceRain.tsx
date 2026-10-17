import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  char: string;
  size: number;
  speed: number;
  swaySpeed: number;
  swayAmp: number;
  swayOffset: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  color: string;
}

const CHESS_PIECES = ['♟', '♞', '♝', '♜', '♛', '♚', '♙', '♘', '♗', '♖', '♕', '♔'];
const COLORS = [
  '#fef08a', // Gold
  '#facc15', // Amber
  '#67e8f9', // Cyan
  '#e2e8f0', // Silver
  '#a7f3d0', // Emerald soft
];

export const ChessPieceRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Number of falling pieces proportional to screen width
    const count = Math.min(45, Math.max(20, Math.floor(width / 35)));

    const createParticle = (randomY = true): Particle => ({
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -40 - Math.random() * 50,
      char: CHESS_PIECES[Math.floor(Math.random() * CHESS_PIECES.length)],
      size: 16 + Math.random() * 22, // 16px to 38px
      speed: 0.6 + Math.random() * 1.5, // gentle falling speed
      swaySpeed: 0.01 + Math.random() * 0.02,
      swayAmp: 0.4 + Math.random() * 1.2,
      swayOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      opacity: 0.06 + Math.random() * 0.12, // Subtle atmospheric opacity
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    const particles: Particle[] = Array.from({ length: count }, () => createParticle(true));

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.y += p.speed;
        p.x += Math.sin(tick * p.swaySpeed + p.swayOffset) * p.swayAmp;
        p.rotation += p.rotSpeed;

        // Respawn when falling off the bottom
        if (p.y > height + 50) {
          particles[i] = createParticle(false);
          continue;
        }

        // Draw falling chess piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.95 }}
    />
  );
};
