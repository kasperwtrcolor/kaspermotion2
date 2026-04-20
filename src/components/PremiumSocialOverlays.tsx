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

export const InstagramFollowOverlay = ({ status, caption, accentColor = "#0095f6" }: BlockProps) => {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={status === 'active' ? { y: 0, opacity: 1 } : { y: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className="bg-[#1a1a1a] rounded-[75px] pr-8 pl-4 py-4 flex items-center gap-6 shadow-2xl brutal-border group"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 p-1">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-1">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Instagram className="text-white w-12 h-12" />
            </div>
          </div>
        </div>
        <motion.div 
          initial={{ scale: 0 }}
          animate={status === 'active' ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1 border-2 border-black"
        >
          <UserPlus size={16} className="text-white" />
        </motion.div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-2xl tracking-tight">{caption || "HeyGen"}</span>
          <CheckCircle2 size={20} className="text-blue-500 fill-blue-500" />
        </div>
        <span className="text-gray-400 text-lg">{handle || "@heygen_official"}</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ backgroundColor: accentColor }}
        className="px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg"
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

export const XPostOverlay = ({ status, caption, accentColor = "#1d9bf0" }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: -200, opacity: 0, rotateZ: -10 }}
      animate={status === 'active' ? { x: 0, opacity: 1, rotateZ: 0 } : { x: -200, opacity: 0, rotateZ: -10 }}
      className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-[500px] shadow-2xl flex flex-col gap-4 font-sans"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 overflow-hidden">
             <div className="w-full h-full bg-white flex items-center justify-center text-black font-black text-2xl">X</div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-lg">KasperMotion</span>
              <CheckCircle2 size={18} className="text-blue-400 fill-blue-400" />
            </div>
            <span className="text-gray-500">{handle || "@kaspermotion"}</span>
          </div>
        </div>
        <Twitter className="text-white w-6 h-6 opacity-30" />
      </div>

      <p className="text-white text-xl leading-relaxed">
        {caption || "Bringing cinematic shader transitions to the masses with KasperMotion 2.0. Write scripts, generate magic. 🚀"}
      </p>

      <div className="flex items-center gap-6 text-gray-500 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400 transition-colors">
          <MessageSquare size={18} /> <span>42</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer hover:text-green-400 transition-colors">
          <TrendingUp size={18} /> <span>128</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer hover:text-red-400 transition-colors">
          <Heart size={18} fill={status === 'active' ? accentColor : "none"} className={status === 'active' ? "text-transparent" : ""} /> <span>1.2k</span>
        </div>
        <Share2 size={18} />
      </div>
    </motion.div>
  );
};

export const MacosNotificationOverlay = ({ status, caption }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={status === 'active' ? { x: 0, opacity: 1 } : { x: 400, opacity: 0 }}
      className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 w-[350px] shadow-2xl flex items-start gap-4 mb-4 fixed top-8 right-8 z-[1000]"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
        <Bell className="text-white w-6 h-6" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-bold text-sm tracking-wide uppercase">System Analytics</span>
          <span className="text-white/40 text-[10px]">Now</span>
        </div>
        <p className="text-white/90 text-sm font-medium leading-normal">
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
      className="bg-black/60 backdrop-blur-2xl rounded-3xl p-8 w-[600px] border border-white/10 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-white font-bold text-2xl mb-1">{caption || "Performance Metrics"}</h4>
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Real-time Visualization</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5">
          <TrendingUp className="text-white" style={{ color: accentColor }} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 h-48">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3">
            <motion.div
              initial={{ height: 0 }}
              animate={status === 'active' ? { height: `${h}%` } : { height: 0 }}
              transition={{ delay: i * 0.1 + 0.5, type: 'spring', damping: 15 }}
              style={{ backgroundColor: accentColor }}
              className="w-full rounded-t-xl relative group overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
            <span className="text-white/30 text-xs font-mono">Q{i + 1}</span>
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
