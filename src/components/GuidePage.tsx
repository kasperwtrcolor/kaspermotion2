import React from 'react';
import { motion } from 'framer-motion';
import { 
  LinkIcon, Upload, Wand2, Layers, Play, Video, Film, 
  Sparkles, Music, Image as ImageIcon, Type, Clock, 
  Volume2, Twitter, Search, ArrowRight, Monitor,
  Instagram, MessageSquare, Bell, TrendingUp, Terminal,
  Globe, Zap, CheckCircle2
} from 'lucide-react';

interface GuidePageProps {
  onStart: () => void;
  user?: any;
}

const SectionHeader = ({ step, title, subtitle }: { step?: string; title: string; subtitle: string }) => (
  <div className="mb-12 pb-8 border-b border-black/5">
    {step && <p className="mono text-[10px] uppercase opacity-40 mb-2">{step}</p>}
    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-3">{title}</h2>
    <p className="text-ink/60 text-base md:text-lg max-w-3xl">{subtitle}</p>
  </div>
);

const TipCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white border border-black/5 p-6 hover:border-black/15 transition-all group">
    <div className="w-10 h-10 bg-ink text-cream flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="font-bold uppercase mono text-[11px] tracking-wide mb-2">{title}</h4>
    <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
  </div>
);

const FeatureBlock = ({ icon, title, desc, tips }: { icon: React.ReactNode; title: string; desc: string; tips: string[] }) => (
  <div className="bg-white border border-black/5 p-8 md:p-10">
    <div className="flex items-start gap-5 mb-6">
      <div className="w-12 h-12 bg-ink text-cream flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-1">{title}</h3>
        <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
    <div className="pl-0 md:pl-17 space-y-2">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-3">
          <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-ink/70">{tip}</p>
        </div>
      ))}
    </div>
  </div>
);

const SceneTypeCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-black text-cream p-5 border border-white/10 hover:border-white/25 transition-all group">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
        {icon}
      </div>
      <span className="mono text-[10px] font-bold uppercase tracking-wide">{title}</span>
    </div>
    <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
  </div>
);

