import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Instagram, Twitter, MessageSquare, Bell, TrendingUp, UserPlus, Heart, Share2 } from 'lucide-react';

interface BlockProps {
  status: 'past' | 'active' | 'future';
  caption?: string;
  accentColor?: string;
  handle?: string;
  userData?: {
    name: string;
    handle: string;
    avatar?: string;
  };
}

export const InstagramFollowOverlay = ({ status, caption, accentColor = "#0095f6", handle }: BlockProps) => {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={status === 'active' ? { y: 0, opacity: 1 } : { y: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className="bg-black/60 backdrop-blur-3xl rounded-[3rem] pr-10 pl-6 py-6 flex items-center gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 group"
    >
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden border border-white/10 p-1 bg-white/5">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-1">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Instagram className="text-white w-14 h-14" />
            </div>
          </div>
        </div>
        <motion.div 
          initial={{ scale: 0 }}
          animate={status === 'active' ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border-4 border-black"
        >
          <UserPlus size={18} className="text-white" />
        </motion.div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-3xl tracking-tighter">{caption || "HeyGen"}</span>
          <div className="bg-blue-500 rounded-full p-1">
            <CheckCircle2 size={16} className="text-white fill-white" />
          </div>
        </div>
        <span className="text-white/50 text-xl font-medium">{handle || "@heygen_official"}</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ backgroundColor: accentColor }}
        className="px-10 py-4 rounded-2xl text-white font-black text-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] ml-4"
      >
        <motion.span
          initial={{ opacity: 1 }}
          animate={status === 'active' ? { opacity: [1, 0, 0, 1] } : {}}
          transition={{ times: [0, 0.4, 0.6, 1], duration: 4 }}
        >
          {status === 'active' ? "Following" : "Follow"}
        </motion.span>
      </motion.button>
    </motion.div>
  );
};

export const XPostOverlay = ({ status, caption, accentColor = "#1d9bf0", handle }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: -200, opacity: 0, rotateZ: -10 }}
      animate={status === 'active' ? { x: 0, opacity: 1, rotateZ: 0 } : { x: -200, opacity: 0, rotateZ: -10 }}
      className="bg-black/85 backdrop-blur-[40px] border border-white/15 rounded-[2.5rem] p-10 w-[580px] shadow-[0_60px_150px_rgba(0,0,0,0.9)] flex flex-col gap-8 font-sans relative overflow-hidden"
    >
      {/* Subtle Branding Background */}
      <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
        <Twitter className="text-white w-64 h-64" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-200 to-white flex items-center justify-center p-0.5 shadow-2xl">
               <div className="w-full h-full rounded-full bg-black flex items-center justify-center border border-white/10">
                  <span className="text-white font-black text-4xl italic tracking-tighter">X</span>
               </div>
            </div>
            <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ delay: 1, type: 'spring' }}
               className="absolute -bottom-1 -right-1 bg-[#1d9bf0] rounded-full p-1.5 border-4 border-black"
            >
               <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                 <path d="M22.5 12.5c0-1.58-.88-2.97-2.18-3.7 1.3-1.4 1.3-3.61 0-5.01-1.4-1.3-3.61-1.3-5.01 0-.73-1.3-2.12-2.18-3.7-2.18s-2.97.88-3.7 2.18c-1.4-1.3-3.61-1.3-5.01 0-1.3 1.4-1.3 3.61 0 5.01-.73-1.3-2.12-2.18-3.7-2.18-3.7 0-3.7 2.97-3.7 4.5s.88 2.97 2.18 3.7c-1.3 1.4-1.3 3.61 0 5.01 1.4 1.3 3.61 1.3 5.01 0 .73 1.3 2.12 2.18 3.7 2.18s2.97-.88 3.7-2.18c1.4 1.3 3.61 1.3 5.01 0 1.3-1.4 1.3-3.61 0-5.01.73 1.3 2.12 2.18 3.7 2.18zM10.7 17.5l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z" />
               </svg>
            </motion.div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-2xl tracking-tighter">KasperMotion</span>
              {/* Premium Verified Badge */}
              <div className="flex items-center bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                 <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.1em]">Verified</span>
              </div>
            </div>
            <span className="text-white/40 text-[18px] font-bold tracking-tight">{handle || "@kaspermotion"}</span>
          </div>
        </div>
        
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
           <Twitter className="text-white w-6 h-6 opacity-30" />
        </div>
      </div>

      <p className="text-white text-[28px] font-bold leading-[1.3] relative z-10 px-1 tracking-tight">
        {caption || "Bringing cinematic shader transitions to the masses with KasperMotion 2.0. Write scripts, generate magic. 🚀"}
      </p>

      <div className="flex items-center justify-between text-white/30 border-t border-white/10 pt-8 px-2 relative z-10">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 group cursor-pointer hover:text-blue-400 transition-all">
            <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
              <MessageSquare size={24} />
            </div>
            <span className="font-bold text-lg italic">42</span>
          </div>
          <div className="flex items-center gap-3 group cursor-pointer hover:text-green-400 transition-all">
            <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
              <TrendingUp size={24} />
            </div>
            <span className="font-bold text-lg italic">128</span>
          </div>
          <div className="flex items-center gap-3 group cursor-pointer hover:text-red-400 transition-all">
            <div className="p-2 rounded-full group-hover:bg-red-400/10 transition-colors">
              <Heart size={24} fill={status === 'active' ? accentColor : "none"} className={status === 'active' ? "text-transparent" : ""} />
            </div>
            <span className="font-bold text-lg italic">1.2k</span>
          </div>
        </div>
        <div className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
           <Share2 size={24} />
        </div>
      </div>
    </motion.div>
  );
};

