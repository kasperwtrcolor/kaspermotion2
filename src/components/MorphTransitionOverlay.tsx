import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { MORPH_SHAPES } from '../constants/transitionAssets';

interface MorphTransitionOverlayProps {
  type: string;
  status: 'past' | 'active' | 'future';
  duration?: number;
}

export default function MorphTransitionOverlay({ type, status, duration = 1.2 }: MorphTransitionOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Use specific shape based on type, e.g. "morph-star" -> "star"
  const shapeKey = type.replace('morph-', '') as keyof typeof MORPH_SHAPES;
  const targetPath = MORPH_SHAPES[shapeKey] || MORPH_SHAPES.circle;
  const squarePath = MORPH_SHAPES.square;

  // Randomized transition color
  const color = useMemo(() => {
    const colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, [type]);

  useEffect(() => {
    if (!pathRef.current) return;

    const path = pathRef.current;

    // Animation logic
    if (status === 'active') {
       // Start as small shape and morph into full screen square
       gsap.fromTo(path, 
         { scale: 0, opacity: 0 },
         { 
           morphSVG: squarePath, 
           scale: 1, 
           opacity: 1, 
           duration: duration, 
           ease: "expo.inOut",
           transformOrigin: "center center"
         }
       );
    } else if (status === 'past') {
       // Shrink back or exit
       gsap.to(path, {
         scale: 0,
         opacity: 0,
         duration: duration * 0.5,
         ease: "expo.in"
       });
    }
  }, [status, targetPath, squarePath, duration]);

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          fill={color}
          d={targetPath}
          style={{ transformOrigin: 'center center' }}
        />
      </svg>
    </div>
  );
}
