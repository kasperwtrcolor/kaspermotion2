import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles, Monitor, Play, Layers, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

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
          <p className="mono mb-4 text-muted">Elite App Showcases for Designers</p>
          <h1 className="reveal-text text-6xl md:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase mb-12">
            Showcase Your<br />Vision.
          </h1>
          <p className="max-w-xl text-xl md:text-2xl font-normal mb-12 text-ink">
            Transform your screenshots into cinematic trailers. AI-pioneered kinetic motion, depth of field, and professional studio vibes.
          </p>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <button 
              onClick={onStart}
              className="btn-primary"
            >
              Start Creating Now <ArrowRight className="ml-2" />
            </button>
            <div className="social-proof mono text-muted max-w-[200px]">
              Join 2,000+ top designers & developers building for the future.
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Stage */}
      <section className="px-6 md:px-20 py-24 relative z-10">
        <div className="max-w-7xl w-full mx-auto">
          <div className="bg-ivory border border-black/5 aspect-video md:h-[80vh] w-full relative overflow-hidden flex items-end p-8 md:p-16 group">
            <div className="z-10 bg-white/40 backdrop-blur-md p-8 border border-black/5">
              <p className="mono mb-2">Active Engine Preview</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase mb-6">The Future of Interaction</h2>
              <div className="flex gap-8 md:gap-16">
                <div>
                  <p className="mono text-[10px] text-muted">Timeline Sync</p>
                  <p className="text-xl font-bold">00:45</p>
                </div>
                <div>
                  <p className="mono text-[10px] text-muted">AI Cinematic</p>
                  <p className="text-xl font-bold">Auto-calculated</p>
                </div>
              </div>
            </div>
            
            {/* Decoration */}
            <div className="absolute top-12 right-12 w-1/3 h-1/2 border border-ink/10 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 border border-ink/10 rounded-full pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24">
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">01. Dynamic Motion</p>
              <h3 className="text-3xl font-black mb-4">Cinematic Kinetics.</h3>
              <p className="text-muted leading-relaxed">
                The core engine treats every word as a 3D object. Elastic bounces, 3D rotations, and cascade reveals—all calculated in real-time.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">02. Visual Depth</p>
              <h3 className="text-3xl font-black mb-4">Hyper Depth.</h3>
              <p className="text-muted leading-relaxed">
                SDF iris wipes and chromatic splits. Every transition is a masterpiece of WebGL architecture, covering the entire viewport.
              </p>
            </div>
            <div className="feature-card animate-up border-t border-ink pt-8">
              <p className="mono text-muted mb-4">03. Professional Flow</p>
              <h3 className="text-3xl font-black mb-4">Elite Studio.</h3>
              <p className="text-muted leading-relaxed">
                Bypass standard editing tools. Write a script, upload a screenshot, and watch our AI director compose the choreography.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA Area */}
      <footer className="px-6 md:px-20 py-24 border-t border-black/5 relative z-10 bg-white">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24">
          <div className="lg:col-span-1">
            <h2 className="text-4xl md:text-6xl font-black uppercase mb-12">Make the UI<br />breathe.</h2>
            <button 
              onClick={onStart}
              className="btn-primary"
            >
              Start Crafting Now
            </button>
          </div>
          
          <div className="flex flex-col gap-4 mono text-sm min-h-[200px]">
             <p className="text-muted">Socials</p>
             <a href="#" className="hover:line-through">Twitter / X</a>
             <a href="#" className="hover:line-through">Instagram</a>
             <a href="#" className="hover:line-through">Dribbble</a>
          </div>
          
          <div className="flex flex-col gap-4 mono text-sm justify-between">
             <div className="flex flex-col gap-4">
                <p className="text-muted">Legal</p>
                <a href="#" className="hover:underline">Privacy Policy</a>
                <a href="#" className="hover:underline">Terms of Service</a>
             </div>
             <p className="text-[10px] opacity-40 mt-12">
               © 2026 VibeTrailer. Elite Cinematic Output for Designers.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
