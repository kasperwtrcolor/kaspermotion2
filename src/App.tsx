import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform } from 'motion/react';
import { Upload, Video, X, AlertCircle, Play, FileText, Image as ImageIcon, ArrowRight, CheckCircle2, Link as LinkIcon, Loader2, LogOut, User as UserIcon, Save, History, Trash2, Sparkles, Wand2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { GoogleGenAI } from "@google/genai";
import { GiphyFetch } from '@giphy/js-fetch-api';
import LandingPage from './components/LandingPage';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'dummy_key_to_prevent_crash');

type TextPosition = 'bottom' | 'top' | 'center' | 'left' | 'right' | 'random';
type FontStyle = 'font-sans' | 'font-serif' | 'font-mono' | 'font-display';
type BackgroundStyle = 'black' | 'gradient-blue' | 'gradient-purple' | 'grid' | 'vibrant-glow' | 'particles' | 'parallax';
type TextEffect = 'gsap-split' | 'typewriter' | 'fade' | 'kinetic';
type TransitionType = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'explode' | 'spin' | 'expand' | 'contract';

type LibraryAsset = {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  createdAt: any;
};

type MediaItem = {
  id: string;
  file?: File;
  url?: string;
  type: 'image' | 'video';
  name: string;
};

type Composition = {
  id: string;
  media: {
    file?: File;
    url: string;
    type: 'image' | 'video';
    name: string;
    xOffset?: number;
    yOffset?: number;
    scale?: number;
  }[];
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  angle: number;
  caption: string;
  textPosition: Exclude<TextPosition, 'random'>;
  sceneType: 'standard' | 'text-morph' | 'grid' | 'split';
  textEffect: TextEffect;
  transitionType: TransitionType;
  transitionDuration: number;
  isTextOnly?: boolean;
  preset?: string;
  backgroundStyle?: string;
  giphyStickerUrl?: string;
  stickerScale?: number;
  stickerX?: number;
  stickerY?: number;
};

