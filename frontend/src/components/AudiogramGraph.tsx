import React, { useEffect, useState } from 'react';
import '../styles/AudiogramGraph.css';

interface AudiogramGraphProps {
  results: Record<number, boolean>;
  frequencies: number[];
}

const AudiogramGraph: React.FC<AudiogramGraphProps> = ({ results, frequencies }) => {
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.audiogram-container');
      if (container) {
        const containerWidth = container.clientWidth;
        // Calculate height based on width to maintain aspect ratio
        const height = Math.min(containerWidth * 0.7, 400);
        setDimensions({
          width: containerWidth,
          height: height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Graph dimensions and margins
  const margin = { 
    top: 20, 
    right: 20, 
    bottom: 40, 
    left: 40 
  };

  // Calculate the inner dimensions
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  // Scale for frequencies (x-axis)
  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);
  const freqScale = (freq: number) => {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(freq);
    return margin.left + ((logFreq - logMin) / (logMax - logMin)) * innerWidth;
  };

  // Scale for hearing level (y-axis)
  const hearingLevelScale = (level: number) => {
    return margin.top + (level / 100) * innerHeight;
  };

  // Generate points for the audiogram line
  const points = frequencies.map(freq => {
    const x = freqScale(freq);
    const y = hearingLevelScale(results[freq] ? 0 : 100); // 0 for heard, 100 for not heard
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="audiogram-container">
      <svg width={dimensions.width} height={dimensions.height}>
        {/* Background grid */}
        <g className="grid">
          {/* Horizontal lines */}
          {[0, 20, 40, 60, 80, 100].map(level => (
            <line
              key={`h-${level}`}
              x1={margin.left}
              y1={hearingLevelScale(level)}
              x2={dimensions.width - margin.right}
              y2={hearingLevelScale(level)}
              className="grid-line"
            />
          ))}
          {/* Vertical lines */}
          {frequencies.map(freq => (
            <line
              key={`v-${freq}`}
              x1={freqScale(freq)}
              y1={margin.top}
              x2={freqScale(freq)}
              y2={dimensions.height - margin.bottom}
              className="grid-line"
            />
          ))}
        </g>

        {/* Axes */}
        <g className="axes">
          {/* X-axis */}
          <line
            x1={margin.left}
            y1={dimensions.height - margin.bottom}
            x2={dimensions.width - margin.right}
            y2={dimensions.height - margin.bottom}
            className="axis"
          />
          {/* Y-axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={dimensions.height - margin.bottom}
            className="axis"
          />
        </g>

        {/* Labels */}
        <g className="labels">
          {/* Frequency labels */}
          {frequencies.map(freq => (
            <text
              key={`freq-${freq}`}
              x={freqScale(freq)}
              y={dimensions.height - margin.bottom + 20}
              className="label"
              textAnchor="middle"
            >
              {freq}Hz
            </text>
          ))}
          {/* Hearing level labels */}
          {[0, 20, 40, 60, 80, 100].map(level => (
            <text
              key={`level-${level}`}
              x={margin.left - 5}
              y={hearingLevelScale(level)}
              className="label"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {level}dB
            </text>
          ))}
        </g>

        {/* Audiogram line */}
        <polyline
          points={points}
          className="audiogram-line"
          fill="none"
          strokeWidth="2"
        />

        {/* Points */}
        {frequencies.map(freq => (
          <circle
            key={`point-${freq}`}
            cx={freqScale(freq)}
            cy={hearingLevelScale(results[freq] ? 0 : 100)}
            r="4"
            className={`audiogram-point ${results[freq] ? 'heard' : 'not-heard'}`}
          />
        ))}
      </svg>
    </div>
  );
};

export default AudiogramGraph; 