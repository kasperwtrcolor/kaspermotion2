import React, { createContext, useContext, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface CompositionContextType {
  hfComposition: any | null;
}

const CompositionContext = createContext<CompositionContextType>({ hfComposition: null });

export const useHyperFrames = () => useContext(CompositionContext);

export const CompositionProvider: React.FC<{ children: React.ReactNode, duration: number }> = ({ children, duration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hfRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      // Provide a lightweight mock for local previews to seek correctly.
      // The actual HyperFrames engine (headless) relies on the data-hf-* attributes.
      const hfMock = {
        seek: (time: number) => {
          gsap.globalTimeline.seek(time);
        },
        destroy: () => {}
      };
      
      hfRef.current = hfMock;
      (window as any).__HYPERFRAMES_COMPOSITION__ = hfMock;

      return () => {
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
