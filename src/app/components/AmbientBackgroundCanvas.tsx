'use client';

import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { useEffect, useMemo, useState } from 'react';

type AmbientBackgroundCanvasProps = {
  reducedMotion?: boolean;
  side?: 'left' | 'right';
};

export default function AmbientBackgroundCanvas({
  reducedMotion = false,
  side = 'left',
}: AmbientBackgroundCanvasProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setIsReady(true);
    });
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      autoPlay: true,
      background: {
        color: 'transparent',
      },
      detectRetina: true,
      fpsLimit: reducedMotion ? 36 : 60,
      fullScreen: {
        enable: false,
        zIndex: 0,
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: {
            enable: !reducedMotion,
            mode: 'grab',
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 180,
            links: {
              opacity: 0.32,
            },
          },
        },
      },
      particles: {
        color: {
          value: ['#d39b62', '#8eaed0', '#ffffff'],
        },
        links: {
          color: '#b8cbe0',
          distance: 140,
          enable: true,
          opacity: reducedMotion ? 0.16 : 0.28,
          width: 1,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: true,
          speed: reducedMotion ? 0.45 : 1.1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 560,
          },
          value: reducedMotion ? 46 : 96,
        },
        opacity: {
          value: reducedMotion ? 0.34 : 0.52,
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 2.1, max: reducedMotion ? 4.2 : 6.8 },
        },
      },
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
    }),
    [reducedMotion]
  );

  if (!isReady) {
    return null;
  }

  return (
    <Particles
      className="h-full w-full"
      id={`ambient-particles-${side}`}
      options={options}
    />
  );
}
