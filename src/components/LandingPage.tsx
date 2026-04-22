import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Play, Layers, Zap, Sparkles, Image as ImageIcon, Video, Type, CreditCard, MousePointer2, ChevronRight, X } from 'lucide-react';
import { PricingPlans } from './PricingModal';
import { AnimatePresence } from 'motion/react';

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
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tighter mb-8 max-w-3xl">
              Showcase <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Your Vision.</span>
            </h1>
            <p className="text-xl sm:text-2xl font-medium mb-12 max-w-2xl text-white/60 leading-relaxed">
              Transform your screenshots into cinematic trailers. AI-pioneered kinetic motion, depth of field, and professional studio vibes.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
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

      {/* Bento Grid Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">The High-Performance Workflow.</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">Skip the manual keyframing. Let AI handle the cinematic composition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[280px]">
          {/* Step 1 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-8 glass-panel p-8 rounded-3xl flex flex-col justify-end relative overflow-hidden group"
          >
            <div className="absolute top-8 left-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 mb-4 transition-transform group-hover:scale-110">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-3xl font-display font-bold mb-3">Upload Media.</h3>
              <p className="text-white/50 max-w-md">Drop your screenshots or let our AI generate visuals from your ideas. Supports high-res PNG, JPG and MP4.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 opacity-20 group-hover:opacity-40 transition-opacity">
               <ImageIcon size={200} className="text-white" />
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-4 glass-panel p-8 rounded-3xl flex flex-col justify-end relative overflow-hidden group border border-purple-500/20"
          >
            <div className="absolute top-8 left-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 mb-4">
                <Type size={24} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">Add Script.</h3>
              <p className="text-white/50 text-sm">Captions sync with kinetic motion paths automatically.</p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-4 glass-panel p-8 rounded-3xl flex flex-col justify-end relative overflow-hidden group border border-pink-500/20"
          >
            <div className="absolute top-8 left-8">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 text-pink-400 mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">Apply Vibes.</h3>
              <p className="text-white/50 text-sm">Presets for Film Noir, Cyberpunk, and Classic Tech.</p>
            </div>
          </motion.div>

          {/* Export Cell */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-8 glass-panel-light p-8 rounded-3xl flex items-center justify-between group overflow-hidden"
          >
            <div className="max-w-xs">
              <h3 className="text-3xl font-display font-bold mb-3">Direct Export.</h3>
              <p className="text-white/50">Render at 4K 60fps directly in your browser. No server waiting times.</p>
            </div>
            <div className="relative">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="w-48 h-48 rounded-full border border-dashed border-white/10 flex items-center justify-center"
               >
                 <div className="w-40 h-40 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                    <Zap size={40} className="text-indigo-400" />
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Motion Engine Showcase */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-[0.3em] mb-4">The Kinetic Engine</p>
          <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-4">Elite Typography.</h2>
          <p className="text-white/40 text-sm max-w-xl mx-auto">Our GSAP-powered motion engine calculates optimal kinetic paths for every character automatically.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Cascade', effect: 'gsap-cascade', desc: 'Elegant staggered entry' },
            { name: '3D Roll', effect: 'gsap-3d-roll', desc: 'Cinematic depth rotation' },
            { name: 'Elastic', effect: 'gsap-elastic', desc: 'Playful organic bounce' },
            { name: 'Glow', effect: 'gsap-glow', desc: 'Atmospheric light leaks' },
            { name: 'Expand', effect: 'gsap-expand', desc: 'Powerful impact scaling' },
            { name: 'Tornado', effect: 'gsap-tornado', desc: 'Vortex motion paths' },
            { name: 'Focus', effect: 'gsap-focus-flash', desc: 'Sharp attention grabbing' },
            { name: 'Stack', effect: 'gsap-stack', desc: 'Modern vertical layering' },
          ].map((item, idx) => (
            <motion.div 
               key={idx}
               whileInView={{ opacity: 1, y: 0 }}
               initial={{ opacity: 0, y: 20 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group cursor-default"
            >
               <div className="h-12 flex items-center mb-4">
                  <h4 className="text-2xl font-display font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{item.name}</h4>
               </div>
               <p className="text-[10px] font-bold uppercase text-white/30 tracking-wider mb-2">{item.desc}</p>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: idx * 0.2 }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                  />
               </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Depth Section */}
      <section className="py-32 bg-white/5 border-y border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 items-center gap-24">
             <div>
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-8">
                   Unrivaled <br/>
                   <span className="text-indigo-400 underline decoration-indigo-500/30 underline-offset-8 italic">Visual Depth.</span>
                </h2>
                <div className="space-y-8">
                   {[
                     { icon: <MousePointer2 className="text-indigo-400" />, title: "3D Parallax Control", desc: "Layers react to virtual lens movement for a true 3D feel." },
                     { icon: <Sparkles className="text-purple-400" />, title: "Cinematic Overlays", desc: "Film grain, dust particles, and organic light leaks." },
                     { icon: <Zap className="text-pink-400" />, title: "Kinetic Synthesis", desc: "Text and media move in perfect harmony with 0 effort." }
                   ].map((item, idx) => (
                     <div key={idx} className="flex gap-4">
                        <div className="mt-1">{item.icon}</div>
                        <div>
                           <h4 className="font-bold text-lg">{item.title}</h4>
                           <p className="text-white/50">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="relative">
                <div className="glass-panel p-4 rounded-2xl aspect-video overflow-hidden group">
                   <motion.div 
                     animate={{ scale: [1, 1.1, 1], rotate: [0, 1, -1, 0] }}
                     transition={{ duration: 15, repeat: Infinity }}
                     className="absolute inset-0 bg-[url('https://picsum.photos/seed/design/1000/600')] bg-cover bg-center rounded-xl overflow-hidden"
                   />
                   <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <p className="font-mono text-xs uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/10">Rendering Engine active</p>
                   </div>
                </div>
                {/* Decorative floating UI */}
                <div className="absolute -top-6 -right-6 glass-panel-light px-4 py-2 rounded-full font-mono text-[10px] text-white/60">
                   SHDR_CORE_v2
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-indigo-400 font-mono text-sm font-bold uppercase tracking-[0.2em] mb-4">Pricing</p>
          <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">Built for results.</h2>
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
              <h3 className="font-display text-2xl font-bold tracking-tight">Agency Solutions</h3>
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
          <h2 className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-12">
            Make the UI <br/> 
            <span className="text-indigo-400 italic">breathe.</span>
          </h2>
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