export default function GuidePage({ onStart, user }: GuidePageProps) {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-24"
        >
          <p className="mono text-[10px] uppercase opacity-40 mb-4 tracking-widest">User Guide</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            How to Use<br /><span className="opacity-30">VibeTrailer</span>
          </h1>
          <p className="text-ink/60 text-lg md:text-xl max-w-2xl mb-8">
            Everything you need to know to create cinematic app trailers. From your first URL paste to your final 4K export.
          </p>
          <button onClick={onStart} className="btn-primary px-8 py-4 text-sm flex items-center gap-3">
            Start Creating <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* Quick Overview */}
        <motion.section 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="mb-24"
        >
          <SectionHeader 
            title="Quick Overview" 
            subtitle="VibeTrailer transforms your app screenshots into cinematic motion graphics trailers in 5 steps."
          />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', label: 'Vision', desc: 'Paste your URL or describe your project', icon: <LinkIcon size={18} /> },
              { num: '02', label: 'Assets', desc: 'Upload screenshots and media files', icon: <Upload size={18} /> },
              { num: '03', label: 'Script', desc: 'Write or edit your trailer captions', icon: <Type size={18} /> },
              { num: '04', label: 'Mapping', desc: 'Assign media to each scene', icon: <Layers size={18} /> },
              { num: '05', label: 'Studio', desc: 'Fine-tune effects, export, and share', icon: <Sparkles size={18} /> },
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="bg-white border border-black/5 p-6 text-center hover:border-black/15 transition-all"
              >
                <div className="w-10 h-10 bg-ink text-cream flex items-center justify-center mx-auto mb-3 font-mono text-xs font-bold">
                  {step.num}
                </div>
                <p className="font-bold uppercase mono text-[11px] tracking-wide mb-1">{step.label}</p>
                <p className="text-ink/50 text-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Step 1 - Vision */}
        <section className="mb-24">
          <SectionHeader
            step="Step 1"
            title="Establish the Vibe"
            subtitle="The AI Director analyzes your website and extracts everything it needs — brand colors, typography, images, and generates a script automatically."
          />
          <div className="space-y-6">
            <FeatureBlock
              icon={<LinkIcon size={20} />}
              title="AI Website Scrape"
              desc="Paste any URL and the AI will analyze your site's content, colors, fonts, and messaging to create a tailored trailer script."
              tips={[
                "Paste your full URL including https:// for best results",
                "The AI extracts your brand colors, typography style, and key messaging from headers",
                "A screenshot of your website is automatically captured and added to your assets",
                "Costs 2 credits per scrape — new users start with 10 free credits",
                "After the scrape completes, you'll automatically move to Step 2"
              ]}
            />
            <FeatureBlock
              icon={<Wand2 size={20} />}
              title="Script Generation"
              desc="The AI generates a punchy 5-8 line script using your actual product name and value propositions — no generic AI buzzwords."
              tips={[
                "Each line of your script becomes one scene in the final trailer",
                "You can edit, reorder, or completely rewrite the script in Step 3",
                "Lines marked as 'text-only' won't have media assigned to them",
                "Shorter, punchier lines create better cinematic impact"
              ]}
            />
          </div>
        </section>

        {/* Step 2 - Assets */}
        <section className="mb-24">
          <SectionHeader
            step="Step 2"
            title="Upload Your Assets"
            subtitle="Add screenshots, images, and videos that will appear in your trailer scenes. Drag and drop or click to upload."
          />
          <div className="space-y-6">
            <FeatureBlock
              icon={<ImageIcon size={20} />}
              title="Media Upload"
              desc="Upload screenshots, product images, or short video clips that will be displayed in your trailer scenes."
              tips={[
                "Supported formats: JPG, PNG, GIF, WebP for images — MP4, WebM for video",
                "Upload multiple files at once by selecting them all in the file picker",
                "Scraped website images are automatically added to your asset pool",
                "Assets are saved to your library for reuse across projects",
                "Use high-resolution images (1080p+) for the best export quality"
              ]}
            />
          </div>
        </section>

        {/* Step 3 - Script */}
        <section className="mb-24">
          <SectionHeader
            step="Step 3"
            title="Write Your Script"
            subtitle="Each line of text becomes a scene. Edit the AI-generated script or write your own from scratch."
          />
          <div className="space-y-6">
            <FeatureBlock
              icon={<Type size={20} />}
              title="Script Editor"
              desc="The text area shows your full script. Each line = one scene in the final trailer."
              tips={[
                "Keep lines short and punchy — 3 to 8 words per line works best",
                "Empty lines are ignored — use them to organize your script visually",
                "The number of non-empty lines determines the number of scenes",
                "You can go back and edit the script at any time, even from the Studio",
                "Pro tip: End with a strong call-to-action like your app name or tagline"
              ]}
            />
          </div>
        </section>

        {/* Step 4 - Mapping */}
        <section className="mb-24">
          <SectionHeader
            step="Step 4"
            title="Map Media to Scenes"
            subtitle="Assign which image or video appears in each scene. Auto-mapping is available for quick setup."
          />
          <div className="space-y-6">
            <FeatureBlock
              icon={<Layers size={20} />}
              title="Scene-Media Mapping"
              desc="Each scene needs a media asset. You can auto-assign or manually pick which asset goes where."
              tips={[
                "Click 'Auto-Map' to automatically assign assets to scenes in order",
                "Click on a scene to manually assign or swap its media asset",
                "Scenes without assigned media will show a placeholder",
                "You can reassign assets later from the Studio's Scene Sequence Editor"
              ]}
            />
          </div>
        </section>

        {/* Step 5 - Studio */}
        <section className="mb-24">
          <SectionHeader
            step="Step 5"
            title="The Studio"
            subtitle="This is where the magic happens. Fine-tune every aspect of your trailer before exporting."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureBlock
              icon={<Sparkles size={20} />}
              title="Text Effects"
              desc="Choose from 13 different text animation styles that play when each scene appears."
              tips={[
                "Stagger Reveal — letters appear one by one, great for impact",
                "Cascade Fall — text drops in from above with depth",
                "3D Roll — cinematic barrel-roll entrance",
                "Typewriter — classic character-by-character typing",
                "Use 'Apply All' to set the same effect across every scene"
              ]}
            />
            <FeatureBlock
              icon={<Film size={20} />}
              title="Scene Types"
              desc="Transform any scene into a social media card overlay for visual variety."
              tips={[
                "Standard — your media with text overlay",
                "Instagram Follow, X Post, Reddit Card — social proof cards",
                "Spotify Now Playing — music-themed card overlay",
                "Terminal Console — hacker/dev aesthetic",
                "Browser URL — shows a URL bar overlay on the scene"
              ]}
            />
            <FeatureBlock
              icon={<Clock size={20} />}
              title="Scene Duration"
              desc="Control exactly how long each individual scene plays during the trailer."
              tips={[
                "The global 'Scene Pacing' slider sets the default for all scenes",
                "Override per-scene in the Scene Sequence Editor (clock icon + seconds input)",
                "Range: 1 to 30 seconds per scene, in 0.5 second increments",
                "Text-heavy scenes automatically get extra time for the animation to finish",
                "The recording respects per-scene durations too"
              ]}
            />
            <FeatureBlock
              icon={<Video size={20} />}
              title="Background Videos"
              desc="Add cinematic video backgrounds that play behind your scenes."
              tips={[
                "Search Pixabay for free stock videos (nature, abstract, business, etc.)",
                "Upload your own video files as backgrounds",
                "Import videos directly from X/Twitter — just paste the tweet URL",
                "Videos cycle per scene (scene 1 → video 1, scene 2 → video 2, wraps around)",
                "Assign a specific video to a specific scene in the Scene Sequence Editor",
                "Toggle 'Audio On' to play the video's original audio track"
              ]}
            />
            <FeatureBlock
              icon={<Music size={20} />}
              title="Music & Audio"
              desc="Add a background music track that plays during the entire trailer."
              tips={[
                "Upload an MP3 or audio file as your background track",
                "Music restarts from the beginning when the trailer loops",
                "The audio is included in the final exported video",
                "Keep the track short — match it to your total trailer duration"
              ]}
            />
            <FeatureBlock
              icon={<Monitor size={20} />}
              title="Fonts & Styling"
              desc="Choose from 20+ fonts and customize colors to match your brand."
              tips={[
                "Outfit is the default modern sans-serif — great for tech products",
                "Serif fonts (Cormorant) work well for luxury/editorial vibes",
                "Mono fonts (JetBrains Mono) suit developer-focused trailers",
                "Display fonts (Syne, Unbounded) create bold, attention-grabbing headlines",
                "Set text color to match your brand — or use the AI-extracted color"
              ]}
            />
          </div>
        </section>

        {/* Scene Types Deep Dive */}
        <section className="mb-24">
          <SectionHeader 
            title="Scene Types" 
            subtitle="Each scene can be styled as a social media card or interface element. Here's every type available:"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <SceneTypeCard icon={<Film size={16} />} title="Standard" desc="Classic media + text overlay. The default for most scenes." />
            <SceneTypeCard icon={<ImageIcon size={16} />} title="Asset Only" desc="Full-screen media with no text. Good for screenshots." />
            <SceneTypeCard icon={<Instagram size={16} />} title="Instagram Follow" desc="Styled as an Instagram follow notification card." />
            <SceneTypeCard icon={<Twitter size={16} />} title="X / Twitter Post" desc="Looks like a tweet card with your text as the post." />
            <SceneTypeCard icon={<MessageSquare size={16} />} title="Reddit Card" desc="Styled as a Reddit post with upvotes and comments." />
            <SceneTypeCard icon={<Music size={16} />} title="Spotify Card" desc="Now Playing music card with album art styling." />
            <SceneTypeCard icon={<Bell size={16} />} title="macOS Notification" desc="Native macOS push notification style card." />
            <SceneTypeCard icon={<TrendingUp size={16} />} title="Data Chart" desc="Dynamic animated chart/graph visualization." />
            <SceneTypeCard icon={<Zap size={16} />} title="3D Coin Flip" desc="Animated 3D coin flip reveal card." />
            <SceneTypeCard icon={<Search size={16} />} title="Search Bar" desc="Browser-style search bar with typed query." />
            <SceneTypeCard icon={<Terminal size={16} />} title="Terminal Console" desc="Hacker-aesthetic terminal with typed commands." />
            <SceneTypeCard icon={<Globe size={16} />} title="Browser URL" desc="Browser address bar overlay showing a URL." />
          </div>
        </section>

        {/* Export & Playback */}
        <section className="mb-24">
          <SectionHeader 
            title="Preview & Export" 
            subtitle="Play your trailer in real-time, then export as a video file."
          />
          <div className="space-y-6">
            <FeatureBlock
              icon={<Play size={20} />}
              title="Live Preview"
              desc="Hit Play to see your trailer in real-time with all effects, transitions, and background videos."
              tips={[
                "The preview plays in fullscreen with your background videos and audio",
                "Scenes advance automatically based on their individual durations",
                "Move your mouse to the top of the screen to reveal the header controls",
                "Use the Studio button to go back and adjust settings without losing progress",
                "The camera has subtle parallax motion — drag to adjust the viewing angle"
              ]}
            />
            <FeatureBlock
              icon={<Video size={20} />}
              title="Export"
              desc="Record your trailer as a WebM video file that you can download and share."
              tips={[
                "Click Export in the header to start recording",
                "The recording captures everything on screen at full resolution",
                "Export costs credits — check your balance before exporting",
                "Exported videos are saved to your profile for later download",
                "For best quality, ensure your browser window is at 1080p or higher"
              ]}
            />
          </div>
        </section>

        {/* Pro Tips */}
        <section className="mb-24">
          <SectionHeader 
            title="Pro Tips" 
            subtitle="Get the most out of VibeTrailer with these power-user tips."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TipCard 
              icon={<Wand2 size={18} />} 
              title="Let AI Draft First" 
              desc="Start with an AI scrape, then refine the script manually. It's faster than writing from scratch."
            />
            <TipCard 
              icon={<Layers size={18} />} 
              title="Mix Scene Types" 
              desc="Don't use all Standard scenes. Sprinkle in Instagram, Twitter, and Terminal cards for visual variety."
            />
            <TipCard 
              icon={<Clock size={18} />} 
              title="Vary Scene Timing" 
              desc="Short scenes (2-3s) build energy. Longer scenes (5-8s) create dramatic pauses. Mix them."
            />
            <TipCard 
              icon={<Video size={18} />} 
              title="Use Video Backgrounds" 
              desc="Even a single abstract video background dramatically improves production value."
            />
            <TipCard 
              icon={<Music size={18} />} 
              title="Music Makes It" 
              desc="A cinematic music track turns a good trailer into a great one. Use royalty-free tracks."
            />
            <TipCard 
              icon={<Type size={18} />} 
              title="Less Text = More Impact" 
              desc="3-5 words per scene. Let the visuals breathe. Nobody reads paragraphs in a trailer."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 border-t border-black/5">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Ready?</h2>
          <p className="text-ink/50 text-lg mb-8">You've read the guide. Now go make something cinematic.</p>
          <button onClick={onStart} className="btn-primary px-10 py-5 text-sm flex items-center gap-3 mx-auto">
            Start Creating <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}
