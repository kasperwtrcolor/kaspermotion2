import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Instagram, Twitter, MessageSquare, Bell, TrendingUp, UserPlus, Heart, Share2, Music, Hash, ArrowUp, ArrowDown, Flame, Sparkles, Layers, CreditCard, Globe, Lock, RefreshCw } from 'lucide-react';

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
  name?: string;
}

export const InstagramFollowOverlay = ({ status, caption, accentColor = "#0095f6", handle }: BlockProps) => {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={status === 'active' ? { y: 0, opacity: 1 } : { y: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className="bg-black/70 backdrop-blur-3xl rounded-[1.5rem] pr-10 pl-6 py-6 flex items-center gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/15 group"
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

export const XPostOverlay = ({ status, caption, accentColor = "#1d9bf0", handle, name }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: -200, opacity: 0, rotateZ: -10 }}
      animate={status === 'active' ? { x: 0, opacity: 1, rotateZ: 0 } : { x: -200, opacity: 0, rotateZ: -10 }}
      className="bg-black/90 backdrop-blur-[40px] border border-white/20 rounded-[1.5rem] p-8 md:p-10 w-[620px] max-w-[95vw] shadow-[0_60px_150px_rgba(0,0,0,0.9)] flex flex-col gap-8 font-sans relative"
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
              <span className="text-white font-black text-2xl tracking-tighter">{name || "KasperMotion"}</span>
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
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (status === 'active') {
      let start = 0;
      const end = 92;
      const duration = 2000;
      const stepTime = Math.abs(Math.floor(duration / end));
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setCount(0);
    }
  }, [status]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
      animate={status === 'active' ? { scale: 1, opacity: 1, rotateX: 0 } : { scale: 0.9, opacity: 0, rotateX: 20 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="bg-black/90 backdrop-blur-[50px] rounded-[1.5rem] p-10 md:p-14 w-[850px] max-w-[95vw] border border-white/20 shadow-[0_80px_200px_rgba(0,0,0,0.9)] relative overflow-visible"
    >
      <div className="grain-overlay opacity-10" />

      <div className="flex items-center justify-between mb-12 relative z-10">
        <div>
          <motion.h4 
            initial={{ x: -20, opacity: 0 }}
            animate={status === 'active' ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-white font-black text-4xl mb-4 tracking-tighter"
          >
            <span className="highlight-sweep px-2 py-1 inline-block" style={{ "--color-accent": accentColor } as any}>
              {caption || "Performance Metrics"}
            </span>
          </motion.h4>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={status === 'active' ? { opacity: 1 } : {}}
            className="text-white font-black text-7xl font-mono tracking-tighter"
            style={{ color: accentColor }}
          >
            {count}%
          </motion.div>
        </div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl"
        >
          <TrendingUp className="text-white w-8 h-8" style={{ color: accentColor }} />
        </motion.div>
      </div>

      <div className="flex items-end justify-between gap-6 h-56 px-4 relative z-10">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-6">
            <div className="relative w-full h-full flex flex-col justify-end">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={status === 'active' ? { scaleY: h/100 } : { scaleY: 0 }}
                transition={{ delay: i * 0.15 + 0.6, duration: 0.8, ease: "circOut" }}
                style={{ backgroundColor: accentColor, transformOrigin: 'bottom' }}
                className="w-full rounded-t-xl rounded-b-md relative group overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/20 h-full"
              >
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30" />
              </motion.div>
            </div>
            <span className="text-white/30 text-[10px] font-black font-mono tracking-widest uppercase">Node.0{i + 1}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};


export const SpotifyCardOverlay = ({ status, caption, accentColor = "#1DB954" }: BlockProps) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={status === 'active' ? { y: 0, opacity: 1, scale: 1 } : { y: 100, opacity: 0, scale: 0.9 }}
      className="bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 md:p-10 w-[95vw] max-w-[600px] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-center gap-8 md:gap-10 relative overflow-visible"
    >
      <div className="absolute top-0 right-0 p-3 opacity-5">
        <Music size={100} className="text-white" />
      </div>
      <div className="w-24 h-24 md:w-36 md:h-36 bg-gradient-to-br from-gray-800 to-black rounded-lg shadow-2xl flex items-center justify-center border border-white/5 shrink-0">
        <Music size={32} className="text-white/10" />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 relative z-10 w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#1DB954] rounded-full animate-pulse" />
          <span className="text-[#1DB954] text-[10px] font-black uppercase tracking-[0.4em]">Now Playing</span>
        </div>
        <h3 className="text-white text-2xl md:text-3xl font-black tracking-tighter leading-tight truncate">{caption || "Cinematic Masterpiece"}</h3>
        <p className="text-white/50 text-base md:text-lg font-bold">KasperMotion & HyperFrames</p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={status === 'active' ? { width: '72%' } : { width: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-[#1DB954]" 
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">
            <span>2:42</span>
            <span>3:45</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RedditPostOverlay = ({ status, caption, handle = "r/cinematic" }: BlockProps) => {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={status === 'active' ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
      className="bg-[#1A1A1B] border border-[#343536] rounded-xl p-6 md:p-8 w-[550px] max-w-[95vw] shadow-[0_30px_80px_rgba(0,0,0,0.7)] flex gap-4 md:gap-6"
    >
      <div className="flex flex-col items-center gap-2 bg-[#151516] p-2 rounded-lg h-fit">
        <ArrowUp size={20} className="text-[#FF4500]" />
        <span className="text-white font-black text-xs">4.2k</span>
        <ArrowDown size={20} className="text-white/20" />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#FF4500] flex items-center justify-center">
            <Hash size={12} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">{handle}</span>
          <span className="text-white/30 text-xs">• Posted by u/director</span>
        </div>
        <p className="text-white text-xl font-bold leading-snug">
          {caption || "Is this the new gold standard for AI-driven cinematic engines?"}
        </p>
        <div className="flex items-center gap-6 text-white/40 text-[10px] font-black uppercase tracking-widest">
          <span>42 Comments</span>
          <span>Share</span>
          <span>Save</span>
        </div>
      </div>
    </motion.div>
  );
};

export const SearchBarOverlay = ({ status, caption, accentColor = "#4285F4" }: BlockProps) => {
  const text = caption || "How to build a cinematic trailer with AI";
  const [displayedText, setDisplayedText] = React.useState("");
  const [typingDone, setTypingDone] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [glowing, setGlowing] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'active') {
      setDisplayedText("");
      setTypingDone(false);
      setPressed(false);
      setGlowing(false);
      return;
    }

    setDisplayedText("");
    setTypingDone(false);
    setPressed(false);
    setGlowing(false);

    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typeInterval);
        setTypingDone(true);
        // Hand presses the button after typing finishes
        setTimeout(() => setPressed(true), 600);
        // Glow after the press
        setTimeout(() => setGlowing(true), 1100);
      }
    }, 55);

    return () => clearInterval(typeInterval);
  }, [status, text]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.92 }}
      animate={status === 'active' ? { y: 0, opacity: 1, scale: 1 } : { y: 100, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="relative w-[700px] max-w-[95vw]"
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute -inset-4 rounded-[2.5rem] pointer-events-none"
        animate={glowing ? {
          boxShadow: [
            `0 0 20px ${accentColor}40, 0 0 60px ${accentColor}20`,
            `0 0 40px ${accentColor}80, 0 0 120px ${accentColor}40, 0 0 200px ${accentColor}15`,
            `0 0 20px ${accentColor}40, 0 0 60px ${accentColor}20`,
          ],
        } : { boxShadow: '0 0 0px transparent' }}
        transition={glowing ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}}
      />

      {/* Main card */}
      <div className="bg-black/90 backdrop-blur-[60px] border border-white/15 rounded-[2rem] p-8 md:p-10 shadow-[0_60px_160px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Inner glow overlay */}
        <motion.div
          className="absolute inset-0 rounded-[2rem] pointer-events-none"
          animate={glowing ? { opacity: [0, 0.15, 0] } : { opacity: 0 }}
          transition={glowing ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}}
          style={{ background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)` }}
        />

        {/* Browser-style dots */}
        <div className="flex items-center gap-2.5 mb-8 relative z-10">
          <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] shadow-[0_0_8px_rgba(255,95,87,0.4)]" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] shadow-[0_0_8px_rgba(254,188,46,0.4)]" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] shadow-[0_0_8px_rgba(40,200,64,0.4)]" />
          <div className="flex-1" />
          <span className="text-white/20 text-[10px] font-mono font-bold uppercase tracking-[0.15em]">Search</span>
        </div>

        {/* Search bar */}
        <div className="relative z-10 flex items-center gap-4">
          {/* Search icon */}
          <div className="shrink-0 p-3 bg-white/5 rounded-xl border border-white/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Text input area */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-5 min-h-[60px] flex items-center relative overflow-hidden">
            <span className="text-white/90 text-lg md:text-xl font-semibold tracking-tight leading-relaxed">
              {displayedText}
            </span>
            {/* Blinking cursor */}
            {!typingDone && (
              <motion.span
                className="inline-block w-[3px] h-7 ml-1 rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "steps(2)" }}
              />
            )}
          </div>

          {/* Search button with hand press animation */}
          <div className="relative shrink-0">
            <motion.button
              className="px-8 py-5 rounded-xl font-black text-white text-base uppercase tracking-wider shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 relative overflow-hidden"
              style={{ backgroundColor: accentColor }}
              animate={pressed ? { scale: [1, 0.88, 1.05, 1] } : {}}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Button shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={pressed ? { x: '200%' } : { x: '-100%' }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <span className="relative z-10">Search</span>
            </motion.button>

            {/* Hand cursor icon */}
            <motion.div
              className="absolute z-20 pointer-events-none"
              initial={{ x: 60, y: 60, opacity: 0, scale: 0.8 }}
              animate={typingDone ? (pressed ? { x: 5, y: 8, opacity: 1, scale: 0.9 } : { x: 20, y: 25, opacity: 1, scale: 1 }) : { x: 60, y: 60, opacity: 0, scale: 0.8 }}
              transition={{ type: 'tween', duration: 0.4, ease: "easeOut" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="0.5" className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] rotate-[-10deg]">
                <path d="M18 11V6.83a2 2 0 0 0-2-2 2 2 0 0 0-2 2V4.83a2 2 0 0 0-2-2 2 2 0 0 0-2 2V3.83a2 2 0 0 0-4 0v7.17l-1.4-1.4a2 2 0 0 0-2.83 2.83l5.66 5.66A8 8 0 0 0 13.76 21H18a4 4 0 0 0 4-4v-3a2 2 0 0 0-2-2 2 2 0 0 0-2 2z" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Quick suggestion pills */}
        <div className="flex items-center gap-3 mt-6 relative z-10">
          {["Trending", "AI Tools", "Launch"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ y: 10, opacity: 0 }}
              animate={status === 'active' ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/40 text-[11px] font-bold uppercase tracking-widest"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const TerminalConsoleOverlay = ({ status, caption, accentColor = "#22C55E" }: BlockProps) => {
  const lines = React.useMemo(() => {
    const c = caption || "vibetrailer";
    return [
      { prompt: true, text: `npx ${c}@latest init ./` },
      { prompt: false, text: `◼ Scaffolding project in ./`, color: 'text-white/50' },
      { prompt: false, text: `◼ Installing dependencies...`, color: 'text-white/50' },
      { prompt: false, text: '', type: 'progress' as const },
      { prompt: false, text: `✓ 142 packages installed`, color: 'text-emerald-400' },
      { prompt: true, text: `npm run build` },
      { prompt: false, text: `  Building for production...`, color: 'text-white/40' },
      { prompt: false, text: `  ✓ 2,198 modules transformed`, color: 'text-white/50' },
      { prompt: false, text: `  ✓ built in 1.24s`, color: 'text-white/50' },
      { prompt: false, text: '', type: 'success' as const },
    ];
  }, [caption]);

  const [visibleLines, setVisibleLines] = React.useState(0);
  const [typedChars, setTypedChars] = React.useState(0);
  const [progressWidth, setProgressWidth] = React.useState(0);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successFlash, setSuccessFlash] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'active') {
      setVisibleLines(0);
      setTypedChars(0);
      setProgressWidth(0);
      setShowSuccess(false);
      setSuccessFlash(false);
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let cancelled = false;

    const advanceLine = () => {
      if (cancelled || lineIdx >= lines.length) return;

      const line = lines[lineIdx];

      if (line.type === 'progress') {
        // Animate progress bar
        setVisibleLines(lineIdx + 1);
        let prog = 0;
        const progInterval = setInterval(() => {
          if (cancelled) { clearInterval(progInterval); return; }
          prog += 3;
          setProgressWidth(Math.min(prog, 100));
          if (prog >= 100) {
            clearInterval(progInterval);
            lineIdx++;
            setTimeout(() => !cancelled && advanceLine(), 200);
          }
        }, 25);
        return;
      }

      if (line.type === 'success') {
        setVisibleLines(lineIdx + 1);
        setTimeout(() => {
          if (cancelled) return;
          setShowSuccess(true);
          setTimeout(() => !cancelled && setSuccessFlash(true), 300);
        }, 400);
        return;
      }

      if (line.prompt) {
        // Type out prompt lines character by character
        setVisibleLines(lineIdx + 1);
        charIdx = 0;
        const typeInterval = setInterval(() => {
          if (cancelled) { clearInterval(typeInterval); return; }
          charIdx++;
          setTypedChars(charIdx);
          if (charIdx >= line.text.length) {
            clearInterval(typeInterval);
            lineIdx++;
            setTimeout(() => !cancelled && advanceLine(), 400);
          }
        }, 40);
      } else {
        // Non-prompt lines appear instantly with a small delay
        setVisibleLines(lineIdx + 1);
        setTypedChars(0);
        lineIdx++;
        setTimeout(() => !cancelled && advanceLine(), 300);
      }
    };

    setTimeout(() => advanceLine(), 500);

    return () => { cancelled = true; };
  }, [status, lines]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.94 }}
      animate={status === 'active' ? { y: 0, opacity: 1, scale: 1 } : { y: 80, opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', damping: 22, stiffness: 90 }}
      className="relative w-[720px] max-w-[95vw]"
    >
      {/* Success glow */}
      <motion.div
        className="absolute -inset-6 rounded-[2rem] pointer-events-none"
        animate={successFlash ? {
          boxShadow: [
            `0 0 30px ${accentColor}50, 0 0 80px ${accentColor}25`,
            `0 0 60px ${accentColor}90, 0 0 150px ${accentColor}40`,
            `0 0 20px ${accentColor}30, 0 0 60px ${accentColor}15`,
          ]
        } : { boxShadow: '0 0 0px transparent' }}
        transition={successFlash ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
      />

      {/* Terminal window */}
      <div className="bg-[#0D1117] border border-white/10 rounded-2xl shadow-[0_60px_160px_rgba(0,0,0,0.95)] relative overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2.5 px-5 py-4 bg-[#161B22] border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          <div className="flex-1 text-center">
            <span className="text-white/25 text-[11px] font-mono font-bold tracking-wider">Terminal</span>
          </div>
          <div className="w-9" /> {/* spacer to balance dots */}
        </div>

        {/* Terminal body */}
        <div className="p-6 md:p-8 font-mono text-[14px] md:text-[15px] leading-[1.9] min-h-[320px] relative">
          {/* Scanline effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)',
              backgroundSize: '100% 3px',
            }}
          />

          {lines.map((line, i) => {
            if (i >= visibleLines) return null;
            const isCurrentlyTyping = line.prompt && i === visibleLines - 1 && typedChars < line.text.length;
            const displayText = line.prompt && i === visibleLines - 1
              ? line.text.slice(0, typedChars)
              : line.text;

            if (line.type === 'progress') {
              return (
                <div key={i} className="flex items-center gap-3 my-2">
                  <span className="text-white/30 text-xs font-bold uppercase tracking-widest shrink-0">Progress</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ width: `${progressWidth}%`, backgroundColor: accentColor }}
                    />
                  </div>
                  <span className="text-white/40 text-xs font-bold tabular-nums w-10 text-right">{progressWidth}%</span>
                </div>
              );
            }

            if (line.type === 'success') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={showSuccess ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4 }}
                  className="mt-4 flex items-center gap-3"
                >
                  {/* Flash overlay */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none z-10 rounded-b-2xl"
                    initial={{ opacity: 0 }}
                    animate={successFlash ? { opacity: [0, 0.3, 0] } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ backgroundColor: accentColor }}
                  />
                  <motion.div
                    animate={showSuccess ? { rotate: [0, -10, 10, 0], scale: [0.5, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-2xl"
                  >
                    ✓
                  </motion.div>
                  <span className="font-black text-lg tracking-tight" style={{ color: accentColor }}>
                    Ready — Deploy with `vercel --prod`
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {line.prompt && (
                  <span className="select-none mr-2 shrink-0">
                    <span className="text-emerald-400 font-bold">~</span>
                    <span className="text-blue-400 font-bold"> ❯ </span>
                  </span>
                )}
                <span className={line.prompt ? 'text-white/90' : (line.color || 'text-white/60')}>
                  {displayText}
                </span>
                {/* Blinking cursor for currently typing line */}
                {isCurrentlyTyping && (
                  <motion.span
                    className="inline-block w-[8px] h-[18px] ml-[2px] relative top-[2px]"
                    style={{ backgroundColor: accentColor }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "steps(2)" }}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Blinking cursor on empty line when idle */}
          {visibleLines === 0 && status === 'active' && (
            <div className="flex">
              <span className="text-emerald-400 font-bold">~</span>
              <span className="text-blue-400 font-bold"> ❯ </span>
              <motion.span
                className="inline-block w-[8px] h-[18px] ml-[2px] relative top-[2px]"
                style={{ backgroundColor: accentColor }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "steps(2)" }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationStackOverlay = ({ status, caption, accentColor = "#6366f1" }: BlockProps) => {
  const notifications = React.useMemo(() => {
    const c = caption || "Pro Plan Subscription";
    return [
      {
        id: 'stripe',
        app: 'STRIPE',
        title: 'Payment Received',
        desc: `New customer: ${c} (+$49.00)`,
        time: 'Just Now',
        iconBg: 'linear-gradient(135deg, #635BFF 0%, #8E2DE2 100%)',
        icon: <CreditCard className="text-white w-5 h-5" />,
        accent: '#635BFF',
      },
      {
        id: 'product-hunt',
        app: 'PRODUCT HUNT',
        title: 'Trending #1 Product',
        desc: '🚀 KasperMotion 2.0 reached 1,500+ upvotes!',
        time: '2m ago',
        iconBg: 'linear-gradient(135deg, #DA552F 0%, #FF8A00 100%)',
        icon: <Flame className="text-white w-5 h-5" />,
        accent: '#DA552F',
      },
      {
        id: 'figma',
        app: 'FIGMA',
        title: 'Design Template Saved',
        desc: '💬 "The smooth 3D overlays are absolute fire!"',
        time: '5m ago',
        iconBg: 'linear-gradient(135deg, #F24E1E 0%, #A259FF 100%)',
        icon: <Layers className="text-white w-5 h-5" />,
        accent: '#A259FF',
      },
      {
        id: 'discord',
        app: 'DISCORD',
        title: 'New Member Joined',
        desc: '✨ 250+ motion creators joined your Discord lounge!',
        time: '12m ago',
        iconBg: 'linear-gradient(135deg, #5865F2 0%, #5151E5 100%)',
        icon: <Sparkles className="text-white w-5 h-5" />,
        accent: '#5865F2',
      },
    ];
  }, [caption]);

  const [activeCount, setActiveCount] = React.useState(0);

  React.useEffect(() => {
    if (status !== 'active') {
      setActiveCount(0);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    
    // Stagger slide-in times for notifications:
    // First card: 0.4s
    // Second card: 1.6s
    // Third card: 2.8s
    // Fourth card: 4.0s
    for (let i = 0; i < notifications.length; i++) {
      const timer = setTimeout(() => {
        setActiveCount(i + 1);
      }, 400 + i * 1300);
      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [status, notifications]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={status === 'active' ? { opacity: 1 } : { opacity: 0 }}
      className="relative w-[440px] max-w-[95vw] h-[280px] flex flex-col items-center justify-start"
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
    >
      <AnimatePresence>
        {notifications.map((notif, index) => {
          if (index >= activeCount) return null;
          
          // depthIdx = how many slots behind the frontmost/newest card this card sits
          const depthIdx = (activeCount - 1) - index;
          
          // Smooth 3D cascading properties
          const yOffset = depthIdx * 54;
          const scale = 1 - depthIdx * 0.055;
          const zIndex = 50 - depthIdx;
          const opacity = 1 - depthIdx * 0.16;
          const blurValue = depthIdx * 1.5;

          return (
            <motion.div
              key={notif.id}
              initial={{ y: -80, opacity: 0, scale: 0.8, rotateX: 18 }}
              animate={{ 
                y: yOffset, 
                opacity: opacity, 
                scale: scale, 
                rotateX: depthIdx * 5,
                z: -depthIdx * 25,
                filter: `blur(${blurValue}px)`,
              }}
              exit={{ y: 220, opacity: 0, scale: 0.8 }}
              transition={{ 
                type: 'spring', 
                damping: 17, 
                stiffness: 95,
                mass: 0.75,
              }}
              style={{ 
                zIndex,
                position: 'absolute',
                top: 0,
                transformStyle: 'preserve-3d',
              }}
              className="w-full bg-[#0E0F12]/80 backdrop-blur-[24px] border border-white/10 rounded-2xl p-4 flex gap-4 shadow-[0_30px_70px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] select-none"
            >
              {/* Left app icon in gradient box */}
              <div 
                style={{ background: notif.iconBg }}
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)] shrink-0 border border-white/10"
              >
                {notif.icon}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span 
                      style={{ color: notif.accent }}
                      className="font-black text-[10px] tracking-[0.15em] uppercase font-sans"
                    >
                      {notif.app}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-white/40 text-[10px] font-bold">Activity</span>
                  </div>
                  <span className="text-white/25 text-[9px] font-bold tracking-tight shrink-0">{notif.time}</span>
                </div>
                <h5 className="text-white font-extrabold text-sm tracking-tight mb-0.5 line-clamp-1">
                  {notif.title}
                </h5>
                <p className="text-white/60 text-xs font-semibold leading-normal line-clamp-1">
                  {notif.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export const BrowserUrlOverlay = ({ status, caption, accentColor = "#3B82F6" }: BlockProps) => {
  const url = React.useMemo(() => {
    const raw = caption || "vibetrailer.fun/analytics";
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }, [caption]);

  const [typedUrl, setTypedUrl] = React.useState("");
  const [phase, setPhase] = React.useState<'typing' | 'enter' | 'loading' | 'loaded'>('typing');
  const [loadProgress, setLoadProgress] = React.useState(0);

  React.useEffect(() => {
    if (status !== 'active') {
      setTypedUrl("");
      setPhase('typing');
      setLoadProgress(0);
      return;
    }

    let isCancelled = false;
    let charIdx = 0;
    
    // 1. Typing Phase
    const typingInterval = setInterval(() => {
      if (isCancelled) { clearInterval(typingInterval); return; }
      charIdx++;
      setTypedUrl(url.slice(0, charIdx));
      
      if (charIdx >= url.length) {
        clearInterval(typingInterval);
        
        // 2. Enter Phase (brief delay when complete)
        setTimeout(() => {
          if (isCancelled) return;
          setPhase('enter');
          
          // 3. Loading Phase
          setTimeout(() => {
            if (isCancelled) return;
            setPhase('loading');
            
            let prog = 0;
            const progressInterval = setInterval(() => {
              if (isCancelled) { clearInterval(progressInterval); return; }
              prog += 4;
              setLoadProgress(Math.min(prog, 100));
              
              if (prog >= 100) {
                clearInterval(progressInterval);
                // 4. Loaded Phase
                setTimeout(() => {
                  if (!isCancelled) setPhase('loaded');
                }, 150);
              }
            }, 30);
          }, 400);
        }, 500);
      }
    }, 35);

    return () => {
      isCancelled = true;
    };
  }, [status, url]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.94 }}
      animate={status === 'active' ? { y: 0, opacity: 1, scale: 1 } : { y: 80, opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', damping: 20, stiffness: 90 }}
      className="relative w-[720px] max-w-[95vw]"
    >
      {/* Browser Card Frame */}
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl shadow-[0_50px_130px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col">
        
        {/* Browser Top Bar / Tabs & Controls */}
        <div className="bg-[#10131A] border-b border-white/5 px-5 py-4 flex items-center justify-between gap-4">
          
          {/* Controls: Traffic light dots */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>

          {/* Browser Search Bar */}
          <div className="flex-1 max-w-[480px] bg-[#161B26] border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2.5 shadow-inner relative overflow-hidden">
            <Lock size={12} className="text-emerald-400 shrink-0" />
            
            <div className="flex-1 text-[13px] font-mono tracking-tight font-medium text-white/90 truncate flex items-center">
              <span className="text-white/40 select-none">https://</span>
              <span>{typedUrl.replace("https://", "")}</span>
              
              {phase === 'typing' && (
                <motion.span
                  className="inline-block w-[2px] h-[14px] ml-[2px] relative top-[1px]"
                  style={{ backgroundColor: accentColor }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "steps(2)" }}
                />
              )}
            </div>

            <motion.div
              animate={phase === 'loading' ? { rotate: 360 } : {}}
              transition={phase === 'loading' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              className="shrink-0"
            >
              <RefreshCw size={12} className={phase === 'loading' ? "text-blue-400" : "text-white/30"} />
            </motion.div>

            {phase === 'loading' && (
              <motion.div
                className="absolute bottom-0 left-0 h-[2px]"
                style={{ 
                  width: `${loadProgress}%`, 
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            )}
          </div>

          <div className="w-12" />
        </div>

        {/* Browser viewport area */}
        <div className="bg-[#0B0D14] min-h-[300px] relative overflow-hidden flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            {phase !== 'loaded' && (
              <motion.div
                key="loading-splash"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-4"
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/5"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: accentColor }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  <Globe className="text-white/20 w-6 h-6" />
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <span className="text-white/30 font-mono text-[10px] uppercase tracking-[0.2em]">Secure Connection</span>
                  <span className="text-white/60 font-bold text-sm tracking-tight">Resolving Secure DNS Handshake...</span>
                </div>
              </motion.div>
            )}

            {phase === 'loaded' && (
              <motion.div
                key="loaded-content"
                initial={{ opacity: 0, y: 35, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 18, stiffness: 85 }}
                className="w-full h-full p-6 md:p-8 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg border border-white/10 shrink-0">
                      <Globe className="text-white w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-extrabold text-sm tracking-tight">VibeTrailer</h4>
                      <p className="text-white/40 text-[10px] font-bold tracking-wider uppercase font-mono">Platform Active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-white/50 text-[11px] font-semibold">Live Sandbox</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 flex-1">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-[#121622]/60 border border-white/8 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-white/15 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
                    <div>
                      <span className="text-white/40 text-[10px] font-extrabold uppercase tracking-wider font-mono">Real-time Conversions</span>
                      <h3 className="text-white font-black text-3xl mt-1 tracking-tighter">+182.4%</h3>
                    </div>
                    
                    <div className="flex items-end gap-1.5 h-16 pt-2">
                      {[35, 55, 45, 75, 60, 95, 80].map((h, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.25 + idx * 0.05, type: 'spring', damping: 12 }}
                          style={{ backgroundColor: idx === 5 ? accentColor : 'rgba(255,255,255,0.15)' }}
                          className="flex-1 rounded-sm shadow-sm"
                        />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#121622]/60 border border-white/8 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-white/15 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-violet-500/10 blur-xl group-hover:bg-violet-500/20 transition-colors pointer-events-none" />
                    <div>
                      <span className="text-white/40 text-[10px] font-extrabold uppercase tracking-wider font-mono">System Integrity</span>
                      <h3 className="text-white font-black text-3xl mt-1 tracking-tighter">99.98%</h3>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Database Node</span>
                        <span className="text-emerald-400 font-bold">Operational</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "99.98%" }}
                          transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
                          style={{ backgroundColor: accentColor }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
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
    case 'spotify-card': return <SpotifyCardOverlay {...props} />;
    case 'reddit-post': return <RedditPostOverlay {...props} />;
    case 'search-bar': return <SearchBarOverlay {...props} />;
    case 'terminal-console': return <TerminalConsoleOverlay {...props} />;
    case 'notification-stack': return <NotificationStackOverlay {...props} />;
    case 'browser-url': return <BrowserUrlOverlay {...props} />;
    default: return null;
  }
}
