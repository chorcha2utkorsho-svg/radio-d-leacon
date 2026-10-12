import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mode?: 'bars' | 'wave' | 'minimal';
  className?: string;
  barColor?: string;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  mode = 'bars',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    let idleAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        audioEngine.getFrequencyData(dataArray);

        if (mode === 'bars') {
          const barCount = 36;
          const barWidth = (width / barCount) * 0.7;
          const gap = (width - barCount * barWidth) / (barCount - 1);

          for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.floor((i / barCount) * bufferLength);
            const value = dataArray[dataIdx] || 0;
            const percent = value / 255;
            // minimum height so bars look alive
            const barHeight = Math.max(4, percent * (height * 0.85));

            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Gradient: amber to deep orange
            const grad = ctx.createLinearGradient(0, height, 0, 0);
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
            grad.addColorStop(0.7, 'rgba(251, 191, 36, 0.9)');
            grad.addColorStop(1, 'rgba(254, 240, 138, 1)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();
          }
        } else if (mode === 'wave') {
          ctx.beginPath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#f59e0b';

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
        } else {
          // Minimal 8-bar indicator
          const barCount = 8;
          const barWidth = 4;
          const spacing = 4;
          const totalW = barCount * (barWidth + spacing) - spacing;
          const startX = (width - totalW) / 2;

          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * 4] || 20;
            const h = Math.max(3, (val / 255) * height);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(startX + i * (barWidth + spacing), height - h, barWidth, h);
          }
        }
      } else {
        // Idle ambient gentle wave
        idleAngle += 0.03;
        const barCount = 36;
        const barWidth = (width / barCount) * 0.7;
        const gap = (width - barCount * barWidth) / (barCount - 1);

        for (let i = 0; i < barCount; i++) {
          const sine = Math.sin(idleAngle + i * 0.25) * 0.5 + 0.5;
          const barHeight = 4 + sine * 8;
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{ display: 'block' }}
    />
  );
};
