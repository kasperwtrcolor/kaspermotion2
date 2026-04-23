import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform, MotionValue } from 'motion/react';
import { Upload, Video, X, AlertCircle, Play, FileText, Image as ImageIcon, ArrowRight, CheckCircle2, Link as LinkIcon, Loader2, LogOut, User as UserIcon, Save, History, Trash2, Sparkles, Wand2, ChevronLeft, ChevronRight, Search, Github, Twitter, Youtube, Figma, Slack, Instagram, Chrome, Grid, Columns, TrendingUp, Bell, MessageSquare, Quote, Star, Plus, Square, Music, Hash, Sunrise, Trees, Rocket, Cpu, Users, Glasses, Trophy, Flower2, Target, Dribbble, Maximize2 } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { GiphyFetch } from '@giphy/js-fetch-api';
import LandingPage from './components/LandingPage';
import AppHeader from './components/AppHeader';
import ProfilePage from './components/ProfilePage';
import PricingModal from './components/PricingModal';
import VideoCanvas from './components/VideoCanvas';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ShaderTransitionCanvas from './components/ShaderTransitionCanvas';
import PremiumSocialOverlays from './components/PremiumSocialOverlays';
import TransitionFiller from './components/TransitionFiller';
import { findBestTransitionItem, TRANSITION_ITEM_LIB } from './constants/transitionAssets';
import SharePage from './components/SharePage';

gsap.registerPlugin(useGSAP);


const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'dummy_key_to_prevent_crash');

type TextPosition = 'bottom' | 'top' | 'center' | 'left' | 'right' | 'random';
type FontStyle = 'font-sans' | 'font-serif' | 'font-mono' | 'font-display';
type BackgroundStyle = 'black';
type TextEffect = 'random' | 'gsap-cascade' | 'gsap-3d-roll' | 'gsap-elastic' | 'gsap-expand' | 'gsap-tornado' | 'gsap-merge-elastic' | 'gsap-funnel' | 'gsap-triangle' | 'gsap-square' | 'gsap-heart' | 'gsap-stack' | 'gsap-glow' | 'gsap-focus-flash';
type FontFamily = 'font-sans' | 'font-display' | 'font-serif' | 'font-mono' | 'font-archivo' | 'font-bebas' | 'font-outfit' | 'font-syne' | 'font-unbounded' | 'font-kanit' | 'font-public' | 'font-work' | 'font-montserrat' | 'font-impact' | 'font-pixel' | 'font-pixel-arcade' | 'font-righteous' | 'font-space-tech' | 'font-bangers';
type TransitionType = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'explode' | 'spin' | 'expand' | 'contract' | '3d-flip' | 'random' 
  | 'domain-warp' | 'ridged-burn' | 'whip-pan' | 'sdf-iris' | 'ripple-waves' | 'gravitational-lens' 
  | 'cinematic-zoom' | 'chromatic-split' | 'glitch' | 'swirl-vortex' | 'thermal-distortion' 
  | 'flash-through-white' | 'cross-warp-morph' | 'light-leak';
type CinematicMood = 'standard' | 'golden-hour' | 'cyberpunk' | 'noir' | 'teal-and-orange';

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
  m3Shape?: string;
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
    m3Shape?: string;
    isFullscreen?: boolean;
    isAnimating?: boolean;
  }[];
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  angle: number;
  caption: string;
  textPosition: TextPosition;
  sceneType: 'standard' | 'instagram-follow' | 'x-post' | 'macos-notification' | 'data-chart' | 'spotify-card' | 'reddit-post';
  textEffect: TextEffect;
  transitionType: TransitionType;
  transitionDuration: number;
  isTextOnly?: boolean;
  preset?: string;
  backgroundStyles?: string[];
  activeBackground?: BackgroundStyle;
  giphyStickerUrl?: string;
  stickerScale?: number;
  stickerX?: number;
  stickerY?: number;
  websiteUrl?: string;
  fontFamily?: FontFamily;
  textColor?: string;
  isMultiColor?: boolean;
  transitionItemAsset?: string;
};

const M3_SHAPES = [
  'circle', 'triangle', 'square', 'rounded-rect', 'hexagon', 'star', 'sunflower', 'pill', 'rhombus', 'leaf', 'flower', 'heart', 'letter', 'blob', 'organic', 'cutout', 'octogon', 'banner', 'bevel'
];

const M3_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
  backgroundStyles?: string[],
  giphyStickerUrl?: string,
  fontFamily?: FontFamily,
  textColor?: string,
  isMultiColor?: boolean
): Composition => {
  let sceneType: Composition['sceneType'] = 'standard';
  const rand = Math.random();
  
  if (caption && rand > 0.85) {
    const socialTypes: Composition['sceneType'][] = ['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post'];
    sceneType = socialTypes[Math.floor(Math.random() * socialTypes.length)];
  }
  
  const angle = prevComp ? prevComp.angle + (Math.random() * 1.5 - 0.75) : 0;
  const distance = 2000;

  const x = prevComp ? prevComp.x + Math.cos(angle) * distance : 0;
  const y = prevComp ? prevComp.y + Math.sin(angle) * distance : 0;
  const z = 0;

  const textPosition = preferredPosition;

  const processedMedia = items.map((item, i) => {
    let xOffset = 0;
    let yOffset = 0;
    let scale = 1;

    const randomShape = M3_SHAPES[Math.floor(Math.random() * M3_SHAPES.length)];
    let m3Shape = item.m3Shape || randomShape;
    
    if (m3Shape === 'letter') {
      const firstChar = (caption || 'K').trim().charAt(0).toUpperCase();
      m3Shape = `letter-${firstChar.match(/[A-Z]/) ? firstChar : M3_LETTERS[Math.floor(Math.random() * M3_LETTERS.length)]}`;
    }

    return {
      file: item.file,
      url: item.url || "",
      type: item.type,
      name: item.name,
      xOffset,
      yOffset,
      scale,
      m3Shape
    };
  });

  const transitionItemAsset = findBestTransitionItem(caption) || undefined;

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
    transitionType: preferredTransition === 'random' 
      ? (Math.random() > 0.4 
          ? (['domain-warp', 'ridged-burn', 'whip-pan', 'sdf-iris', 'ripple-waves', 'gravitational-lens', 'cinematic-zoom', 'chromatic-split', 'glitch', 'swirl-vortex', 'thermal-distortion', 'flash-through-white', 'cross-warp-morph', 'light-leak'][Math.floor(Math.random() * 14)] as TransitionType)
          : (['fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract'][Math.floor(Math.random() * 8)] as TransitionType))
      : preferredTransition,
    transitionDuration: preferredDuration,
    isTextOnly,
    preset,
    backgroundStyles,
    activeBackground: backgroundStyles && backgroundStyles.length > 0 ? (backgroundStyles[Math.floor(Math.random() * backgroundStyles.length)] as BackgroundStyle) : 'black',
    giphyStickerUrl,
    fontFamily,
    textColor,
    isMultiColor,
    transitionItemAsset
  };
};

