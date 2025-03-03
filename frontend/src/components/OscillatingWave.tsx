import React, { useEffect, useRef } from 'react';

interface OscillatingWaveProps {
  color?: string;
  secondaryColor?: string;
  waveCount?: number;
  speed?: number;
  amplitude?: number;
  opacity?: number;
  gradientToWhite?: boolean;
  variant?: 'hero' | 'section';
}

const OscillatingWave: React.FC<OscillatingWaveProps> = ({
  color = '#3b82f6',
  secondaryColor = '#2c5282',
  waveCount = 3,
  speed = 0.02,
  amplitude = 20,
  opacity = 0.25,
  gradientToWhite = true,
  variant = 'section'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const waves: { offset: number; speed: number; amplitude: number; phase: number }[] = [];
    
    // Create multiple waves with slightly different parameters
    for (let i = 0; i < waveCount; i++) {
      waves.push({
        offset: Math.random() * Math.PI * 2,
        speed: speed * (0.8 + Math.random() * 0.4),
        amplitude: amplitude * (0.7 + Math.random() * 0.6),
        phase: i * (Math.PI / waveCount)
      });
    }

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create background gradient based on variant
      if (gradientToWhite && variant === 'section') {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, 'rgba(241, 245, 249, 1)'); // Light gray from your CSS (f1f5f9)
        bgGradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.9)'); // Fade to white
        bgGradient.addColorStop(1, 'rgba(255, 255, 255, 1)'); // White for product section
        
        // Fill background with gradient
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw waves from back to front
      waves.forEach((wave, index) => {
        // Hero variant has different wave patterns than section variant
        if (variant === 'hero') {
          drawHeroWave(ctx, canvas, wave, time, index, waves.length, color, secondaryColor, opacity);
        } else {
          drawSectionWave(ctx, canvas, wave, time, index, waves.length, color, opacity);
        }
      });
      
      time += 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    // Draw waves for the hero section - more dramatic, flowing from bottom
    const drawHeroWave = (
      ctx: CanvasRenderingContext2D, 
      canvas: HTMLCanvasElement,
      wave: { offset: number; speed: number; amplitude: number; phase: number },
      time: number,
      index: number,
      totalWaves: number,
      color: string,
      secondaryColor: string,
      opacity: number
    ) => {
      ctx.beginPath();
      
      // Start from bottom left
      ctx.moveTo(0, canvas.height);
      
      const segmentCount = 100;
      const segmentWidth = canvas.width / segmentCount;
      
      // Create curved wave pattern
      for (let i = 0; i <= segmentCount; i++) {
        const x = i * segmentWidth;
        const normalizedX = i / segmentCount;
        
        // Calculate vertical position with multiple sine waves
        const waveHeight = canvas.height * 0.4;
        const baseY = canvas.height - waveHeight * (index + 1) / totalWaves;
        
        // Complex wave function with phase offsets
        const y = baseY - 
          Math.sin(time * wave.speed * 0.5 + wave.offset + normalizedX * Math.PI * 3) * wave.amplitude -
          Math.sin(time * wave.speed * 0.3 + wave.phase + normalizedX * Math.PI * 5) * (wave.amplitude * 0.5);
        
        if (i === 0) {
          ctx.moveTo(x, canvas.height);
        } else if (i === 1) {
          ctx.lineTo(x, canvas.height);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Complete the path
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      
      // Create gradient for wave
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const waveOpacity = opacity * (0.7 + 0.3 * (index / totalWaves));
      
      gradient.addColorStop(0, hexToRgba(secondaryColor, waveOpacity));
      gradient.addColorStop(0.5, hexToRgba(color, waveOpacity));
      gradient.addColorStop(1, hexToRgba(secondaryColor, waveOpacity));
      
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // Draw waves for regular sections - gentler, horizontal flow
    const drawSectionWave = (
      ctx: CanvasRenderingContext2D, 
      canvas: HTMLCanvasElement,
      wave: { offset: number; speed: number; amplitude: number; phase: number },
      time: number,
      index: number,
      totalWaves: number,
      color: string,
      opacity: number
    ) => {
      ctx.beginPath();
      
      const startY = canvas.height * 0.3; // Start higher up
      ctx.moveTo(0, startY);
      
      const segmentCount = 100;
      const segmentWidth = canvas.width / segmentCount;
      
      // Create gentle horizontal waves
      for (let i = 0; i <= segmentCount; i++) {
        const x = i * segmentWidth;
        const normalizedX = i / segmentCount;
        
        // Create waves that are more pronounced at the top and fade toward bottom
        const wavePosition = startY + 
          Math.sin(time * wave.speed + wave.offset + normalizedX * Math.PI * 4) * wave.amplitude +
          Math.cos(time * wave.speed * 0.7 + wave.phase + normalizedX * Math.PI * 2) * (wave.amplitude * 0.4);
        
        // Cap the wave height
        const y = Math.min(wavePosition, canvas.height * 0.7);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Complete the path
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      
      // Create gradient for waves
      const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const waveOpacity = opacity * (0.7 + 0.3 * (index / totalWaves));
      
      waveGradient.addColorStop(0, hexToRgba(color, waveOpacity));
      waveGradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Transparent at bottom
      
      ctx.fillStyle = waveGradient;
      ctx.fill();
    };

    // Helper function to convert hex color to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, secondaryColor, waveCount, speed, amplitude, opacity, gradientToWhite, variant]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{
        zIndex: variant === 'hero' ? 0 : 0
      }}
    />
  );
};

export default OscillatingWave;