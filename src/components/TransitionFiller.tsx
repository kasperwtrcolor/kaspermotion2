import React, { useMemo } from 'react';
import { motion, useTransform, MotionValue } from 'motion/react';

interface TransitionFillerProps {
  assetUrl: string;
  progress: MotionValue<number>; // Mapping directly from the transition progress
  accentColor?: string;
  isActive: boolean;
}

const TransitionFiller: React.FC<TransitionFillerProps> = ({ assetUrl, progress, accentColor = '#ff3e88', isActive }) => {
  // Visibility curve: fade in early, stay bright, fade out at end
  const opacity = useTransform(progress, [0, 0.1, 0.3, 0.7, 1], [0, 0, 1, 1, 0]);
  
  // Cinematic Trajectory: Fly from bottom-left depth to top-right
  const x = useTransform(progress, [0, 1], [-1200, 1200]);
  const y = useTransform(progress, [0, 1], [600, -600]);
  const z = useTransform(progress, [0, 1], [-1500, 500]);
  const rotate = useTransform(progress, [0, 1], [0, 1080]);
  const scale = useTransform(progress, [0, 0.4, 0.6, 1], [0.4, 2.5, 2.5, 0.8]);

  // Fixed set of trails
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      startTime: 0.2 + (i * 0.04), // staggered start
      offset: { 
        x: (Math.random() - 0.5) * 60, 
        y: (Math.random() - 0.5) * 60 
      }
    }));
  }, []);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-[1200] pointer-events-none overflow-visible" style={{ perspective: '2000px' }}>
      <motion.div
        style={{ 
          x, 
          y, 
          z, 
          opacity, 
          rotateY: rotate, 
          rotateZ: rotate / 3,
          scale 
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] flex items-center justify-center transform-gpu"
      >
        {/* Core 3D Icon */}
        <div className="relative w-full h-full flex items-center justify-center">
            <img 
                src={assetUrl} 
                className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] filter brightness-110 contrast-110" 
                alt="3D transition item" 
            />
            
            {/* Inner Glow */}
            <div 
                className="absolute inset-0 blur-3xl opacity-20" 
                style={{ backgroundColor: accentColor }}
            />
        </div>
        
        {/* Particle Trail */}
        {particles.map(p => (
          <Particle 
            key={p.id} 
            progress={progress} 
            startTime={p.startTime} 
            offset={p.offset} 
            color={accentColor} 
          />
        ))}
      </motion.div>
    </div>
  );
};

const Particle = ({ progress, startTime, offset, color }: { progress: MotionValue<number>, startTime: number, offset: any, color: string }) => {
  // Particles trail behind the item's progress
  const pOpacity = useTransform(progress, [startTime, startTime + 0.1, startTime + 0.3], [0, 1, 0]);
  const pScale = useTransform(progress, [startTime, startTime + 0.3], [1.5, 0]);
  const pX = useTransform(progress, [startTime, startTime + 0.3], [offset.x, offset.x * 2]);
  const pY = useTransform(progress, [startTime, startTime + 0.3], [offset.y, offset.y * 2]);

  return (
    <motion.div
      style={{ 
        opacity: pOpacity, 
        scale: pScale,
        x: pX,
        y: pY,
        backgroundColor: color,
        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}44`,
        zIndex: -1
      }}
      className="absolute w-5 h-5 rounded-full blur-[1px]"
    />
  );
};

export default TransitionFiller;
