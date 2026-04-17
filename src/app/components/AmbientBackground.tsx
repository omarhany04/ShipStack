'use client';

import dynamic from 'next/dynamic';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

const AmbientBackgroundCanvas = dynamic(() => import('./AmbientBackgroundCanvas'), {
  ssr: false,
});

const HALOS = [
  {
    className: 'ambient-halo ambient-halo-warm',
    style: {
      left: '6%',
      top: '12%',
      width: '20rem',
      height: '20rem',
      animationDelay: '-4s',
      animationDuration: '22s',
    },
  },
  {
    className: 'ambient-halo ambient-halo-cool',
    style: {
      right: '8%',
      top: '18%',
      width: '24rem',
      height: '24rem',
      animationDelay: '-9s',
      animationDuration: '27s',
    },
  },
  {
    className: 'ambient-halo ambient-halo-soft',
    style: {
      right: '12%',
      bottom: '8%',
      width: '18rem',
      height: '18rem',
      animationDelay: '-14s',
      animationDuration: '30s',
    },
  },
] satisfies Array<{ className: string; style: CSSProperties }>;

const PARTICLES = [
  { className: 'ambient-particle ambient-particle-cool', style: { left: '10%', top: '24%', width: '0.6rem', height: '0.6rem', animationDelay: '-2s' } },
  { className: 'ambient-particle ambient-particle-warm', style: { left: '18%', top: '36%', width: '0.45rem', height: '0.45rem', animationDelay: '-7s' } },
  { className: 'ambient-particle ambient-particle-soft', style: { right: '16%', top: '26%', width: '0.52rem', height: '0.52rem', animationDelay: '-5s' } },
  { className: 'ambient-particle ambient-particle-cool', style: { right: '24%', top: '42%', width: '0.38rem', height: '0.38rem', animationDelay: '-11s' } },
  { className: 'ambient-particle ambient-particle-warm', style: { left: '12%', bottom: '18%', width: '0.42rem', height: '0.42rem', animationDelay: '-9s' } },
  { className: 'ambient-particle ambient-particle-soft', style: { right: '14%', bottom: '12%', width: '0.54rem', height: '0.54rem', animationDelay: '-13s' } },
  { className: 'ambient-particle ambient-particle-cool', style: { right: '10%', bottom: '22%', width: '0.4rem', height: '0.4rem', animationDelay: '-4s' } },
] satisfies Array<{ className: string; style: CSSProperties }>;

export default function AmbientBackground() {
  const [isMounted, setIsMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
    } else {
      mediaQuery.addListener(updatePreference);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updatePreference);
      } else {
        mediaQuery.removeListener(updatePreference);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-shell absolute inset-0" />

      {isMounted ? (
        <div className={`ambient-webgl absolute inset-0 ${prefersReducedMotion ? 'ambient-webgl-reduced' : ''}`}>
          <div className="ambient-webgl-pane ambient-webgl-pane-left">
            <AmbientBackgroundCanvas reducedMotion={prefersReducedMotion} side="left" />
          </div>
          <div className="ambient-webgl-pane ambient-webgl-pane-right">
            <AmbientBackgroundCanvas reducedMotion={prefersReducedMotion} side="right" />
          </div>
        </div>
      ) : null}

      <div className="ambient-aurora ambient-aurora-left absolute left-[-16rem] top-[2%] h-[34rem] w-[44rem]" />
      <div className="ambient-aurora ambient-aurora-right absolute right-[-14rem] top-[18%] h-[34rem] w-[42rem]" />

      <div className="ambient-beam ambient-beam-left absolute left-[7%] top-[-18%] h-[140%] w-[18rem]" />
      <div className="ambient-beam ambient-beam-right absolute right-[9%] top-[-16%] h-[140%] w-[16rem]" />

      <div className="ambient-mesh ambient-mesh-warm absolute left-[-9rem] top-[9%] h-[28rem] w-[28rem]" />
      <div className="ambient-mesh ambient-mesh-cool absolute right-[-11rem] top-[18%] h-[30rem] w-[30rem]" />
      <div className="ambient-mesh ambient-mesh-soft absolute bottom-[-10rem] right-[-6rem] h-[26rem] w-[26rem]" />

      {HALOS.map((halo, index) => (
        <div key={index} className={`absolute rounded-full ${halo.className}`} style={halo.style} />
      ))}

      {PARTICLES.map((particle, index) => (
        <div key={index} className={`absolute rounded-full ${particle.className}`} style={particle.style} />
      ))}

      <div className="ambient-grid absolute inset-0" />
      <div className="ambient-noise absolute inset-0" />
      <div className="ambient-vignette absolute inset-0" />
    </div>
  );
}
