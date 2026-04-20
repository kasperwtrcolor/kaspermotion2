import React from 'react';
import { motion, useTime, useTransform } from 'motion/react';

interface ComparisonSliderProps {
  status: 'past' | 'active' | 'future';
  assets: string[]; // Expects at least 2 URLs
  caption?: string;
  accentColor?: string;
}

export const ComparisonSliderBlock: React.FC<ComparisonSliderProps> = ({
  status,
  assets,
  accentColor = "#A855F7"
}) => {
  const time = useTime();
  // Animate from 5% to 95% over 5 seconds (standard scene duration)
  const sliderPos = useTransform(time, [0, 5000], [5, 95]);

  if (!assets || assets.length < 2) {
    return (
      <div className="w-[800px] h-[500px] bg-black/40 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border-4 border-dashed border-white/20">
         <p className="text-white/50 font-mono font-bold uppercase">Requires 2 assets to compare</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={status === 'active' ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-[900px] max-w-[85vw] h-[600px] max-h-[70vh] bg-black rounded-[2.5rem] relative overflow-hidden brutal-border-large shadow-[0_80px_150px_rgba(0,0,0,0.6)]"
    >
      {/* After Image (Full Background) */}
      <img 
        src={assets[1]} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Before Image (Clipped Overlay) */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ 
          width: status === 'active' ? sliderPos : '100%',
          borderRight: status === 'active' ? `4px solid ${accentColor}` : 'none'
        }}
      >
        <img 
          src={assets[0]} 
          alt="Before" 
          className="absolute inset-0 w-[900px] h-[600px] max-w-none object-cover"
        />
        
        {/* Slider Handle Glow */}
        <div className="absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white/20 to-transparent blur-md" />
      </motion.div>

      {/* Labels */}
      <div className="absolute top-6 left-6 z-20">
        <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
           <span className="text-white font-mono text-[10px] font-black uppercase tracking-widest">Before</span>
        </div>
      </div>
      <div className="absolute top-6 right-6 z-20">
        <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-black/10">
           <span className="text-black font-mono text-[10px] font-black uppercase tracking-widest">After</span>
        </div>
      </div>

      {/* Slider Visual Handle */}
      <motion.div 
        className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
        style={{ left: status === 'active' ? sliderPos : '100%' }}
      >
        <div 
          className="w-12 h-12 -translate-x-1/2 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-white border-solid cursor-ew-resize group"
          style={{ backgroundColor: accentColor }}
        >
          <div className="flex gap-1">
             <div className="w-1 h-4 bg-white/40 rounded-full" />
             <div className="w-1 h-4 bg-white rounded-full" />
             <div className="w-1 h-4 bg-white/40 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
    </motion.div>
  );
};

export default ComparisonSliderBlock;
