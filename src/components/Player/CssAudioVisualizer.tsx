/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { Activity, BarChart2, Waves, Disc3, Radio, Sparkles } from 'lucide-react';

export type VisualizerStyle = 'bars' | 'wave' | 'circular' | 'led' | 'compact';
export type ColorPalette = 'dynamic' | 'fire' | 'neon';

interface CssAudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
  variant?: VisualizerStyle;
  colorScheme?: ColorPalette;
  showLabels?: boolean;
  title?: string;
  sensitivity?: number;
  onToggleStyle?: (style: VisualizerStyle) => void;
}

const FREQUENCY_LABELS = [
  '40Hz', '80Hz', '160Hz', '320Hz', '640Hz', '1.2k', '2.5k', '5k', '10k', '16k'
];

/**
 * Returns dynamic multi-stop gradient, glow filter, and peak colors based on frequency intensity
 */
export function getDynamicIntensityStyle(percent: number, variant: string = 'bars', palette: ColorPalette = 'dynamic') {
  if (palette === 'neon') {
    // Cyber Neon Palette: Cyan (low) -> Violet (mid) -> Hot Pink (high) -> Electric White (peak)
    if (percent >= 85) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #701a75 0px, #701a75 3px, transparent 3px, transparent 5px, #d946ef 5px, #d946ef 8px, transparent 8px, transparent 10px, #ffffff 10px, #ffffff 12px)`
          : `linear-gradient(to top, #c026d3 0%, #ec4899 45%, #f43f5e 80%, #ffffff 100%)`,
        filter: `drop-shadow(0 0 12px rgba(244, 63, 94, 0.95)) brightness(1.25)`,
        peakColor: '#ffffff',
        peakShadow: '0 0 8px #f43f5e',
        intensityTag: 'পিক (Peak)',
        badgeClass: 'text-rose-400',
      };
    } else if (percent >= 60) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #4c1d95 0px, #4c1d95 3px, transparent 3px, transparent 5px, #8b5cf6 5px, #8b5cf6 8px, transparent 8px, transparent 10px, #f472b6 10px, #f472b6 12px)`
          : `linear-gradient(to top, #7c3aed 0%, #a855f7 50%, #ec4899 100%)`,
        filter: `drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) brightness(1.15)`,
        peakColor: '#f472b6',
        peakShadow: '0 0 6px #ec4899',
        intensityTag: 'তীব্র (High)',
        badgeClass: 'text-purple-400',
      };
    } else if (percent >= 30) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #0e7490 0px, #0e7490 3px, transparent 3px, transparent 5px, #06b6d4 5px, #06b6d4 8px, transparent 8px, transparent 10px, #818cf8 10px, #818cf8 12px)`
          : `linear-gradient(to top, #0284c7 0%, #06b6d4 50%, #a5b4fc 100%)`,
        filter: `drop-shadow(0 0 5px rgba(6, 182, 212, 0.55)) brightness(1.05)`,
        peakColor: '#a5b4fc',
        peakShadow: '0 0 4px #06b6d4',
        intensityTag: 'স্বাভাবিক (Mid)',
        badgeClass: 'text-cyan-400',
      };
    } else {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #042f2e 0px, #042f2e 3px, transparent 3px, transparent 5px, #0f766e 5px, #0f766e 8px, transparent 8px, transparent 10px, #2dd4bf 10px, #2dd4bf 12px)`
          : `linear-gradient(to top, #042f2e 0%, #0f766e 50%, #2dd4bf 100%)`,
        filter: `drop-shadow(0 0 3px rgba(45, 212, 191, 0.3))`,
        peakColor: '#2dd4bf',
        peakShadow: '0 0 3px #0f766e',
        intensityTag: 'শান্ত (Low)',
        badgeClass: 'text-teal-400',
      };
    }
  }

  if (palette === 'fire') {
    // Fire Spectrum: Deep Bronze/Amber (low) -> Bright Amber (mid) -> Fiery Orange (high) -> Burning Crimson (peak)
    if (percent >= 85) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #991b1b 0px, #991b1b 3px, transparent 3px, transparent 5px, #dc2626 5px, #dc2626 8px, transparent 8px, transparent 10px, #ffffff 10px, #ffffff 12px)`
          : `linear-gradient(to top, #991b1b 0%, #dc2626 40%, #ea580c 80%, #ffffff 100%)`,
        filter: `drop-shadow(0 0 12px rgba(220, 38, 38, 0.95)) brightness(1.3)`,
        peakColor: '#ffffff',
        peakShadow: '0 0 8px #dc2626',
        intensityTag: 'পিক (Peak)',
        badgeClass: 'text-red-400',
      };
    } else if (percent >= 60) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #9a3412 0px, #9a3412 3px, transparent 3px, transparent 5px, #ea580c 5px, #ea580c 8px, transparent 8px, transparent 10px, #fde047 10px, #fde047 12px)`
          : `linear-gradient(to top, #9a3412 0%, #ea580c 50%, #fde047 100%)`,
        filter: `drop-shadow(0 0 8px rgba(234, 88, 12, 0.85)) brightness(1.15)`,
        peakColor: '#fde047',
        peakShadow: '0 0 6px #ea580c',
        intensityTag: 'তীব্র (High)',
        badgeClass: 'text-orange-400',
      };
    } else if (percent >= 30) {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #b45309 0px, #b45309 3px, transparent 3px, transparent 5px, #d97706 5px, #d97706 8px, transparent 8px, transparent 10px, #fef08a 10px, #fef08a 12px)`
          : `linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fef08a 100%)`,
        filter: `drop-shadow(0 0 5px rgba(245, 158, 11, 0.5)) brightness(1.05)`,
        peakColor: '#fef08a',
        peakShadow: '0 0 4px #d97706',
        intensityTag: 'স্বাভাবিক (Mid)',
        badgeClass: 'text-amber-400',
      };
    } else {
      return {
        background: variant === 'led'
          ? `repeating-linear-gradient(to top, #78350f 0px, #78350f 3px, transparent 3px, transparent 5px, #92400e 5px, #92400e 8px, transparent 8px, transparent 10px, #d97706 10px, #d97706 12px)`
          : `linear-gradient(to top, #78350f 0%, #92400e 50%, #d97706 100%)`,
        filter: `drop-shadow(0 0 3px rgba(217, 119, 6, 0.35))`,
        peakColor: '#f59e0b',
        peakShadow: '0 0 3px #92400e',
        intensityTag: 'শান্ত (Low)',
        badgeClass: 'text-amber-600',
      };
    }
  }

  // DEFAULT DYNAMIC PALETTE:
  // Emerald (0-35%) -> Radiant Golden Amber (35-65%) -> Fiery Coral Orange (65-85%) -> Electric Crimson & White Peak (85-100%)
  if (percent >= 85) {
    return {
      background: variant === 'led'
        ? `repeating-linear-gradient(to top, #991b1b 0px, #991b1b 3px, transparent 3px, transparent 5px, #ef4444 5px, #ef4444 8px, transparent 8px, transparent 10px, #ffffff 10px, #ffffff 12px)`
        : `linear-gradient(to top, #991b1b 0%, #ef4444 45%, #fb923c 80%, #ffffff 100%)`,
      filter: `drop-shadow(0 0 14px rgba(239, 68, 68, 0.95)) brightness(1.25)`,
      peakColor: '#ffffff',
      peakShadow: '0 0 8px #ef4444',
      intensityTag: 'পিক (Peak)',
      badgeClass: 'text-red-400',
    };
  } else if (percent >= 65) {
    return {
      background: variant === 'led'
        ? `repeating-linear-gradient(to top, #c2410c 0px, #c2410c 3px, transparent 3px, transparent 5px, #f97316 5px, #f97316 8px, transparent 8px, transparent 10px, #fef08a 10px, #fef08a 12px)`
        : `linear-gradient(to top, #c2410c 0%, #f97316 50%, #fde047 88%, #fef08a 100%)`,
      filter: `drop-shadow(0 0 9px rgba(249, 115, 22, 0.85)) brightness(1.15)`,
      peakColor: '#fef08a',
      peakShadow: '0 0 6px #f97316',
      intensityTag: 'উচ্চ তীব্রতা (High)',
      badgeClass: 'text-orange-400',
    };
  } else if (percent >= 35) {
    return {
      background: variant === 'led'
        ? `repeating-linear-gradient(to top, #b45309 0px, #b45309 3px, transparent 3px, transparent 5px, #f59e0b 5px, #f59e0b 8px, transparent 8px, transparent 10px, #fef08a 10px, #fef08a 12px)`
        : `linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fef08a 100%)`,
      filter: `drop-shadow(0 0 5px rgba(245, 158, 11, 0.6)) brightness(1.05)`,
      peakColor: '#fde047',
      peakShadow: '0 0 4px #f59e0b',
      intensityTag: 'স্বাভাবিক (Mid)',
      badgeClass: 'text-amber-400',
    };
  } else {
    return {
      background: variant === 'led'
        ? `repeating-linear-gradient(to top, #047857 0px, #047857 3px, transparent 3px, transparent 5px, #10b981 5px, #10b981 8px, transparent 8px, transparent 10px, #6ee7b7 10px, #6ee7b7 12px)`
        : `linear-gradient(to top, #065f46 0%, #059669 45%, #10b981 80%, #a7f3d0 100%)`,
      filter: `drop-shadow(0 0 3px rgba(16, 185, 129, 0.4))`,
      peakColor: '#a7f3d0',
      peakShadow: '0 0 3px #10b981',
      intensityTag: 'শান্ত (Low)',
      badgeClass: 'text-emerald-400',
    };
  }
}

