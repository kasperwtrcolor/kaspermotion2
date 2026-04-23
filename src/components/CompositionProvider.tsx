import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Composition as HFComposition } from '@hyperframes/core';

interface CompositionContextType {
  hfComposition: HFComposition | null;
}

const CompositionContext = createContext<CompositionContextType>({ hfComposition: null });

export const useHyperFrames = () => useContext(CompositionContext);

export const CompositionProvider: React.FC<{ children: React.ReactNode, duration: number }> = ({ children, duration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hfRef = useRef<HFComposition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      // Initialize HyperFrames composition on the container
      // This allows the headless engine to find and seek our stage
      const hf = new HFComposition(containerRef.current, {
        duration,
        fps: 60,
        // Sync with GSAP
        adapter: 'gsap'
      });
      
      hfRef.current = hf;
      (window as any).__HYPERFRAMES_COMPOSITION__ = hf;

      return () => {
        hf.destroy();
        delete (window as any).__HYPERFRAMES_COMPOSITION__;
      };
    }
  }, [duration]);

  return (
    <CompositionContext.Provider value={{ hfComposition: hfRef.current }}>
      <div ref={containerRef} className="hf-composition-root w-full h-full relative" data-hf-duration={duration}>
        {children}
      </div>
    </CompositionContext.Provider>
  );
};
