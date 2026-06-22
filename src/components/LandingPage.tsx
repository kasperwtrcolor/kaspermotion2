import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check, X, Play, Upload, Wand2, Video, Layers, Sparkles, Monitor, Instagram, Twitter, MessageSquare, Bell, Music, Globe, Search, TrendingUp, Terminal, CreditCard, Zap } from 'lucide-react';
import PricingPlanGrid from './PricingPlanGrid';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
  user?: any;
}

/* ── Static preview cards for the showcase section ── */
const SocialCardPreview = ({ type, children, label }: { type: string; children: React.ReactNode; label: string }) => (
  <motion.div
    className="animate-up"
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
  >
    <div className="bg-black rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden aspect-video flex items-center justify-center relative group">
      {children}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
        <span className="mono text-[10px] text-white/80 uppercase font-bold">{label}</span>
      </div>
    </div>
  </motion.div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart, user }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    // Initial Reveal
    gsap.from(".reveal-text", {
      duration: 1.5,
      y: 100,
      opacity: 0,
      ease: "expo.out",
      stagger: 0.2
    });

    // Feature card reveal
    gsap.utils.toArray(".animate-up").forEach((card: any, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        delay: i * 0.1,
        ease: "power3.out"
      });
    });

    // Dynamic Line Path Animation
    if (pathRef.current) {
      gsap.to(pathRef.current, {
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1
        },
        attr: { d: "M0,200 Q500,800 1000,200 T2000,800" },
        ease: "none"
      });
    }
  }, []);

  return (
    <div className="bg-cream selection:bg-ink selection:text-cream">
      {/* Dynamic Line Shapes SVG */}
      <svg className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <path ref={pathRef} d="M0,500 Q250,200 500,500 T1000,500" fill="none" stroke="#121212" strokeWidth="1" />
      </svg>

      {/* Hero Section */}
      <section ref={heroRef} className="hero min-h-screen flex flex-col justify-center px-6 md:px-20 relative z-10">
        <div className="max-w-7xl w-full mx-auto">
          <p className="mono mb-4 text-muted">Ship your app with a trailer.</p>
          <h1 className="reveal-text text-6xl md:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase mb-12">
            Your App<br />Deserves<br />a Trailer.
          </h1>
          <p className="max-w-xl text-xl md:text-2xl font-normal mb-12 text-ink">
            Turn your screenshots into cinematic launch videos. AI-powered motion, studio-grade transitions, and one-click export — built for vibe coders.
          </p>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <button 
              onClick={onStart}
              className="btn-primary"
            >
              Start Creating <ArrowRight className="ml-2" />
            </button>
            <div className="social-proof mono text-muted max-w-[200px]">
              Join 2,000+ vibe coders shipping with trailers.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — Step-by-step breakdown
          ═══════════════════════════════════════════════════ */}
      <section className="px-6 md:px-20 py-32 relative z-10 bg-white border-t border-black/5">
        <div className="max-w-7xl w-full mx-auto">
          <p className="mono text-muted mb-4 animate-up">How it works</p>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-24 leading-[0.85] animate-up">
            Five Steps.<br />Zero Learning Curve.
          </h2>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-up">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-ink text-cream rounded-full flex items-center justify-center font-black text-xl">1</div>
                  <span className="mono text-muted uppercase text-sm">Upload</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">Drop Your Screenshots</h3>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  Drag and drop your app UI, landing page, or product shots. Upload images, GIFs, or videos — the AI Director analyzes your brand palette and builds cinematic choreography automatically.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['PNG', 'JPG', 'GIF', 'MP4', 'WebM'].map(fmt => (
                    <span key={fmt} className="px-3 py-1 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase">{fmt}</span>
                  ))}
                </div>
              </div>
              <div className="bg-ivory border border-black/10 rounded-xl p-12 flex flex-col items-center justify-center aspect-video">
                <Upload className="w-16 h-16 text-ink/20 mb-6" />
                <span className="mono text-sm text-ink/40 font-bold uppercase">Drop screenshots here</span>
                <span className="mono text-[10px] text-ink/20 mt-2">or click to browse</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-up">
              <div className="order-2 md:order-1 bg-ink rounded-xl p-8 aspect-video flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30" />
                <div className="relative grid grid-cols-2 gap-3 w-full max-w-sm">
                  {['Write your hook', 'Add bold caption', 'Set the scene', 'Drop the CTA'].map((t, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/10 backdrop-blur border border-white/10 rounded-lg p-4 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <span className="text-white/80 mono text-[10px] font-bold uppercase">{t}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-ink text-cream rounded-full flex items-center justify-center font-black text-xl">2</div>
                  <span className="mono text-muted uppercase text-sm">Write</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">Add Cinematic Captions</h3>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  Write bold, punchy text for each scene — or let the AI generate copy from your product description. Each caption becomes an animated text block with studio-grade typography and effects.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Stagger Reveal', 'Cascade Fall', 'Glow Pulse', '3D Roll', 'Typewriter'].map(fx => (
                    <span key={fx} className="px-3 py-1 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase">{fx}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-up">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-ink text-cream rounded-full flex items-center justify-center font-black text-xl">3</div>
                  <span className="mono text-muted uppercase text-sm">Style</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">Choose Your Vibe</h3>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  Pick from stunning themes, WebGL transitions, and background styles. Add stock video backgrounds from Pixabay, upload your own, or use solid gradients. Every combination feels premium.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Deep Ocean', 'Sunset Fire', 'Midnight', 'Gradient Rose', 'Particles', 'Grid'].map(theme => (
                    <span key={theme} className="px-3 py-1 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase">{theme}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 aspect-video">
                {[
                  'bg-gradient-to-br from-cyan-900 to-blue-950',
                  'bg-gradient-to-br from-orange-600 to-rose-800',
                  'bg-gradient-to-br from-slate-900 to-slate-950',
                  'bg-gradient-to-br from-emerald-700 to-teal-900',
                  'bg-gradient-to-br from-violet-800 to-indigo-950',
                  'bg-gradient-to-br from-amber-500 to-orange-700',
                ].map((bg, i) => (
                  <motion.div
                    key={i}
                    className={`${bg} rounded-lg border border-white/10 shadow-lg flex items-center justify-center`}
                    whileHover={{ scale: 1.08 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Sparkles className="text-white/20 w-6 h-6" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-up">
              <div className="order-2 md:order-1 bg-ink rounded-xl p-8 aspect-video flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-emerald-900/20" />
                <div className="relative flex flex-col items-center gap-4">
                  <Video className="w-20 h-20 text-white/20" />
                  <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="mono text-white/60 text-sm font-bold uppercase">Recording in 4K...</span>
                  </div>
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <motion.div
                      className="h-full bg-green-400 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '70%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-ink text-cream rounded-full flex items-center justify-center font-black text-xl">4</div>
                  <span className="mono text-muted uppercase text-sm">Preview & Export</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">Ship It. Now.</h3>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  Hit play to preview your trailer in real-time. When you're happy, export in 4K WebM or MP4. Share on X, post to Product Hunt, embed on your landing page — your trailer goes from idea to shipped in minutes.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['4K Export', 'WebM', 'MP4', 'Share Link', '1-Click Download'].map(fmt => (
                    <span key={fmt} className="px-3 py-1 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase">{fmt}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-up">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-ink text-cream rounded-full flex items-center justify-center font-black text-xl">5</div>
                  <span className="mono text-muted uppercase text-sm">Video Backgrounds</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[0.9]">Stock Video<br/>Backgrounds</h3>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  Search millions of free stock videos from Pixabay and set them as full-screen backgrounds. Select multiple videos — each scene automatically gets a different background with smooth crossfade transitions. Upload your own videos too.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Pixabay Search', 'Multi-Select', 'Per-Scene Cycling', 'Upload Your Own', '0.8s Crossfade'].map(f => (
                    <span key={f} className="px-3 py-1 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase">{f}</span>
                  ))}
                </div>
              </div>
              <div className="bg-ink rounded-xl p-6 aspect-video flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-purple-900/30" />
                <div className="relative grid grid-cols-3 gap-2 w-full max-w-xs">
                  {['🌊 Ocean', '🏙️ City', '🌌 Space', '🌿 Nature', '🔥 Abstract', '✨ Bokeh'].map((v, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/10 backdrop-blur border border-white/10 rounded-lg p-3 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-white/80 mono text-[9px] font-bold">{v}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SOCIAL CARDS — All scene types showcased
          ═══════════════════════════════════════════════════ */}
      <section className="px-6 md:px-20 py-32 relative z-10 border-t border-black/5">
        <div className="max-w-7xl w-full mx-auto">
          <p className="mono text-muted mb-4 animate-up">Social Scene Types</p>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.85] animate-up">
            Built-In<br />Social Cards.
          </h2>
          <p className="text-xl text-muted max-w-3xl mb-20 animate-up">
            Every scene can be a different social card. Mix and match Instagram follows, Reddit posts, tweets, Spotify cards, and more — creating viral-ready content without any design tools.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Instagram Follow */}
            <SocialCardPreview type="instagram-follow" label="Instagram Follow">
              <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-6 py-5 flex items-center gap-4 border border-white/15 scale-75">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5 shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <Instagram className="text-white w-7 h-7" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-lg tracking-tight">YourApp</span>
                  <span className="text-white/50 text-sm">@yourapp</span>
                </div>
                <button className="px-6 py-2 bg-blue-500 rounded-xl text-white font-bold text-sm ml-auto">Follow</button>
              </div>
            </SocialCardPreview>

            {/* X/Twitter Post */}
            <SocialCardPreview type="x-post" label="X / Twitter Post">
              <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-5 border border-white/15 w-[85%] scale-75">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white font-black text-lg italic">X</span>
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm block">Your App</span>
                    <span className="text-white/40 text-xs">@yourapp</span>
                  </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">Just shipped the most insane update. Your app trailer is about to go viral 🚀</p>
                <div className="flex gap-6 mt-4 text-white/30">
                  <MessageSquare size={14} />
                  <TrendingUp size={14} />
                  <span className="mono text-[10px]">2.4K</span>
                </div>
              </div>
            </SocialCardPreview>

            {/* Reddit Post */}
            <SocialCardPreview type="reddit-post" label="Reddit Card">
              <div className="bg-white rounded-2xl p-5 w-[85%] scale-75 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-black text-xs">r/</span>
                  </div>
                  <span className="text-gray-500 text-xs font-medium">r/SideProject • 5h</span>
                </div>
                <p className="text-gray-900 font-bold text-sm mb-2">I built a cinematic trailer maker for app launches</p>
                <div className="flex gap-4 text-gray-400 text-xs">
                  <span className="flex items-center gap-1"><TrendingUp size={12} /> 847</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> 134</span>
                </div>
              </div>
            </SocialCardPreview>

            {/* macOS Notification */}
            <SocialCardPreview type="macos-notification" label="macOS Notification">
              <div className="bg-white/90 backdrop-blur-2xl rounded-2xl p-4 w-[80%] shadow-2xl scale-75">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Bell className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">YourApp</span>
                    <span className="text-gray-500 text-xs leading-relaxed block">New feature just dropped — check it out! 🎉</span>
                  </div>
                  <span className="text-gray-300 text-[10px] mono shrink-0">now</span>
                </div>
              </div>
            </SocialCardPreview>

            {/* Spotify Card */}
            <SocialCardPreview type="spotify-card" label="Spotify Now Playing">
              <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-5 w-[85%] scale-75 border border-green-700/30">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="text-green-400 w-5 h-5" />
                  <span className="text-green-400 mono text-[10px] font-bold uppercase">Now Playing</span>
                </div>
                <p className="text-white font-black text-lg tracking-tight">Launch Day</p>
                <p className="text-white/50 text-sm">Your App • The Soundtrack</p>
                <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full w-2/3 bg-green-400 rounded-full" />
                </div>
              </div>
            </SocialCardPreview>

            {/* Data Chart */}
            <SocialCardPreview type="data-chart" label="Dynamic Data Chart">
              <div className="w-[85%] scale-75 p-4">
                <div className="flex items-end gap-2 h-32 justify-center">
                  {[40, 65, 45, 80, 60, 95, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-8 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                    />
                  ))}
                </div>
                <div className="text-center mt-3">
                  <span className="mono text-[10px] text-white/40 uppercase">Revenue Growth</span>
                </div>
              </div>
            </SocialCardPreview>

            {/* 3D Coin Flip */}
            <SocialCardPreview type="coin-flip" label="3D Coin Flip Card">
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-[0_10px_40px_rgba(245,158,11,0.4)] flex items-center justify-center border-4 border-amber-300/50">
                  <CreditCard className="text-amber-900 w-10 h-10" />
                </div>
              </div>
            </SocialCardPreview>

            {/* Search Bar */}
            <SocialCardPreview type="search-bar" label="Search Bar">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-[85%] p-4 border border-white/15 scale-75">
                <div className="flex items-center gap-3">
                  <Search className="text-white/40 w-5 h-5" />
                  <span className="text-white/60 text-sm flex-1">Search your product...</span>
                  <div className="px-2 py-1 bg-white/10 rounded text-white/30 mono text-[10px]">⌘K</div>
                </div>
              </div>
            </SocialCardPreview>

            {/* Terminal Console */}
            <SocialCardPreview type="terminal-console" label="Terminal Console">
              <div className="bg-gray-950 rounded-2xl w-[85%] p-4 border border-white/10 scale-75 font-mono text-sm">
                <div className="flex gap-1.5 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="space-y-1">
                  <p className="text-green-400 text-xs">$ npm run deploy</p>
                  <p className="text-white/50 text-xs">✓ Build successful</p>
                  <p className="text-cyan-400 text-xs">✓ Deployed to production</p>
                </div>
              </div>
            </SocialCardPreview>

            {/* Notification Stack */}
            <SocialCardPreview type="notification-stack" label="Notification Stack">
              <div className="w-[80%] space-y-2 scale-75">
                {['New user signed up', 'Payment received', 'Feature request'].map((msg, i) => (
                  <motion.div
                    key={i}
                    className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center gap-3"
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <Bell className="text-white/40 w-4 h-4 shrink-0" />
                    <span className="text-white/70 text-xs">{msg}</span>
                  </motion.div>
                ))}
              </div>
            </SocialCardPreview>

            {/* Browser URL */}
            <SocialCardPreview type="browser-url" label="Browser URL Bar">
              <div className="bg-gray-100 rounded-2xl w-[85%] overflow-hidden scale-75 shadow-xl">
                <div className="bg-gray-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600 text-xs">yourapp.com</span>
                  </div>
                </div>
                <div className="bg-white p-6 flex items-center justify-center">
                  <span className="text-gray-300 text-xs mono">Your app here</span>
                </div>
              </div>
            </SocialCardPreview>

            {/* Standard Scene */}
            <SocialCardPreview type="standard" label="Standard Scene">
              <div className="flex flex-col items-center gap-4">
                <Layers className="text-white/20 w-12 h-12" />
                <div className="text-center">
                  <span className="text-white font-black text-xl uppercase tracking-tight block">Bold Caption</span>
                  <span className="text-white/40 mono text-[10px] mt-1 block">with cinematic motion</span>
                </div>
              </div>
            </SocialCardPreview>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES GRID — Original 3-column
          ═══════════════════════════════════════════════════ */}
      <section className="px-6 md:px-20 py-24 relative z-10 border-t border-black/5 bg-ivory/30">
        <div className="max-w-7xl w-full mx-auto">
          <p className="mono text-muted mb-4 animate-up">Key Features</p>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-20 leading-[0.85] animate-up">
            Everything<br />You Need.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">01. AI Director</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Smart Choreography.</h3>
              <p className="text-muted leading-relaxed">
                The AI analyzes your screenshots and auto-generates cinematic choreography — camera movements, text timing, and transitions that match your brand energy.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">02. WebGL Transitions</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Studio-Grade Effects.</h3>
              <p className="text-muted leading-relaxed">
                Morph star, glitch, dissolve, slide, zoom — every transition is GPU-accelerated and professionally designed. Mix them across scenes for maximum impact.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">03. Social Cards</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Viral-Ready Scenes.</h3>
              <p className="text-muted leading-relaxed">
                12 built-in social card types — Instagram follows, X posts, Reddit cards, Spotify players, macOS notifications, terminal consoles, and more. Each auto-animated.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">04. Video Backgrounds</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Cinematic Backdrops.</h3>
              <p className="text-muted leading-relaxed">
                Search Pixabay's library of free stock videos, select multiple, and each scene gets its own background with smooth crossfade transitions. Upload your own too.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">05. Music & Audio</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Set The Mood.</h3>
              <p className="text-muted leading-relaxed">
                Upload your own soundtrack or pick from curated tracks. Audio syncs to your scenes and exports with your final video.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">06. One-Click Export</p>
              <h3 className="text-3xl font-black mb-4 uppercase">4K In Seconds.</h3>
              <p className="text-muted leading-relaxed">
                Export your trailer in 4K resolution. Download as WebM or MP4, share via link, or embed directly on your landing page. No watermarks on paid plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing embedded in Landing Page */}
      <section className="px-6 md:px-20 py-32 bg-white relative z-10 border-t border-black/5">
        <div className="max-w-7xl w-full mx-auto">
           <div className="mb-16 text-center">
              <p className="mono text-muted mb-4">Simple Pricing</p>
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.85]">No<br/>Subscriptions.</h2>
              <p className="text-xl text-muted max-w-2xl mx-auto">One pack. All features. Export cinematic trailers for your apps without recurring fees.</p>
           </div>
           
           <PricingPlanGrid onPurchase={onStart} user={user} />
           
           <div className="mt-16 flex flex-wrap gap-8 text-ink/40 mono text-[10px] justify-center">
              <div className="flex items-center gap-2"><Check size={12} /> Secure Stripe Checkout</div>
              <div className="flex items-center gap-2"><Check size={12} /> Commercial License Included</div>
              <div className="flex items-center gap-2"><Check size={12} /> No Monthly Recurring Fees</div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-20 py-32 relative z-10 bg-ink text-cream">
        <div className="max-w-7xl w-full mx-auto text-center">
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.85] animate-up">
            Ready to<br />Ship Your<br />Trailer?
          </h2>
          <p className="text-xl text-cream/60 max-w-2xl mx-auto mb-12 animate-up">
            Stop explaining your app. Show it. Create a cinematic trailer in under 5 minutes.
          </p>
          <button
            onClick={onStart}
            className="bg-cream text-ink px-12 py-5 font-black text-xl uppercase tracking-tight hover:bg-white transition-colors animate-up inline-flex items-center gap-3"
          >
            Start Creating <ArrowRight />
          </button>
        </div>
      </section>

      {/* Footer Area */}
      <footer className="px-6 md:px-20 py-24 border-t border-black/5 relative z-10 bg-white">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24">
          <div className="lg:col-span-1">
            <h2 className="text-4xl md:text-6xl font-black uppercase mb-12 leading-[0.85]">Ship it<br />with a vibe.</h2>
            <button 
              onClick={onStart}
              className="btn-primary"
            >
              Start Creating
            </button>
          </div>
          
          <div className="flex flex-col gap-4 mono text-sm min-h-[200px]">
             <p className="text-muted underline">Socials</p>
             <a href="https://x.com/VibeTrailer" target="_blank" rel="noopener noreferrer" className="hover:line-through">Twitter / X</a>
          </div>
          
          <div className="flex flex-col gap-4 mono text-sm justify-between">
             <div className="flex flex-col gap-4">
                <p className="text-muted underline">Legal</p>
                <button onClick={() => setActiveModal('privacy')} className="text-left hover:underline">Privacy Policy</button>
                <button onClick={() => setActiveModal('terms')} className="text-left hover:underline">Terms of Service</button>
             </div>
             <p className="text-[10px] opacity-40 mt-12">
               © 2026 VibeTrailer. Cinematic trailers for vibe coders.
             </p>
          </div>
        </div>
      </footer>

      {/* Info Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-cream/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="bg-white border border-ink/10 max-w-2xl w-full p-10 md:p-16 relative shadow-2xl h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setActiveModal(null)} 
                className="absolute top-8 right-8 p-2 hover:bg-ivory transition-colors"
              >
                <X size={24} />
              </button>
              
              <p className="mono mb-4 text-muted italic">VibeTrailer Legal Document</p>
              <h2 className="text-4xl font-black uppercase mb-12 leading-none border-b border-ink pb-8">
                {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              
              <div className="prose prose-sm text-ink/70 leading-relaxed font-sans space-y-6">
                <p className="font-bold">Last Updated: October 2026</p>
                <p>Welcome to VibeTrailer. We are committed to providing elite cinematic tools for developers while respecting your data and usage rights.</p>
                <h4 className="font-black uppercase text-ink">Usage Rights</h4>
                <p>Upon purchase of credits, you are granted a worldwide, perpetual license to use the generated output for any commercial or personal purpose. VibeTrailer retains no rights to your uploaded assets.</p>
                <h4 className="font-black uppercase text-ink">Data Security</h4>
                <p>We do not train our AI models on your private screenshots. Assets are used solely for the duration of the rendering process and are stored securely using industry-standard encryption.</p>
                <h4 className="font-black uppercase text-ink">Refund Policy</h4>
                <p>Because of the heavy GPU processing costs associated with AI generation, all credit purchases are final. If an export fails due to a technical error, credits will be automatically refunded to your project balance.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