export const CssAudioVisualizer: React.FC<CssAudioVisualizerProps> = ({
  isPlaying,
  barCount = 28,
  className = '',
  variant = 'bars',
  colorScheme = 'dynamic',
  showLabels = true,
  title,
  sensitivity = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const barElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const peakElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const radialBarElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const wavePathRef = useRef<SVGPathElement | null>(null);
  const waveFillPathRef = useRef<SVGPathElement | null>(null);
  const waveStop1Ref = useRef<SVGStopElement | null>(null);
  const waveStop2Ref = useRef<SVGStopElement | null>(null);
  const waveStop3Ref = useRef<SVGStopElement | null>(null);
  const centerCoreRef = useRef<HTMLDivElement | null>(null);

  const sensitivityRef = useRef<number>(sensitivity);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const colorSchemeRef = useRef<ColorPalette>(colorScheme);
  useEffect(() => {
    colorSchemeRef.current = colorScheme;
  }, [colorScheme]);

  const peakValuesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const [activeFrequencyBand, setActiveFrequencyBand] = useState<string>('Normal');
  const [maxIntensityStatus, setMaxIntensityStatus] = useState<{ tag: string; cls: string }>({
    tag: 'শান্ত (Low)',
    cls: 'text-emerald-400',
  });

  const radialCount = 36; // 36 radial bars around 360-degree circle

  useEffect(() => {
    peakValuesRef.current = new Array(Math.max(barCount, radialCount)).fill(0);
    const bufferLength = 128;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    let idlePhase = 0;

    const updateVisualizer = () => {
      if (isPlaying) {
        audioEngine.getFrequencyData(frequencyData);
        audioEngine.getTimeDomainData(timeDomainData);
      }

      const sens = sensitivityRef.current;
      const palette = colorSchemeRef.current;

      let maxBandValue = 0;
      let maxBandIndex = 0;
      let totalEnergy = 0;

      // 1. UPDATE BARS & LED VARIANT (WITH DYNAMIC COLOR SCALING)
      if (variant === 'bars' || variant === 'led' || variant === 'compact') {
        const count = variant === 'compact' ? Math.min(16, barCount) : barCount;
        for (let i = 0; i < count; i++) {
          let percent = 0;

          if (isPlaying) {
            const startBin = Math.floor(Math.pow(i / count, 1.6) * (bufferLength - 4));
            const endBin = Math.max(startBin + 1, Math.floor(Math.pow((i + 1) / count, 1.6) * bufferLength));

            let sum = 0;
            let binCount = 0;
            for (let b = startBin; b < endBin && b < bufferLength; b++) {
              sum += frequencyData[b];
              binCount++;
            }
            const rawAvg = binCount > 0 ? sum / binCount : 0;
            const hfBoost = 1 + (i / count) * 0.7;
            percent = Math.min(100, Math.max(4, (rawAvg / 255) * 100 * hfBoost * sens));

            if (percent < 8) {
              percent = 6 + Math.sin(idlePhase + i * 0.3) * 3;
            }

            totalEnergy += percent;

            if (percent > maxBandValue) {
              maxBandValue = percent;
              maxBandIndex = i;
            }
          } else {
            percent = 4;
          }

          // Peak Hold logic with gravity decay
          let currentPeak = peakValuesRef.current[i] || 0;
          if (percent >= currentPeak) {
            currentPeak = percent;
          } else {
            currentPeak = Math.max(0, currentPeak - 1.5);
          }
          peakValuesRef.current[i] = currentPeak;

          // Compute Dynamic Color Scaling based on intensity percent
          const styleInfo = getDynamicIntensityStyle(percent, variant, palette);

          const barEl = barElementsRef.current[i];
          if (barEl) {
            barEl.style.height = `${percent}%`;
            barEl.style.background = styleInfo.background;
            barEl.style.filter = styleInfo.filter;
          }

          const peakEl = peakElementsRef.current[i];
          if (peakEl) {
            if (isPlaying && currentPeak > 6) {
              peakEl.style.bottom = `${Math.min(98, currentPeak)}%`;
              peakEl.style.opacity = '1';
              peakEl.style.backgroundColor = styleInfo.peakColor;
              peakEl.style.boxShadow = styleInfo.peakShadow;
            } else {
              peakEl.style.opacity = '0';
            }
          }
        }
      }

      // 2. UPDATE WAVE VARIANT (WITH DYNAMIC COLOR TRANSITION)
      if (variant === 'wave') {
        const svgWidth = 600;
        const svgHeight = 120;
        const points: [number, number][] = [];

        const samplesToUse = 64;
        const step = svgWidth / (samplesToUse - 1);
        let waveEnergy = 0;

        for (let i = 0; i < samplesToUse; i++) {
          const sampleIdx = Math.floor((i / samplesToUse) * bufferLength);
          let val = 128;
          if (isPlaying) {
            val = timeDomainData[sampleIdx] || 128;
            if (Math.abs(val - 128) < 4) {
              val = 128 + Math.sin(idlePhase * 1.5 + i * 0.4) * 14;
            }
          } else {
            val = 128 + Math.sin(idlePhase * 0.5 + i * 0.2) * 2;
          }

          const ampDiff = Math.abs(val - 128);
          waveEnergy += ampDiff;

          // Normalize to [0, svgHeight] scaled by sensitivity
          const norm = ((val - 128) / 128) * sens;
          const y = (svgHeight / 2) + Math.max(-svgHeight * 0.46, Math.min(svgHeight * 0.46, norm * (svgHeight * 0.42)));
          points.push([i * step, y]);
        }

        const avgWaveIntensity = (waveEnergy / samplesToUse) * 2 * sens;
        maxBandValue = Math.min(100, avgWaveIntensity);

        // Build smooth SVG curve
        if (points.length > 0) {
          let d = `M ${points[0][0]},${points[0][1]}`;
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx = (prev[0] + curr[0]) / 2;
            d += ` Q ${prev[0]},${prev[1]} ${cx},${(prev[1] + curr[1]) / 2}`;
          }
          const last = points[points.length - 1];
          d += ` T ${last[0]},${last[1]}`;

          if (wavePathRef.current) {
            wavePathRef.current.setAttribute('d', d);
          }

          if (waveFillPathRef.current) {
            const fillD = `${d} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;
            waveFillPathRef.current.setAttribute('d', fillD);
          }

          // Dynamic gradient stop colors for wave based on intensity
          if (waveStop1Ref.current && waveStop2Ref.current && waveStop3Ref.current) {
            if (maxBandValue >= 80) {
              waveStop1Ref.current.setAttribute('stop-color', '#dc2626');
              waveStop2Ref.current.setAttribute('stop-color', '#f97316');
              waveStop3Ref.current.setAttribute('stop-color', '#ffffff');
            } else if (maxBandValue >= 50) {
              waveStop1Ref.current.setAttribute('stop-color', '#d97706');
              waveStop2Ref.current.setAttribute('stop-color', '#fbbf24');
              waveStop3Ref.current.setAttribute('stop-color', '#fef08a');
            } else {
              waveStop1Ref.current.setAttribute('stop-color', '#059669');
              waveStop2Ref.current.setAttribute('stop-color', '#10b981');
              waveStop3Ref.current.setAttribute('stop-color', '#6ee7b7');
            }
          }
        }
      }

      // 3. UPDATE CIRCULAR VARIANT (DYNAMIC RADIAL INTENSITY SCALING)
      if (variant === 'circular') {
        let totalBass = 0;
        for (let i = 0; i < radialCount; i++) {
          const binIdx = Math.floor((i / radialCount) * (bufferLength / 2));
          let percent = 0;
          if (isPlaying) {
            const raw = frequencyData[binIdx] || 0;
            percent = Math.min(100, Math.max(5, (raw / 255) * 100 * sens));
            if (percent < 8) {
              percent = 7 + Math.sin(idlePhase + i * 0.4) * 4;
            }
          } else {
            percent = 5;
          }

          if (percent > maxBandValue) {
            maxBandValue = percent;
          }

          if (i < 6) totalBass += percent;

          const barEl = radialBarElementsRef.current[i];
          if (barEl) {
            const barLen = Math.max(6, (percent / 100) * 44);
            barEl.style.height = `${barLen}px`;

            // Dynamic color scaling on radial bar
            const radialStyle = getDynamicIntensityStyle(percent, 'bars', palette);
            barEl.style.background = radialStyle.background;
            barEl.style.filter = radialStyle.filter;
          }
        }

        // Pulse and dynamic glow on the center vinyl core
        if (centerCoreRef.current) {
          const pulseScale = isPlaying ? 1 + (totalBass / (6 * 100)) * 0.16 : 1;
          centerCoreRef.current.style.transform = `scale(${pulseScale})`;

          if (totalBass / 6 > 75) {
            centerCoreRef.current.style.borderColor = '#ef4444';
            centerCoreRef.current.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.7)';
          } else if (totalBass / 6 > 45) {
            centerCoreRef.current.style.borderColor = '#f59e0b';
            centerCoreRef.current.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.5)';
          } else {
            centerCoreRef.current.style.borderColor = '#10b981';
            centerCoreRef.current.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.3)';
          }
        }
      }

      // Qualitative band label update
      if (isPlaying && Math.random() < 0.08) {
        if (maxBandIndex < barCount * 0.25) {
          setActiveFrequencyBand('বেস (Bass Boost)');
        } else if (maxBandIndex < barCount * 0.65) {
          setActiveFrequencyBand('মিড (Vocals/Mid)');
        } else {
          setActiveFrequencyBand('ট্রেবল (High/Hi-Fi)');
        }

        const maxStyle = getDynamicIntensityStyle(maxBandValue, 'bars', palette);
        setMaxIntensityStatus({
          tag: maxStyle.intensityTag,
          cls: maxStyle.badgeClass,
        });
      }

      idlePhase += 0.04;
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animationFrameRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, barCount, variant]);

  // COMPACT MINI VISUALIZER
  if (variant === 'compact') {
    return (
      <div className={`flex items-end gap-1 h-8 ${className}`}>
        {Array.from({ length: Math.min(16, barCount) }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[3px] bg-slate-800/80 rounded-t-sm overflow-hidden h-full flex items-end"
          >
            <div
              ref={(el) => {
                barElementsRef.current[i] = el;
              }}
              className="w-full bg-gradient-to-t from-emerald-600 via-amber-400 to-rose-500 transition-all duration-75 ease-out rounded-t-sm"
              style={{ height: '8%' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md overflow-hidden ${className}`}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(245, 158, 11, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245, 158, 11, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isPlaying ? 'bg-amber-400 shadow-sm shadow-amber-400 animate-pulse' : 'bg-slate-700'
            }`}
          />
          <span className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {title ||
                (variant === 'wave'
                  ? 'রিয়েল-টাইম সাউন্ড ওয়েভ (Live Oscilloscope Wave)'
                  : variant === 'circular'
                  ? 'সার্কুলার স্পেকট্রাম (Circular Radial Spectrum)'
                  : 'ডাইনামিক কালার স্পেকট্রাম (Dynamic Color Scaled Bars)')}
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Frequency Intensity Level Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md text-[10px] font-mono">
            <span className="text-slate-400 hidden sm:inline">তীব্রতা লেভেল:</span>
            <span className={`font-bold ${maxIntensityStatus.cls}`}>
              {isPlaying ? maxIntensityStatus.tag : 'শান্ত (Low)'}
            </span>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isPlaying ? activeFrequencyBand : 'স্ট্যান্ডবাই (Standby)'}
          </span>

          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300 capitalize">
            {variant === 'bars'
              ? 'স্পেকট্রাম বার্স'
              : variant === 'wave'
              ? 'ওয়েভফর্ম'
              : variant === 'circular'
              ? 'বৃত্তাকার রেডিয়াল'
              : 'এলইডি র্যাক'}
          </span>

          <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 hidden md:inline">
            সেন্সি: {Math.round(sensitivity * 100)}%
          </span>
        </div>
      </div>

      {/* Dynamic Color Scale Intensity Legend */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 px-1 py-1 rounded bg-slate-950/50 border border-slate-800/40">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-slate-300 font-semibold">ডাইনামিক কালার স্কেল:</span>
        </span>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">শান্ত (০-৩৫%)</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="hidden sm:inline">স্বাভাবিক (৩৫-৬৫%)</span>
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="hidden sm:inline">তীব্র (৬৫-৮৫%)</span>
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="hidden sm:inline">পিক লেভেল (৮৫-১০০%)</span>
          </span>
        </div>
      </div>

      {/* 1. BARS / LED RACK */}
      {(variant === 'bars' || variant === 'led') && (
        <div className="relative z-10 h-24 sm:h-28 w-full flex items-end gap-1 sm:gap-1.5 pt-2">
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              className="relative flex-1 h-full flex items-end justify-center group"
            >
              {/* Background Track Channel */}
              <div className="w-full h-full bg-slate-900/60 rounded-t-sm absolute inset-0 pointer-events-none border-x border-slate-800/30" />

              {/* Glowing Active Frequency Bar with Dynamic Color Scaling */}
              <div
                ref={(el) => {
                  barElementsRef.current[i] = el;
                }}
                className="relative w-full z-10 rounded-t-sm transition-all duration-75 ease-out"
                style={{
                  height: '4%',
                  background: 'linear-gradient(to top, #065f46 0%, #10b981 80%, #a7f3d0 100%)',
                }}
              />

              {/* Peak Hold Indicator Point */}
              <div
                ref={(el) => {
                  peakElementsRef.current[i] = el;
                }}
                className="absolute left-0 right-0 h-1 bg-amber-200 z-20 rounded-full transition-opacity duration-150 pointer-events-none shadow-sm shadow-amber-300"
                style={{
                  bottom: '4%',
                  opacity: 0,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 2. WAVEFORM (OSCILLOSCOPE WITH DYNAMIC ENERGY TRANSITION) */}
      {variant === 'wave' && (
        <div className="relative z-10 h-28 sm:h-32 w-full flex items-center justify-center">
          <svg
            viewBox="0 0 600 120"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
                <stop ref={waveStop1Ref} offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop ref={waveStop2Ref} offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                <stop ref={waveStop3Ref} offset="100%" stopColor="#ef4444" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="waveFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.25)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0.0)" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Zero Axis Reference Line */}
            <line
              x1="0"
              y1="60"
              x2="600"
              y2="60"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4 4"
            />

            {/* Area Fill Under Wave */}
            <path
              ref={waveFillPathRef}
              fill="url(#waveFillGradient)"
              d="M 0,60 L 600,60 L 600,120 L 0,120 Z"
            />

            {/* Neon Soundwave Stroke */}
            <path
              ref={wavePathRef}
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
              d="M 0,60 L 600,60"
            />
          </svg>
        </div>
      )}

      {/* 3. CIRCULAR RADIAL SPECTRUM WITH INTENSITY COLOR SCALING */}
      {variant === 'circular' && (
        <div className="relative z-10 h-44 sm:h-48 w-full flex items-center justify-center py-2">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Center Pulsing Vinyl Disc Core */}
            <div
              ref={centerCoreRef}
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 border-2 border-amber-400/80 shadow-lg shadow-amber-500/30 flex items-center justify-center z-20 transition-all duration-75 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 border border-amber-300/60 flex items-center justify-center">
                <Radio className={`w-3 h-3 text-amber-300 ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            {/* Outer Radial Frequency Bars */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {Array.from({ length: radialCount }).map((_, i) => {
                const angle = (360 / radialCount) * i;
                return (
                  <div
                    key={i}
                    className="absolute w-1 origin-bottom flex flex-col justify-end items-center"
                    style={{
                      height: '76px',
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <div
                      ref={(el) => {
                        radialBarElementsRef.current[i] = el;
                      }}
                      className="w-1 bg-gradient-to-t from-emerald-600 via-amber-400 to-rose-500 rounded-full transition-all duration-75 ease-out"
                      style={{
                        height: '6px',
                        boxShadow: isPlaying ? '0 0 4px rgba(245, 158, 11, 0.4)' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Frequency Hz Labels Row (For bars/led/wave) */}
      {showLabels && variant !== 'circular' && (
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/60 select-none">
          {FREQUENCY_LABELS.map((lbl, idx) => (
            <span key={idx} className="hover:text-amber-400 transition-colors">
              {lbl}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