export const MacosNotificationOverlay = ({ status, caption }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={status === 'active' ? { x: 0, opacity: 1 } : { x: 400, opacity: 0 }}
      className="bg-[#1d1d1d]/70 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-5 w-[380px] shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex items-start gap-5 mb-4 fixed top-10 right-10 z-[1000]"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)] shrink-0">
        <Bell className="text-white w-8 h-8" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-white/50 font-bold text-[10px] tracking-[0.1em] uppercase">System Notification</span>
          <span className="text-white/20 text-[10px] font-bold">Just Now</span>
        </div>
        <p className="text-white/95 text-base font-semibold leading-relaxed line-clamp-2">
          {caption || "Project rendering complete. Performance increased by 42% using the new shader pipeline."}
        </p>
      </div>
    </motion.div>
  );
};

export const DataChartOverlay = ({ status, caption, accentColor = "#6366f1" }: BlockProps) => {
  const bars = [80, 65, 90, 45, 75];
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={status === 'active' ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      className="bg-black/60 backdrop-blur-3xl rounded-[2.5rem] p-10 w-[650px] border border-white/10 shadow-[0_60px_150px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h4 className="text-white font-black text-3xl mb-1 tracking-tight">{caption || "Performance Metrics"}</h4>
          <p className="text-white/30 text-xs uppercase tracking-[0.2em] font-black">AI Reality Visualization</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
          <TrendingUp className="text-white" style={{ color: accentColor }} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-6 h-56 px-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-4">
            <motion.div
              initial={{ height: 0 }}
              animate={status === 'active' ? { height: `${h}%` } : { height: 0 }}
              transition={{ delay: i * 0.1 + 0.5, type: 'spring', damping: 15 }}
              style={{ backgroundColor: accentColor }}
              className="w-full rounded-2xl relative group overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/20" />
               <motion.div 
                 animate={{ y: [0, -100] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-x-0 h-10 bg-white/10 blur-xl"
               />
            </motion.div>
            <span className="text-white/20 text-[10px] font-black font-mono tracking-widest mt-2 uppercase">Node {i + 1}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function PremiumSocialOverlays({ type, ...props }: any) {
  switch (type) {
    case 'instagram-follow': return <InstagramFollowOverlay {...props} />;
    case 'x-post': return <XPostOverlay {...props} />;
    case 'macos-notification': return <MacosNotificationOverlay {...props} />;
    case 'data-chart': return <DataChartOverlay {...props} />;
    default: return null;
  }
}
