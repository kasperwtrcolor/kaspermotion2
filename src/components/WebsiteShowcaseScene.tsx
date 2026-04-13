import React from 'react';
import { motion } from 'motion/react';
import { Globe, Lock } from 'lucide-react';

interface WebsiteShowcaseSceneProps {
  screenshotUrl: string;
  websiteUrl: string;
  status: 'past' | 'active' | 'future';
}

export default function WebsiteShowcaseScene({ screenshotUrl, websiteUrl, status }: WebsiteShowcaseSceneProps) {
  // Extract domain for display
  let displayUrl = websiteUrl;
  try {
    const u = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    displayUrl = u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {}

  return (
    <motion.div
      className="absolute z-10 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        status === 'active'
          ? { opacity: 1, scale: 1 }
          : status === 'past'
          ? { opacity: 0, scale: 0.5 }
          : { opacity: 0, scale: 0.8 }
      }
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Browser Chrome Mockup */}
      <motion.div
        className="relative bg-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        style={{ width: 900, maxWidth: '80vw' }}
        animate={
          status === 'active'
            ? {
                rotateY: [5, -5, 0],
                rotateX: [-3, 3, 0],
              }
            : {}
        }
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Title Bar */}
        <div className="bg-brutal-bg border-b-2 border-black px-4 py-2.5 flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400 brutal-border" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 brutal-border" />
            <div className="w-3 h-3 rounded-full bg-green-400 brutal-border" />
          </div>
          {/* Address bar */}
          <div className="flex-1 bg-white brutal-border px-3 py-1 flex items-center gap-2 text-xs font-mono">
            <Lock size={10} className="text-green-600" />
            <Globe size={10} className="text-black/40" />
            <span className="text-black/70 truncate">{displayUrl}</span>
          </div>
        </div>

        {/* Screenshot Container */}
        <div className="relative overflow-hidden" style={{ height: 500, maxHeight: '50vh' }}>
          <motion.img
            src={screenshotUrl}
            alt="Website screenshot"
            className="w-full h-auto absolute top-0 left-0"
            style={{ minHeight: '100%', objectFit: 'cover', objectPosition: 'top' }}
            animate={
              status === 'active'
                ? {
                    scale: [1, 1.4, 1.6, 1.2, 1],
                    y: [0, -60, -120, -40, 0],
                  }
                : { scale: 1, y: 0 }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />

          {/* Highlight overlays that animate in */}
          {status === 'active' && (
            <>
              {/* Top highlight box */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ left: '10%', top: '8%', width: '80%', height: '18%' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: [0, 0, 1, 1, 0, 0],
                  scale: [0.9, 0.9, 1, 1, 1, 0.9],
                  borderColor: ['rgba(191,219,254,0)', 'rgba(191,219,254,0)', 'rgba(191,219,254,1)', 'rgba(191,219,254,1)', 'rgba(191,219,254,0)', 'rgba(191,219,254,0)'],
                }}
                transition={{ duration: 8, repeat: Infinity, times: [0, 0.2, 0.25, 0.45, 0.5, 1] }}
              >
                <div className="w-full h-full border-3 border-brutal-blue rounded-sm bg-brutal-blue/10 shadow-[0_0_20px_rgba(191,219,254,0.4)]" />
                <motion.div
                  className="absolute -top-6 left-2 bg-brutal-blue brutal-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{
                    opacity: [0, 0, 1, 1, 0, 0],
                    y: [5, 5, 0, 0, 5, 5],
                  }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.22, 0.27, 0.43, 0.48, 1] }}
                >
                  Hero Section
                </motion.div>
              </motion.div>

              {/* Middle highlight box */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ left: '15%', top: '40%', width: '35%', height: '22%' }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0, 0, 1, 1, 0, 0],
                  scale: [0.9, 0.9, 0.9, 1, 1, 1, 0.9],
                }}
                transition={{ duration: 8, repeat: Infinity, times: [0, 0.4, 0.48, 0.52, 0.68, 0.72, 1] }}
              >
                <div className="w-full h-full border-3 border-brutal-green rounded-sm bg-brutal-green/10 shadow-[0_0_20px_rgba(167,243,208,0.4)]" />
                <motion.div
                  className="absolute -top-6 left-2 bg-brutal-green brutal-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0, 0, 1, 1, 0, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.4, 0.5, 0.54, 0.66, 0.7, 1] }}
                >
                  Key Feature
                </motion.div>
              </motion.div>

              {/* CTA highlight */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ left: '55%', top: '50%', width: '30%', height: '10%' }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0, 0, 0, 1, 1, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, times: [0, 0.6, 0.68, 0.72, 0.76, 0.88, 0.92] }}
              >
                <div className="w-full h-full border-3 border-brutal-pink rounded-sm bg-brutal-pink/15 shadow-[0_0_20px_rgba(251,207,232,0.4)] animate-pulse" />
                <motion.div
                  className="absolute -bottom-6 right-2 bg-brutal-pink brutal-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0, 0, 0, 1, 1, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, times: [0, 0.6, 0.7, 0.74, 0.78, 0.86, 0.9] }}
                >
                  Call to Action
                </motion.div>
              </motion.div>
            </>
          )}

          {/* Scan line effect */}
          {status === 'active' && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-brutal-blue/30 pointer-events-none"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
