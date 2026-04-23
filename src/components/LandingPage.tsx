import React from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, Play, Layers, Zap, Sparkles, Image as ImageIcon, Video, Type, CreditCard, MousePointer2, ChevronRight, X } from 'lucide-react';
import { PricingPlans } from './PricingModal';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const KineticTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const containerRef = React.useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Split text into lines/words if it's a string
    const target = containerRef.current;
    
    gsap.fromTo(target, 
      { 
        y: 60,
        opacity: 0,
        skewY: 3,
        clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'
      },
      {
        y: 0,
        opacity: 1,
        skewY: 0,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: target,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <h2 ref={containerRef} className={`${className} will-change-transform`}>
      {children}
    </h2>
  );
};

const KineticHero = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const containerRef = React.useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    const target = containerRef.current;
    
    gsap.fromTo(target, 
      { 
        y: 100,
        opacity: 0,
        rotateX: -20,
        perspective: 1000
      },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 0.2
      }
    );
  }, { scope: containerRef });

  return (
    <h1 ref={containerRef} className={`${className} will-change-transform`}>
      {children}
    </h1>
  );
};

interface LandingPageProps {
  onStart: () => void;
  onSelectTier: (tier: any) => void;
}

export default function LandingPage({ onStart, onSelectTier }: LandingPageProps) {
  const [showLegal, setShowLegal] = React.useState<'privacy' | 'terms' | null>(null);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div className="min-h-screen bg-mesh-gradient bg-dot-grid text-white font-sans selection:bg-indigo-500/30">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh] overflow-hidden">
        <div className="flex-1 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={12} />
              Elite App Showcases for Designers
            </div>
            <KineticHero className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tighter mb-8 max-w-3xl">
              Showcase <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Your Vision.</span>
            </KineticHero>
            <p className="text-xl sm:text-2xl font-medium mb-12 max-w-2xl text-white/60 leading-relaxed">
              Transform your screenshots into cinematic trailers. AI-pioneered kinetic motion, depth of field, and professional studio vibes.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onStart} 
                className="elite-button group px-10 py-5 text-xl rounded-full font-bold flex items-center justify-center gap-2 overflow-hidden shadow-2xl shadow-indigo-500/20"
              >
                Start Creating Free
                <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-12 flex items-center gap-6 text-white/40 font-medium text-sm">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-gray-800" />
                ))}
              </div>
              <p>Join 2,000+ top designers & developers</p>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
          {/* Main Visual Component representing the product UI */}
          <motion.div 
            style={{ y: y1 }}
            className="relative z-20 glass-panel p-2 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700"
          >
            <div className="aspect-video bg-[#0c0c0e] rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/elite-trailer/1200/675')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all">
                  <Play size={32} className="text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-1">Current Scene</p>
                     <h3 className="font-display text-white font-bold text-2xl tracking-tight">The Future of Interaction</h3>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-mono text-xs">
                     00:45
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: y2 }}
            className="absolute -bottom-12 -left-12 z-30 glass-panel-light p-4 rounded-2xl -rotate-6 hidden sm:block w-48"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="font-mono text-[10px] font-bold text-white/60 uppercase">Timeline Sync</p>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-indigo-500" />
              </div>
              <div className="h-1.5 w-[80%] bg-white/5 rounded-full" />
              <div className="h-1.5 w-[60%] bg-white/5 rounded-full" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-12 -right-12 z-10 glass-panel p-4 rounded-2xl rotate-6 hidden sm:block"
          >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                 <Sparkles size={20} className="text-indigo-400" />
               </div>
               <div>
                  <p className="font-display font-bold text-sm">AI Cinematic</p>
                  <p className="text-[10px] text-white/50">Auto-calculated paths</p>
               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Kinetic Typography Showcase (Fully Animated with GSAP) */}
      <section className="py-40 bg-zinc-950/50 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="flex flex-col gap-32">
            <div className="max-w-4xl">
              <span className="text-indigo-400 font-mono text-sm font-bold uppercase tracking-[0.4em] mb-8 block">01. Dynamic Motion</span>
              <KineticTitle className="text-7xl md:text-9xl font-display font-bold leading-[0.8] tracking-tighter uppercase mb-12">
                Cinematic <br/><span className="text-indigo-500">Kinetics.</span>
              </KineticTitle>
              <p className="text-2xl text-white/40 leading-relaxed max-w-2xl font-medium">
                The core engine treats every word as a 3D object. Elastic bounces, 3D rotations, and cascade reveals—all calculated in real-time.
              </p>
            </div>

            <div className="max-w-4xl ml-auto text-right">
              <span className="text-purple-400 font-mono text-sm font-bold uppercase tracking-[0.4em] mb-8 block">02. Visual Depth</span>
              <KineticTitle className="text-7xl md:text-9xl font-display font-bold leading-[0.8] tracking-tighter uppercase mb-12">
                Hyper <br/><span className="text-purple-500">Depth.</span>
              </KineticTitle>
              <p className="text-2xl text-white/40 leading-relaxed max-w-2xl ml-auto font-medium">
                SDF iris wipes and chromatic splits. Every transition is a masterpiece of WebGL architecture, covering the entire viewport with cinematic glow.
              </p>
            </div>

            <div className="max-w-4xl">
              <span className="text-pink-400 font-mono text-sm font-bold uppercase tracking-[0.4em] mb-8 block">03. Professional Flow</span>
              <KineticTitle className="text-7xl md:text-9xl font-display font-bold leading-[0.8] tracking-tighter uppercase mb-12">
                Elite <br/><span className="text-pink-500">Studio.</span>
              </KineticTitle>
              <p className="text-2xl text-white/40 leading-relaxed max-w-2xl font-medium">
                Bypass standard editing tools. Write a script, upload a screenshot, and watch our AI director compose the choreography.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-indigo-400 font-mono text-sm font-bold uppercase tracking-[0.2em] mb-4">Pricing</p>
          <KineticTitle className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">Built for results.</KineticTitle>
          <p className="text-xl text-white/50 font-medium">Simple credit-based usage. No monthly recurring fees.</p>
        </div>

        <PricingPlans onSelect={onSelectTier} />
        
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="mt-20 glass-panel p-10 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-white/5">
              <CreditCard size={32} className="text-white/60" />
            </div>
            <div>
              <KineticTitle className="text-2xl font-display font-bold tracking-tight">Agency Solutions</KineticTitle>
              <p className="text-white/40 text-sm max-w-sm uppercase font-bold tracking-widest mt-1">Order 1,000+ credits for your team.</p>
            </div>
          </div>
          <button onClick={onStart} className="elite-button-secondary px-8 py-4 rounded-xl font-bold relative z-10 border border-white/10">
            Buy Bulk Credits
          </button>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <KineticTitle className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-12">
            Make the UI <br/> 
            <span className="text-indigo-400 italic">breathe.</span>
          </KineticTitle>
          <button 
            onClick={onStart} 
            className="elite-button group px-12 py-6 text-2xl rounded-full font-bold inline-flex items-center gap-4"
          >
            <Zap size={32} fill="white" /> 
            Start Crafting Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-500 shadow-lg shadow-indigo-500/40" />
              <span className="font-display font-bold text-lg tracking-tighter">vibetrailer</span>
           </div>
           <div className="flex gap-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
              <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">Terms</button>
              <a href="https://twitter.com/vibetrailer" target="_blank" className="hover:text-white transition-colors">Twitter</a>
           </div>
           <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">© {new Date().getFullYear()} VibeTrailer. Elite Cinematic Output.</p>
        </div>
      </footer>

      {/* Legal Popups */}
      <AnimatePresence>
        {showLegal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLegal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-3xl max-h-[80vh] overflow-y-auto p-10 rounded-3xl relative border border-white/10 custom-scrollbar"
            >
              <button 
                onClick={() => setShowLegal(null)}
                className="absolute top-6 right-6 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="prose prose-invert max-w-none">
                {showLegal === 'privacy' ? (
                  <>
                    <h2 className="text-4xl font-display font-bold mb-6 text-indigo-400">Privacy Policy</h2>
                    <p className="text-white/60 mb-8 leading-relaxed">
                      At VibeTrailer, we prioritize the protection of your creative assets and personal data. This policy outlines how we handle information to provide you with an elite cinematic experience.
                    </p>
                    <div className="space-y-6">
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">1. Data Sovereignty</h4>
                        <p className="text-white/50 text-sm">Your uploaded media remains your property. We only process it to generate your trailers and do not train AI models on your private assets without explicit consent.</p>
                      </section>
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">2. Secure Processing</h4>
                        <p className="text-white/50 text-sm">All renders are performed in secure browser environments or encrypted cloud nodes. We use Stripe for high-security payment processing.</p>
                      </section>
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">3. Right to Erasure</h4>
                        <p className="text-white/50 text-sm">You can delete your account and all associated trailers at any time from your profile dashboard.</p>
                      </section>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-display font-bold mb-6 text-purple-400">Terms of Service</h2>
                    <p className="text-white/60 mb-8 leading-relaxed">
                      By using VibeTrailer, you are entering a space built for high-performance creativity. Please adhere to these standards to maintain the elite nature of the community.
                    </p>
                    <div className="space-y-6">
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">1. Account Integrity</h4>
                        <p className="text-white/50 text-sm">You are responsible for maintaining the security of your account and for all activities that occur under your vibe-profile.</p>
                      </section>
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">2. Usage Rights</h4>
                        <p className="text-white/50 text-sm">Trailers generated by VibeTrailer are subject to the license of your specific credit tier. Commercial usage requires a 'Pro' package.</p>
                      </section>
                      <section>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-2">3. Acceptable Use</h4>
                        <p className="text-white/50 text-sm">Users must not generate harmful, illegal, or deepfake-style content that violates the rights of third parties.</p>
                      </section>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                 <button 
                   onClick={() => setShowLegal(null)}
                   className="elite-button px-8 py-3 rounded-xl text-sm"
                 >
                   I Understand
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
