import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check, X } from 'lucide-react';
import PricingPlanGrid from './PricingPlanGrid';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
  user?: any;
}

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

      {/* Features section */}
      <section className="px-6 md:px-20 py-24 relative z-10">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">01. Cinematic Motion</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Drop Your Screenshots.</h3>
              <p className="text-muted leading-relaxed">
                Upload your app UI, landing page, or product shots. The AI Director analyzes your brand and builds cinematic choreography automatically.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">02. Studio Transitions</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Launch-Ready Vibes.</h3>
              <p className="text-muted leading-relaxed">
                WebGL-powered transitions, kinetic typography, and depth effects. Every frame feels like it was cut by a motion designer.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">03. One-Click Export</p>
              <h3 className="text-3xl font-black mb-4 uppercase">Ship It. Now.</h3>
              <p className="text-muted leading-relaxed">
                Export in 4K, share on X, post to Product Hunt. Your app trailer goes from idea to shipped in under 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing embedded in Landing Page */}
      <section className="px-6 md:px-20 py-32 bg-ivory/30 relative z-10">
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
