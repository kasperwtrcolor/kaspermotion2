import React, { useId, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MORPH_SHAPES } from '../constants/transitionAssets';
import { motion } from 'motion/react';

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
  const solidRef = useRef<HTMLDivElement>(null);
  const solidPathRef = useRef<SVGPathElement>(null);
  const maskId = useId().replace(/:/g, '');
  
  const shapeKey = type.replace('morph-', '') as keyof typeof MORPH_SHAPES;
  const targetPath = MORPH_SHAPES[shapeKey] || MORPH_SHAPES.circle;
  const squarePath = MORPH_SHAPES.square;
  const activeItemUrl = itemUrl || (type === 'item-portal' ? '/assets/3D-Items/rocket/rocket-dynamic-premium.png' : null);

  const transitionColor = useMemo(() => {
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, [type]);

  useGSAP(() => {
    console.log(`MorphTransitionOverlay: ${type} status: ${status} itemUrl: ${activeItemUrl}`);
    if (!gsap.plugins.morphSVG) {
      console.warn('MorphSVGPlugin not found! Morphs will not work.');
    }

    // Item Portal logic
    if (activeItemUrl && itemRef.current && solidRef.current) {
      if (status === 'active') {
        // Masked content animation
        gsap.fromTo(itemRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 25,
            opacity: 1,
            duration: duration,
            ease: "expo.inOut"
          }
        );
        // Solid wipe animation (on top)
        gsap.fromTo(solidRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 30,
            opacity: 1,
            duration: duration,
            ease: "expo.inOut",
            onComplete: () => gsap.to(solidRef.current, { opacity: 0, duration: 0.3 })
          }
        );
      } else {
        gsap.set([itemRef.current, solidRef.current], { scale: 0, opacity: 0 });
      }
      return;
    }

    // SVG Morph logic
    if (!pathRef.current || !solidPathRef.current) return;

    if (status === 'active') {
       // Morph both the mask and a solid colored shape
       gsap.fromTo([pathRef.current, solidPathRef.current], 
         { scale: 0, opacity: 0, attr: { d: targetPath } },
         { 
           morphSVG: squarePath, 
           scale: 1, 
           opacity: 1, 
           duration: duration, 
           ease: "expo.inOut",
           transformOrigin: "50% 50%",
           stagger: 0.05 // Solid shape lead slightly
         }
       );
       // Fade out solid shape at end
       gsap.to(solidPathRef.current, { opacity: 0, duration: 0.3, delay: duration - 0.1 });
    } else {
       gsap.set([pathRef.current, solidPathRef.current], { scale: 0, opacity: 0 });
    }
  }, { dependencies: [status, targetPath, squarePath, duration, activeItemUrl], scope: containerRef });

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Solid Wipe Layer (Top) */}
      {activeItemUrl ? (
        <div 
          ref={solidRef}
          className="absolute inset-0 z-[110]"
          style={{
            backgroundImage: `url(${activeItemUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.5) drop-shadow(0 0 20px rgba(255,255,255,0.5))'
          }}
        />
      ) : (
        <svg className="absolute inset-0 z-[110] w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path ref={solidPathRef} fill={transitionColor} style={{ transformOrigin: 'center center' }} />
        </svg>
      )}

      {/* Masked Reveal Layer */}
      <div 
        className="absolute inset-0 z-[100]"
        style={{ clipPath: activeItemUrl ? 'none' : `url(#${maskId})` }}
      >
        {activeItemUrl ? (
          <div 
            ref={itemRef}
            className="absolute inset-0"
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
      </div>
      
      {/* Mask Definition */}
      {!activeItemUrl && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id={maskId} clipPathUnits="objectBoundingBox">
              <path ref={pathRef} d={targetPath} transform="scale(0.01)" />
            </clipPath>
          </defs>
        </svg>
      )}

      {/* Transitional Flash */}
      {status === 'active' && (
        <motion.div 
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="absolute inset-0 z-[120] bg-white pointer-events-none mix-blend-overlay"
        />
      )}
    </div>
  );
}