const generateComposition = (
  items: MediaItem[],
  index: number,
  caption: string,
  preferredPosition: TextPosition,
  preferredEffect: TextEffect,
  preferredTransition: TransitionType,
  preferredDuration: number,
  prevComp?: Composition,
  isTextOnly?: boolean,
  preset?: string,
  backgroundStyle?: string,
  giphyStickerUrl?: string
): Composition => {
  // Determine scene type
  let sceneType: Composition['sceneType'] = 'standard';
  if (items.length > 1) {
    sceneType = Math.random() > 0.5 ? 'grid' : 'split';
  } else if (caption && Math.random() > 0.4) {
    sceneType = 'text-morph';
  }
  
  const angle = prevComp ? prevComp.angle + (Math.random() * 1.5 - 0.75) : 0;
  const distance = 2000;

  const x = prevComp ? prevComp.x + Math.cos(angle) * distance : 0;
  const y = prevComp ? prevComp.y + Math.sin(angle) * distance : 0;
  const z = 0;

  const positions: Exclude<TextPosition, 'random'>[] = ['bottom', 'top', 'center', 'left', 'right'];
  const textPosition = preferredPosition === 'random' 
    ? positions[Math.floor(Math.random() * positions.length)]
    : preferredPosition as Exclude<TextPosition, 'random'>;

  // Process media items with offsets for multi-image scenes
  const processedMedia = items.map((item, i) => {
    let xOffset = 0;
    let yOffset = 0;
    let scale = 1;

    if (sceneType === 'grid') {
      xOffset = (i % 2 === 0 ? -400 : 400);
      yOffset = (i < 2 ? -300 : 300);
      scale = 0.8;
    } else if (sceneType === 'split') {
      xOffset = i === 0 ? -450 : 450;
      scale = 0.9;
    }

    return {
      file: item.file,
      url: item.url || "",
      type: item.type,
      name: item.name,
      xOffset,
      yOffset,
      scale
    };
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    media: processedMedia,
    x, y, z,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    angle,
    caption,
    textPosition,
    sceneType,
    textEffect: preferredEffect,
    transitionType: preferredTransition,
    transitionDuration: preferredDuration,
    isTextOnly,
    preset,
    backgroundStyle,
    giphyStickerUrl
  };
};

const getWordStyle = (word: string, index: number) => {
  const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
  const hash = cleanWord.length + index;
  
  // AE Color Palette: Cyberpunk / Modern Tech
  if (hash % 7 === 0) return { backgroundColor: '#FF2A6D', color: '#FFFFFF', padding: '0.1em 0.2em', borderRadius: '0.15em', display: 'inline-block', transform: 'rotate(-2deg)' };
  if (hash % 5 === 0) return { color: '#05D9E8', textShadow: '0 0 10px rgba(5,217,232,0.5)' };
  if (hash % 11 === 0) return { color: '#FFC200', textShadow: '0 0 10px rgba(255,194,0,0.5)' };
  if (hash % 13 === 0) return { backgroundColor: '#01FFC3', color: '#000000', padding: '0.1em 0.2em', borderRadius: '0.15em', display: 'inline-block', transform: 'rotate(1deg)' };
  
  return {};
};

const SplitText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={getWordStyle(word, i)}>
          {word.split('').map((char, j) => (
            <motion.span
              key={j}
              initial={{ opacity: 0, y: 50, rotateY: 90, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              transition={{
                delay: i * 0.1 + j * 0.03,
                type: 'spring',
                damping: 15,
                stiffness: 300
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </div>
  );
};

const TypewriterText = ({ text, className = "" }: { text: string, className?: string }) => {
  const characters = text.split('');
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.1 }}
          style={getWordStyle(char, i)}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-1 h-8 bg-white ml-1"
      />
    </div>
  );
};

const FadeText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.1, duration: 0.8 }}
          style={getWordStyle(word, i)}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const KineticText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-4 gap-y-2 ${className}`}>
      {words.map((word, i) => (
        <div key={i} className="overflow-hidden pb-2">
          <motion.div
            initial={{ y: '100%', opacity: 0, rotateX: -80, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
            transition={{ 
              delay: i * 0.1, 
              type: 'spring', 
              damping: 12, 
              stiffness: 200,
              mass: 0.8
            }}
            className="inline-block origin-bottom font-black uppercase tracking-tighter"
            style={getWordStyle(word, i)}
          >
            {word}
          </motion.div>
        </div>
      ))}
    </div>
  );
};

const AnimatedCaption = ({ text, effect, className }: { text: string, effect: TextEffect, className?: string }) => {
  switch (effect) {
    case 'typewriter': return <TypewriterText text={text} className={className} />;
    case 'fade': return <FadeText text={text} className={className} />;
    case 'kinetic': return <KineticText text={text} className={className} />;
    default: return <SplitText text={text} className={className} />;
  }
};

const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 15000,
      y: (Math.random() - 0.5) * 10000,
      z: (Math.random() - 0.5) * 20000,
      size: Math.random() * 15 + 5,
      color: ['bg-white', 'bg-blue-300', 'bg-green-300', 'bg-yellow-300'][Math.floor(Math.random() * 4)],
      duration: Math.random() * 30 + 30
    })));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className={`absolute rounded-sm ${p.color} shadow-[0_0_15px_rgba(255,255,255,0.4)]`}
          style={{
            width: p.size,
            height: p.size,
            left: '50%',
            top: '50%',
            x: p.x,
            y: p.y,
            z: p.z,
            rotateZ: 45,
            transformStyle: 'preserve-3d'
          }}
          animate={{
            z: [p.z, p.z + 5000, p.z],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const MediaThumbnail = ({ item }: { item: MediaItem }) => {
  const url = item.url;

  if (!url) return <div className="w-full h-full bg-brutal-bg brutal-border animate-pulse" />;

  return item.type === 'video' ? (
    <video src={url} className="w-full h-full object-cover opacity-70" muted />
  ) : (
    <img src={url} className="w-full h-full object-cover opacity-70" alt="thumbnail" />
  );
};

const ParallaxBackground = ({ worldX, worldY }: { worldX: any, worldY: any }) => {
  const bgX1 = useTransform(worldX, v => Number(v) * 0.1);
  const bgY1 = useTransform(worldY, v => Number(v) * 0.1);
  const bgX2 = useTransform(worldX, v => Number(v) * 0.2);
  const bgY2 = useTransform(worldY, v => Number(v) * 0.2);
  const bgX3 = useTransform(worldX, v => Number(v) * 0.3);
  const bgY3 = useTransform(worldY, v => Number(v) * 0.3);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-1]">
      <motion.div 
        className="absolute inset-[-50%] bg-[url('https://picsum.photos/seed/stars/1920/1080')] bg-repeat opacity-20 mix-blend-screen"
        style={{ x: bgX1, y: bgY1, backgroundSize: '500px 500px' }}
      />
      <motion.div 
        className="absolute inset-[-50%] bg-[url('https://picsum.photos/seed/nebula/1920/1080')] bg-repeat opacity-30 mix-blend-screen"
        style={{ x: bgX2, y: bgY2, backgroundSize: '800px 800px' }}
      />
      <motion.div 
        className="absolute inset-[-50%] bg-[url('https://picsum.photos/seed/dust/1920/1080')] bg-repeat opacity-40 mix-blend-screen"
        style={{ x: bgX3, y: bgY3, backgroundSize: '1200px 1200px' }}
      />
    </div>
  );
};

const ParticleTrails = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-tr from-white to-blue-400 blur-[1px]"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 1000,
            y: (Math.random() - 0.5) * 1000,
            z: (Math.random() - 0.5) * 500,
            opacity: [0, 1, 0],
            scale: [0, Math.random() * 2 + 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 2
          }}
          style={{ transformStyle: 'preserve-3d' }}
        />
      ))}
    </div>
  );
};

const CartoonShapes = ({ status }: { status: 'past' | 'active' | 'future' }) => {
  if (status !== 'active') return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
      {/* Existing Shape 1 */}
      <motion.div
        className="absolute -top-32 -left-32 w-24 h-24 rounded-3xl bg-brutal-pink brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        initial={{ x: -800, y: -500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [-800, 0, 150, 800],
          y: [-500, 0, -150, -500],
          rotateX: [0, 360, 720],
          rotateY: [0, 360, 720],
          rotateZ: [0, 180, 360],
          scale: [0, 1.5, 1, 0],
        }}
        transition={{ duration: 4.5, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      {/* Existing Shape 2 */}
      <motion.div
        className="absolute -bottom-32 -right-32 w-20 h-20 rounded-full bg-brutal-blue brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        initial={{ x: 800, y: 500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [800, 0, -100, -800],
          y: [500, 0, 100, 500],
          rotateX: [0, -360, -720],
          rotateY: [0, -360, -720],
          rotateZ: [0, -180, -360],
          scale: [0, 1.2, 1, 0],
        }}
        transition={{ duration: 4.5, times: [0, 0.4, 0.8, 1], ease: "easeInOut", delay: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      {/* New Shape 1: Triangle */}
      <motion.div
        className="absolute top-1/4 -right-20 w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[69.3px] border-b-brutal-green drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]"
        initial={{ x: 800, y: -200, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [800, -100, -300, -800],
          y: [-200, 100, 200, -200],
          rotateX: [0, 180, 360],
          rotateY: [0, 360, 720],
          rotateZ: [0, -90, -180],
          scale: [0, 1.3, 1, 0],
        }}
        transition={{ duration: 5, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.2 }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      {/* New Shape 2: Star */}
      <motion.div
        className="absolute bottom-1/4 -left-20 text-6xl drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-orange"
        initial={{ x: -800, y: 200, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [-800, 100, 300, 800],
          y: [200, -100, -200, 200],
          rotateX: [0, -180, -360],
          rotateY: [0, -360, -720],
          rotateZ: [0, 180, 360],
          scale: [0, 1.4, 1, 0],
        }}
        transition={{ duration: 5.5, times: [0, 0.35, 0.75, 1], ease: "easeInOut", delay: 0.7 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        ★
      </motion.div>
      {/* New Shape 3: Pill */}
      <motion.div
        className="absolute top-1/2 -left-32 w-32 h-12 rounded-full bg-brutal-purple brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        initial={{ x: -800, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [-800, 200, 400, 1000],
          y: [0, -150, 150, 0],
          rotateX: [0, 360, 720],
          rotateY: [0, 180, 360],
          rotateZ: [0, 45, 90],
          scale: [0, 1.1, 1.1, 0],
        }}
        transition={{ duration: 6, times: [0, 0.4, 0.8, 1], ease: "easeInOut", delay: 0.3 }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      {/* New Shape 4: Cross */}
      <motion.div
        className="absolute bottom-1/2 -right-32 text-7xl font-bold drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-blue"
        initial={{ x: 800, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [800, -200, -400, -1000],
          y: [0, 150, -150, 0],
          rotateX: [0, -360, -720],
          rotateY: [0, -180, -360],
          rotateZ: [0, -45, -90],
          scale: [0, 1.2, 1.2, 0],
        }}
        transition={{ duration: 6.5, times: [0, 0.4, 0.8, 1], ease: "easeInOut", delay: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        +
      </motion.div>
      {/* New Shape 5: ZigZag */}
      <motion.div
        className="absolute top-10 right-1/4 text-6xl font-bold drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white"
        initial={{ x: 0, y: -500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [0, 100, -100, 0],
          y: [-500, 200, 400, 800],
          rotateX: [0, 180, 360],
          rotateY: [0, 360, 720],
          rotateZ: [0, 90, 180],
          scale: [0, 1.5, 1.5, 0],
        }}
        transition={{ duration: 5.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.4 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        ~
      </motion.div>
    </div>
  );
};

const MobileMockup = ({ children, status }: { children: React.ReactNode, status: string }) => {
  return (
    <motion.div
      initial={{ rotateY: -20, rotateX: 10, scale: 0.8 }}
      animate={status === 'active' ? { 
        rotateY: [-20, 20, -20], 
        rotateX: [10, -5, 10], 
        scale: [0.8, 1.1, 0.8] 
      } : { rotateY: -20, rotateX: 10, scale: 0.8 }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-[280px] h-[580px] md:w-[320px] md:h-[650px] bg-white brutal-border shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black z-20 flex items-center justify-between px-2 brutal-border">
        <div className="w-2 h-2 bg-white brutal-border"></div>
        <div className="w-2 h-2 bg-brutal-green brutal-border"></div>
      </div>
      {/* Screen Content */}
      <div className="w-full h-full bg-brutal-bg relative overflow-hidden flex items-center justify-center">
        {children}
      </div>
      {/* Glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none z-30"></div>
    </motion.div>
  );
};

const PopCulture3DIcon = ({ type, status }: { type: string, status: string }) => {
  let emojis = ['✨', '🌟', '💫'];
  if (type === 'black') emojis = ['🍿', '🎬', '🎥', '🎞️', '🎟️', '🎭'];
  if (type === 'vibrant-glow') emojis = ['🎵', '🎶', '🎧', '🎸', '🎹', '🥁'];
  if (type === 'grid') emojis = ['🚀', '💻', '📱', '🕹️', '💾', '🔋'];
  if (type === 'particles') emojis = ['🌍', '🪐', '☄️', '🌌', '🛸', '🛰️'];
  if (type === 'parallax') emojis = ['🏔️', '🌲', '🏕️', '🗺️', '🧭', '🦅'];
  
  // Create 3D shadow effect
  const depth = 30;
  const shadows = Array.from({length: depth}).map((_, i) => `${i}px ${i}px 0px rgba(0,0,0,${0.8 - (i * 0.02)})`).join(',');

  return (
    <>
      {emojis.map((emoji, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0, rotateY: -180, y: 100 }}
          animate={status === 'active' ? { 
            scale: [0, 1.2, 1], 
            rotateY: [-180, 0, 20, -20, 0],
            y: [100, -20, 0, -10, 0]
          } : { scale: 0, rotateY: 180, y: 100 }}
          transition={{ duration: 8, ease: "easeOut", delay: index * 0.5 }}
          className="absolute z-0 flex items-center justify-center opacity-40"
          style={{ 
            transformStyle: 'preserve-3d',
            left: `${(index % 3) * 30 + 10}%`,
            top: `${Math.floor(index / 3) * 40 + 10}%`
          }}
        >
          <div style={{ fontSize: '10rem', textShadow: shadows, filter: 'drop-shadow(0 0 50px rgba(255,255,255,0.2))' }}>
            {emoji}
          </div>
        </motion.div>
      ))}
    </>
  );
};

const CinematicOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>
        {`
          @keyframes film-grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -10%); }
            30% { transform: translate(7%, -15%); }
            50% { transform: translate(-15%, 10%); }
            70% { transform: translate(10%, 15%); }
            90% { transform: translate(-10%, 5%); }
          }
        `}
      </style>
      {/* Film Grain */}
      <div 
        className="absolute opacity-[0.15] mix-blend-overlay pointer-events-none" 
        style={{ 
          top: '-50%', left: '-50%', width: '200%', height: '200%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          animation: 'film-grain 8s steps(10) infinite'
        }}
      ></div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.8)_120%)] mix-blend-multiply pointer-events-none"></div>
    </div>
  );
};

const CompositionNode = ({ comp, status }: { key?: string; comp: Composition; status: 'past' | 'active' | 'future' }) => {
  const isMorph = comp.sceneType === 'text-morph';
  const isMulti = comp.sceneType === 'grid' || comp.sceneType === 'split';
  const duration = comp.transitionDuration;
  const [hasError, setHasError] = useState(false);

  const getTransitionVariants = (type: TransitionType) => {
    const baseTransition = { duration, ease: [0.16, 1, 0.3, 1] };
    
    switch (type) {
      case 'slide':
        return {
          future: { x: 1000, opacity: 0, transition: baseTransition },
          active: { x: 0, opacity: 1, transition: baseTransition },
          past: { x: -1000, opacity: 0, transition: baseTransition }
        };
      case 'zoom':
        return {
          future: { scale: 0, opacity: 0, transition: baseTransition },
          active: { scale: 1, opacity: 1, transition: baseTransition },
          past: { scale: 5, opacity: 0, transition: baseTransition }
        };
      case 'dissolve':
        return {
          future: { opacity: 0, filter: 'blur(40px)', transition: baseTransition },
          active: { opacity: 1, filter: 'blur(0px)', transition: baseTransition },
          past: { opacity: 0, filter: 'blur(40px)', transition: baseTransition }
        };
      case 'explode':
        return {
          future: { scale: 0, opacity: 0, transition: baseTransition },
          active: { scale: 1, opacity: 1, transition: baseTransition },
          past: { scale: 10, opacity: 0, filter: 'blur(60px)', transition: baseTransition }
        };
      case 'spin':
        return {
          future: { rotateZ: 180, opacity: 0, scale: 0.5, transition: baseTransition },
          active: { rotateZ: 0, opacity: 1, scale: 1, transition: baseTransition },
          past: { rotateZ: -180, opacity: 0, scale: 0.5, transition: baseTransition }
        };
      case 'expand':
        return {
          future: { scale: 0.8, opacity: 0, transition: baseTransition },
          active: { scale: 1, opacity: 1, transition: baseTransition },
          past: { scale: 1.2, opacity: 0, transition: baseTransition }
        };
      case 'contract':
        return {
          future: { scale: 1.2, opacity: 0, transition: baseTransition },
          active: { scale: 1, opacity: 1, transition: baseTransition },
          past: { scale: 0.8, opacity: 0, transition: baseTransition }
        };
      case 'fade':
      default:
        return {
          future: { opacity: 0, transition: baseTransition },
          active: { opacity: 1, transition: baseTransition },
          past: { opacity: 0, transition: baseTransition }
        };
    }
  };

  const transitionVariants = getTransitionVariants(comp.transitionType);

  // 3D Spin, Dissolve, and Morphing Effects
  const mediaVariants = {
    future: transitionVariants.future,
    active: isMorph ? {
      opacity: [0, 1, 1],
      scale: [0.9, 1, 1],
      rotateY: 0, 
      rotateX: 0,
      filter: ['blur(20px)', 'blur(10px)', 'blur(0px)'],
      transition: { times: [0, 0.3, 1], duration: 4, ease: 'easeOut' }
    } : { 
      ...transitionVariants.active,
      rotateY: 0, 
      rotateX: 0,
      transition: { 
        filter: { duration: 0.4 },
        default: { type: 'spring', damping: 15, stiffness: 100, mass: 1, delay: 0.1 }
      }
    },
    past: {
      ...transitionVariants.past,
      rotateZ: 360,
      scale: 0,
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  const textMorphVariants = {
    future: { opacity: 0, scale: 0.5, z: 200 },
    active: {
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1, 1.1, 5],
      z: [200, 200, 200, 800],
      filter: ['blur(20px)', 'blur(0px)', 'blur(0px)', 'blur(40px)'],
      transition: { times: [0, 0.15, 0.6, 1], duration: 4, ease: 'easeInOut' }
    },
    past: { opacity: 0 }
  };

  const mediaClass = "max-w-[85vw] max-h-[75vh] w-auto h-auto block object-contain brutal-border bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]";
  const multiMediaClass = "max-w-[40vw] max-h-[40vh] w-auto h-auto block object-contain brutal-border bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate3d(${comp.x}px, ${comp.y}px, ${comp.z}px) rotateX(${comp.rotX}deg) rotateY(${comp.rotY}deg) rotateZ(${comp.rotZ}deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        
        {isMorph && status === 'active' && (
          <motion.div
            className="absolute z-20 w-[80vw] text-center pointer-events-none"
            variants={textMorphVariants}
            initial="future"
            animate="active"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <AnimatedCaption text={comp.caption} effect={comp.textEffect} className="text-5xl md:text-7xl font-bold tracking-tight text-black drop-shadow-2xl" />
          </motion.div>
        )}

        {comp.media.length > 0 && (
          <>
            <CartoonShapes status={status} />
          </>
        )}

        {comp.isTextOnly && comp.backgroundStyle && (
          <PopCulture3DIcon type={comp.backgroundStyle} status={status} />
        )}

        {comp.giphyStickerUrl && (
          <motion.img
            src={comp.giphyStickerUrl}
            className="absolute z-50 w-64 h-64 md:w-96 md:h-96 object-contain pointer-events-none drop-shadow-2xl"
            initial={{ scale: 0, opacity: 0, y: 100, x: 0, z: 300, rotateZ: -15 }}
            animate={status === 'active' ? { 
              scale: comp.stickerScale ?? 1, 
              opacity: 1, 
              y: comp.stickerY ?? 0, 
              x: comp.stickerX ?? 0,
              z: 300, 
              rotateZ: 0 
            } : { 
              scale: 0, 
              opacity: 0, 
              y: (comp.stickerY ?? 0) + 100, 
              x: comp.stickerX ?? 0,
              z: 300, 
              rotateZ: -15 
            }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: status === 'active' ? 0.5 : 0 }}
            style={{ transformStyle: 'preserve-3d' }}
          />
        )}

        {comp.media.map((m, i) => {
          const mediaElement = m.url && (
            m.type === 'video' ? (
              <motion.video
                src={m.url}
                autoPlay
                loop
                muted
                playsInline
                className={isMulti ? multiMediaClass : mediaClass}
                onError={() => setHasError(true)}
                animate={status === 'active' ? {
                  scale: [1, 1.05],
                  x: [0, (comp.caption.length + i) % 2 === 0 ? 15 : -15],
                  y: [0, (comp.caption.length + i) % 3 === 0 ? 15 : -15]
                } : { scale: 1, x: 0, y: 0 }}
                transition={{ duration: 10, ease: "linear" }}
              />
            ) : (
              <motion.img
                src={m.url}
                alt={comp.caption}
                className={isMulti ? multiMediaClass : mediaClass}
                onError={() => setHasError(true)}
                animate={status === 'active' ? {
                  scale: [1, 1.05],
                  x: [0, (comp.caption.length + i) % 2 === 0 ? 15 : -15],
                  y: [0, (comp.caption.length + i) % 3 === 0 ? 15 : -15]
                } : { scale: 1, x: 0, y: 0 }}
                transition={{ duration: 10, ease: "linear" }}
              />
            )
          );

          return (
            <motion.div
              key={i}
              className="absolute z-10"
              variants={mediaVariants}
              initial="future"
              animate={status}
              style={{ 
                transformStyle: 'preserve-3d',
                x: m.xOffset || 0,
                y: m.yOffset || 0,
                scale: m.scale || 1
              }}
            >
              {hasError ? (
                <div className={`${isMulti ? multiMediaClass : mediaClass} flex flex-col items-center justify-center gap-4 bg-brutal-pink brutal-border`}>
                  <AlertCircle size={isMulti ? 24 : 48} className="text-black" />
                  <p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">Error</p>
                </div>
              ) : (
                comp.preset === 'app-showcase' ? (
                  <MobileMockup status={status}>
                    {mediaElement}
                  </MobileMockup>
                ) : (
                  mediaElement
                )
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userTrailers, setUserTrailers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("https://");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRenderingTrailer, setIsRenderingTrailer] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [textOnlyLines, setTextOnlyLines] = useState<Set<number>>(new Set());
  const [mediaMapping, setMediaMapping] = useState<Record<number, string>>({});
  const [useGiphy, setUseGiphy] = useState(false);

  const [appMode, setAppMode] = useState<'landing' | 'setup' | 'playing'>('landing');
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptText, setScriptText] = useState("");

  const [scrapeUrl, setScrapeUrl] = useState("https://");
  const [isScraping, setIsScraping] = useState(false);
  
  const [fontStyle, setFontStyle] = useState<FontStyle>('font-sans');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('black');
  const [textEffect, setTextEffect] = useState<TextEffect>('gsap-split');
  const [preferredTextPosition, setPreferredTextPosition] = useState<TextPosition>('random');
  const [transitionType, setTransitionType] = useState<TransitionType>('zoom');
  const [transitionDuration, setTransitionDuration] = useState(1.2);
  const [preset, setPreset] = useState<'custom' | 'blockbuster' | 'documentary' | 'music-video' | 'app-showcase'>('custom');
  
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');

  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentComp = compositions[currentIndex];
  
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [isRecording, setIsRecording] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showGiphyModal, setShowGiphyModal] = useState(false);
  const [giphySearchQuery, setGiphySearchQuery] = useState('');
  const [giphySearchResults, setGiphySearchResults] = useState<any[]>([]);
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false);

  // Firebase Auth & Firestore Connection Test
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Test connection
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }

        // Sync user profile
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync user trailers
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'trailers'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUserTrailers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trailers');
      });

      const aq = query(collection(db, 'assets'), where('userId', '==', user.uid));
      const unsubscribeAssets = onSnapshot(aq, (snapshot) => {
        setLibraryAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryAsset)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'assets');
      });

      const checkAndRewardCredits = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const today = new Date().toISOString().split('T')[0];

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.lastRewardDate !== today) {
              const newCredits = (userData.credits || 0) + 10;
              await setDoc(userRef, { credits: newCredits, lastRewardDate: today }, { merge: true });
              setToastMessage("You received 10 daily credits!");
            }
          } else {
            await setDoc(userRef, { credits: 20, lastRewardDate: today }, { merge: true });
            setToastMessage("Welcome! You received 20 initial credits.");
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      };
      
      checkAndRewardCredits();

      const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setCredits(doc.data().credits || 0);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      return () => {
        unsubscribe();
        unsubscribeAssets();
        unsubscribeUser();
      };
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      return result.user;
    } catch (err) {
      setToastMessage("Login failed. Please try again.");
      return null;
    }
  };

  const handleLogout = () => signOut(auth);

  const uploadAssetToLibrary = async (file: File): Promise<{ url: string, uploaded: boolean }> => {
    if (!user) return { url: URL.createObjectURL(file), uploaded: false };
    try {
      const storageRef = ref(storage, `users/${user.uid}/media/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      
      // Add a timeout to the upload to prevent hanging on CORS/Permission errors
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out. This may be due to missing CORS configuration on your Firebase Storage bucket.")), 10000);
      });
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const url = await getDownloadURL(storageRef);
      
      await addDoc(collection(db, 'assets'), {
        userId: user.uid,
        url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        createdAt: serverTimestamp()
      });
      return { url, uploaded: true };
    } catch (err) {
      console.error("Upload failed", err);
      return { url: URL.createObjectURL(file), uploaded: false };
    }
  };

  const generateAIImage = async () => {
    if (!aiPrompt) return;
    if (credits < 1) {
      setToastMessage("Not enough credits. You need 1 credit to generate an image.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: aiPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Convert base64 to File
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], `ai_gen_${Date.now()}.png`, { type: "image/png" });
        
        const { url, uploaded } = await uploadAssetToLibrary(file);

        const newItem: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          file: uploaded ? undefined : file,
          url,
          type: 'image',
          name: file.name
        };
        
        setMediaFiles(prev => [...prev, newItem]);
        setAiPrompt("");
        
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { credits: credits - 1 }, { merge: true });
          setToastMessage("Image generated! 1 credit used.");
        } else {
          setToastMessage("Image generated locally.");
        }
      } else {
        setToastMessage("Failed to generate image. Try a different prompt.");
      }
    } catch (err) {
      console.error(err);
      setToastMessage("AI Generation error. Please try again.");
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const saveProject = async (isAutoSave = false) => {
    if (!user) {
      if (!isAutoSave) {
        setToastMessage("Please login to save your project.");
        setTimeout(() => setToastMessage(null), 3000);
      }
      return;
    }
    
    if (mediaFiles.length === 0) return;

    if (!isAutoSave) setIsSaving(true);
    try {
      let updatedMediaFiles = false;
      const newMediaFiles = [...mediaFiles];

      // 1. Upload media if they are local files and add to library
      const mediaData = await Promise.all(mediaFiles.map(async (item, i) => {
        const compForMedia = compositions.find(c => c.media.some(m => m.url === item.url));
        const giphyStickerUrl = compForMedia?.giphyStickerUrl;
        const stickerScale = compForMedia?.stickerScale;
        const stickerX = compForMedia?.stickerX;
        const stickerY = compForMedia?.stickerY;

        if (item.file) {
          try {
            const storageRef = ref(storage, `users/${user.uid}/media/${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
            
            const uploadPromise = uploadBytes(storageRef, item.file);
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Upload timed out.")), 10000);
            });
            
            await Promise.race([uploadPromise, timeoutPromise]);
            const url = await getDownloadURL(storageRef);
            
            // Add to library metadata
            await addDoc(collection(db, 'assets'), {
              userId: user.uid,
              url,
              type: item.type,
              name: item.name,
              createdAt: serverTimestamp()
            });

            newMediaFiles[i] = { ...item, url, file: undefined };
            updatedMediaFiles = true;

            return {
              url,
              type: item.type,
              name: item.name,
              caption: scriptText.split('\n')[i] || '',
              giphyStickerUrl,
              stickerScale,
              stickerX,
              stickerY
            };
          } catch (uploadErr) {
            console.error("File upload failed for:", item.name, uploadErr);
            // Fallback to current URL if upload fails (might be a blob but better than nothing)
            return {
              url: item.url,
              type: item.type,
              name: item.name,
              caption: scriptText.split('\n')[i] || '',
              giphyStickerUrl,
              stickerScale,
              stickerX,
              stickerY
            };
          }
        } else {
          return {
            url: item.url,
            type: item.type,
            name: item.name,
            caption: scriptText.split('\n')[i] || '',
            giphyStickerUrl,
            stickerScale,
            stickerX,
            stickerY
          };
        }
      }));

      if (updatedMediaFiles) {
        setMediaFiles(newMediaFiles);
      }

      // 2. Save the trailer project
      const trailerData: any = {
        userId: user.uid,
        name: `Trailer ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}${isAutoSave ? ' (Auto-saved)' : ''}`,
        script: scriptText,
        settings: {
          fontStyle,
          backgroundStyle,
          textEffect,
          transitionType,
          transitionDuration,
          preset,
          textOnlyLines: Array.from(textOnlyLines),
          mediaMapping,
          useGiphy
        },
        media: mediaData,
        updatedAt: serverTimestamp(),
        isAutoSave
      };

      if (currentProjectId) {
        await setDoc(doc(db, 'trailers', currentProjectId), trailerData, { merge: true });
        if (!isAutoSave) setToastMessage("Project saved successfully!");
      } else {
        trailerData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'trailers'), trailerData);
        setCurrentProjectId(docRef.id);
        if (!isAutoSave) setToastMessage("Project saved successfully!");
      }
    } catch (err) {
      console.error("Save project failed:", err);
      if (!isAutoSave) setToastMessage("Failed to save project. Check your connection.");
    } finally {
      if (!isAutoSave) setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const loadProject = (project: any) => {
    setCurrentProjectId(project.id);
    setScriptText(project.script);
    setFontStyle(project.settings.fontStyle);
    setBackgroundStyle(project.settings.backgroundStyle);
    setTextEffect(project.settings.textEffect);
    setTransitionType(project.settings.transitionType);
    setTransitionDuration(project.settings.transitionDuration);
    setTextOnlyLines(new Set(project.settings.textOnlyLines || []));
    setMediaMapping(project.settings.mediaMapping || {});
    setUseGiphy(project.settings.useGiphy || false);
    
    const loadedMedia: MediaItem[] = project.media.map((m: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: m.url,
      type: m.type,
      name: m.name
    }));
    setMediaFiles(loadedMedia);
    
    // We can't easily convert URLs back to File objects for the current setup
    // So we'll need to modify generateWorld to handle URLs directly
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;
    project.media.forEach((m: any, i: number) => {
      const isTextOnly = new Set(project.settings.textOnlyLines || []).has(i);
      const comp = generateCompositionFromData([m], i, project.settings.textEffect, project.settings.transitionType, project.settings.transitionDuration, prev, isTextOnly, project.settings.preset, project.settings.backgroundStyle, m.giphyStickerUrl, m.stickerScale, m.stickerX, m.stickerY);
      newComps.push(comp);
      prev = comp;
    });
    setCompositions(newComps);
    setAppMode('playing');
  };

  const handleGiphySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!giphySearchQuery.trim()) return;
    
    setIsSearchingGiphy(true);
    try {
      const { data } = await gf.search(giphySearchQuery, { type: 'stickers', limit: 20 });
      setGiphySearchResults(data || []);
    } catch (err) {
      console.error("Giphy search failed:", err);
      setToastMessage("Failed to search Giphy. Check your API key.");
    } finally {
      setIsSearchingGiphy(false);
    }
  };

  const applyStickerToCurrentScene = (url: string) => {
    setCompositions(prev => prev.map((comp, i) => {
      if (i === currentIndex) {
        return { ...comp, giphyStickerUrl: url, stickerScale: 1, stickerX: 0, stickerY: 0 };
      }
      return comp;
    }));
    setShowGiphyModal(false);
  };

  const updateCurrentStickerTransform = (scale: number, x: number, y: number) => {
    setCompositions(prev => prev.map((comp, i) => {
      if (i === currentIndex) {
        return { ...comp, stickerScale: scale, stickerX: x, stickerY: y };
      }
      return comp;
    }));
  };

  const handleStartOver = () => {
    setCurrentProjectId(null);
    setMediaFiles([]);
    setScriptText('');
    setTextOnlyLines(new Set());
    setCompositions([]);
    setAppMode('setup');
    setSetupStep(1);
    setToastMessage("Started over. Ready for a new project.");
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trailers', id));
      if (currentProjectId === id) {
        setCurrentProjectId(null);
      }
      setToastMessage("Project deleted.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `trailers/${id}`);
    }
  };

  const deleteLibraryAsset = async (e: React.MouseEvent, asset: LibraryAsset) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'assets', asset.id));
      try {
        const storageRef = ref(storage, asset.url);
        await deleteObject(storageRef);
      } catch (e) {
        console.error("Could not delete from storage", e);
      }
      setToastMessage("Asset deleted from library.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `assets/${asset.id}`);
    }
  };

  // Motion Blur & Camera Tracking
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const camZ = useMotionValue(0);
  
  // Interactive Offsets
  const userRotX = useMotionValue(0);
  const userRotY = useMotionValue(0);
  const userPanX = useMotionValue(0);
  const userPanY = useMotionValue(0);

  const smoothX = useSpring(camX, { damping: 30, stiffness: 100, mass: 1 });
  const smoothY = useSpring(camY, { damping: 30, stiffness: 100, mass: 1 });
  const smoothZ = useSpring(camZ, { damping: 30, stiffness: 100, mass: 1 });
  
  const smoothRotX = useSpring(userRotX, { damping: 50, stiffness: 150 });
  const smoothRotY = useSpring(userRotY, { damping: 50, stiffness: 150 });
  const smoothPanX = useSpring(userPanX, { damping: 50, stiffness: 150 });
  const smoothPanY = useSpring(userPanY, { damping: 50, stiffness: 150 });

  // AE-inspired "Wiggle" Expression for Camera
  const wiggleX = useMotionValue(0);
  const wiggleY = useMotionValue(0);

  useEffect(() => {
    if (appMode === 'playing') {
      const interval = setInterval(() => {
        wiggleX.set((Math.random() - 0.5) * 40);
        wiggleY.set((Math.random() - 0.5) * 40);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [appMode]);

  const smoothWiggleX = useSpring(wiggleX, { damping: 20, stiffness: 50 });
  const smoothWiggleY = useSpring(wiggleY, { damping: 20, stiffness: 50 });

  const velX = useVelocity(smoothX);
  const velY = useVelocity(smoothY);
  const velZ = useVelocity(smoothZ);

  const cameraFilter = useTransform([velX, velY, velZ], ([vx, vy, vz]) => {
    const speed = Math.sqrt(Math.pow(Number(vx), 2) + Math.pow(Number(vy), 2) + Math.pow(Number(vz), 2));
    const blurAmount = Math.min(speed / 120, 15); 
    const caAmount = Math.min(speed / 80, 8); // Chromatic aberration spread
    
    if (speed < 5) return `blur(0px)`;
    
    return `blur(${blurAmount}px) drop-shadow(${caAmount}px 0px 0px rgba(255,0,0,0.6)) drop-shadow(-${caAmount}px 0px 0px rgba(0,255,255,0.6))`;
  });

  const worldX = useTransform([smoothX, smoothPanX, smoothWiggleX], ([x, px, wx]) => Number(x) + Number(px) + Number(wx));
  const worldY = useTransform([smoothY, smoothPanY, smoothWiggleY], ([y, py, wy]) => Number(y) + Number(py) + Number(wy));
  const worldZ = smoothZ;

  const flareX1 = useTransform(worldX, v => Number(v) * -0.5);
  const flareY1 = useTransform(worldY, v => Number(v) * -0.5);
  const flareX2 = useTransform(worldX, v => Number(v) * 1.5);
  const flareY2 = useTransform(worldY, v => Number(v) * 1.5);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const sequenceActiveRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle camera movement
  useEffect(() => {
    if (appMode === 'playing' && currentComp) {
      // Force immediate update of motion values to trigger springs
      camX.set(windowSize.w / 2 - currentComp.x);
      camY.set(windowSize.h / 2 - currentComp.y);
      camZ.set(-currentComp.z);
    }
  }, [appMode, currentIndex, compositions, windowSize, camX, camY, camZ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    if (e.shiftKey) {
      // Pan
      userPanX.set(userPanX.get() + dx * 2);
      userPanY.set(userPanY.get() + dy * 2);
    } else {
      // Rotate
      userRotY.set(userRotY.get() + dx * 0.2);
      userRotX.set(userRotX.get() - dy * 0.2);
    }
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // --- ERROR HANDLING ---
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId: string | undefined;
      email: string | null | undefined;
      emailVerified: boolean | undefined;
      isAnonymous: boolean | undefined;
      tenantId: string | null | undefined;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  const resetCamera = () => {
    userRotX.set(0);
    userRotY.set(0);
    userPanX.set(0);
    userPanY.set(0);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (appMode === 'playing' && !isRecording && compositions.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < compositions.length - 1) return prev + 1;
          return 0; // Loop back to start for a better experience
        });
      }, 4500); 
      return () => clearInterval(timer);
    }
  }, [appMode, isRecording, compositions]); // Depend on compositions array itself

  // Auto-save logic (every 2 minutes)
  useEffect(() => {
    if (user && mediaFiles.length > 0) {
      const autoSaveTimer = setInterval(() => {
        console.log("Auto-saving project...");
        saveProject(true);
      }, 120000); // 2 minutes
      
      return () => clearInterval(autoSaveTimer);
    }
  }, [user, mediaFiles, scriptText, fontStyle, backgroundStyle, textEffect, transitionType, transitionDuration, preset, currentProjectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      setIsUploading(true);
      try {
        let anyFailed = false;
        const newItems: MediaItem[] = await Promise.all(files.map(async (file) => {
          const { url, uploaded } = await uploadAssetToLibrary(file);
          if (!uploaded) anyFailed = true;
          return {
            id: Math.random().toString(36).substr(2, 9),
            file: uploaded ? undefined : file,
            url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            name: file.name
          };
        }));
        setMediaFiles(prev => [...prev, ...newItems]);
        if (anyFailed) {
          setToastMessage("Assets added locally, but failed to save to cloud library (CORS/Permissions).");
        } else {
          setToastMessage("Assets uploaded and saved to library!");
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addFromLibrary = (assets: LibraryAsset[]) => {
    const newItems: MediaItem[] = assets.map(asset => ({
      id: Math.random().toString(36).substr(2, 9),
      url: asset.url,
      type: asset.type,
      name: asset.name
    }));
    setMediaFiles(prev => [...prev, ...newItems]);
    setToastMessage(`Added ${assets.length} asset${assets.length > 1 ? 's' : ''} from library!`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const toggleLibraryAssetSelection = (id: string) => {
    setSelectedLibraryAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleScriptChange = (newText: string) => {
    let newTextOnly = new Set(textOnlyLines);
    const lines = newText.split('\n');
    const cleanLines = lines.map((line, i) => {
      if (line.toUpperCase().includes('[TEXT]') || line.toUpperCase().includes('[TEXT ONLY]')) {
        newTextOnly.add(i);
        return line.replace(/\[TEXT ONLY\]/gi, '').replace(/\[TEXT\]/gi, '').trim();
      }
      return line;
    });
    setScriptText(cleanLines.join('\n'));
    setTextOnlyLines(newTextOnly);
  };

  const toggleTextOnly = (index: number) => {
    setTextOnlyLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  const handleGoToMapping = () => {
    const newMapping = { ...mediaMapping };
    const lines = scriptText.split('\n').filter(l => l.trim().length > 0);
    let mediaIdx = 0;
    
    lines.forEach((line, idx) => {
      if (!textOnlyLines.has(idx) && !newMapping[idx] && mediaIdx < mediaFiles.length) {
        newMapping[idx] = mediaFiles[mediaIdx].id;
        mediaIdx++;
      }
    });
    
    setMediaMapping(newMapping);
    setSetupStep(3);
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (data.script) {
        handleScriptChange(data.script);
        setToastMessage("Script generated successfully!");
      } else {
        setToastMessage(data.error || "Failed to generate script.");
      }
    } catch (err) {
      setToastMessage("Error connecting to scraper.");
    } finally {
      setIsScraping(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const applyPreset = (p: 'blockbuster' | 'documentary' | 'music-video' | 'app-showcase') => {
    setPreset(p);
    switch (p) {
      case 'blockbuster':
        setFontStyle('font-display');
        setBackgroundStyle('black');
        setTextEffect('gsap-split');
        setTransitionType('explode');
        setTransitionDuration(0.8);
        break;
      case 'documentary':
        setFontStyle('font-serif');
        setBackgroundStyle('grid');
        setTextEffect('fade');
        setTransitionType('dissolve');
        setTransitionDuration(2.0);
        break;
      case 'music-video':
        setFontStyle('font-mono');
        setBackgroundStyle('vibrant-glow');
        setTextEffect('kinetic');
        setTransitionType('spin');
        setTransitionDuration(0.6);
        break;
      case 'app-showcase':
        setFontStyle('font-sans');
        setBackgroundStyle('grid');
        setTextEffect('kinetic');
        setTransitionType('slide');
        setTransitionDuration(1.0);
        break;
    }
  };

  const generateWorld = async () => {
    if (mediaFiles.length === 0) {
      setToastMessage("Please add some media files first.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (credits < 5) {
      setToastMessage("Not enough credits. You need 5 credits to generate a trailer.");
      return;
    }

    setIsRenderingTrailer(true);
    setRenderProgress(0);
    
    const scriptLines = scriptText.split('\n').filter(line => line.trim() !== '');
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;

    for (let sceneIdx = 0; sceneIdx < scriptLines.length; sceneIdx++) {
      let caption = scriptLines[sceneIdx] || '';
      let isTextOnly = textOnlyLines.has(sceneIdx);
      
      let sceneItems: MediaItem[] = [];
      if (!isTextOnly) {
        const mappedMediaId = mediaMapping[sceneIdx];
        if (mappedMediaId) {
          const mediaItem = mediaFiles.find(m => m.id === mappedMediaId);
          if (mediaItem) {
            sceneItems = [mediaItem];
          } else {
            isTextOnly = true;
          }
        } else {
          isTextOnly = true;
        }
      }
      
      let giphyStickerUrl: string | undefined;
      if (useGiphy && caption) {
        try {
          const words = caption.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
          const searchTerms = words.slice(0, 2).join(' ');
          const fallbackTerm = words.sort((a, b) => b.length - a.length)[0] || 'wow';

          if (searchTerms || fallbackTerm) {
            let { data } = await gf.search(searchTerms || fallbackTerm, { type: 'stickers', limit: 1 });
            
            if (!data || data.length === 0) {
              const fallbackRes = await gf.search(fallbackTerm, { type: 'stickers', limit: 1 });
              data = fallbackRes.data;
            }

            if (data && data.length > 0) {
              giphyStickerUrl = data[0].images.original.url;
              console.log("Found Giphy sticker:", giphyStickerUrl);
            } else {
              console.log("No Giphy stickers found for:", searchTerms, "or", fallbackTerm);
            }
          }
        } catch (err: any) {
          console.error("Giphy fetch error:", err);
          if (err.message && err.message.includes('401')) {
            setToastMessage("Giphy API Key is missing or invalid. Please check your Secrets.");
          } else {
            setToastMessage("Failed to fetch Giphy stickers. Check console for details.");
          }
        }
      }
      
      const comp = generateComposition(
        sceneItems, 
        sceneIdx, 
        caption, 
        preferredTextPosition, 
        textEffect, 
        transitionType, 
        transitionDuration, 
        prev,
        isTextOnly,
        preset,
        backgroundStyle,
        giphyStickerUrl
      );
      
      newComps.push(comp);
      prev = comp;
      
      setRenderProgress(Math.min(((sceneIdx / Math.max(scriptLines.length, 1)) * 100), 100));
      await new Promise(r => setTimeout(r, 100));
    }

    // Add any unmapped media at the end
    const mappedMediaIds = new Set(Object.values(mediaMapping));
    const unmappedMedia = mediaFiles.filter(m => !mappedMediaIds.has(m.id));
    
    for (let i = 0; i < unmappedMedia.length; i++) {
      const m = unmappedMedia[i];
      const comp = generateComposition(
        [m], 
        scriptLines.length + i, 
        '', 
        preferredTextPosition, 
        textEffect, 
        transitionType, 
        transitionDuration, 
        prev,
        false,
        preset,
        backgroundStyle
      );
      newComps.push(comp);
      prev = comp;
    }

    setCompositions(newComps);
    setCurrentIndex(0);
    
    if (newComps.length > 0) {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { credits: credits - 5 }, { merge: true });
        setToastMessage("Trailer generated! 5 credits used.");
      }
      setTimeout(() => {
        setIsRenderingTrailer(false);
        setAppMode('playing');
      }, 500);
    } else {
      setIsRenderingTrailer(false);
      setToastMessage("Failed to generate trailer.");
    }
  };

  const generateCompositionFromData = (media: any[], index: number, effect: TextEffect, tType: TransitionType, tDur: number, prevComp?: Composition, isTextOnly?: boolean, preset?: string, backgroundStyle?: string, giphyStickerUrl?: string, stickerScale?: number, stickerX?: number, stickerY?: number): Composition => {
    const angle = prevComp ? prevComp.angle + (Math.random() * 1.5 - 0.75) : 0;
    const distance = 2000;
    const x = prevComp ? prevComp.x + Math.cos(angle) * distance : 0;
    const y = prevComp ? prevComp.y + Math.sin(angle) * distance : 0;
    const z = 0;

    return {
      id: Math.random().toString(36).substr(2, 9),
      media: media.map(m => ({
        url: m.url,
        type: m.type,
        name: m.name || 'Asset',
        xOffset: m.xOffset || 0,
        yOffset: m.yOffset || 0,
        scale: m.scale || 1
      })),
      x, y, z,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      angle,
      caption: media[0]?.caption || '',
      textPosition: 'bottom',
      sceneType: media.length > 1 ? 'grid' : 'standard',
      textEffect: effect,
      transitionType: tType,
      transitionDuration: tDur,
      isTextOnly,
      preset,
      backgroundStyle,
      giphyStickerUrl,
      stickerScale,
      stickerX,
      stickerY
    };
  };

  const startRecording = async () => {
    try {
      const resConstraints = {
        '4K': { width: 3840, height: 2160 },
        '1080p': { width: 1920, height: 1080 },
        '720p': { width: 1280, height: 720 }
      }[exportResolution];

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: "browser",
          width: { ideal: resConstraints.width },
          height: { ideal: resConstraints.height },
          frameRate: { ideal: 60 }
        },
        audio: false,
        preferCurrentTab: true
      } as any);

      let mimeType = 'video/webm;codecs=vp9';
      if (exportFormat === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) mimeType = 'video/mp4;codecs=h264';
        else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
        else {
          setToastMessage("MP4 export not natively supported in this browser. Falling back to WebM. Use Safari or a converter for MP4.");
          setTimeout(() => setToastMessage(null), 5000);
        }
      } else if (exportFormat === 'mov') {
        if (MediaRecorder.isTypeSupported('video/quicktime')) mimeType = 'video/quicktime';
        else {
          setToastMessage("MOV export not natively supported in this browser. Falling back to WebM.");
          setTimeout(() => setToastMessage(null), 5000);
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        videoBitsPerSecond: exportResolution === '4K' ? 50000000 : 15000000 
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      sequenceActiveRef.current = true;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        sequenceActiveRef.current = false;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = exportFormat === 'mov' ? 'mov' : (exportFormat === 'mp4' ? 'mp4' : 'webm');
        a.download = `motion-trailer-${exportResolution}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-play sequence for recording
      // Give more time for the browser to stabilize and for the user to switch tabs if needed
      setCurrentIndex(0);
      setRecordingProgress(0);
      await new Promise(r => setTimeout(r, 3000)); 

      for (let i = 1; i < compositions.length; i++) {
        if (!sequenceActiveRef.current) break;
        
        // Update index
        setCurrentIndex(i);
        setRecordingProgress((i / compositions.length) * 100);
        
        // Wait for the transition and scene duration
        // We use a slightly longer wait to ensure the transition completes fully
        await new Promise(r => setTimeout(r, 5000)); 
      }

      if (sequenceActiveRef.current) {
        setRecordingProgress(100);
        // Final wait for the last scene to settle
        await new Promise(r => setTimeout(r, 2000)); 
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }

    } catch (err) {
      console.error("Recording failed", err);
      setToastMessage("Screen recording requires opening the app in a new tab. Click the 'Open in new tab' icon in the top right of the preview.");
      setTimeout(() => setToastMessage(null), 8000);
    }
  };

  // --- RENDER LANDING PAGE ---
  if (appMode === 'landing') {
    return <LandingPage onStart={async () => {
      if (!user) {
        const loggedInUser = await handleLogin();
        if (loggedInUser) {
          setAppMode('setup');
        }
      } else {
        setAppMode('setup');
      }
    }} />;
  }

  // --- RENDER SETUP WIZARD ---
  if (appMode === 'setup') {
    return (
      <div className="min-h-screen bg-isometric-grid text-black font-sans flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-3xl brutal-card p-6 md:p-12 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar relative">
          
          {/* Loading Overlays */}
          <AnimatePresence>
            {(isUploading || isGeneratingImage || isSaving) && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-brutal-blue/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl md:rounded-3xl brutal-border"
              >
                <div className="w-16 h-16 border-8 border-black border-t-brutal-pink rounded-full animate-spin mb-6"></div>
                <p className="text-black font-display font-bold uppercase text-xl bg-white px-4 py-2 brutal-border">
                  {isUploading && "Uploading assets..."}
                  {isGeneratingImage && "Generating AI image..."}
                  {isSaving && "Saving project..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12 border-b-4 border-black pb-4">
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-1">Create Trailer</h1>
              <p className="text-black font-mono text-xs md:text-sm font-bold bg-brutal-green inline-block px-2 py-1 brutal-border transform -rotate-2">Motion Graphics Generator</p>
            </div>
            <div className="flex flex-col items-end gap-4">
              {user ? (
                <div className="flex items-center gap-3 bg-brutal-purple px-3 py-1.5 brutal-border">
                  <img src={user.photoURL || ''} className="w-6 h-6 brutal-border" alt="Profile" />
                  <span className="text-xs font-bold font-mono uppercase hidden sm:inline">{user.displayName}</span>
                  <button onClick={handleLogout} className="text-black hover:text-red-600 transition-colors">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="brutal-button bg-brutal-blue px-4 py-1.5 text-xs flex items-center gap-2"
                >
                  <UserIcon size={14} /> LOGIN
                </button>
              )}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(step => (
                  <div 
                    key={step} 
                    className={`w-4 h-4 brutal-border transition-colors ${setupStep >= step ? 'bg-black' : 'bg-white'}`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step 1: Media */}
          {setupStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brutal-blue brutal-border flex items-center justify-center"><ImageIcon size={16} /></div> Step 1: Add Media
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {mediaFiles.map((item, i) => (
                  <div key={i} className="relative aspect-square bg-white brutal-border overflow-hidden group">
                    <MediaThumbnail item={item} />
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-brutal-pink brutal-border p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex flex-col gap-2">
                  <label className="flex-1 aspect-square bg-brutal-orange/20 hover:bg-brutal-orange/40 border-2 border-black border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors text-black">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs uppercase font-mono font-bold">Upload</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={() => setShowLibrary(true)}
                    className="brutal-button bg-brutal-purple h-10 flex items-center justify-center gap-2 text-xs"
                  >
                    <History size={14} /> Library
                  </button>
                </div>
              </div>

              {/* Library Modal */}
              <AnimatePresence>
                {showLibrary && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-brutal-bg/90 backdrop-blur-md flex items-center justify-center p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white brutal-border w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="p-6 border-b-4 border-black flex items-center justify-between bg-brutal-blue">
                        <h3 className="text-2xl font-display font-bold uppercase flex items-center gap-3 text-black">
                          <History size={24} /> Your Asset Library
                        </h3>
                        <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-black/10 transition-colors text-black">
                          <X size={24} />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-brutal-bg">
                        {libraryAssets.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-black/40">
                            <ImageIcon size={48} className="mb-4 opacity-50" />
                            <p className="font-mono font-bold uppercase">Your library is empty. Upload assets to see them here.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {libraryAssets.map((asset) => {
                              const isSelected = selectedLibraryAssets.has(asset.id);
                              return (
                                <div
                                  key={asset.id}
                                  onClick={() => toggleLibraryAssetSelection(asset.id)}
                                  className={`relative aspect-square brutal-border overflow-hidden group cursor-pointer transition-all ${isSelected ? 'border-4 border-black bg-brutal-green' : 'bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                                >
                                  {asset.type === 'video' ? (
                                    <video src={asset.url} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} />
                                  ) : (
                                    <img src={asset.url} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} alt={asset.name} />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <p className="text-[10px] truncate w-full font-mono font-bold text-black">{asset.name}</p>
                                  </div>
                                  <div className={`absolute top-2 left-2 w-6 h-6 brutal-border flex items-center justify-center transition-colors ${isSelected ? 'bg-brutal-green' : 'bg-white'}`}>
                                    {isSelected && <CheckCircle2 size={16} className="text-black" />}
                                  </div>
                                  <button 
                                    onClick={(e) => deleteLibraryAsset(e, asset)}
                                    className="absolute top-2 right-2 bg-brutal-pink brutal-border p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 text-black"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 border-t-4 border-black bg-white flex items-center justify-between">
                        <p className="text-xs text-black/60 font-mono font-bold uppercase">Select assets to add them to your current project.</p>
                        <button
                          disabled={selectedLibraryAssets.size === 0}
                          onClick={() => {
                            const selectedAssets = libraryAssets.filter(a => selectedLibraryAssets.has(a.id));
                            addFromLibrary(selectedAssets);
                            setShowLibrary(false);
                            setSelectedLibraryAssets(new Set());
                          }}
                          className="brutal-button bg-brutal-green px-6 py-2 text-sm disabled:opacity-50"
                        >
                          ADD SELECTED ({selectedLibraryAssets.size})
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Generation Tool */}
              <div className="bg-brutal-blue/20 brutal-border p-4 md:p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brutal-blue text-black font-mono text-[10px] font-bold px-2 py-1 brutal-border border-t-0 border-r-0">BETA</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brutal-blue brutal-border flex items-center justify-center text-black">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg uppercase">AI Visual Generator</h3>
                    <p className="text-xs font-mono font-bold uppercase">Create unique motion assets</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Describe the visual you want (e.g. 'Cyberpunk city at night, cinematic lighting')"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="brutal-input flex-1 px-4 py-3 text-sm"
                  />
                  <button 
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || !aiPrompt}
                    className="brutal-button bg-brutal-green px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                    <span className="hidden sm:inline">GENERATE</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setSetupStep(2)}
                  disabled={mediaFiles.length === 0}
                  className="brutal-button bg-brutal-orange px-8 py-3 text-lg flex items-center gap-2 disabled:opacity-50"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Script */}
          {setupStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brutal-green brutal-border flex items-center justify-center"><FileText size={16} /></div> Step 2: Add Script
              </h2>
              
              <div className="mb-6 bg-brutal-pink/20 brutal-border p-4">
                <label className="block text-sm font-mono font-bold uppercase mb-2">AI URL Scraper (Optional)</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={14} />
                    <input 
                      type="url" 
                      placeholder="https://example.com/article" 
                      className="brutal-input w-full py-2 pl-10 pr-4 text-sm"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleScrape}
                    disabled={isScraping || !scrapeUrl}
                    className="brutal-button bg-brutal-purple px-4 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
                  </button>
                </div>
              </div>

              <p className="text-black/70 text-sm mb-4 font-medium">Each line of text will be displayed as a caption for the corresponding media file.</p>
              
              <textarea
                className="brutal-input w-full p-6 font-mono text-sm resize-none h-48 mb-4"
                placeholder="Line 1: Welcome to the presentation&#10;Line 2: Here is our first product&#10;Line 3: Notice the sleek design..."
                value={scriptText}
                onChange={(e) => handleScriptChange(e.target.value)}
              />

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setSetupStep(1)}
                  className="brutal-button bg-white px-6 py-3"
                >
                  Back
                </button>
                <button 
                  onClick={handleGoToMapping}
                  className="brutal-button bg-brutal-orange px-8 py-3 text-lg flex items-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Link Media to Text */}
          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brutal-purple brutal-border flex items-center justify-center"><LinkIcon size={16} /></div> Step 3: Link Media to Text
              </h2>
              
              <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {scriptText.split('\n').filter(l => l.trim().length > 0).map((line, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 bg-white brutal-border p-3">
                    <div className="flex-1 text-sm text-black font-medium flex items-center">
                      <span className="bg-brutal-blue brutal-border text-black px-2 py-0.5 font-mono font-bold text-xs mr-3">{idx + 1}</span>
                      {line}
                    </div>
                    <div className="flex items-center gap-3 md:w-1/3">
                      <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase whitespace-nowrap cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={textOnlyLines.has(idx)}
                          onChange={() => toggleTextOnly(idx)}
                          className="w-4 h-4 border-2 border-black rounded-none text-brutal-blue focus:ring-0 focus:ring-offset-0"
                        />
                        Text Only
                      </label>
                      
                      {!textOnlyLines.has(idx) && (
                        <select
                          value={mediaMapping[idx] || ''}
                          onChange={(e) => setMediaMapping(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="brutal-input flex-1 px-2 py-1.5 text-xs font-mono"
                        >
                          <option value="">Select Media...</option>
                          {mediaFiles.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setSetupStep(2)}
                  className="brutal-button bg-white px-6 py-3"
                >
                  Back
                </button>
                <button 
                  onClick={() => setSetupStep(4)}
                  className="brutal-button bg-brutal-orange px-8 py-3 text-lg flex items-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Ready & Styling */}
          {setupStep === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-2 md:py-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-brutal-green brutal-border flex items-center justify-center mx-auto mb-4 transform -rotate-6">
                <CheckCircle2 size={24} className="md:w-8 md:h-8 text-black" />
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold uppercase mb-1 md:mb-2 text-center tracking-tighter text-black">Style & Generate</h2>
              <p className="text-black/70 font-mono font-bold uppercase mb-6 md:mb-8 text-center text-xs md:text-sm">Loaded {mediaFiles.length} media files and {scriptText.split('\n').filter(l => l.trim()).length} script lines.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Professional Presets</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['blockbuster', 'documentary', 'music-video', 'app-showcase'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => applyPreset(p)}
                        className={`px-4 py-4 brutal-border text-center transition-all text-black ${preset === p ? 'bg-brutal-blue transform translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                      >
                        <div className="font-display font-bold uppercase mb-1">{p.replace('-', ' ')}</div>
                        <div className="text-[10px] text-black/60 font-mono uppercase tracking-widest">Automated Engine</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Typography</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['font-sans', 'font-serif', 'font-mono', 'font-display'] as FontStyle[]).map(font => (
                      <button
                        key={font}
                        onClick={() => setFontStyle(font)}
                        className={`px-3 py-2 md:px-4 md:py-3 text-left brutal-border transition-colors text-xs md:text-sm text-black ${fontStyle === font ? 'bg-brutal-pink' : 'bg-white hover:bg-gray-100'} ${font}`}
                      >
                        {font.replace('font-', '').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Background</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['black', 'gradient-blue', 'gradient-purple', 'grid', 'vibrant-glow', 'particles', 'parallax'] as BackgroundStyle[]).map(bg => (
                      <button
                        key={bg}
                        onClick={() => setBackgroundStyle(bg)}
                        className={`px-3 py-2 md:px-4 md:py-3 text-left brutal-border transition-colors capitalize text-xs md:text-sm text-black ${backgroundStyle === bg ? 'bg-brutal-orange' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {bg.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="flex items-center gap-3 cursor-pointer bg-white p-4 brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <input 
                    type="checkbox" 
                    checked={useGiphy}
                    onChange={(e) => setUseGiphy(e.target.checked)}
                    className="w-5 h-5 border-2 border-black rounded-none text-brutal-green focus:ring-0 focus:ring-offset-0"
                  />
                  <div>
                    <div className="text-sm font-bold uppercase font-mono">Add Giphy Stickers</div>
                    <div className="text-xs text-black/70 font-medium">Automatically fetch and overlay animated stickers based on scene text.</div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Text Animation</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['gsap-split', 'typewriter', 'fade', 'kinetic'] as TextEffect[]).map(effect => (
                      <button
                        key={effect}
                        onClick={() => setTextEffect(effect)}
                        className={`px-3 py-2 md:px-4 md:py-3 text-left brutal-border transition-colors capitalize text-xs md:text-sm text-black ${textEffect === effect ? 'bg-brutal-blue' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {effect.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Text Position</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['random', 'top', 'bottom', 'center', 'left', 'right'] as TextPosition[]).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setPreferredTextPosition(pos)}
                        className={`px-3 py-2 md:px-4 md:py-3 text-left brutal-border transition-colors capitalize text-xs md:text-sm text-black ${preferredTextPosition === pos ? 'bg-brutal-purple' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Transition Effect</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract'] as TransitionType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setTransitionType(type)}
                        className={`px-3 py-2 md:px-4 md:py-3 text-left brutal-border transition-colors capitalize text-xs md:text-sm text-black ${transitionType === type ? 'bg-brutal-green' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Transition Speed</h3>
                  <div className="flex flex-col gap-4 px-2 bg-white brutal-border p-4">
                    <input 
                      type="range" 
                      min="0.2" 
                      max="3" 
                      step="0.1" 
                      value={transitionDuration}
                      onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-black font-bold">
                      <span>FAST ({transitionDuration}s)</span>
                      <span>SLOW</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Export Format</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['webm', 'mp4', 'mov'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        className={`px-3 py-2 text-center brutal-border transition-colors uppercase text-[10px] font-mono font-bold text-black ${exportFormat === f ? 'bg-brutal-orange' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Export Resolution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '4K'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setExportResolution(r)}
                        className={`px-3 py-2 text-center brutal-border transition-colors uppercase text-[10px] font-mono font-bold text-black ${exportResolution === r ? 'bg-brutal-pink' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setSetupStep(3)}
                  className="brutal-button bg-white px-6 py-3"
                >
                  Back
                </button>
                {user && (
                  <button 
                    onClick={saveProject}
                    disabled={isSaving || mediaFiles.length === 0}
                    className="brutal-button bg-brutal-blue px-8 py-4 text-lg flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    SAVE PROJECT
                  </button>
                )}
                <button 
                  onClick={generateWorld}
                  className="brutal-button bg-brutal-green px-10 py-4 text-xl flex items-center gap-3"
                >
                  <Play size={20} fill="currentColor" />
                  START TRAILER
                </button>
              </div>

              {user && userTrailers.length > 0 && (
                <div className="mt-12 pt-12 border-t-4 border-black">
                  <h3 className="text-xl font-display font-bold uppercase mb-6 flex items-center gap-3 text-black">
                    <div className="w-8 h-8 bg-brutal-purple brutal-border flex items-center justify-center"><History size={16} /></div> Your Saved Trailers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userTrailers.map(project => (
                      <div key={project.id} className="bg-white brutal-border p-4 flex items-center justify-between group hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="cursor-pointer flex-1" onClick={() => loadProject(project)}>
                          <div className="font-bold font-mono uppercase text-sm mb-1 text-black">{project.name}</div>
                          <div className="text-[10px] text-black/60 font-mono font-bold uppercase">{new Date(project.createdAt?.seconds * 1000).toLocaleDateString()} • {project.media.length} Scenes</div>
                        </div>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="text-black hover:text-brutal-pink p-2 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  // --- RENDER PLAYING MODE ---
  const camera = currentComp ? { x: currentComp.x, y: currentComp.y, z: currentComp.z } : { x: 0, y: 0, z: 0 };

  const getBackgroundClass = () => {
    switch (backgroundStyle) {
      case 'gradient-blue': return 'bg-brutal-blue';
      case 'gradient-purple': return 'bg-brutal-purple';
      case 'grid': return 'bg-isometric-grid bg-white';
      case 'vibrant-glow': return 'bg-brutal-orange';
      default: return 'bg-brutal-bg';
    }
  };

  const getTextPositionClass = (pos: TextPosition) => {
    switch (pos) {
      case 'top': return 'top-16 md:top-24 inset-x-0';
      case 'bottom': return 'bottom-16 md:bottom-24 inset-x-0';
      case 'center': return 'top-1/2 -translate-y-1/2 inset-x-0';
      case 'left': return 'left-4 md:left-16 top-1/2 -translate-y-1/2 max-w-[90vw] md:max-w-lg text-left';
      case 'right': return 'right-4 md:right-16 top-1/2 -translate-y-1/2 max-w-[90vw] md:max-w-lg text-right';
      default: return 'bottom-16 md:bottom-24 inset-x-0';
    }
  };

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden text-black ${fontStyle} ${getBackgroundClass()}`} 
      style={{ perspective: '1500px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      
      {/* The 3D World */}
      {backgroundStyle === 'parallax' && <ParallaxBackground worldX={worldX} worldY={worldY} />}
      {backgroundStyle === 'particles' && <ParticleTrails />}
      <motion.div
        className="absolute top-0 left-0 w-full h-full overflow-visible"
        style={{ 
          transformStyle: 'preserve-3d',
          x: worldX,
          y: worldY,
          z: worldZ,
          rotateX: smoothRotX,
          rotateY: smoothRotY,
          filter: cameraFilter
        }}
      >
        {/* Cinematic Light Leaks */}
        <div className="absolute inset-0 pointer-events-none z-[102] overflow-hidden">
          <motion.div 
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,100,0,0.15)_0%,transparent_60%)]"
            animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,150,255,0.1)_0%,transparent_50%)]"
            animate={{ x: [0, -100, 0], y: [0, 50, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Floating Particles Background */}
        <FloatingParticles />

        {/* Compositions */}
        {compositions.map((comp, index) => {
          let status: 'past' | 'active' | 'future' = 'future';
          if (index === currentIndex) status = 'active';
          else if (index < currentIndex) status = 'past';

          return <CompositionNode key={comp.id} comp={comp} status={status} />;
        })}
      </motion.div>

      {/* Scene Counter Overlay */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
        <div className="bg-white brutal-border px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-3 h-3 bg-brutal-orange brutal-border animate-pulse" />
          <span className="text-xs font-mono font-bold text-black uppercase">
            Scene {currentIndex + 1} / {compositions.length}
          </span>
        </div>
      </div>

      {/* Cinematic Overlay (Film Grain, Vignette, Chromatic Aberration) */}
      <CinematicOverlay />

      {/* Cinematic Letterboxing (AE Style) */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between">
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="h-[10vh] w-full bg-brutal-bg border-b-8 border-black"
        />
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="h-[10vh] w-full bg-brutal-bg border-t-8 border-black"
        />
      </div>

      {/* Global Lens Flare (AE Style) */}
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden mix-blend-screen opacity-40">
        <motion.div 
          style={{ x: worldX, y: worldY }}
          className="absolute w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_70%)] blur-3xl"
        />
        <motion.div 
          style={{ x: flareX1, y: flareY1 }}
          className="absolute w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(0,100,255,0.4)_0%,transparent_70%)] blur-2xl"
        />
        <motion.div 
          style={{ x: flareX2, y: flareY2 }}
          className="absolute w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(255,100,0,0.3)_0%,transparent_70%)] blur-xl"
        />
      </div>

      {/* Global HUD Layer for Typography */}
      <AnimatePresence mode="wait">
        {currentComp && currentComp.caption && currentComp.sceneType !== 'text-morph' && (
          <motion.div
            key={currentComp.id}
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className={`pointer-events-none fixed z-40 flex flex-col items-center justify-center text-center px-8 ${getTextPositionClass(currentComp.textPosition)}`}
          >
            <div className="px-8 py-4 bg-white brutal-border transform -rotate-2">
              <div className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-black uppercase">
                <AnimatedCaption text={currentComp.caption} effect={currentComp.textEffect} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${toastMessage.includes('success') ? 'bg-brutal-green' : 'bg-brutal-pink'} text-black px-6 py-4 brutal-border flex items-start gap-4 max-w-md`}>
          {toastMessage.includes('success') ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
          <p className="text-sm font-bold font-mono uppercase leading-relaxed">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="shrink-0 hover:scale-110 transition-transform">
            <X size={20} />
          </button>
        </div>
      )}

      {/* UI Controls Overlay (Hidden during recording) */}
      <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-50 transition-opacity duration-500 ${isRecording ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button 
          onClick={startRecording}
          className="brutal-button bg-brutal-pink px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-sm flex items-center gap-2 md:gap-3"
        >
          <Video size={14} className="md:w-4 md:h-4" />
          <span>EXPORT</span>
        </button>
      </div>
      
      <div className={`fixed top-4 left-4 md:top-6 md:left-6 z-50 transition-opacity duration-500 ${isRecording ? 'opacity-0 pointer-events-none' : 'opacity-100'} flex gap-2 md:gap-3`}>
        <button 
          onClick={() => setAppMode('setup')}
          className="brutal-button bg-white px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-sm"
        >
          <span>MENU</span>
        </button>
        <button 
          onClick={handleStartOver}
          className="brutal-button bg-brutal-orange px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-sm"
        >
          <span>START OVER</span>
        </button>
        <button 
          onClick={resetCamera}
          className="brutal-button bg-brutal-blue px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-sm flex items-center gap-2"
          title="Reset Camera"
        >
          <Play size={12} className="rotate-90 md:w-3 md:h-3" />
          <span className="hidden md:inline">RESET CAMERA</span>
          <span className="md:hidden">RESET</span>
        </button>
        <button 
          onClick={() => setShowGiphyModal(true)}
          className="brutal-button bg-brutal-purple px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-sm flex items-center gap-2 md:gap-3"
        >
          <Sparkles size={14} className="md:w-4 md:h-4 text-black" />
          <span className="text-black">STICKERS</span>
        </button>
      </div>

      {/* Manual Navigation Controls */}
      {!isRecording && compositions.length > 1 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-white brutal-border p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <button 
            onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : compositions.length - 1))}
            className="p-2 bg-brutal-pink brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            {compositions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-4 h-4 brutal-border transition-all ${i === currentIndex ? 'bg-brutal-blue scale-125' : 'bg-white hover:bg-gray-200'}`}
              />
            ))}
          </div>
          <button 
            onClick={() => setCurrentIndex(prev => (prev < compositions.length - 1 ? prev + 1 : 0))}
            className="p-2 bg-brutal-green brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Interaction Hint */}
      {!isRecording && (
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none font-mono text-xs font-bold uppercase tracking-widest bg-white brutal-border px-3 py-1 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Drag to Rotate • Shift+Drag to Pan
        </div>
      )}

      {/* Recording Progress Bar */}
      {isRecording && (
        <div className="fixed bottom-0 left-0 right-0 h-4 bg-white border-t-4 border-black z-[300]">
          <div 
            className="h-full bg-brutal-pink border-r-4 border-black transition-all duration-1000 ease-linear" 
            style={{ width: `${recordingProgress}%` }} 
          />
        </div>
      )}

      {/* AI Rendering Overlay */}
      <AnimatePresence>
        {isRenderingTrailer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-brutal-bg flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md bg-white brutal-border p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brutal-green brutal-border">
                    <Sparkles size={24} className="animate-pulse text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold uppercase text-black">AI Rendering Engine</h2>
                    <p className="text-xs text-black/60 font-mono font-bold uppercase tracking-widest">Processing cinematic assets</p>
                  </div>
                </div>
                <span className="text-xl font-display font-bold text-black">{Math.round(renderProgress)}%</span>
              </div>
              
              <div className="h-4 w-full bg-white brutal-border overflow-hidden">
                <motion.div 
                  className="h-full bg-brutal-blue border-r-2 border-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${renderProgress}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-brutal-pink brutal-border">
                  <p className="text-[10px] text-black/60 font-mono font-bold uppercase mb-1">Status</p>
                  <p className="text-sm font-bold uppercase text-black">Analyzing Composition</p>
                </div>
                <div className="p-4 bg-brutal-orange brutal-border">
                  <p className="text-[10px] text-black/60 font-mono font-bold uppercase mb-1">Task</p>
                  <p className="text-sm font-bold uppercase text-black">Syncing 3D Coordinates</p>
                </div>
              </div>
              
              <p className="mt-12 text-center text-xs text-black font-mono font-bold animate-pulse">
                INITIALIZING VIRTUAL CAMERA & LIGHTING SYSTEMS...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker Controls Removed */}

      {/* Giphy Search Modal */}
      <AnimatePresence>
        {showGiphyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-brutal-bg/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white brutal-border w-full max-w-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b-4 border-black flex justify-between items-center bg-brutal-purple text-black">
                <h3 className="font-display font-bold uppercase flex items-center gap-2"><Sparkles size={18} /> Add Giphy Sticker</h3>
                <button onClick={() => setShowGiphyModal(false)} className="p-1.5 hover:scale-110 transition-transform">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 border-b-4 border-black bg-gray-100">
                <form onSubmit={handleGiphySearch} className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={giphySearchQuery}
                      onChange={(e) => setGiphySearchQuery(e.target.value)}
                      placeholder="Search for a sticker..."
                      className="brutal-input w-full py-3 pl-10 pr-4 text-sm"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  </div>
                  <button type="submit" className="brutal-button bg-brutal-blue px-6 py-3 text-sm">
                    Search
                  </button>
                </form>
              </div>

              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-white text-black">
                {isSearchingGiphy ? (
                  <div className="flex flex-col items-center justify-center h-48 text-black/50">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p className="text-sm font-mono uppercase font-bold">Searching Giphy...</p>
                  </div>
                ) : giphySearchResults.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {giphySearchResults.map((gif) => (
                      <button 
                        key={gif.id}
                        onClick={() => applyStickerToCurrentScene(gif.images.original.url)}
                        className="aspect-square bg-gray-100 brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all p-2 flex items-center justify-center group"
                      >
                        <img src={gif.images.fixed_height.url} alt={gif.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-black/40">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-mono font-bold uppercase">Search for stickers to add to Scene {currentIndex + 1}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