const getM3ShapeStyle = (shape: string = 'square', caption: string = '') => {
  const base = "max-w-[85vw] max-h-[75vh] w-auto h-auto block object-cover shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700";
  
  let resolvedShape = shape;
  if (shape === 'letter') {
    const firstLetter = caption.trim().charAt(0).toUpperCase();
    resolvedShape = `letter-${firstLetter.match(/[A-Z]/) ? firstLetter : M3_LETTERS[Math.floor(Math.random() * M3_LETTERS.length)]}`;
  }

  if (resolvedShape.startsWith('letter-')) {
    const letter = resolvedShape.split('-')[1];
    return {
      className: base,
      style: {
        maskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><text x='50%' y='50%' font-size='350' font-family='Arial Black, Impact, sans-serif' font-weight='900' text-anchor='middle' dominant-baseline='central'>${letter}</text></svg>")`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><text x='50%' y='50%' font-size='350' font-family='Arial Black, Impact, sans-serif' font-weight='900' text-anchor='middle' dominant-baseline='central'>${letter}</text></svg>")`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }
    };
  }

  const paths: Record<string, string> = {
    circle: 'circle(50% at 50% 50%)',
    triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    sunflower: 'polygon(50% 0%, 55% 10%, 70% 3%, 68% 18%, 84% 17%, 78% 32%, 93% 40%, 82% 50%, 93% 60%, 78% 68%, 84% 83%, 68% 82%, 70% 97%, 55% 90%, 50% 100%, 45% 90%, 30% 97%, 32% 82%, 16% 83%, 22% 68%, 7% 60%, 18% 50%, 7% 40%, 22% 32%, 16% 17%, 32% 18%, 30% 3%, 45% 10%)',
    pill: 'inset(0% round 100vw)',
    rhombus: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    flower: 'polygon(50% 0%, 65% 15%, 85% 15%, 85% 35%, 100% 50%, 85% 65%, 85% 85%, 65% 85%, 50% 100%, 35% 85%, 15% 85%, 15% 65%, 0% 50%, 15% 35%, 15% 15%, 35% 15%)',
    heart: 'polygon(50% 15%, 75% 0%, 100% 30%, 50% 95%, 0% 30%, 25% 0%)',
    blob: 'polygon(30% 0%, 70% 10%, 100% 30%, 90% 70%, 70% 100%, 30% 90%, 0% 70%, 10% 20%)',
    organic: 'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)',
    cutout: 'polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%)',
    octogon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    banner: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)',
    bevel: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    'rounded-rect': 'inset(0% round 15%)',
  };

  if (resolvedShape === 'leaf') {
    return { className: base, style: { borderRadius: '50% 0 50% 0' } };
  }
  if (resolvedShape === 'square') {
    return { className: base, style: { borderRadius: '0.5rem' } };
  }
  if (resolvedShape === 'rounded-large' || resolvedShape === 'rounded-rect') {
    return { className: base, style: { borderRadius: '2.5rem' } };
  }

  return {
    className: base,
    style: { 
      clipPath: paths[resolvedShape] || 'none', 
      WebkitClipPath: paths[resolvedShape] || 'none'
    }
  };
};

const getWordStyle = (word: string, index: number, customColor?: string, isMulti?: boolean) => {
  const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
  const hash = cleanWord.length + index;
  
  if (isMulti) {
    if (hash % 7 === 0) return { backgroundColor: '#FF2A6D', color: '#FFFFFF', padding: '0.1em 0.2em', borderRadius: '0.15em', display: 'inline-block', transform: 'rotate(-2deg)' };
    if (hash % 5 === 0) return { color: '#05D9E8', textShadow: '0 0 10px rgba(5,217,232,0.5)' };
    if (hash % 11 === 0) return { color: '#FFC200', textShadow: '0 0 10px rgba(255,194,0,0.5)' };
    if (hash % 13 === 0) return { backgroundColor: '#01FFC3', color: '#000000', padding: '0.1em 0.2em', borderRadius: '0.15em', display: 'inline-block', transform: 'rotate(1deg)' };
  }
  
  return customColor ? { color: customColor } : {};
};

const SplitText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...style, ...getWordStyle(word, i, textColor, isMulti) }}>
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

const TypewriterText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const characters = text.split('');
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.1 }}
          style={{ ...style, ...getWordStyle(char, i, textColor, isMulti) }}
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

const FadeText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.1, duration: 0.8 }}
          style={{ ...style, ...getWordStyle(word, i, textColor, isMulti) }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const KineticText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
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
            style={{ ...style, ...getWordStyle(word, i, textColor, isMulti) }}
          >
            {word}
          </motion.div>
        </div>
      ))}
    </div>
  );
};

const BounceText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: 0 }}
          animate={{ y: [0, -20, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className="inline-block"
          style={style}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const GlitchText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <div className={`relative ${className} font-black uppercase`} style={style}>
      <motion.div
        animate={{
          x: [-2, 2, -1, 0, 1],
          y: [1, -1, 2, 0, -2],
          opacity: [1, 0.8, 1, 0.9, 1]
        }}
        transition={{ repeat: Infinity, duration: 0.2 }}
        className="relative z-10"
      >
        {text}
      </motion.div>
      <motion.div
        className="absolute inset-0 text-[#FF2A6D] z-0"
        animate={{ x: [-3, 3], y: [2, -2] }}
        transition={{ repeat: Infinity, duration: 0.1 }}
      >
        {text}
      </motion.div>
      <motion.div
        className="absolute inset-0 text-[#05D9E8] z-0"
        animate={{ x: [3, -3], y: [-2, 2] }}
        transition={{ repeat: Infinity, duration: 0.1 }}
      >
        {text}
      </motion.div>
    </div>
  );
};

const RevealText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={style}
      >
        {text}
      </motion.div>
    </div>
  );
};

const ZoomText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <motion.div
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      className={className}
      style={style}
    >
      {text}
    </motion.div>
  );
};

const BlurText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <motion.div
      initial={{ filter: 'blur(20px)', opacity: 0 }}
      animate={{ filter: 'blur(0px)', opacity: 1 }}
      transition={{ duration: 1.2 }}
      className={className}
      style={style}
    >
      {text}
    </motion.div>
  );
};

const NeonText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <motion.div
      animate={{
        textShadow: [
          '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #01FFC3',
          '0 0 2px #fff, 0 0 5px #fff, 0 0 10px #01FFC3',
          '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #01FFC3'
        ],
        opacity: [1, 0.9, 1, 0.8, 1]
      }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`${className} text-[#01FFC3]`}
      style={style}
    >
      {text}
    </motion.div>
  );
};

const WaveText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <div className={`flex justify-center flex-wrap ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
          className="inline-block"
          style={style}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
};

const ShakeText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <motion.div
      animate={{ x: [-1, 1, -1, 1, 0] }}
      transition={{ repeat: Infinity, duration: 0.1 }}
      className={className}
      style={style}
    >
      {text}
    </motion.div>
  );
};

const SlideText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {text.split(' ').map((word, i) => (
        <motion.div
          key={i}
          initial={{ x: i % 2 === 0 ? -100 : 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.1, type: 'spring' }}
          style={style}
        >
          {word}
        </motion.div>
      ))}
    </div>
  );
};

const PerspectiveText = ({ text, className = "", style = {} }: { text: string, className?: string, style?: any }) => {
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`${className} origin-left`}
      style={{ ...style, perspective: '1000px' }}
    >
      {text}
    </motion.div>
  );
};

const GSAPCascadeText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.fromTo(
      ".gsap-cascade-word",
      { y: 50, opacity: 0, rotateX: -90 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.7)", overwrite: "auto" }
    );
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="gsap-cascade-word inline-block" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>{word}</span>
      ))}
    </div>
  );
};

const GSAP3DRollText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.fromTo(
      ".gsap-roll-word",
      { z: -100, rotationX: 90, opacity: 0 },
      { z: 0, rotationX: 0, opacity: 1, duration: 1, transformOrigin: '0% 50% -50', stagger: 0.1, ease: "expo.out", overwrite: "auto" }
    );
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={{ ...style, perspective: '800px' }}>
      {words.map((word, i) => (
        <span key={i} className="gsap-roll-word inline-block" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>{word}</span>
      ))}
    </div>
  );
};

const GSAPElasticText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.fromTo(
      ".gsap-elastic-word",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5, stagger: 0.05, ease: "elastic.out(1, 0.3)", overwrite: "auto" }
    );
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="gsap-elastic-word inline-block" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>{word}</span>
      ))}
    </div>
  );
};

const GSAPSplitText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.fromTo(
      ".gsap-split-char",
      { opacity: 0, scale: 0.5, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.02, ease: "back.out(1.5)", overwrite: "auto" }
    );
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-split-char inline-block">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPExpandText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-expand-char", {
      keyframes: {
        "0%": { scale: 0.1, opacity: 0 },
        "15%": { scale: 1, opacity: 1 },
        "60%": { scale: 1.2, opacity: 0.2 },
        "100%": { scale: 3.5, opacity: 0 }
      },
      duration: 4,
      stagger: { each: 0.05, from: "center" },
      ease: "power2.inOut",
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 overflow-visible ${className}`} style={{ ...style, perspective: 1000 }}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-expand-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPTornadoText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-tornado-char", {
      keyframes: {
        "0%": { x: 0, y: 100, rotation: 0, scale: 0.5, opacity: 0 },
        "15%": { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
        "60%": { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
        "100%": { x: () => (Math.random() - 0.5) * 1000, y: () => -500 - Math.random() * 500, rotation: () => Math.random() * 720 - 360, scale: 0.2, opacity: 0 }
      },
      duration: 4,
      stagger: { each: 0.02, from: "random" },
      ease: "power2.inOut",
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-tornado-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPMergeElasticText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-elastic-merge-char", {
      keyframes: {
        "0%":   { x: () => (Math.random() - 0.5) * 800, y: () => (Math.random() - 0.5) * 800, opacity: 0, scale: 0.5 },
        "25%":  { x: 0, y: 0, opacity: 1, scale: 1, ease: "elastic.out(1, 0.3)" },
        "70%":  { x: 0, y: 0, opacity: 1, scale: 1 },
        "100%": { scale: 10, opacity: 0, ease: "back.in(2)" }
      },
      duration: 4,
      stagger: 0.02,
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 overflow-visible ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-elastic-merge-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPFunnelText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-funnel-char", {
      keyframes: {
        "0%": { y: -300, scale: 2, opacity: 0, rotation: () => Math.random() * 180 - 90 },
        "30%": { y: 0, scale: 1, opacity: 1, rotation: 0, ease: "bounce.out" },
        "70%": { y: 0, opacity: 1 },
        "100%": { y: 300, scale: 0, opacity: 0, ease: "power2.in" }
      },
      duration: 4,
      stagger: { each: 0.05, from: "edges" },
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 overflow-visible ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-funnel-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPTriangleText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-triangle-char", {
      keyframes: {
        "0%": { x: 0, y: 0, opacity: 0 },
        "20%": { x: 0, y: 0, opacity: 1 },
        "60%": { x: 0, y: 0, opacity: 1 },
        "85%": { 
          x: (i) => (i % 3 === 0 ? 0 : i % 3 === 1 ? -120 : 120) + (Math.random()*10-5),
          y: (i) => (i % 3 === 0 ? -120 : 120) + (Math.random()*10-5),
          opacity: 1
        },
        "100%": { opacity: 0, scale: 3 }
      },
      duration: 4,
      stagger: 0.02,
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-triangle-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPSquareText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-square-char", {
      keyframes: {
        "0%": { x: 0, y: 0, opacity: 0 },
        "20%": { x: 0, y: 0, opacity: 1 },
        "60%": { x: 0, y: 0, opacity: 1 },
        "85%": { 
          x: (i) => (i % 4 === 0 || i % 4 === 3 ? -120 : 120),
          y: (i) => (i % 4 === 0 || i % 4 === 1 ? -120 : 120),
          opacity: 1
        },
        "100%": { opacity: 0, rotationY: 90 }
      },
      duration: 4,
      stagger: 0.02,
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-square-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPHeartText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-heart-char", {
      keyframes: {
        "0%": { x: 0, y: 0, opacity: 0 },
        "20%": { x: 0, y: 0, opacity: 1 },
        "60%": { x: 0, y: 0, opacity: 1 },
        "85%": { 
          x: (i) => 7.5 * (16 * Math.pow(Math.sin(i * 0.5), 3)), 
          y: (i) => -7.5 * (13 * Math.cos(i * 0.5) - 5 * Math.cos(2*i*0.5) - 2 * Math.cos(3*i*0.5) - Math.cos(4*i*0.5)),
          opacity: 1
        },
        "100%": { opacity: 0, scale: 2 }
      },
      duration: 4,
      stagger: 0.015,
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-heart-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPGlowText = ({ text, className, textColor, isMulti }: { text: string, className?: string, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');

  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-glow-char');
    
    gsap.set(chars, { opacity: 0, y: 30, scale: 0.8 });
    
    gsap.to(chars, {
      opacity: 1,
      y: 0,
      scale: 1,
      textShadow: `0 0 20px ${textColor || '#00f2ff'}`,
      duration: 0.8,
      stagger: 0.05,
      ease: "power3.out",
      onComplete: () => {
        gsap.to(chars, {
          textShadow: `0 0 5px ${textColor || '#00f2ff'}`,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });
  }, { scope: containerRef, dependencies: [text] });

  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-glow-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const GSAPFocusFlashText = ({ text, className, textColor, isMulti }: { text: string, className?: string, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ').filter(w => w.length > 0);
  
  const heroIndex = useMemo(() => {
    let maxLen = -1;
    let idx = 0;
    words.forEach((w, i) => {
      if (w.length > maxLen) {
        maxLen = w.length;
        idx = i;
      }
    });
    return idx;
  }, [words]);

  useGSAP(() => {
    if (!containerRef.current) return;
    const wordElements = containerRef.current.querySelectorAll('.gsap-focus-word');
    
    gsap.set(wordElements, { opacity: 0, scale: 0.5, filter: 'blur(10px)' });
    
    const tl = gsap.timeline();
    
    tl.to(wordElements, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.7)"
    });

    const others = Array.from(wordElements).filter((_, i) => i !== heroIndex);
    if (others.length > 0) {
      tl.to(others, {
        opacity: [1, 0, 1, 0, 1, 0],
        duration: 0.2,
        repeat: 3,
        ease: "none",
        delay: 1.0
      }).to(others, { opacity: 0, duration: 0.2 });
    }

    tl.to(wordElements[heroIndex], {
      scale: 1.4,
      textShadow: '0 0 40px rgba(255,255,255,0.9)',
      duration: 0.6,
      ease: "elastic.out(1, 0.3)"
    }, "-=0.2");

  }, { scope: containerRef, dependencies: [text] });

  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span 
          key={i} 
          className="gsap-focus-word inline-flex whitespace-pre" 
          style={{ ...getWordStyle(word, i, textColor, isMulti) }}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

const GSAPStackText = ({ text, className = "", style = {}, textColor, isMulti }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  useGSAP(() => {
    gsap.to(".gsap-stack-char", {
      keyframes: {
        "0%": { x: 0, y: -300, opacity: 0 },
        "20%": { x: 0, y: 0, opacity: 1, ease: "bounce.out" },
        "60%": { x: 0, y: 0, opacity: 1 },
        "100%": { x: () => (Math.random() - 0.5) * 500, y: 300, opacity: 0 }
      },
      duration: 4,
      stagger: 0.05,
      overwrite: "auto"
    });
  }, { scope: containerRef });
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex whitespace-pre" style={{ ...getWordStyle(word, i, textColor, isMulti) }}>
          {word.split('').map((char, j) => (
            <span key={j} className="gsap-stack-char inline-block whitespace-pre">{char}</span>
          ))}
        </span>
      ))}
    </div>
  );
};

const AnimatedCaption = ({ text, effect, className, style, textColor, isMulti }: { text: string, effect: TextEffect, className?: string, style?: any, textColor?: string, isMulti?: boolean }) => {
  const props = { text, className, style, textColor, isMulti };
  switch (effect) {
    case 'gsap-glow': return <GSAPGlowText {...props} />;
    case 'gsap-cascade': return <GSAPCascadeText {...props} />;
    case 'gsap-3d-roll': return <GSAP3DRollText {...props} />;
    case 'gsap-elastic': return <GSAPElasticText {...props} />;
    case 'gsap-expand': return <GSAPExpandText {...props} />;
    case 'gsap-tornado': return <GSAPTornadoText {...props} />;
    case 'gsap-merge-elastic': return <GSAPMergeElasticText {...props} />;
    case 'gsap-funnel': return <GSAPFunnelText {...props} />;
    case 'gsap-triangle': return <GSAPTriangleText {...props} />;
    case 'gsap-square': return <GSAPSquareText {...props} />;
    case 'gsap-heart': return <GSAPHeartText {...props} />;
    case 'gsap-stack': return <GSAPStackText {...props} />;
    case 'gsap-focus-flash': return <GSAPFocusFlashText {...props} />;
    default: return <SplitText {...props} />;
  }
};

const FilmGrainOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.035] mix-blend-overlay overflow-hidden">
      <svg className="w-full h-full">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <motion.div 
        animate={{ x: [0, -100, 100, -50, 0], y: [0, 50, -50, 100, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-100%] bg-white/5 opacity-20"
      />
    </div>
  );
};

const ThemedParallaxWorld = ({ theme, worldX, worldY }: { theme: string, worldX: any, worldY: any }) => {
  const images: Record<string, string> = {
    'world-flowers': '/worlds/flowers.png',
    'world-sunset': '/worlds/sunset.png',
    'world-cartoon-animals': '/worlds/animals.png',
    'world-forest': '/worlds/forest.png',
    'world-spaceship': '/worlds/spaceship.png',
    'world-tech': '/worlds/tech.png',
    'world-people': '/worlds/people.png',
    'world-vr': '/worlds/vr.png',
    'world-sports': '/worlds/sports.png',
    'world-tennis': '/worlds/tennis.png',
    'world-football': '/worlds/football.png'
  };

  const url = images[theme];
  if (!url) return null;

  const bgX = useTransform(worldX, (x: number) => x * 0.1);
  const bgY = useTransform(worldY, (y: number) => y * 0.1);
  const midX = useTransform(worldX, (x: number) => x * 0.4);
  const midY = useTransform(worldY, (y: number) => y * 0.4);
  const fgX = useTransform(worldX, (x: number) => x * 0.9);
  const fgY = useTransform(worldY, (y: number) => y * 0.9);

  return (
    <div className="absolute inset-[-1000px] pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {/* Background Layer (Far) */}
      <motion.div 
        style={{ x: bgX, y: bgY, z: -1500, scale: 12 }} 
        className="absolute inset-0 flex items-center justify-center"
      >
        <img src={url} className="w-full h-full object-cover opacity-40 blur-[2px]" alt="far" />
      </motion.div>

      {/* Mid Layer (Horizon) */}
      <motion.div 
        style={{ x: midX, y: midY, z: -800, scale: 8 }} 
        className="absolute inset-0 flex items-center justify-center"
      >
        <img src={url} className="w-full h-full object-cover opacity-80" alt="mid" />
      </motion.div>

      {/* Foreground Layer (Focus) */}
      <motion.div 
        style={{ x: fgX, y: fgY, z: -200, scale: 4 }} 
        className="absolute inset-0 flex items-center justify-center"
      >
        <img src={url} className="w-full h-full object-cover opacity-30 blur-[4px]" alt="near" />
      </motion.div>
    </div>
  );
};

const SceneBackground = ({ style, status, worldX, worldY }: { style?: BackgroundStyle, status: string, worldX?: any, worldY?: any }) => {
  if (!style || style === 'black') return (
    <>
      <FilmGrainOverlay />
    </>
  );

  const isThemedWorld = style.startsWith('world-');

  return (
    <>
      <FilmGrainOverlay />
      {isThemedWorld ? (
         <ThemedParallaxWorld theme={style} worldX={worldX} worldY={worldY} />
      ) : (
        <motion.div 
          className="absolute inset-[-1000%] pointer-events-none"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-500px) scale(8)', zIndex: -10, willChange: 'transform' }}
          animate={{ 
            opacity: status === 'active' ? 1 : 0.8
          }}
          transition={{ duration: 0.5 }}
        >
          {style === 'particles' && <ParticleTrails />}
        </motion.div>
      )}
    </>
  );
};

const PremiumParallaxBackground = ({ worldX, worldY }: { worldX: any, worldY: any }) => {
  const layer1X = useTransform(worldX, (x: number) => x * 0.2);
  const layer1Y = useTransform(worldY, (y: number) => y * 0.2);
  const layer2X = useTransform(worldX, (x: number) => x * 0.5);
  const layer2Y = useTransform(worldY, (y: number) => y * 0.5);
  const layer3X = useTransform(worldX, (x: number) => x * 0.8);
  const layer3Y = useTransform(worldY, (y: number) => y * 0.8);
  const layer4X = useTransform(worldX, (x: number) => x * 1.2);
  const layer4Y = useTransform(worldY, (y: number) => y * 1.2);

  return (
    <div className="absolute inset-[-500px] pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      <motion.div style={{ x: layer1X, y: layer1Y, z: -1000 }} className="absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:50px_50px]" />
      <motion.div style={{ x: layer2X, y: layer2Y, z: -500 }} className="absolute inset-0 flex items-center justify-center">
      </motion.div>
      <motion.div style={{ x: layer3X, y: layer3Y, z: -200 }} className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:200px_100%] opacity-30" />
      <motion.div style={{ x: layer4X, y: layer4Y, z: -100 }} className="absolute inset-0">
         {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 bg-brutal-green rounded-full shadow-[0_0_10px_#88ff00]" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
        ))}
      </motion.div>
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

