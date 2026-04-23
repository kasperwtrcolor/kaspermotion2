import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, ExternalLink, Share2, Eye, Zap, ChevronRight } from 'lucide-react';

interface SharePageProps {
  videoId: string;
  onGoHome: () => void;
}

interface VideoData {
  videoId: string;
  title: string;
  url: string;
  status: string;
  views: number;
  createdAt: any;
}

export default function SharePage({ videoId, onGoHome }: SharePageProps) {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (!res.ok) throw new Error('Video not found');
        const data = await res.json();
        setVideo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">Video Not Found</h1>
          <p className="text-white/40 mb-8">This video may have been removed or the link is invalid.</p>
          <button onClick={onGoHome} className="elite-button px-8 py-4 rounded-xl font-bold">
            Go to VibeTrailer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] bg-dot-grid text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded bg-indigo-500 shadow-lg shadow-indigo-500/40" />
            <span className="font-display font-bold text-lg tracking-tighter group-hover:text-indigo-400 transition-colors">vibetrailer</span>
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold"
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button 
              onClick={onGoHome}
              className="elite-button px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              Create Yours <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-3">
              {video.title}
            </h1>
            <div className="flex items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Eye size={14} />
                {video.views} views
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Made with VibeTrailer
              </span>
            </div>
          </div>

          {/* Player */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <div className="aspect-video bg-black relative">
              <video
                src={video.url}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm mb-6 uppercase font-bold tracking-widest">
              Want to create cinematic trailers like this?
            </p>
            <button 
              onClick={onGoHome}
              className="elite-button group px-10 py-5 text-xl rounded-full font-bold inline-flex items-center gap-3"
            >
              <Zap size={24} fill="white" />
              Start Creating Free
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} VibeTrailer. Elite Cinematic Output.
          </p>
        </div>
      </footer>
    </div>
  );
}
