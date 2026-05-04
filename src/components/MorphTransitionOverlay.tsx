import React, { useRef, useMemo, useId } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MORPH_SHAPES } from '../constants/transitionAssets';

interface MorphTransitionOverlayProps {
  children: React.ReactNode;
  type: string;
  status: 'past' | 'active' | 'future';
  duration?: number;
  itemUrl?: string;
}

export default function MorphTransitionOverlay({ children, type, status, duration = 1.5, itemUrl }: MorphTransitionOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maskId = useId().replace(/:/g, ''); // Ensure valid ID for CSS
  
  const shapeKey = type.replace('morph-', '') as keyof typeof MORPH_SHAPES;
  const targetPath = MORPH_SHAPES[shapeKey] || MORPH_SHAPES.circle;
  const squarePath = MORPH_SHAPES.square;
  const activeItemUrl = itemUrl || (type === 'item-portal' ? '/assets/3D-Items/rocket/rocket-dynamic-premium.png' : null);

  useGSAP(() => {
    // Item Portal logic
    if (activeItemUrl && itemRef.current) {
      if (status === 'active') {
        gsap.fromTo(itemRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 25,
            opacity: 1,
            duration: duration,
            ease: "expo.inOut",
            onStart: () => console.log('Item Portal Started:', itemUrl)
          }
        );
      } else if (status === 'past') {
        gsap.to(itemRef.current, { scale: 0, opacity: 0, duration: duration * 0.5 });
      } else {
        gsap.set(itemRef.current, { scale: 0, opacity: 0 });
      }
      return;
    }

    // SVG Morph logic
    if (!pathRef.current) return;

    const path = pathRef.current;
    
    // Animation logic
    if (status === 'active') {
       // Start as small shape in center and morph to full screen
       gsap.fromTo(path, 
         { 
           scale: 0, 
           opacity: 0, 
           attr: { d: targetPath },
           transformOrigin: "50% 50%" 
         },
         { 
           morphSVG: squarePath, 
           scale: 1, 
           opacity: 1, 
           duration: duration, 
           ease: "expo.inOut",
           onStart: () => console.log('Morph Reveal Started:', type),
           onComplete: () => console.log('Morph Reveal Complete')
         }
       );
    } else if (status === 'past') {
       // Shrink away
       gsap.to(path, {
         scale: 0,
         opacity: 0,
         duration: duration * 0.8,
         ease: "power2.in"
       });
    } else {
       // Future
       gsap.set(path, { scale: 0, opacity: 0 });
    }
  }, { dependencies: [status, targetPath, squarePath, duration, activeItemUrl], scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ clipPath: activeItemUrl ? 'none' : `url(#${maskId})` }}>
      {activeItemUrl ? (
        <div 
          ref={itemRef}
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            WebkitMaskImage: `url(${activeItemUrl})`,
            maskImage: `url(${activeItemUrl})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            backgroundColor: 'white'
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
      
      {/* The Mask Definition */}
      {!activeItemUrl && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id={maskId} clipPathUnits="objectBoundingBox">
              <path
                ref={pathRef}
                d={targetPath}
                transform="scale(0.01)" 
              />
            </clipPath>
          </defs>
        </svg>
      )}
      
      {/* Optional: A solid color flash during the morph to give it more "pop" */}
      {status === 'active' && (
        <div 
          className="absolute inset-0 pointer-events-none z-[-1]"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            mixBlendMode: 'overlay' 
          }}
        />
      )}
    </div>
  );
}