const ParticleTrails = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-white via-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            z: (Math.random() * -800) - 100,
            opacity: [0, 1, 1, 0],
            scale: [0, Math.random() * 3 + 1, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
          style={{ transformStyle: 'preserve-3d' }}
        />
      ))}
    </div>
  );
};

const CartoonShapes = ({ status }: { status: 'past' | 'active' | 'future' }) => {
  const randomIndex = useMemo(() => Math.floor(Math.random() * 14), []);
  
  if (status !== 'active') return null;

  const shapes = [
    <motion.div
      key="shape-0"
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
    />,
    <motion.div
      key="shape-1"
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
    />,
    <motion.div
      key="shape-2"
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
    />,
    <motion.div
      key="shape-3"
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
    </motion.div>,
    <motion.div
      key="shape-4"
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
    />,
    <motion.div
      key="shape-5"
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
    </motion.div>,
    <motion.div
      key="shape-6"
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
    </motion.div>,
    <motion.div
      key="shape-7"
      className="absolute top-1/3 left-10 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-pink"
      initial={{ x: -800, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [-800, 100, 200, 800],
        y: [0, -200, 200, 0],
        rotateX: [0, 360, 720],
        rotateY: [0, 180, 360],
        rotateZ: [0, 90, 180],
        scale: [0, 1.5, 1.5, 0],
      }}
      transition={{ duration: 5.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.1 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Github size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-8"
      className="absolute bottom-1/3 right-10 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-blue"
      initial={{ x: 800, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [800, -100, -200, -800],
        y: [0, 200, -200, 0],
        rotateX: [0, -360, -720],
        rotateY: [0, -180, -360],
        rotateZ: [0, -90, -180],
        scale: [0, 1.6, 1.6, 0],
      }}
      transition={{ duration: 6.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.4 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Twitter size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-9"
      className="absolute top-20 right-20 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-orange"
      initial={{ x: 500, y: -500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [500, 0, -200, -800],
        y: [-500, 100, 300, 800],
        rotateX: [0, 180, 360],
        rotateY: [0, 360, 720],
        rotateZ: [0, 45, 90],
        scale: [0, 1.4, 1.4, 0],
      }}
      transition={{ duration: 5.5, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.3 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Youtube size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-10"
      className="absolute bottom-20 left-20 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-green"
      initial={{ x: -500, y: 500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [-500, 0, 200, 800],
        y: [500, -100, -300, -800],
        rotateX: [0, -180, -360],
        rotateY: [0, -360, -720],
        rotateZ: [0, -45, -90],
        scale: [0, 1.5, 1.5, 0],
      }}
      transition={{ duration: 6.1, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.5 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Figma size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-11"
      className="absolute top-1/2 left-1/4 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-purple"
      initial={{ x: -800, y: -200, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [-800, 0, 300, 1000],
        y: [-200, 100, -100, 200],
        rotateX: [0, 360, 720],
        rotateY: [0, 180, 360],
        rotateZ: [0, 90, 180],
        scale: [0, 1.3, 1.3, 0],
      }}
      transition={{ duration: 5.9, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.2 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Slack size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-12"
      className="absolute bottom-1/2 right-1/4 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-pink"
      initial={{ x: 800, y: 200, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [800, 0, -300, -1000],
        y: [200, -100, 100, -200],
        rotateX: [0, -360, -720],
        rotateY: [0, -180, -360],
        rotateZ: [0, -90, -180],
        scale: [0, 1.4, 1.4, 0],
      }}
      transition={{ duration: 6.3, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.6 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Instagram size={80} strokeWidth={1.5} />
    </motion.div>,
    <motion.div
      key="shape-13"
      className="absolute top-1/4 left-1/2 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] text-brutal-blue"
      initial={{ x: 0, y: -800, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
      animate={{
        x: [0, 200, -200, 0],
        y: [-800, 0, 300, 1000],
        rotateX: [0, 180, 360],
        rotateY: [0, 360, 720],
        rotateZ: [0, 45, 90],
        scale: [0, 1.5, 1.5, 0],
      }}
      transition={{ duration: 5.7, times: [0, 0.3, 0.7, 1], ease: "easeInOut", delay: 0.3 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Chrome size={80} strokeWidth={1.5} />
    </motion.div>
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
      {shapes[randomIndex]}
    </div>
  );
};

const MobileMockup = ({ children, status, variant = 0, isLandscape = false }: { children: React.ReactNode, status: string, variant?: number, isLandscape?: boolean }) => {
  const animations = [
    { 
      rotateY: [-30, 30, -30], 
      rotateX: [15, -10, 15], 
      z: [0, 150, 0],
      transition: { duration: 15, repeat: Infinity, ease: "easeInOut" }
    },
    {
      rotateY: [0, 360],
      scale: [0.8, 1.1, 0.8],
      transition: { duration: 20, repeat: Infinity, ease: "linear" }
    },
    {
      z: [0, 300, 0],
      rotateY: [-20, 20, -20],
      rotateX: [-10, 10, -10],
      transition: { duration: 12, repeat: Infinity, ease: "easeInOut" }
    },
    {
      x: [0, 40, -40, 0],
      rotateY: [-25, 25],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    }
  ];

  const currentAnim = animations[variant % animations.length];

  return (
    <div className="perspective-container" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
      <motion.div
        initial={{ rotateY: 90, opacity: 0, scale: 0.5, z: -500 }}
        animate={status === 'active' ? { 
          rotateY: currentAnim.rotateY,
          rotateX: currentAnim.rotateX,
          scale: 1, 
          opacity: 1, 
          z: 0 
        } : { rotateY: 90, opacity: 0, scale: 0.5, z: -500 }}
        transition={status === 'active' ? {
          rotateY: { type: 'spring', damping: 20, stiffness: 40 },
          scale: { duration: 1, ease: 'easeOut' },
          opacity: { duration: 0.8 },
          default: currentAnim.transition
        } : { duration: 0.5 }}
        className="relative bg-white brutal-border shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        style={{ transformStyle: 'preserve-3d', width: 320, height: 650 }}
      >
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black z-20 flex items-center justify-between px-2 brutal-border">
        <div className="w-2 h-2 bg-white brutal-border"></div>
        <div className="w-2 h-2 bg-brutal-green brutal-border"></div>
      </div>
      {/* Screen Content */}
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
        {children || (
          <div className="flex flex-col items-center justify-center gap-3 text-white/30">
            <div className="w-16 h-16 border-2 border-white/20 bg-white/5 flex items-center justify-center">
              <ImageIcon size={24} />
            </div>
            <p className="font-mono text-[10px] font-bold uppercase">App Preview</p>
          </div>
        )}
      </div>
    </motion.div>
    </div>
  );
};


const PremiumBackgroundStack = ({ style }: { style: BackgroundStyle }) => {
  if (style === 'geometry-morph') {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl"
            initial={{ 
              x: Math.random() * 2000 - 1000, 
              y: Math.random() * 2000 - 1000, 
              rotate: Math.random() * 360,
              scale: 0.5 + Math.random()
            }}
            animate={{
              x: [null, Math.random() * 2000 - 1000],
              y: [null, Math.random() * 2000 - 1000],
              rotate: [null, Math.random() * 360],
            }}
            transition={{ 
              duration: 20 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ 
              width: 200 + Math.random() * 400, 
              height: 200 + Math.random() * 400,
              boxShadow: '0 0 50px rgba(255,255,255,0.05)'
            }}
          />
        ))}
      </div>
    );
  }


  return null;
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




const CompositionNode = ({ 
  comp, 
  status, 
  fontSizeOverride,
  globalTextColor,
  globalIsMultiColor,
  globalFontFamily,
  socialHandle,
  websiteSiteName,
  worldX,
  worldY
}: { 
  key?: string; 
  comp: Composition; 
  status: 'past' | 'active' | 'future'; 
  fontSizeOverride?: string;
  globalTextColor: string;
  globalIsMultiColor: boolean;
  globalFontFamily: string;
  socialHandle: string;
  websiteSiteName: string;
  worldX: any;
  worldY: any;
}) => {
  const accentColor = globalTextColor || '#A855F7';
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
          future: { rotateY: 180, opacity: 0, scale: 0.5, transition: baseTransition },
          active: { rotateY: 0, opacity: 1, scale: 1, transition: baseTransition },
          past: { rotateY: -180, opacity: 0, scale: 0.5, transition: baseTransition }
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
      case '3d-flip':
        return {
          future: { rotateY: 90, scale: 0.8, opacity: 0, x: 500, transition: baseTransition },
          active: { rotateY: 0, scale: 1, opacity: 1, x: 0, transition: baseTransition },
          past: { rotateY: -90, scale: 0.8, opacity: 0, x: -500, transition: baseTransition }
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

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate3d(${comp.x}px, ${comp.y}px, ${comp.z}px) rotateX(${comp.rotX}deg) rotateY(${comp.rotY}deg) rotateZ(${comp.rotZ}deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div 
        className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" 
        style={{ transformStyle: 'preserve-3d' }}
        variants={transitionVariants}
        initial="future"
        animate={status}
      >
        
        <SceneBackground style={comp.activeBackground} status={status} worldX={worldX} worldY={worldY} />
        {comp.giphyStickerUrl && (
          <motion.div
            className="absolute z-50 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0, rotateZ: -15 }}
            animate={status === 'active' ? { 
              scale: 1.5, 
              opacity: 1, 
              rotateZ: 0 
            } : { 
              scale: 0, 
              opacity: 0, 
              rotateZ: -15 
            }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: status === 'active' ? 0.3 : 0 }}
          >
            <img
              src={comp.giphyStickerUrl}
              crossOrigin="anonymous"
              className="w-96 h-96 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            />
          </motion.div>
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {!['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post'].includes(comp.sceneType) && comp.media.map((m, i) => {
            const shapeStyle = getM3ShapeStyle(m.m3Shape, comp.caption);
            
            const mediaElement = m.url && (
              m.type === 'video' ? (
                <motion.video
                  src={m.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={m.isFullscreen ? "absolute inset-0 w-full h-full object-cover" : shapeStyle.className}
                  style={m.isFullscreen ? { zIndex: -1 } : shapeStyle.style}
                  onError={() => setHasError(true)}
                  animate={(status === 'active' && !m.isFullscreen) ? {
                    scale: [1, 1.05],
                    rotate: [(i % 2 === 0 ? 1 : -1), (i % 2 === 0 ? -1 : 1)],
                  } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                />
              ) : (
                <motion.img
                  src={m.url}
                  alt={comp.caption}
                  className={m.isFullscreen ? "absolute inset-0 w-full h-full object-cover" : shapeStyle.className}
                  style={m.isFullscreen ? { zIndex: -1 } : shapeStyle.style}
                  onError={() => setHasError(true)}
                  animate={(status === 'active' && !m.isFullscreen) ? {
                    scale: [1, 1.05],
                    rotate: [(i % 2 === 0 ? 1 : -1), (i % 2 === 0 ? -1 : 1)],
                  } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                />
              )
            );

            return (
              <motion.div
                key={i}
                className={m.isFullscreen ? "absolute inset-0 z-0" : "absolute z-10"}
                style={m.isFullscreen ? { width: '100%', height: '100%' } : { 
                  transformStyle: 'preserve-3d',
                  x: m.xOffset || 0,
                  y: m.yOffset || 0,
                  scale: m.scale || 1
                }}
              >
                {hasError ? (
                  <div className={shapeStyle.className} style={shapeStyle.style}>
                  </div>
                ) : (
                  comp.preset === 'app-showcase' ? (
                  <MobileMockup status={status} variant={i} isLandscape={m.url?.toLowerCase().includes('landscape') || (m.scale || 1) > 1.2}>
                    <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
                      {mediaElement}
                    </div>
                  </MobileMockup>
                ) : (
                  mediaElement
                )
              )}
            </motion.div>
          );
        })}
        </div>


        {['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post'].includes(comp.sceneType) && (
          <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center">
            <PremiumSocialOverlays
              type={comp.sceneType}
              status={status}
              caption={comp.caption}
              accentColor={accentColor}
              handle={socialHandle}
              name={websiteSiteName || "KasperMotion"}
            />
          </div>
        )}

        {comp.caption && status === 'active' && !['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post'].includes(comp.sceneType) && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)', z: 1000 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', z: 1000 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)', z: 1000 }}
            className={`absolute z-[300] flex flex-col items-center justify-center text-center px-8 transition-all duration-700 ${getTextPositionClass(comp.textPosition)}`}
          >
            <div className={`transform -rotate-2 ${comp.fontFamily || globalFontFamily} font-bold tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]`}>
              <AnimatedCaption 
                text={comp.caption} 
                effect={comp.textEffect} 
                className={fontSizeOverride || "text-4xl md:text-6xl"}
                textColor={comp.textColor || globalTextColor}
                isMulti={comp.isMultiColor || globalIsMultiColor}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
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
  const [isRenderingTrailer, setIsRenderingTrailer] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [textOnlyLines, setTextOnlyLines] = useState<Set<number>>(new Set());
  const [mediaMapping, setMediaMapping] = useState<Record<number, string>>({});
  const [useGiphy, setUseGiphy] = useState(false);

  // Detect share page from URL
  const getInitialMode = (): 'landing' | 'setup' | 'playing' | 'profile' | 'share' => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) return 'share';
    return 'landing';
  };
  const getShareVideoId = (): string | null => {
    const path = window.location.pathname;
    const match = path.match(/^\/share\/(.+)$/);
    return match ? match[1] : null;
  };

  const [appMode, setAppMode] = useState<'landing' | 'setup' | 'playing' | 'profile' | 'share'>(getInitialMode());
  const [shareVideoId, setShareVideoId] = useState<string | null>(getShareVideoId());
  const [lastShareUrl, setLastShareUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptText, setScriptText] = useState("");

  const [scrapeUrl, setScrapeUrl] = useState("https://");
  const [isScraping, setIsScraping] = useState(false);
  const [websiteSiteName, setWebsiteSiteName] = useState<string>('');
  
  const [fontStyle, setFontStyle] = useState<FontStyle>('font-sans');
  const [fontFamily, setFontFamily] = useState<FontFamily>('font-display');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [isMultiColor, setIsMultiColor] = useState<boolean>(false);
  const [selectedEffects, setSelectedEffects] = useState<TextEffect[]>(['gsap-glow']);
  const [textEffect, setTextEffect] = useState<TextEffect>('gsap-glow');
  const [preferredTextPosition, setPreferredTextPosition] = useState<TextPosition>('random');
  const [transitionType, setTransitionType] = useState<TransitionType>('zoom');
  const [transitionDuration, setTransitionDuration] = useState(1.2);
  const [textAnimationSpeed, setTextAnimationSpeed] = useState<number>(1.0);
  const [sceneDuration, setSceneDuration] = useState<number>(5.0);
  const [preset, setPreset] = useState<string>('custom');

  const [backgroundStyles, setBackgroundStyles] = useState<BackgroundStyle[]>(['black']);
  const [activeShaderTransition, setActiveShaderTransition] = useState<{
    name: string;
    fromUrl: string;
    toUrl: string;
    isActive: boolean;
    progress: number;
  }>({ name: 'whip-pan', fromUrl: '', toUrl: '', isActive: false, progress: 0 });

  const globalTransitionProgress = useMotionValue(0);

  const [dailyCreditsClaimed, setDailyCreditsClaimed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');

  const [socialHandle, setSocialHandle] = useState('@Handle');
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sceneStartTime, setSceneStartTime] = useState(Date.now());

  const currentComp = compositions[currentIndex];
  
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [isRecording, setIsRecording] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const setToastMessage = (msg: string | null) => {
    if (!msg) return;
    setNotifications(prev => prev.includes(msg) ? prev : [msg, ...prev]);
  };

  const [showGiphyModal, setShowGiphyModal] = useState(false);
  const [showExportExplainer, setShowExportExplainer] = useState(false);
  const [recordingKey, setRecordingKey] = useState(0);
  const [giphySearchQuery, setGiphySearchQuery] = useState('');
  const [giphySearchResults, setGiphySearchResults] = useState<any[]>([]);
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }

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
        if (dailyCreditsClaimed) return;
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const today = new Date().toISOString().split('T')[0];

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.lastRewardDate !== today) {
              const currentCredits = userData.credits || 0;
              if (currentCredits < 5) {
                await setDoc(userRef, { credits: 5, lastRewardDate: today }, { merge: true });
                setToastMessage("Daily Refresh: Your credits have been topped up to 5!");
              } else {
                await setDoc(userRef, { lastRewardDate: today }, { merge: true });
              }
              setDailyCreditsClaimed(true);
            } else {
              setDailyCreditsClaimed(true);
            }
          } else {
            await setDoc(userRef, { credits: 20, lastRewardDate: today }, { merge: true });
            setToastMessage("Welcome! You received 20 initial credits.");
            setDailyCreditsClaimed(true);
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
      
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out.")), 10000);
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


  const saveProject = async (isAutoSave = false) => {
    if (!user) {
      if (!isAutoSave) {
        setToastMessage("Please login to save your project.");
        setTimeout(() => setToastMessage(null), 3000);
      }
      return;
    }
    
    if (mediaFiles.length === 0 && !scriptText.trim()) return;

    if (!isAutoSave) setIsSaving(true);
    try {
      let updatedMediaFiles = false;
      const newMediaFiles = [...mediaFiles];

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
              ...(giphyStickerUrl && { giphyStickerUrl }),
              ...(stickerScale && { stickerScale }),
              ...(stickerX !== undefined && { stickerX }),
              ...(stickerY !== undefined && { stickerY })
            };
          } catch (uploadErr) {
            console.error("File upload failed for:", item.name, uploadErr);
            return {
              url: item.url,
              type: item.type,
              name: item.name,
              caption: scriptText.split('\n')[i] || '',
              ...(giphyStickerUrl && { giphyStickerUrl }),
              ...(stickerScale && { stickerScale }),
              ...(stickerX !== undefined && { stickerX }),
              ...(stickerY !== undefined && { stickerY })
            };
          }
        } else {
          return {
            url: item.url,
            type: item.type,
            name: item.name,
            caption: scriptText.split('\n')[i] || '',
            ...(giphyStickerUrl && { giphyStickerUrl }),
            ...(stickerScale && { stickerScale }),
            ...(stickerX !== undefined && { stickerX }),
            ...(stickerY !== undefined && { stickerY })
          };
        }
      }));

      if (updatedMediaFiles) {
        setMediaFiles(newMediaFiles);
      }

      const trailerData: any = {
        userId: user.uid,
        name: `Trailer ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}${isAutoSave ? ' (Auto-saved)' : ''}`,
        script: scriptText,
        settings: {
          fontStyle,
          backgroundStyles,
          textEffect,
          selectedEffects,
          transitionType,
          transitionDuration,
          textAnimationSpeed,
          sceneDuration,
          backgroundStyles,
          preset: preset || 'custom',
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
    const loadedBackgrounds = Array.isArray(project.settings.backgroundStyles) 
      ? project.settings.backgroundStyles 
      : (project.settings.backgroundStyle ? [project.settings.backgroundStyle] : ['black']);
    setBackgroundStyles(loadedBackgrounds);
    setTextEffect(project.settings.textEffect || 'gsap-glow');
    setSelectedEffects(project.settings.selectedEffects || [project.settings.textEffect || 'gsap-glow']);
    setTransitionType(project.settings.transitionType);
    setTransitionDuration(project.settings.transitionDuration);
    setTextAnimationSpeed(project.settings.textAnimationSpeed || 1.0);
    setSceneDuration(project.settings.sceneDuration || 5.0);


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
    
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;
    project.media.forEach((m: any, i: number) => {
      const isTextOnly = new Set(project.settings.textOnlyLines || []).has(i);
      const comp = generateCompositionFromData([m], i, project.settings.textEffect, project.settings.transitionType, project.settings.transitionDuration, prev, isTextOnly, project.settings.preset, loadedBackgrounds, m.giphyStickerUrl, m.stickerScale, m.stickerX, m.stickerY);
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

  const handleToggleFullscreen = (sceneIdx: number, mediaIdx: number) => {
    setCompositions(prev => prev.map((c, i) => {
      if (i !== sceneIdx) return c;
      const newMedia = [...c.media];
      newMedia[mediaIdx] = { 
        ...newMedia[mediaIdx], 
        isFullscreen: !newMedia[mediaIdx].isFullscreen 
      };
      return { ...c, media: newMedia };
    }));
  };

  const handleAnimateAsset = async (sceneIdx: number, mediaIdx: number) => {
    const comp = compositions[sceneIdx];
    const media = comp.media[mediaIdx];
    
    if (media.type !== 'image' || !media.url) return;

    // Set animating state
    setCompositions(prev => prev.map((c, i) => {
      if (i !== sceneIdx) return c;
      const newMedia = [...c.media];
      newMedia[mediaIdx] = { ...newMedia[mediaIdx], isAnimating: true };
      return { ...c, media: newMedia };
    }));

    try {
      const response = await fetch('/api/animate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: media.url })
      });

      const data = await response.json();
      if (data.videoUrl) {
        setCompositions(prev => prev.map((c, i) => {
          if (i !== sceneIdx) return c;
          const newMedia = [...c.media];
          newMedia[mediaIdx] = { 
            ...newMedia[mediaIdx], 
            url: data.videoUrl, 
            type: 'video', 
            isAnimating: false 
          };
          return { ...c, media: newMedia };
        }));
        setToastMessage("AI Animation complete!");
      } else {
        throw new Error(data.error || "Animation failed");
      }
    } catch (err: any) {
      setToastMessage(err.message);
      setCompositions(prev => prev.map((c, i) => {
        if (i !== sceneIdx) return c;
        const newMedia = [...c.media];
        newMedia[mediaIdx] = { ...newMedia[mediaIdx], isAnimating: false };
        return { ...c, media: newMedia };
      }));
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
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

  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const camZ = useMotionValue(0);
  
  const artistryX = useMotionValue(0);
  const artistryY = useMotionValue(0);
  const artistryZ = useMotionValue(0);
  
  const userRotX = useMotionValue(0);
  const userRotY = useMotionValue(0);
  const userPanX = useMotionValue(0);
  const userPanY = useMotionValue(0);

  const smoothX = useSpring(camX, { damping: 26, stiffness: 220, mass: 1 });
  const smoothY = useSpring(camY, { damping: 26, stiffness: 220, mass: 1 });
  const smoothZ = useSpring(camZ, { damping: 26, stiffness: 220, mass: 1 });

  const smoothArtX = useSpring(artistryX, { damping: 30, stiffness: 100 });
  const smoothArtY = useSpring(artistryY, { damping: 30, stiffness: 100 });
  const smoothArtZ = useSpring(artistryZ, { damping: 30, stiffness: 100 });
  
  const smoothRotX = useSpring(userRotX, { damping: 50, stiffness: 150 });
  const smoothRotY = useSpring(userRotY, { damping: 50, stiffness: 150 });
  const smoothPanX = useSpring(userPanX, { damping: 50, stiffness: 150 });
  const smoothPanY = useSpring(userPanY, { damping: 50, stiffness: 150 });

  const wiggleX = useMotionValue(0);
  const wiggleY = useMotionValue(0);

  useEffect(() => {
    if (appMode === 'playing') {
      const interval = setInterval(() => {
        const now = Date.now();
        wiggleX.set((Math.random() - 0.5) * 40);
        wiggleY.set((Math.random() - 0.5) * 40);
        
        const time = now / 2000;
        userPanX.set(Math.sin(time) * 15);
        userPanY.set(Math.cos(time * 0.8) * 15);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [appMode, sceneStartTime]);

  const smoothWiggleX = useSpring(wiggleX, { damping: 20, stiffness: 50 });
  const smoothWiggleY = useSpring(wiggleY, { damping: 20, stiffness: 50 });

  const velX = useVelocity(smoothX);
  const velY = useVelocity(smoothY);
  const velZ = useVelocity(smoothZ);

  const cameraFilter = useTransform([velX, velY, velZ], ([vx, vy, vz]) => {
    const speed = Math.sqrt(Math.pow(Number(vx), 2) + Math.pow(Number(vy), 2) + Math.pow(Number(vz), 2));
    const blurAmount = Math.min(speed / 120, 15); 
    const caAmount = Math.min(speed / 80, 8);
    
    if (speed < 5) return `blur(0px)`;
    
    return `blur(${blurAmount}px) drop-shadow(${caAmount}px 0px 0px rgba(255,0,0,0.6)) drop-shadow(-${caAmount}px 0px 0px rgba(0,255,255,0.6))`;
  });

  const worldX = useTransform([smoothX, smoothPanX, smoothWiggleX, smoothArtX], ([x, px, wx, ax]) => Number(x) + Number(px) + Number(wx) + Number(ax));
  const worldY = useTransform([smoothY, smoothPanY, smoothWiggleY, smoothArtY], ([y, py, wy, ay]) => Number(y) + Number(py) + Number(wy) + Number(ay));
  const worldZ = useTransform([smoothZ, smoothArtZ], ([z, az]) => Number(z) + Number(az));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const sequenceActiveRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (appMode === 'playing' && currentComp) {
      camX.set(windowSize.w / 2 - currentComp.x);
      camY.set(windowSize.h / 2 - currentComp.y);
      camZ.set(-currentComp.z);
      setSceneStartTime(Date.now());
      artistryX.set(0);
      artistryY.set(0);
      artistryZ.set(0);
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
      userPanX.set(userPanX.get() + dx * 2);
      userPanY.set(userPanY.get() + dy * 2);
    } else {
      userRotY.set(userRotY.get() + dx * 0.2);
      userRotX.set(userRotX.get() - dy * 0.2);
    }
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const resetCamera = () => {
    userRotX.set(0);
    userRotY.set(0);
    userPanX.set(0);
    userPanY.set(0);
  };

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

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appMode === 'playing' && !isRecording && compositions.length > 0) {
      const hasText = currentComp?.caption && currentComp.caption.trim().length > 0;
      const animDuration = hasText ? (4 / textAnimationSpeed) * 1000 : 0;
      const effectiveSceneDuration = hasText ? animDuration + 500 : 500;
      
      timer = setTimeout(() => {
        const nextIdx = (currentIndex + 1) % compositions.length;
        const currentComp = compositions[currentIndex];
        const nextComp = compositions[nextIdx];
        const shaderList = [
          'fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract', 'random',
          'domain-warp', 'ridged-burn', 'whip-pan', 'sdf-iris', 'ripple-waves', 'gravitational-lens',
          'cinematic-zoom', 'chromatic-split', 'glitch', 'swirl-vortex', 'thermal-distortion',
          'flash-through-white', 'cross-warp-morph', 'light-leak', 'hyper-blocks', 'hyper-wipe'
        ];
        
        const isShaderTrans = shaderList.includes(nextComp.transitionType);

        if (isShaderTrans) {
          globalTransitionProgress.set(0);
          setActiveShaderTransition({
            name: nextComp.transitionType,
            fromUrl: currentComp.media[0]?.url || '',
            toUrl: nextComp.media[0]?.url || '',
            isActive: true,
            progress: 0
          });

          gsap.to({}, {
            duration: (nextComp.transitionDuration || 1200) / 1000,
            onUpdate: function() {
              const p = this.progress();
              globalTransitionProgress.set(p);
              setActiveShaderTransition(prev => ({ ...prev, progress: p }));
            },
            onComplete: () => {
              setActiveShaderTransition(prev => ({ ...prev, isActive: false, progress: 0 }));
            }
          });
        }

        setCurrentIndex(nextIdx);
      }, effectiveSceneDuration); 
    }
    return () => clearTimeout(timer);
  }, [appMode, isRecording, compositions, sceneDuration, textAnimationSpeed, currentIndex, currentComp]);

  const [addingAssetToSceneIdx, setAddingAssetToSceneIdx] = useState<number | null>(null);
  
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
    if (addingAssetToSceneIdx !== null) {
      const asset = libraryAssets.find(a => a.id === id);
      if (asset) {
        setCompositions(prev => prev.map((c, i) => {
          if (i !== addingAssetToSceneIdx) return c;
          return {
            ...c,
            media: [...c.media, { id: asset.id, url: asset.url, type: asset.type, name: asset.name }]
          };
        }));
        setAddingAssetToSceneIdx(null);
        setShowLibrary(false);
        setToastMessage("Layer added to scene from library!");
      }
      return;
    }

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
        
        if (data.siteName) {
          setWebsiteSiteName(data.siteName);
        }
        
        setToastMessage("Content fetched — script & assets ready!");
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

  const generateWorld = async () => {
    if (mediaFiles.length === 0 && !scriptText.trim()) {
      setToastMessage("Please add some media files or write a script first.");
      return;
    }

    const isAdmin = user?.email === 'philipsimmons67@gmail.com';

    if (!isAdmin && credits < 1) {
      setShowPricing(true);
      return;
    }

    setIsRenderingTrailer(true);
    setRenderProgress(0);
    
    const scriptLines = scriptText.split('\n').filter(line => line.trim() !== '');
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;

    const effectsPool = selectedEffects.length > 0 ? selectedEffects : (['gsap-glow'] as TextEffect[]);
    
    for (let sceneIdx = 0; sceneIdx < scriptLines.length; sceneIdx++) {
      const existingComp = compositions[sceneIdx];
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
      
      let activeEffect = effectsPool[sceneIdx % effectsPool.length];

      const transitions: TransitionType[] = ['random', 'fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract', '3d-flip', 'domain-warp', 'ridged-burn', 'whip-pan', 'sdf-iris', 'ripple-waves', 'gravitational-lens', 'cinematic-zoom', 'chromatic-split', 'glitch', 'swirl-vortex', 'thermal-distortion', 'flash-through-white', 'cross-warp-morph', 'light-leak'];
      const activeTransition = transitionType === 'random' ? transitions[Math.floor(Math.random() * (transitions.length - 1)) + 1] : transitionType;

      const comp = generateComposition(
        sceneItems, 
        sceneIdx, 
        caption, 
        preferredTextPosition, 
        activeEffect, 
        activeTransition, 
        transitionDuration, 
        prev,
        isTextOnly,
        preset,
        backgroundStyles,
        undefined,
        fontFamily,
        textColor,
        isMultiColor
      );
      
      if (existingComp) {
        comp.sceneType = existingComp.sceneType;
      }
      
      newComps.push(comp);
      prev = comp;

      if (useGiphy && caption && sceneIdx % 3 === 0) {
        try {
          const words = caption.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
          const searchTerm = words.slice(0, 2).join(' ') || words[0] || 'dynamic';
          const { data } = await gf.search(searchTerm, { type: 'stickers', limit: 1 });
          
          if (data && data.length > 0) {
            const stickerUrl = data[0].images.original.url;
            const giphyComp = generateComposition(
              [],
              sceneIdx + 100, 
              searchTerm.toUpperCase(), 
              'center', 
              effectsPool[(sceneIdx + 1) % effectsPool.length], 
              'zoom', 
              transitionDuration, 
              prev,
              isTextOnly,
              preset,
              backgroundStyles,
              stickerUrl,
              fontFamily,
              textColor,
              isMultiColor
            );
            newComps.push(giphyComp);
            prev = giphyComp;
          }
        } catch (err) {
          console.error("Giphy logic error:", err);
        }
      }
      
      setRenderProgress(Math.min(((sceneIdx / Math.max(scriptLines.length, 1)) * 100), 100));
      await new Promise(r => setTimeout(r, 100));
    }

    const mappedMediaIds = new Set(Object.values(mediaMapping));
    const unmappedMedia = mediaFiles.filter(m => !mappedMediaIds.has(m.id));
    
    for (let i = 0; i < unmappedMedia.length; i++) {
      const m = unmappedMedia[i];
      const comp = generateComposition(
        [m], 
        scriptLines.length + i, 
        '', 
        preferredTextPosition, 
        effectsPool[i % effectsPool.length], 
        transitionType, 
        transitionDuration, 
        prev,
        false,
        preset,
        backgroundStyles
      );
      newComps.push(comp);
      prev = comp;
    }

    setCompositions(newComps);
    setCurrentIndex(0);
    
    if (newComps.length > 0) {
      try {
        const isAdmin = user?.email === 'philipsimmons67@gmail.com';
        if (user && !isAdmin) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { credits: Math.max(0, credits - 1) }, { merge: true });
          setToastMessage("Trailer generated! 1 credit used.");
        } else if (isAdmin) {
          setToastMessage("Admin access: Trailer generated without credit deduction!");
        }
        
        setTimeout(() => {
          setIsRenderingTrailer(false);
          setAppMode('playing');
          setCurrentIndex(0);
        }, 800);
      } catch (err) {
        console.error("Credit deduction failed:", err);
        setIsRenderingTrailer(false);
        setToastMessage("Generation error. No credits used.");
      }
    } else {
      setIsRenderingTrailer(false);
      setToastMessage("Failed to generate trailer.");
    }
  };

  const generateCompositionFromData = (media: any[], index: number, effect: TextEffect, tType: TransitionType, tDur: number, prevComp?: Composition, isTextOnly?: boolean, preset?: string, backgroundStyles?: string[], giphyStickerUrl?: string, stickerScale?: number, stickerX?: number, stickerY?: number): Composition => {
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
      sceneType: 'standard',
      textEffect: effect,
      transitionType: tType,
      transitionDuration: tDur,
      isTextOnly,
      preset,
      backgroundStyles,
      activeBackground: backgroundStyles && backgroundStyles.length > 0 ? (backgroundStyles[index % backgroundStyles.length] as BackgroundStyle) : 'black',
      giphyStickerUrl,
      stickerScale,
      stickerX,
      stickerY,
      transitionItemAsset: findBestTransitionItem(media[0]?.caption || '') || undefined
    };
  };

  const startRecording = async () => {
    const isAdmin = user?.email === 'philipsimmons67@gmail.com';
    if (!isAdmin && credits < 2) {
      setShowPricing(true);
      return;
    }
    try {
      setShowExportExplainer(false);
      const resConstraints = {
        '4K': { width: 3840, height: 2160 },
        '1080p': { width: 1920, height: 1080 },
        '720p': { width: 1280, height: 720 }
      }[exportResolution] || { width: 1920, height: 1080 };

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

      mediaRecorder.onstop = async () => {
        sequenceActiveRef.current = false;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // 1. Download locally
        const localUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = localUrl;
        const ext = exportFormat === 'mov' ? 'mov' : (exportFormat === 'mp4' ? 'mp4' : 'webm');
        a.download = `motion-trailer-${exportResolution}.${ext}`;
        a.click();
        URL.revokeObjectURL(localUrl);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
        document.body.style.cursor = 'default';
        const header = document.querySelector('header');
        if (header) (header as HTMLElement).style.display = '';

        // 2. Upload to server for shareable link
        try {
          setIsUploadingVideo(true);
          setToastMessage('Generating shareable link...');
          const uploadRes = await fetch('/api/video/upload', {
            method: 'POST',
            headers: {
              'Content-Type': mimeType.split(';')[0],
              'x-user-id': user?.uid || '',
              'x-video-title': websiteSiteName || 'Motion Trailer',
            },
            body: blob
          });
          
          if (uploadRes.ok) {
            const { shareUrl } = await uploadRes.json();
            setLastShareUrl(shareUrl);
            setToastMessage(`Video shared! Link copied to clipboard.`);
            navigator.clipboard.writeText(shareUrl).catch(() => {});
          } else {
            setToastMessage('Video saved locally. Share upload failed.');
          }
        } catch (err) {
          console.error('Video upload failed:', err);
          setToastMessage('Video saved locally. Share upload failed.');
        } finally {
          setIsUploadingVideo(false);
          setTimeout(() => setToastMessage(null), 6000);
        }
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      document.body.style.cursor = 'none';
      const header = document.querySelector('header');
      if (header) (header as HTMLElement).style.display = 'none';
      
      const countdownEl = document.createElement('div');
      countdownEl.className = 'recording-countdown';
      countdownEl.innerHTML = '<span>3</span>';
      document.body.appendChild(countdownEl);
      await new Promise(r => setTimeout(r, 1000));
      countdownEl.innerHTML = '<span>2</span>';
      await new Promise(r => setTimeout(r, 1000));
      countdownEl.innerHTML = '<span>1</span>';
      await new Promise(r => setTimeout(r, 1000));
      countdownEl.remove();
      
      await new Promise(r => setTimeout(r, 1000));

      setIsRecording(true);
      setRecordingKey(prev => prev + 1);
      setCurrentIndex(0);
      setRecordingProgress(0);

      await new Promise(r => setTimeout(r, 100));
      mediaRecorder.start();
      
      for (let i = 0; i < compositions.length; i++) {
        if (!sequenceActiveRef.current) break;
        
        setCurrentIndex(i);
        setRecordingProgress((i / compositions.length) * 100);
        
        const hasText = compositions[i].caption && compositions[i].caption.trim().length > 0;
        const animDuration = hasText ? (4 / textAnimationSpeed) * 1000 : 0;
        const effectiveSceneDuration = Math.max(sceneDuration * 1000, hasText ? animDuration + 1500 : 0);

        await new Promise(r => setTimeout(r, effectiveSceneDuration)); 
      }

      if (sequenceActiveRef.current) {
        setRecordingProgress(100);
        const finalAnimDuration = (4 / textAnimationSpeed) * 1000;
        await new Promise(r => setTimeout(r, Math.max(2000, finalAnimDuration))); 
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        if (user && !isAdmin) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { credits: Math.max(0, credits - 2) }, { merge: true });
          setToastMessage("Export complete! 2 credits used.");
        }
      }

    } catch (err) {
      console.error("Recording failed", err);
      setToastMessage("Screen recording requires opening the app in a new tab. Click the 'Open in new tab' icon in the top right of the preview.");
      setTimeout(() => setToastMessage(null), 8000);
    }
  };

  const renderContent = () => {
    if (appMode === 'share' && shareVideoId) {
      return (
        <SharePage 
          videoId={shareVideoId} 
          onGoHome={() => {
            window.history.pushState({}, '', '/');
            setAppMode('landing');
            setShareVideoId(null);
          }} 
        />
      );
    }

    if (appMode === 'landing') {
      return (
        <LandingPage onStart={async () => {
          if (!user) {
            const loggedInUser = await handleLogin();
            if (loggedInUser) {
              setAppMode('setup');
            }
          } else {
            setAppMode('setup');
          }
        }} />
      );
    }

    if (appMode === 'profile') {
      return (
        <ProfilePage
          user={user}
          credits={credits}
          libraryAssets={libraryAssets}
          userTrailers={userTrailers}
          onLoadProject={loadProject}
          onDeleteProject={deleteProject}
          onDeleteAsset={deleteLibraryAsset}
          onUseAssetInProject={(assets) => {
            addFromLibrary(assets);
            setAppMode('setup');
            setSetupStep(1);
          }}
          notifications={notifications}
          onShowPricing={() => setShowPricing(true)}
        />
      );
    }

    if (appMode === 'setup') {
      return (
        <div className="min-h-screen bg-mesh-gradient bg-dot-grid text-white font-sans flex items-start md:items-center justify-center p-4 md:p-6 pt-16 overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 md:p-12 my-auto max-h-[85vh] overflow-y-auto custom-scrollbar relative">
            <AnimatePresence>
              {(isUploading || isSaving) && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-indigo-600/90 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-white/20"
                >
                  <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div>
                  <p className="text-white font-display font-bold uppercase text-xl px-4 py-2">
                    {isUploading && "Uploading assets..."}
                    {isSaving && "Saving project..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-white/10 pb-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2 text-white">Create Trailer</h1>
                <p className="text-white font-mono text-xs md:text-sm font-bold bg-white/10 inline-block px-3 py-1 rounded-full border border-white/10 mb-4">Step {setupStep} of 4</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(step => (
                  <div 
                    key={step} 
                    className={`w-6 h-1.5 rounded-full transition-all duration-300 ${setupStep >= step ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-white/10'}`} 
                  />
                ))}
              </div>
            </div>

          {setupStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><ImageIcon size={20} /></div> Step 1: Add Media
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {mediaFiles.map((item, i) => (
                  <div key={i} className="relative aspect-square glass-panel overflow-hidden group rounded-xl border border-white/10">
                    <MediaThumbnail item={item} />
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex flex-col gap-2">
                  <label className="flex-1 aspect-square glass-panel bg-white/5 hover:bg-white/10 border-2 border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-white/40 hover:text-white">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs uppercase font-sans font-bold tracking-wider">Upload</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={() => setShowLibrary(true)}
                    className="elite-button h-10 flex items-center justify-center gap-2 text-xs rounded-lg"
                  >
                    <History size={14} /> Library
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-mono font-bold uppercase mb-2 text-black/60">Brand / Site Name</label>
                <div className="relative group">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 group-focus-within:text-brutal-purple transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g. KasperMotion" 
                    className="elite-input w-full py-4 pl-12 pr-6 text-lg font-bold bg-white/5"
                    value={websiteSiteName}
                    onChange={(e) => setWebsiteSiteName(e.target.value)}
                  />
                  <div className="mt-2 text-[10px] font-mono font-bold text-gray-400 uppercase">
                    This name will appear on social cards and other branded layouts.
                  </div>
                </div>
              </div>


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
                      className="glass-panel w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl rounded-3xl"
                    >
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-indigo-600/50 backdrop-blur-md">
                        <h3 className="text-2xl font-display font-bold uppercase flex items-center gap-3 text-white">
                          <History size={24} /> Your Asset Library
                        </h3>
                        <button onClick={() => setShowLibrary(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
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
                          IMPORT SELECTED ({selectedLibraryAssets.size})
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>


              <div className="flex justify-end mt-8">
                <button 
                  onClick={() => setSetupStep(2)}
                  className="elite-button px-10 py-4 text-xl flex items-center gap-3 rounded-full"
                >
                  Continue <ArrowRight size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {setupStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><FileText size={20} /></div> Step 2: Add Script
              </h2>
              
              <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-white/50">AI URL Scraper (Optional)</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input 
                      type="url" 
                      placeholder="https://example.com/article" 
                      className="elite-input w-full py-3 pl-10 pr-4 text-sm bg-white/5"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleScrape}
                    disabled={isScraping || !scrapeUrl}
                    className="elite-button px-6 py-2 text-sm flex items-center justify-center gap-2 rounded-xl disabled:opacity-50"
                  >
                    {isScraping ? <Loader2 size={18} className="animate-spin" /> : 'Fetch Content'}
                  </button>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-4 font-medium">Each line of text will be displayed as a caption for the corresponding media file.</p>
              
              <textarea
                className="elite-input w-full p-6 font-sans text-sm resize-none h-48 mb-6 bg-white/5"
                placeholder="Line 1: Welcome to the presentation&#10;Line 2: Here is our first product&#10;Line 3: Notice the sleek design..."
                value={scriptText}
                onChange={(e) => handleScriptChange(e.target.value)}
              />

              <div className="flex justify-between mt-10">
                <button 
                  onClick={() => setSetupStep(1)}
                  className="px-8 py-3 font-bold text-white/60 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleGoToMapping}
                  className="elite-button px-10 py-3 text-lg flex items-center gap-2 rounded-full"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><LinkIcon size={20} /></div> Step 3: Link Media to Text
              </h2>
              
              <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {scriptText.split('\n').filter(l => l.trim().length > 0).map((line, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 glass-panel p-5 rounded-2xl border border-white/5">
                    <div className="flex-1 text-sm text-white/80 font-medium flex items-center">
                      <span className="bg-indigo-500 text-white w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs mr-4 shrink-0 shadow-lg shadow-indigo-500/20">{idx + 1}</span>
                      {line}
                    </div>
                    <div className="flex items-center gap-4 md:w-1/3">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40 whitespace-nowrap cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={textOnlyLines.has(idx)}
                          onChange={() => toggleTextOnly(idx)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20"
                        />
                        Text Only
                      </label>
                      
                      {!textOnlyLines.has(idx) && (
                        <select
                          value={mediaMapping[idx] || ''}
                          onChange={(e) => setMediaMapping(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="elite-input flex-1 px-3 py-2 text-xs bg-white/5 border border-white/10"
                        >
                          <option value="">Select Media...</option>
                          {mediaFiles.map(m => (
                            <option key={m.id} value={m.id} className="bg-zinc-900">{m.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-10">
                <button 
                  onClick={() => setSetupStep(2)}
                  className="px-8 py-3 font-bold text-white/60 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setSetupStep(4)}
                  className="elite-button px-10 py-3 text-lg flex items-center gap-2 rounded-full"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {setupStep === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-2 md:py-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6 text-indigo-400">
                <Sparkles size={32} />
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-2 text-center tracking-tight text-white uppercase">Finalize & Preview</h2>
              <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-10 text-center font-bold">Loaded {mediaFiles.length} media files and {scriptText.split('\n').filter(l => l.trim()).length} script lines.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-indigo-400">Typography System</h3>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="elite-input w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl"
                  >
                    {[
                      { val: 'font-display', label: 'Space Grotesk' },
                      { val: 'font-sans', label: 'Inter' },
                      { val: 'font-serif', label: 'Playfair Display' },
                      { val: 'font-mono', label: 'JetBrains Mono' },
                      { val: 'font-archivo', label: 'Archivo Black' },
                      { val: 'font-bebas', label: 'Bebas Neue' },
                      { val: 'font-outfit', label: 'Outfit' },
                      { val: 'font-syne', label: 'Syne' },
                      { val: 'font-unbounded', label: 'Unbounded' },
                      { val: 'font-kanit', label: 'Kanit' },
                      { val: 'font-public', label: 'Public Sans' },
                      { val: 'font-work', label: 'Work Sans' },
                      { val: 'font-montserrat', label: 'Montserrat' },
                      { val: 'font-impact', label: 'Impact Display' },
                      { val: 'font-pixel', label: 'Pixel Press (8-bit)' },
                      { val: 'font-pixel-arcade', label: 'Arcade Silk' },
                      { val: 'font-righteous', label: 'Retro Righteous' },
                      { val: 'font-space-tech', label: 'Space Technical' },
                      { val: 'font-bangers', label: 'Bangers Comic' }
                    ].map(f => (
                      <option key={f.val} value={f.val} className={`${f.val} bg-zinc-900 border-none`}>{f.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-purple-400">Visual Controls</h3>
                  <div className="flex gap-4">
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-white/5 border border-white/10 p-1 hover:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer flex-1 glass-panel-light px-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                      <input 
                        type="checkbox" 
                        checked={isMultiColor}
                        onChange={(e) => setIsMultiColor(e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Multicolors</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-pink-400">Background Atmosphere</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(['black', 'vibrant-glow', 'particles', 'gradient-teal', 'gradient-rose', 'gradient-amber', 'gradient-emerald', 'gradient-indigo', 'gradient-slate', 'deep-ocean', 'sunset-fire', 'midnight', 'premium-parallax', 'textured-paper'] as BackgroundStyle[]).map(bg => (
                      <button
                        key={bg}
                        onClick={() => {
                          setBackgroundStyles(prev => 
                            prev.includes(bg) ? prev.filter(s => s !== bg) : [...prev, bg]
                          );
                        }}
                        className={`px-3 py-3 text-left rounded-xl border transition-all capitalize text-[11px] font-bold relative ${backgroundStyles.includes(bg) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                      >
                        {bg.replace('-', ' ')}
                        {backgroundStyles.includes(bg) && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Kinetic Motion Profiles</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedEffects(['gsap-cascade', 'gsap-3d-roll', 'gsap-elastic', 'gsap-expand', 'gsap-tornado', 'gsap-merge-elastic', 'gsap-funnel', 'gsap-triangle', 'gsap-square', 'gsap-heart', 'gsap-stack', 'gsap-glow', 'gsap-focus-flash'])}
                        className="text-[9px] uppercase font-bold text-white/30 hover:text-white transition-colors border border-white/5 px-2 py-1 rounded"
                      >
                        Select All
                      </button>
                      <button 
                        onClick={() => setSelectedEffects([])}
                        className="text-[9px] uppercase font-bold text-white/30 hover:text-white transition-colors border border-white/5 px-2 py-1 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase text-gray-500 mb-2">Advanced Cinematic (GSAP)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {[
                          'gsap-cascade', 'gsap-3d-roll', 'gsap-elastic', 'gsap-expand', 
                          'gsap-tornado', 'gsap-merge-elastic', 'gsap-funnel', 'gsap-triangle', 
                          'gsap-square', 'gsap-heart', 'gsap-stack', 'gsap-glow', 'gsap-focus-flash'
                        ].map((effect: any) => (
                          <button
                            key={effect}
                            onClick={() => {
                              setSelectedEffects(prev => 
                                prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
                              );
                            }}
                            className={`px-3 py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${selectedEffects.includes(effect) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                          >
                            {effect.replace('gsap-', '').replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                  
                  {selectedEffects.length === 0 && (
                    <p className="mt-3 text-[10px] font-mono font-bold text-red-500 uppercase animate-pulse">
                      Warning: No animations selected. Defaulting to GSAP Glow.
                    </p>
                  )}
                  <p className="mt-2 text-[10px] font-mono font-bold text-gray-400 uppercase">
                    The engine will cycle through your {selectedEffects.length} selected animations across your trailer scenes.
                  </p>
                </div>
                <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-amber-400">Text Position</h3>
                  <select 
                    value={preferredTextPosition}
                    onChange={(e) => setPreferredTextPosition(e.target.value as TextPosition)}
                    className="elite-input w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl"
                  >
                    {['random', 'top', 'bottom', 'center', 'left', 'right'].map(pos => (
                      <option key={pos} value={pos} className="bg-zinc-900 border-none capitalize">{pos}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-emerald-400">Transition Engine</h3>
                  <select 
                    value={transitionType}
                    onChange={(e) => setTransitionType(e.target.value as TransitionType)}
                    className="elite-input w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl"
                  >
                    {['random', 'fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract', '3d-flip', 'domain-warp', 'ridged-burn', 'whip-pan', 'sdf-iris', 'ripple-waves', 'gravitational-lens', 'cinematic-zoom', 'chromatic-split', 'glitch', 'swirl-vortex', 'thermal-distortion', 'flash-through-white', 'cross-warp-morph', 'light-leak'].map(type => (
                      <option key={type} value={type} className="bg-zinc-900 border-none capitalize">{type.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 text-blue-400">Engine Speeds</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Transition Speed</span>
                         <span className="text-xs font-mono text-indigo-400">{transitionDuration}s</span>
                      </div>
                      <input 
                        type="range" min="0.2" max="3" step="0.1" 
                        value={transitionDuration}
                        onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Motion Complexity</span>
                         <span className="text-xs font-mono text-purple-400">{textAnimationSpeed}x</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2" step="0.1" 
                        value={textAnimationSpeed}
                        onChange={(e) => setTextAnimationSpeed(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Scene Duration</span>
                         <span className="text-xs font-mono text-pink-400">{sceneDuration}s</span>
                      </div>
                      <input 
                        type="range" min="2" max="15" step="0.5" 
                        value={sceneDuration}
                        onChange={(e) => setSceneDuration(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-white/40">Export Format</h3>
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
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-white/40">Export Resolution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '4K'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setExportResolution(r)}
                        className={`px-3 py-2 text-center rounded-xl border transition-all uppercase text-[10px] font-bold ${exportResolution === r ? 'bg-pink-600 border-pink-400 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-xl md:text-2xl font-display font-bold mb-6 text-center tracking-tight text-white uppercase">Scene-by-Scene Editor</h3>
                  <div className="space-y-4">
                    {compositions.map((comp, idx) => (
                      <div key={comp.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:bg-white/5 transition-all">
                        <div className="flex flex-col gap-2 shrink-0">
                          <div className="w-12 h-12 bg-indigo-500 text-white flex items-center justify-center font-display font-bold text-xl rounded-2xl shadow-lg shadow-indigo-500/20">
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase text-white/30 tracking-widest mb-1 text-left">Scene Script</p>
                          <p className="text-sm font-bold text-white truncate text-left">{comp.caption || "Untitled Scene"}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-4 pb-4 border-b border-white/5">
                             {comp.media.map((m, mIdx) => (
                               <div key={mIdx} className="relative group/media glass-panel p-1 rounded-xl w-14 h-14 md:w-20 md:h-20 flex-shrink-0 border border-white/10 overflow-hidden">
                                 {m.type === 'video' ? (
                                   <video src={m.url} className="w-full h-full object-cover rounded-lg" />
                                 ) : (
                                   <img src={m.url} className="w-full h-full object-cover rounded-lg" alt="Asset" />
                                 )}
                                 
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-50">
                                   <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); handleToggleFullscreen(idx, mIdx); }}
                                     className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${m.isFullscreen ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/10 border-white/10 text-white'}`}
                                     title="Toggle Fullscreen"
                                   >
                                     <Maximize2 size={12} />
                                   </button>
                                   
                                   {m.type === 'image' && (
                                     <button
                                       type="button"
                                       onClick={(e) => { e.stopPropagation(); handleAnimateAsset(idx, mIdx); }}
                                       disabled={m.isAnimating}
                                       className="p-1.5 rounded-lg bg-purple-500 border border-purple-400 text-white hover:scale-110 disabled:opacity-50 transition-all"
                                       title="AI Animate"
                                     >
                                       {m.isAnimating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                     </button>
                                   )}
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center md:justify-end">
                          {[
                            { id: 'standard', label: 'Standard', icon: <Square size={16} /> },
                            { id: 'instagram-follow', label: 'IG Follow', icon: <Instagram size={16} /> },
                            { id: 'x-post', label: 'X Post', icon: <Twitter size={16} /> },
                            { id: 'macos-notification', label: 'Notify', icon: <Bell size={16} /> },
                            { id: 'data-chart', label: 'Chart', icon: <TrendingUp size={16} /> },
                            { id: 'spotify-card', label: 'Spotify', icon: <Music size={16} /> },
                            { id: 'reddit-post', label: 'Reddit', icon: <Hash size={16} /> }
                          ].map(type => (
                            <button
                              type="button"
                              key={type.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompositions(prev => prev.map((c, i) => {
                                  if (i !== idx) return c;
                                  const newType = type.id as any;
                                  let updatedMedia = [...c.media];
                                  if (['standard'].includes(newType)) {
                                    updatedMedia = updatedMedia.map(m => ({ ...m, xOffset: 0, yOffset: 0, scale: 1 }));
                                  }
                                  return { ...c, sceneType: newType, media: updatedMedia };
                                }));
                              }}
                              className={`p-3 rounded-xl border relative z-50 cursor-pointer transition-all hover:scale-110 active:scale-95 flex flex-col items-center gap-1 group/btn ${comp.sceneType === type.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                            >
                              <div className="pointer-events-none flex flex-col items-center gap-1">
                                {type.icon}
                                <span className="text-[7px] font-bold uppercase tracking-widest">{type.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
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
                    disabled={isSaving}
                    className="brutal-button bg-brutal-blue px-8 py-4 text-lg flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    SAVE DRAFT
                  </button>
                )}
                <button 
                  onClick={generateWorld}
                  className="brutal-button bg-brutal-green px-10 py-4 text-xl flex items-center gap-3"
                >
                  <Play size={20} fill="currentColor" />
                  GENERATE PREVIEW
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


    if (appMode === 'playing') {
      const getBackgroundClass = () => {
        if (!backgroundStyles.length) return 'bg-black';
        
        // Find first style that provides a base background class
        for (const style of backgroundStyles) {
          switch (style) {
            case 'gradient-blue': return 'bg-gradient-to-br from-brutal-blue via-white to-brutal-blue animate-pulse';
            case 'gradient-purple': return 'bg-gradient-to-tr from-brutal-purple via-brutal-pink to-white animate-pulse';
            case 'gradient-teal': return 'bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-700 animate-gradient-slow';
            case 'gradient-rose': return 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-700 animate-gradient-slow';
            case 'gradient-amber': return 'bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 animate-gradient-slow';
            case 'gradient-emerald': return 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 animate-gradient-slow';
            case 'gradient-indigo': return 'bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-700 animate-gradient-slow';
            case 'gradient-slate': return 'bg-gradient-to-br from-slate-600 via-gray-700 to-slate-900 animate-gradient-slow';
            case 'deep-ocean': return 'bg-gradient-to-b from-blue-950 via-cyan-900 to-teal-950 animate-gradient-slow';
            case 'sunset-fire': return 'bg-gradient-to-br from-yellow-400 via-red-500 to-purple-700 animate-gradient-slow';
            case 'midnight': return 'bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 animate-gradient-slow';
            case 'grid': return 'bg-isometric-grid bg-white';
            case 'vibrant-glow': return 'bg-gradient-to-br from-brutal-pink via-brutal-orange to-brutal-purple animate-gradient-slow';
            case 'sunset-haze':
            case 'morning-dew':
              // These define their own base colors in-component, so we return empty to avoid overlap
              return ''; 
            case 'black': 
            case 'radio-waves':
            case 'motion-tile':
            case 'premium-parallax':
            case 'fluid-displace':
              return 'bg-black';
            case 'textured-paper':
              return 'bg-[#f4f1ea]';
          }
        }
        return 'bg-black';
      };


      const camera = currentComp ? { x: currentComp.x, y: currentComp.y, z: currentComp.z } : { x: 0, y: 0, z: 0 };
      
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
      <VideoCanvas key={recordingKey} isRecording={isRecording}>
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


        {/* Compositions */}
        {compositions.map((comp, index) => {
          let status: 'past' | 'active' | 'future' = 'future';
          if (index === currentIndex) status = 'active';
          else if (index < currentIndex) status = 'past';

          // Randomize text size for text-only scenes
          const randomFontSize = comp.isTextOnly 
            ? ['text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'][Math.floor(Math.random() * 5)]
            : 'text-4xl md:text-6xl';

          return (
            <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d', isolation: 'isolate' }}>

              <CompositionNode 
                comp={comp} 
                status={status} 
                fontSizeOverride={randomFontSize} 
                globalTextColor={textColor}
                globalIsMultiColor={isMultiColor}
                globalFontFamily={fontFamily}
                socialHandle={socialHandle}
                websiteSiteName={websiteSiteName}
                worldX={worldX}
                worldY={worldY}
              />
            </div>
          );
        })}
      </motion.div>



      {/* Global Shader Transition Layer */}
      {activeShaderTransition.isActive && (
        <ShaderTransitionCanvas 
          fromImage={activeShaderTransition.fromUrl}
          toImage={activeShaderTransition.toUrl}
          shaderName={activeShaderTransition.name}
          progress={activeShaderTransition.progress}
          resolution={{ width: windowSize.w, height: windowSize.h }}
          accentColor={textColor || '#A855F7'}
        />
      )}

      {/* 3D Transition Filler Overlay */}
      {activeShaderTransition.isActive && compositions[currentIndex]?.transitionItemAsset && (
        <TransitionFiller 
          assetUrl={compositions[currentIndex].transitionItemAsset!}
          progress={globalTransitionProgress}
          isActive={true}
          accentColor={textColor || '#ff3e88'}
        />
      )}

      {/* Manual Scene Layout Picker Toolbar Moved to Step 4 */}

        </VideoCanvas>
      </div>
    );
  }


    return null;
  };

  return (
    <>
      <AppHeader
        appMode={appMode}
        user={user}
        credits={credits}
        onNavigate={setAppMode}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onNewProject={handleStartOver}
        onRefill={() => setShowPricing(true)}
        onExport={() => setShowExportExplainer(true)}
        onStudio={() => setAppMode('setup')}
        onStickers={() => setShowGiphyModal(true)}
        onResetCamera={resetCamera}
        isRendering={isRenderingTrailer}
        renderProgress={renderProgress}
      />
      
      {renderContent()}
      

      
      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        user={user} 
      />

      {/* Global Overlays Layer */}
      {/* Export Explainer Modal */}
      <AnimatePresence>
        {showExportExplainer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel p-8 max-w-md w-full text-white shadow-2xl"
            >
              <h2 className="font-display text-2xl font-bold uppercase mb-6 text-indigo-400">Export Instructions</h2>
              <p className="font-mono text-sm mb-4 leading-relaxed font-bold">
                1. Click <span className="bg-brutal-blue px-1">PROCEED</span> to select a screen to record.
              </p>
              <p className="font-mono text-sm mb-4 leading-relaxed font-bold">
                2. Your browser will ask you to share your screen. Select the <span className="bg-brutal-green px-1">CURRENT TAB</span>. Make sure "Share Audio" is checked if available.
              </p>
              <p className="font-mono text-sm mb-6 leading-relaxed font-bold">
                3. Do not minimize or switch tabs. A 3-second countdown will start, followed by the actual video export.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExportExplainer(false)} 
                  className="flex-1 p-3 elite-button-secondary rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={startRecording}
                  className="flex-1 p-3 elite-button rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  Proceed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Giphy Search Modal */}
      <AnimatePresence>
        {showGiphyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] rounded-3xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-600/50 backdrop-blur-md text-white">
                <h3 className="font-display font-bold uppercase flex items-center gap-3 text-sm"><Sparkles size={16} /> Add Giphy Sticker</h3>
                <button onClick={() => setShowGiphyModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 border-b border-white/10 bg-white/5">
                <form onSubmit={handleGiphySearch} className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={giphySearchQuery}
                      onChange={(e) => setGiphySearchQuery(e.target.value)}
                      placeholder="Search for a sticker..."
                      className="brutal-input w-full py-3 pl-10 pr-4 text-sm bg-white"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  </div>
                  <button type="submit" className="elite-button px-6 py-2 text-sm rounded-lg">
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
    </>
  );
}
