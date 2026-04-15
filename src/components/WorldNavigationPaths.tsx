import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';

interface PathPoint {
  x: number;
  y: number;
  z: number;
}

interface WorldNavigationPathsProps {
  compositions: any[];
  currentIndex: number;
}

const PathLine = ({ start, end, index, activeIndex }: { start: PathPoint; end: PathPoint; index: number; activeIndex: number }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  
  const { length, pitch, yaw } = useMemo(() => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // Pitch (up/down) - rotation around X or a projected Z
    // In CSS coordinate system (Y is down), positive dy is down.
    const pitchVal = -Math.asin(dy / dist) * (180 / Math.PI);
    // Yaw (left/right) - rotation around Y
    const yawVal = Math.atan2(dx, dz) * (180 / Math.PI);
    
    return { length: dist, pitch: pitchVal, yaw: yawVal };
  }, [start, end]);

  useEffect(() => {
    if (!lineRef.current) return;
    
    const line = lineRef.current;
    const isActive = index === activeIndex;
    const isNext = index === activeIndex + 1;
    
    // Variation selection based on index
    const variations = ['pulse', 'stretch', 'bounce', 'coil', 'shake'];
    const variation = variations[index % variations.length];
    
    let ctx = gsap.context(() => {
      // Basic entry
      gsap.from(line, {
        opacity: 0,
        scaleX: 0,
        duration: 1,
        delay: index * 0.1,
        ease: "power2.out"
      });

      // Variation specific logic
      switch (variation) {
        case 'pulse':
          gsap.to(line, {
            boxShadow: '0 0 25px rgba(255,255,255,1), 0 0 50px #00f2ff',
            opacity: 1,
            repeat: -1,
            yoyo: true,
            duration: 0.8,
            ease: "sine.inOut"
          });
          break;
          
        case 'stretch':
          // Stretches out more when active or next
          gsap.to(line, {
            scaleX: isActive || isNext ? 1.2 : 1,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)"
          });
          break;
          
        case 'bounce':
          gsap.to(line, {
            y: "+=15",
            repeat: -1,
            yoyo: true,
            duration: 2,
            ease: "power1.inOut",
            delay: Math.random()
          });
          break;
          
        case 'coil':
          // Simulating coiling with rotation
          gsap.to(line, {
            rotateX: "+=360",
            repeat: -1,
            duration: 4,
            ease: "none"
          });
          break;
          
        case 'shake':
          gsap.to(line, {
            x: "+=3",
            y: "+=3",
            duration: 0.1,
            repeat: -1,
            yoyo: true,
            ease: "none",
            paused: !isActive && !isNext
          });
          break;
      }
    });

    return () => ctx.revert();
  }, [index, activeIndex]);

  const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0000'];
  const pathColor = colors[index % colors.length];

  return (
    <div
      ref={lineRef}
      className="neon-path"
      style={{
        width: `${length}px`,
        transform: `translate3d(${start.x}px, ${start.y}px, ${start.z}px) rotateY(${yaw}deg) rotateX(${pitch}deg)`,
        '--path-color': pathColor,
        opacity: index < activeIndex ? 0.2 : 0.8 // Dim past paths
      } as any}
    />
  );
};

export default function WorldNavigationPaths({ compositions, currentIndex }: WorldNavigationPathsProps) {
  // Only render paths between existing compositions
  const paths = useMemo(() => {
    const result = [];
    for (let i = 0; i < compositions.length - 1; i++) {
      result.push({
        start: { x: compositions[i].x, y: compositions[i].y, z: compositions[i].z },
        end: { x: compositions[i + 1].x, y: compositions[i + 1].y, z: compositions[i + 1].z },
        index: i
      });
    }
    return result;
  }, [compositions]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {paths.map((path) => (
        <PathLine
          key={`${path.index}-${path.start.x}`}
          start={path.start}
          end={path.end}
          index={path.index}
          activeIndex={currentIndex}
        />
      ))}
    </div>
  );
}
