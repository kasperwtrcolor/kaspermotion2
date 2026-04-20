import React from 'react';
import { motion } from 'motion/react';
import { Quote, Star } from 'lucide-react';

interface TestimonialProps {
  status: 'past' | 'active' | 'future';
  caption: string;
  author?: string;
  role?: string;
  avatar?: string;
  rating?: number;
  accentColor?: string;
}

export const TestimonialBlock: React.FC<TestimonialProps> = ({
  status,
  caption,
  author = "Sarah Johnson",
  role = "CEO, TechFlow",
  avatar,
  rating = 5,
  accentColor = "#A855F7"
}) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 20 }}
      animate={status === 'active' ? { 
        scale: 1, 
        opacity: 1, 
        rotateY: 0 
      } : { 
        scale: 0.8, 
        opacity: 0, 
        rotateY: 20 
      }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-12 md:p-16 w-full max-w-[85vw] h-auto brutal-border-large shadow-[0_60px_120px_rgba(0,0,0,0.4)] flex flex-col items-center text-center gap-8 relative overflow-hidden pb-16"
    >
      {/* Decorative Brand Accent */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 rounded-b-full"
        style={{ backgroundColor: accentColor }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={status === 'active' ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <Quote size={64} className="text-black opacity-10 absolute -top-10 -left-10 rotate-12" />
        <p className="text-3xl md:text-4xl font-display font-black leading-tight text-black tracking-tight italic">
          "{caption || "KasperMotion transformed our product launch video in minutes. The shader transitions are purely magic."}"
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-1">
          {[...Array(rating)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={status === 'active' ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <Star size={24} className="fill-yellow-400 text-yellow-400" />
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-black/5 border-2 border-black/10 overflow-hidden shadow-xl">
            {avatar ? (
              <img src={avatar} alt={author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brutal-purple/20">
                <span className="text-2xl font-black text-black/40">{author[0]}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <h4 className="text-xl font-black text-black uppercase tracking-tight">{author}</h4>
            <p className="text-sm font-mono font-bold text-black/50 uppercase tracking-widest">{role}</p>
          </div>
        </div>
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>
    </motion.div>
  );
};

export default TestimonialBlock;
