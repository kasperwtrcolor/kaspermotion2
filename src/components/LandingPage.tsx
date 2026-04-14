import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Play, Layers, Zap, Sparkles, Image as ImageIcon, Video, Music, Type } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-isometric-grid text-black font-sans selection:bg-brutal-green selection:text-black">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
        <div className="flex-1 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block bg-brutal-orange brutal-border px-3 py-1 mb-6 font-mono text-sm font-bold uppercase transform -rotate-2">
              AI-Powered Video Creation
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tighter mb-6 uppercase">
              Make <span className="text-brutal-blue" style={{ textShadow: '4px 4px 0 #000' }}>Trailers</span><br />
              In Seconds.
            </h1>
            <p className="text-xl sm:text-2xl font-medium mb-10 max-w-2xl border-l-4 border-black pl-4">
              Turn your images, videos, and text into cinematic trailers with AI-driven transitions, effects, and music.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStart} className="brutal-button bg-brutal-green px-8 py-4 text-lg flex items-center justify-center gap-2">
                Create Now <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
          <motion.div 
            style={{ y: y1 }}
            className="relative z-20 brutal-card bg-brutal-purple p-2 transform rotate-3"
          >
            <div className="aspect-video bg-black brutal-border relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/trailer/800/450')] bg-cover bg-center opacity-80 mix-blend-luminosity"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <Play size={64} className="text-white relative z-10" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="font-display text-white font-bold text-2xl uppercase">Epic Journey</div>
                <div className="font-mono text-brutal-green text-sm">00:45</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: y2 }}
            className="absolute -bottom-10 -left-10 z-30 brutal-card bg-brutal-pink p-4 transform -rotate-6 hidden sm:block"
          >
            <div className="font-mono font-bold text-sm mb-2 uppercase border-b-2 border-black pb-1">Assets</div>
            <div className="flex gap-2">
              <div className="w-12 h-12 bg-white brutal-border flex items-center justify-center"><ImageIcon size={20} /></div>
              <div className="w-12 h-12 bg-white brutal-border flex items-center justify-center"><Video size={20} /></div>
              <div className="w-12 h-12 bg-white brutal-border flex items-center justify-center"><Music size={20} /></div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-10 -right-10 z-10 brutal-card bg-brutal-blue p-4 transform rotate-12 hidden sm:block"
          >
            <div className="font-mono font-bold text-sm uppercase flex items-center gap-2">
              <Sparkles size={16} /> AI Generated
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-black text-white border-y-4 border-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brutal-blue via-black to-black"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4">How It Works</h2>
            <p className="text-xl font-mono text-brutal-green">Three simple steps to cinematic glory.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Media",
                desc: "Drag and drop your images and videos, or generate new ones using our built-in AI image generator.",
                icon: <ImageIcon size={32} />,
                color: "bg-brutal-pink"
              },
              {
                step: "02",
                title: "Write Script",
                desc: "Add text captions for each scene. Our system automatically times them to the beat of the music.",
                icon: <Type size={32} />,
                color: "bg-brutal-blue"
              },
              {
                step: "03",
                title: "Apply Style",
                desc: "Choose from cinematic presets, add 3D camera movements, film grain, and dynamic transitions.",
                icon: <Layers size={32} />,
                color: "bg-brutal-orange"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.2 }}
                className="bg-white text-black brutal-border p-6 relative group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className={`absolute -top-4 -right-4 w-12 h-12 ${feature.color} brutal-border flex items-center justify-center font-mono font-bold text-xl transform rotate-12 group-hover:rotate-0 transition-transform`}>
                  {feature.step}
                </div>
                <div className="mb-6 border-b-2 border-black pb-4 inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-display font-bold uppercase mb-3">{feature.title}</h3>
                <p className="font-medium text-gray-700">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-6">
              Cinematic <br/>
              <span className="bg-brutal-green px-2 brutal-border inline-block transform -rotate-2 mt-2">Effects</span>
            </h2>
            <p className="text-xl font-medium mb-8">
              Go beyond simple slideshows. KasperMotion adds real 3D camera movements, depth of field, chromatic aberration, and motion blur to make your static images feel alive.
            </p>
            <ul className="space-y-4 font-mono font-bold uppercase text-sm">
              <li className="flex items-center gap-3"><div className="w-4 h-4 bg-brutal-purple brutal-border"></div> 3D Parallax & Depth</li>
              <li className="flex items-center gap-3"><div className="w-4 h-4 bg-brutal-orange brutal-border"></div> Dynamic Text Animations</li>
              <li className="flex items-center gap-3"><div className="w-4 h-4 bg-brutal-blue brutal-border"></div> Film Grain & Vignette</li>
              <li className="flex items-center gap-3"><div className="w-4 h-4 bg-brutal-pink brutal-border"></div> Beat-synced Transitions</li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="brutal-card bg-white p-4 transform rotate-2">
              <div className="border-2 border-black bg-gray-100 aspect-video relative overflow-hidden">
                {/* Simulated 3D effect */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotateZ: [0, 2, -2, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[url('https://picsum.photos/seed/cinematic/800/450')] bg-cover bg-center"
                />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
                <motion.div 
                  animate={{ 
                    y: [50, 0, 0, -50],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <h3 className="text-5xl font-display font-bold text-white uppercase tracking-widest" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #ff00ff, 2px -2px 0 #00ffff' }}>
                    Cyberpunk
                  </h3>
                </motion.div>
              </div>
              <div className="mt-4 flex justify-between items-center font-mono text-xs font-bold uppercase">
                <span>Effect: Glitch</span>
                <span>Camera: Dolly Zoom</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brutal-purple border-t-4 border-black text-center px-4">
        <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter mb-8 max-w-4xl mx-auto">
          Ready to make your masterpiece?
        </h2>
        <button onClick={onStart} className="brutal-button bg-brutal-green px-12 py-6 text-2xl inline-flex items-center gap-4 hover:scale-105">
          <Zap size={32} /> Start Creating Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 border-t-4 border-black text-center font-mono text-sm uppercase">
        <p>© {new Date().getFullYear()} KasperMotion. All rights reserved.</p>
      </footer>
    </div>
  );
}
