import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform, MotionValue } from 'motion/react';
import { animate } from 'motion';
import { Upload, Video, X, AlertCircle, Play, FileText, Image as ImageIcon, ArrowRight, CheckCircle2, Link as LinkIcon, Loader2, LogOut, User as UserIcon, Save, History, Trash2, Sparkles, Wand2, ChevronLeft, ChevronRight, Search, Github, Twitter, Youtube, Figma, Slack, Instagram, Chrome, Grid, Columns, TrendingUp, Bell, MessageSquare, Quote, Star, Plus, Square, Music, Hash, Sunrise, Trees, Rocket, Cpu, Users, Glasses, Trophy, Flower2, Target, Dribbble, Maximize2, Zap } from 'lucide-react';
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
import HandDrawnCursor from './components/HandDrawnCursor';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(Physics2DPlugin, MorphSVGPlugin);
import MorphTransitionOverlay from './components/MorphTransitionOverlay';
import PremiumSocialOverlays from './components/PremiumSocialOverlays';
import TransitionFiller from './components/TransitionFiller';
import { CompositionProvider } from './components/CompositionProvider';
import { findBestTransitionItem, TRANSITION_ITEM_LIB, SECONDARY_3D_ITEMS, HYPER_SHAPES, MORPH_SHAPES } from './constants/transitionAssets';
import { findBestMotionIcon, MotionIcon } from './components/motion-icons/MotionIconRegistry';
import SharePage from './components/SharePage';
import { ALL_SHADER_NAMES } from './lib/ShaderTransitionSource';
import WorldNavigationPaths from './components/WorldNavigationPaths';
import AuthModal from './components/AuthModal';
import ExplosionOverlay from './components/ExplosionOverlay';
import CoinFlipCard from './components/CoinFlipCard';
import RainbowPhysicsOverlay from './components/RainbowPhysicsOverlay';

gsap.registerPlugin(useGSAP);

const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};


// Sensitive keys are now proxied via the server
const searchGiphy = async (query: string, offset = 0): Promise<any> => {
  const res = await fetch(getApiUrl(`/api/giphy/search?q=${encodeURIComponent(query)}&offset=${offset}`));
  return res.json();
};

type TextPosition = 'bottom' | 'top' | 'center' | 'left' | 'right' | 'random';
type FontStyle = 'font-sans' | 'font-serif' | 'font-mono' | 'font-display' | 'font-outfit' | 'font-grotesk' | 'font-syne' | 'font-bangers';
type BackgroundStyle = 'black' | 'vibrant-glow' | 'particles' | 'grid' | 'gradient-teal' | 'gradient-rose' | 'gradient-amber' | 'gradient-emerald' | 'gradient-indigo' | 'gradient-slate' | 'deep-ocean' | 'sunset-fire' | 'midnight' | 'premium-parallax' | 'textured-paper' | string;
type TextEffect = 'random' | 'gsap-cascade' | 'gsap-3d-roll' | 'gsap-elastic' | 'gsap-expand' | 'gsap-tornado' | 'gsap-merge-elastic' | 'gsap-funnel' | 'gsap-triangle' | 'gsap-square' | 'gsap-heart' | 'gsap-stack' | 'gsap-glow' | 'gsap-focus-flash' | 'gsap-stagger' | 'gsap-typewriter' | 'gsap-slide-type' | 'gsap-glitch' | 'gsap-wave' | 'gsap-blur-reveal';
type FontFamily = 'font-sans' | 'font-display' | 'font-serif' | 'font-mono' | 'font-archivo' | 'font-bebas' | 'font-outfit' | 'font-grotesk' | 'font-lexend' | 'font-syne' | 'font-unbounded' | 'font-kanit' | 'font-public' | 'font-work' | 'font-montserrat' | 'font-impact' | 'font-pixel' | 'font-pixel-arcade' | 'font-righteous' | 'font-space-tech' | 'font-bangers';
type TransitionType = 'random' | 'morph-circle' | 'morph-star' | 'morph-diamond' | 'morph-hexagon' | 'morph-heart' | 'item-portal' | 'fade' | 'zoom' | 'minimal-reveal';
type CinematicMood = 'standard' | 'golden-hour' | 'cyberpunk' | 'noir' | 'teal-and-orange';

// ===================== THICC TYPOGRAPHY THEMES =====================
type ThiccThemeId = 'none' | 'random' | 'chunk' | 'tomato' | 'oreon' | 'pomos' | 'neon-drip' | 'retro-pop' | 'ice-cream' | 'pearl-white' | 'midnight-gold' | 'emerald-cyber' | 'lava' | 'deep-sea' | 'cyber-punk' | 'luxury' | 'brutal' | 'glass' | 'cyber-lime' | 'bubblegum' | 'deep-space' | 'gold-standard' | 'clean-white' | 'midnight-neon' | 'sunset-vibe' | 'monday-bold' | 'heavy-web' | 'pure-grapes' | 'retro-thick' | 'thick-fonts';

interface ThiccTheme {
  id: ThiccThemeId;
  label: string;
  fontFamily: string; // CSS font-family string
  fontClass: string; // Tailwind font class
  textColor: string;
  bgColor: string;
  textShadow: string;
  textStroke?: string;
  extraClass?: string;
  letterSpacing?: string;
}

const THICC_THEMES: Record<Exclude<ThiccThemeId, 'none' | 'random'>, ThiccTheme> = {
  chunk: {
    id: 'chunk',
    label: 'Chunk',
    fontFamily: '"Fredoka", sans-serif',
    fontClass: 'font-fredoka',
    textColor: '#fcf5e5',
    bgColor: '#e84c3d',
    textShadow: '4px 4px 0px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.3)',
    letterSpacing: '-0.03em',
  },
  tomato: {
    id: 'tomato',
    label: 'Tomato Soup',
    fontFamily: '"Chango", system-ui',
    fontClass: 'font-chango',
    textColor: '#1a6b3c',
    bgColor: '#f5c6c6',
    textShadow: '3px 3px 0 rgba(0,0,0,0.08)',
    letterSpacing: '-0.04em',
  },
  oreon: {
    id: 'oreon',
    label: 'Oreon',
    fontFamily: '"Archivo Black", sans-serif',
    fontClass: 'font-impact',
    textColor: '#111111',
    bgColor: '#e8e4dd',
    textShadow: 'none',
    letterSpacing: '-0.05em',
    extraClass: 'tracking-tighter',
  },
  pomos: {
    id: 'pomos',
    label: 'Pomos',
    fontFamily: '"Bungee", system-ui',
    fontClass: 'font-bungee',
    textColor: '#1a1a1a',
    bgColor: '#f5a623',
    textShadow: '3px 3px 0 rgba(0,0,0,0.2)',
    textStroke: '2px rgba(0,0,0,0.1)',
    letterSpacing: '0.02em',
  },
  'neon-drip': {
    id: 'neon-drip',
    label: 'Neon Drip',
    fontFamily: '"Bungee Shade", system-ui',
    fontClass: 'font-bungee-shade',
    textColor: '#39ff14',
    bgColor: '#0a0a0a',
    textShadow: '0 0 20px #39ff14, 0 0 60px #39ff14, 0 0 100px rgba(57,255,20,0.4)',
    letterSpacing: '0.03em',
  },
  'retro-pop': {
    id: 'retro-pop',
    label: 'Retro Pop',
    fontFamily: '"Luckiest Guy", system-ui',
    fontClass: 'font-luckiest',
    textColor: '#fff44f',
    bgColor: '#ff6b9d',
    textShadow: '4px 4px 0 #e8320a, 8px 8px 0 rgba(0,0,0,0.15)',
    letterSpacing: '0.02em',
  },
  'ice-cream': {
    id: 'ice-cream',
    label: 'Ice Cream',
    fontFamily: '"Lilita One", sans-serif',
    fontClass: 'font-lilita',
    textColor: '#ffffff',
    bgColor: '#ff9ff3',
    textShadow: '0 8px 0 #f368e0',
    letterSpacing: '0.02em',
  },
  'pearl-white': {
    id: 'pearl-white',
    label: 'Pearl White',
    fontFamily: '"Outfit", sans-serif',
    fontClass: 'font-outfit',
    textColor: '#1a1a1a',
    bgColor: '#ffffff',
    textShadow: 'none',
    letterSpacing: '-0.02em',
    extraClass: 'tracking-tight',
  },
  'midnight-gold': {
    id: 'midnight-gold',
    label: 'Midnight Gold',
    fontFamily: '"Cinzel", serif',
    fontClass: 'font-serif',
    textColor: '#d4af37',
    bgColor: '#0f0f0f',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
    letterSpacing: '0.1em',
  },
  'emerald-cyber': {
    id: 'emerald-cyber',
    label: 'Emerald Cyber',
    fontFamily: '"Space Grotesk", sans-serif',
    fontClass: 'font-grotesk',
    textColor: '#00ff41',
    bgColor: '#001a00',
    textShadow: '0 0 5px #00ff41',
    textStroke: '1px rgba(0,255,65,0.2)',
    letterSpacing: '-0.01em',
  },
  lava: {
    id: 'lava',
    label: 'Lava',
    fontFamily: '"Titan One", system-ui',
    fontClass: 'font-titan',
    textColor: '#ff4400',
    bgColor: '#1a0a00',
    textShadow: '0 0 30px rgba(255,68,0,0.6), 0 0 60px rgba(255,68,0,0.3), 3px 3px 0 rgba(0,0,0,0.4)',
    letterSpacing: '-0.02em',
  },
  'cyber-lime': {
    id: 'cyber-lime',
    label: 'Cyber Lime',
    fontFamily: '"Bungee", system-ui',
    fontClass: 'font-bungee',
    textColor: '#ccff00',
    bgColor: '#050505',
    textShadow: '0 0 15px rgba(204,255,0,0.6)',
    letterSpacing: '0.05em',
  },
  'bubblegum': {
    id: 'bubblegum',
    label: 'Bubblegum',
    fontFamily: '"Luckiest Guy", system-ui',
    fontClass: 'font-luckiest',
    textColor: '#00f2ff',
    bgColor: '#ff49db',
    textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
    letterSpacing: '0.02em',
  },
  'deep-space': {
    id: 'deep-space',
    label: 'Deep Space',
    fontFamily: '"Archivo Black", sans-serif',
    fontClass: 'font-impact',
    textColor: '#ffffff',
    bgColor: '#000033',
    textShadow: '0 0 40px rgba(255,255,255,0.4)',
    letterSpacing: '-0.03em',
  },
  'gold-standard': {
    id: 'gold-standard',
    label: 'Gold Standard',
    fontFamily: '"Titan One", system-ui',
    fontClass: 'font-titan',
    textColor: '#0a0a2a',
    bgColor: '#ffd700',
    textShadow: '3px 3px 0 rgba(255,255,255,0.3)',
    letterSpacing: '-0.01em',
  },
  'clean-white': {
    id: 'clean-white',
    label: 'Clean White',
    fontFamily: '"Archivo Black", sans-serif',
    fontClass: 'font-impact',
    textColor: '#111111',
    bgColor: '#ffffff',
    textShadow: 'none',
    letterSpacing: '-0.04em',
  },
  'midnight-neon': {
    id: 'midnight-neon',
    label: 'Midnight Neon',
    fontFamily: '"Bungee", system-ui',
    fontClass: 'font-bungee',
    textColor: '#00ffff',
    bgColor: '#02021a',
    textShadow: '0 0 15px rgba(0,255,255,0.5)',
    letterSpacing: '0.02em',
  },
  'sunset-vibe': {
    id: 'sunset-vibe',
    label: 'Sunset Vibe',
    fontFamily: '"Titan One", system-ui',
    fontClass: 'font-titan',
    textColor: '#5a189a',
    bgColor: '#ff9100',
    textShadow: '2px 2px 0 rgba(255,255,255,0.4)',
    letterSpacing: '-0.02em',
  },
  'monday-bold': {
    id: 'monday-bold',
    label: 'Monday Bold',
    fontFamily: '"Titan One", system-ui',
    fontClass: 'font-titan',
    textColor: '#121212',
    bgColor: '#eedb08',
    textShadow: 'none',
    letterSpacing: '-0.06em',
    extraClass: 'tracking-tighter uppercase',
  },
  'heavy-web': {
    id: 'heavy-web',
    label: 'Heavy Web',
    fontFamily: '"Archivo Black", sans-serif',
    fontClass: 'font-impact',
    textColor: '#ffffff',
    bgColor: '#ff5e62',
    textShadow: 'none',
    letterSpacing: '-0.05em',
    extraClass: 'tracking-tighter uppercase -rotate-3',
  },
  'pure-grapes': {
    id: 'pure-grapes',
    label: 'Pure Grapes',
    fontFamily: '"Lilita One", sans-serif',
    fontClass: 'font-lilita',
    textColor: '#ff5e62',
    bgColor: '#fdf6ed',
    textShadow: '3px 3px 0px #1e293b, 6px 6px 0px #0f172a',
    letterSpacing: '-0.02em',
    extraClass: 'tracking-tight',
  },
  'retro-thick': {
    id: 'retro-thick',
    label: 'Retro Thick',
    fontFamily: '"Chango", system-ui',
    fontClass: 'font-chango',
    textColor: '#ff8da7',
    bgColor: '#fbf0c8',
    textShadow: '3px 3px 0px #5c3d2e',
    textStroke: '2px #5c3d2e',
    letterSpacing: '-0.03em',
  },
  'thick-fonts': {
    id: 'thick-fonts',
    label: 'Thick Fonts',
    fontFamily: '"Fredoka", sans-serif',
    fontClass: 'font-fredoka',
    textColor: '#e0533c',
    bgColor: '#f5ece6',
    textShadow: 'none',
    letterSpacing: '-0.03em',
    extraClass: 'tracking-tight font-black',
  }
};

const THICC_THEME_IDS = Object.keys(THICC_THEMES) as Exclude<ThiccThemeId, 'none' | 'random'>[];

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

type SecondaryAsset = {
  id: string;
  type: 'hyper-shape' | '3d-item' | 'motion-icon';
  content: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  drift: number;
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
    objectFit?: 'cover' | 'contain';
    animation?: 'none' | 'pulse' | 'scale-up' | 'scale-down' | 'breathing';
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
  sceneType: 'standard' | 'instagram-follow' | 'x-post' | 'macos-notification' | 'data-chart' | 'spotify-card' | 'reddit-post' | 'coin-flip' | 'asset-only';
  textEffect: TextEffect;
  textEffectSource?: 'manual' | 'auto';
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
  cameraPath?: 'zoom-in' | 'zoom-out' | 'orbit-right' | 'pan-down-tilt' | 'static' | 'hyper-glide' | 'crane-up' | 'parallax-drift';
  secondaryAssets?: SecondaryAsset[];
  sceneDuration?: number;
  fontSize?: string;
  thiccTheme?: ThiccThemeId;
};

const CHOREOGRAPHY_SKELETONS = {
  launch_teaser: {
    name: 'Skeleton B: Launch Teaser',
    description: '25s, 8 scenes, high-energy shader reveals.',
    scenes: [
      { duration: 3.0, transition: 'fade' },
      { duration: 3.0, transition: 'fade' },
      { duration: 3.0, transition: 'fade' },
      { duration: 3.5, transition: 'cinematic-zoom' },
      { duration: 3.0, transition: 'light-leak' },
      { duration: 3.0, transition: 'fade' },
      { duration: 3.0, transition: 'cross-warp-morph' },
      { duration: 3.5, transition: 'fade' }
    ]
  },
  product_explainer: {
    name: 'Skeleton C: Product Explainer',
    description: '45s, 12 scenes, rhythmic storytelling.',
    scenes: [
      { duration: 3.0 }, { duration: 3.0 }, { duration: 4.0 }, { duration: 3.5 },
      { duration: 4.0 }, { duration: 5.0 }, { duration: 3.5 }, { duration: 4.0 },
      { duration: 3.5 }, { duration: 4.0 }, { duration: 4.0 }, { duration: 3.5 }
    ]
  },
  cinematic_title: {
    name: 'Skeleton D: Cinematic Title',
    description: '60s, 7 scenes, atmospheric & slow.',
    scenes: [
      { duration: 8.0 }, { duration: 7.0 }, { duration: 8.0 }, { duration: 10.0 },
      { duration: 9.0 }, { duration: 10.0 }, { duration: 8.0 }
    ]
  }
};

const M3_SHAPES = [
  'square', 'rounded-rect'
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
  isMultiColor?: boolean,
  choreography?: {
    transitionType?: TransitionType;
    backgroundStyle?: BackgroundStyle;
    textEffect?: TextEffect;
    cameraPath?: Composition['cameraPath'];
  }
): Composition => {
  let sceneType: Composition['sceneType'] = 'standard';
  const rand = Math.random();

  if (caption && rand > 0.85) {
    const socialTypes: Composition['sceneType'][] = ['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post', 'coin-flip'];
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
    textEffect: preferredEffect || choreography?.textEffect || 'gsap-stagger',
    transitionType: choreography?.transitionType || (preferredTransition === 'random'
          ? (['morph-circle', 'morph-star', 'morph-diamond', 'morph-hexagon', 'morph-heart', 'item-portal'][Math.floor(Math.random() * 6)] as TransitionType)
          : preferredTransition),
    transitionDuration: preferredDuration,
    isTextOnly,
    preset,
    backgroundStyles,
    activeBackground: choreography?.backgroundStyle || (backgroundStyles && backgroundStyles.length > 0 ? (backgroundStyles[Math.floor(Math.random() * backgroundStyles.length)] as BackgroundStyle) : 'black'),
    giphyStickerUrl,
    fontFamily,
    textColor,
    isMultiColor,
    transitionItemAsset,
    cameraPath: choreography?.cameraPath || (['zoom-in', 'zoom-out', 'static'][Math.floor(Math.random() * 3)] as any),
    effectiveDuration: 5 // Default HyperFrames scene duration
  };
};

const getM3ShapeStyle = (shape: string = 'square', caption: string = '') => {
  const base = "max-w-[85vw] max-h-[75vh] w-auto h-auto block object-cover shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700";

  let resolvedShape = shape;
  if (shape === 'letter') {
    const firstLetter = caption.trim().charAt(0).toUpperCase();
    resolvedShape = `letter-${firstLetter.match(/[A-Z]/) ? firstLetter : M3_LETTERS[Math.floor(Math.random() * M3_LETTERS.length)]}`;
  }

  if (typeof resolvedShape === 'string' && resolvedShape.startsWith('letter-')) {
    const letter = resolvedShape.split('-')[1] || 'A';
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

const GSAPCountUp = ({ value, className = "", textColor }: { value: number, className?: string, textColor?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef({ val: 0 });

  useGSAP(() => {
    gsap.to(countRef.current, {
      val: value,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => setDisplayValue(Math.round(countRef.current.val))
    });
  }, [value]);

  return <span className={className} style={{ color: textColor }}>{displayValue}</span>;
};

const getWordStyle = (word: string, index: number, customColor?: string, isMulti?: boolean, commonWord?: string | null) => {
  const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
  const lowercaseWord = cleanWord.toLowerCase();
  
  // High-contrast but soft pastel for the "anchor" word
  if (commonWord && lowercaseWord === commonWord.toLowerCase()) {
    return {
      background: 'linear-gradient(135deg, #FFEFBA 0%, #FFFFFF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      fontWeight: '900',
      textShadow: '0 0 15px rgba(255, 239, 186, 0.4)',
      display: 'inline-block',
      transform: 'scale(1.1)',
      zIndex: 10
    };
  }

  if (isMulti) {
    const gradients = [
      'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)',
      'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
      'linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)',
      'linear-gradient(120deg, #A1C4FD 0%, #C2E9FB 100%)',
      'linear-gradient(to top, #FD9644 0%, #FFD17E 100%)',
    ];
    return {
      background: gradients[index % gradients.length],
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      fontWeight: '900',
      textShadow: 'none',
      display: 'inline-block'
    };
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

const GSAPCascadeText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-cascade-word" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
          splitChars={false}
        />
      ))}
    </div>
  );
};

const GSAP3DRollText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-roll-word" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
          splitChars={false}
        />
      ))}
    </div>
  );
};

const GSAPElasticText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-elastic-word" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
          splitChars={false}
        />
      ))}
    </div>
  );
};

const WordRenderer = ({ 
  word, 
  index, 
  charClassName, 
  textColor, 
  isMulti, 
  commonWord,
  splitChars = true
}: { 
  word: string, 
  index: number, 
  charClassName: string, 
  textColor?: string, 
  isMulti?: boolean, 
  commonWord?: string | null,
  splitChars?: boolean
}) => {
  const isNumber = !isNaN(parseFloat(word.replace(/,/g, ''))) && isFinite(Number(word.replace(/,/g, '')));
  const style = getWordStyle(word, index, textColor, isMulti, commonWord);

  if (isNumber) {
    return (
      <span className={`inline-flex whitespace-pre ${charClassName}`} style={style}>
        <GSAPCountUp value={parseFloat(word.replace(/,/g, ''))} textColor={style.color || textColor} />
      </span>
    );
  }

  if (!splitChars) {
    return (
      <span className={`inline-flex whitespace-pre ${charClassName}`} style={style}>
        {word}
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-pre" style={style}>
      {word.split('').map((char, j) => (
        <span key={j} className={`${charClassName} inline-block`}>
          {char}
        </span>
      ))}
    </span>
  );
};

const GSAPSplitText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-split-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPExpandText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-expand-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPTornadoText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-tornado-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPMergeElasticText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-elastic-merge-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPFunnelText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-funnel-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPTriangleText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-triangle-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPSquareText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-square-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPHeartText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-heart-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPGlowText = ({ text, className, textColor, isMulti, commonWord }: { text: string, className?: string, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-glow-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPFocusFlashText = ({ text, className, textColor, isMulti, commonWord }: { text: string, className?: string, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-focus-word" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPStackText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
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
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-stack-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

// ======= NEW EFFECTS =======

const GSAPTypewriterText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleChars, setVisibleChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx++;
      setVisibleChars(charIdx);
      if (charIdx >= text.length) {
        clearInterval(interval);
        // Blink cursor a few more times then hide
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 60);
    const cursorBlink = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => { clearInterval(interval); clearInterval(cursorBlink); };
  }, [text]);

  const words = text.split(' ');
  let charCount = 0;

  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, wi) => {
        const wordStart = charCount;
        charCount += word.length + 1; // +1 for space
        const wordStyle = getWordStyle(word, wi, textColor, isMulti, commonWord);
        const isNumber = !isNaN(parseFloat(word.replace(/,/g, ''))) && isFinite(Number(word.replace(/,/g, '')));
        
        if (isNumber && visibleChars > wordStart) {
          return (
            <span key={wi} className="inline-flex whitespace-pre" style={wordStyle}>
              <GSAPCountUp value={parseFloat(word.replace(/,/g, ''))} textColor={wordStyle.color || textColor} />
            </span>
          );
        }
        
        return (
          <span key={wi} className="inline-flex whitespace-pre" style={wordStyle}>
            {word.split('').map((char, ci) => {
              const globalIdx = wordStart + ci;
              return (
                <span key={ci} className="inline-block" style={{ opacity: globalIdx < visibleChars ? 1 : 0 }}>
                  {char}
                </span>
              );
            })}
            {/* Show cursor after last visible char in this word */}
            {visibleChars >= wordStart && visibleChars <= wordStart + word.length && showCursor && (
              <span className="inline-block w-[2px] h-[1em] bg-current animate-pulse ml-[1px]" style={{ color: textColor || '#fff' }} />
            )}
          </span>
        );
      })}
      {visibleChars >= text.length && showCursor && (
        <span className="inline-block w-[3px] h-[1em] bg-current" style={{ color: textColor || '#fff', opacity: showCursor ? 1 : 0 }} />
      )}
    </div>
  );
};

const GSAPSlideTypeText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  
  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-slide-type-char');
    
    gsap.set(chars, { opacity: 0 });
    
    const totalDuration = chars.length * 0.08;
    
    const tl = gsap.timeline();
    
    // Animate container out of screen to the left over the total duration
    tl.fromTo(containerRef.current,
      { x: "30vw" },
      { x: "-150vw", duration: totalDuration + 2.5, ease: "power1.inOut" },
      0
    );
    
    // Typewriter effect
    tl.to(chars, {
      opacity: 1,
      duration: 0.01,
      stagger: 0.08,
      ease: "none"
    }, 0);
  }, { scope: containerRef, dependencies: [text] });

  return (
    <div className="w-full overflow-visible flex items-center justify-center">
      <div ref={containerRef} className={`flex flex-nowrap whitespace-nowrap gap-x-3 gap-y-1 ${className}`} style={{ ...style, width: 'max-content' }}>
        {words.map((word, i) => (
          <WordRenderer 
            key={i} 
            word={word} 
            index={i} 
            charClassName="gsap-slide-type-char" 
            textColor={textColor} 
            isMulti={isMulti} 
            commonWord={commonWord} 
            splitChars={true}
          />
        ))}
      </div>
    </div>
  );
};

const GSAPGlitchText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glitchChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?0123456789";

  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-glitch-char');
    
    chars.forEach((charEl, i) => {
      const original = charEl.getAttribute('data-char') || '';
      const el = charEl as HTMLElement;
      
      // Scramble phase
      let scrambleCount = 0;
      const scrambleInterval = setInterval(() => {
        el.textContent = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        scrambleCount++;
        if (scrambleCount > 4 + i * 2) {
          clearInterval(scrambleInterval);
          el.textContent = original;
        }
      }, 50);
      
      // Animate in
      gsap.fromTo(el, 
        { opacity: 0, x: () => (Math.random() - 0.5) * 20, color: '#ff0040' },
        { opacity: 1, x: 0, color: textColor || '#ffffff', duration: 0.3, delay: i * 0.04, ease: "power2.out" }
      );
    });
    
    // Periodic glitch flicker on random chars
    const flickerInterval = setInterval(() => {
      const randomChar = chars[Math.floor(Math.random() * chars.length)] as HTMLElement;
      if (randomChar) {
        const original = randomChar.getAttribute('data-char') || '';
        randomChar.textContent = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        gsap.to(randomChar, { x: (Math.random() - 0.5) * 5, duration: 0.05 });
        setTimeout(() => {
          randomChar.textContent = original;
          gsap.to(randomChar, { x: 0, duration: 0.1 });
        }, 80);
      }
    }, 800);
    
    return () => clearInterval(flickerInterval);
  }, { scope: containerRef, dependencies: [text] });

  const words = text.split(' ');
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => {
        const wordStyle = getWordStyle(word, i, textColor, isMulti, commonWord);
        const isNumber = !isNaN(parseFloat(word.replace(/,/g, ''))) && isFinite(Number(word.replace(/,/g, '')));
        if (isNumber) {
          return (
            <span key={i} className="inline-flex whitespace-pre gsap-glitch-char" style={wordStyle} data-char={word}>
              <GSAPCountUp value={parseFloat(word.replace(/,/g, ''))} textColor={wordStyle.color || textColor} />
            </span>
          );
        }
        return (
          <span key={i} className="inline-flex whitespace-pre" style={wordStyle}>
            {word.split('').map((char, j) => (
              <span key={j} className="gsap-glitch-char inline-block" data-char={char}>{char}</span>
            ))}
          </span>
        );
      })}
    </div>
  );
};

const GSAPWaveText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-wave-char');
    
    // Entrance
    gsap.fromTo(chars,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.03, ease: "back.out(1.7)" }
    );
    
    // Continuous wave
    chars.forEach((char, i) => {
      gsap.to(char, {
        y: -15,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.08
      });
    });
  }, { scope: containerRef, dependencies: [text] });

  const words = text.split(' ');
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-wave-char" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
    </div>
  );
};

const GSAPBlurRevealText = ({ text, className = "", style = {}, textColor, isMulti, commonWord }: { text: string, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const wordEls = containerRef.current.querySelectorAll('.gsap-blur-word');
    
    gsap.fromTo(wordEls,
      { opacity: 0, filter: 'blur(20px)', scale: 1.1, y: 20 },
      { 
        opacity: 1, 
        filter: 'blur(0px)', 
        scale: 1, 
        y: 0,
        duration: 1.0, 
        stagger: 0.15, 
        ease: "power3.out" 
      }
    );
  }, { scope: containerRef, dependencies: [text] });

  const words = text.split(' ');
  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => (
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-blur-word" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
          splitChars={false}
        />
      ))}
    </div>
  );
};

const AnimatedCaption = ({ text, effect, className, style, textColor, isMulti, commonWord }: { text: string, effect: TextEffect, className?: string, style?: any, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const props = { text, className, style, textColor, isMulti, commonWord };
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
    case 'gsap-typewriter': return <GSAPTypewriterText {...props} />;
    case 'gsap-slide-type': return <GSAPSlideTypeText {...props} />;
    case 'gsap-glitch': return <GSAPGlitchText {...props} />;
    case 'gsap-wave': return <GSAPWaveText {...props} />;
    case 'gsap-blur-reveal': return <GSAPBlurRevealText {...props} />;
    case 'gsap-stagger': return <GSAPStaggerText {...props} />;
    default: {
      console.log(`AnimatedCaption: using default Stagger for ${effect}`);
      return <GSAPStaggerText {...props} />;
    }
  }
};

const FilmGrainOverlay = () => {
  return (
    <div className="grain-overlay" />
  );
};

const GSAPStaggerText = ({ text, className, textColor, isMulti, commonWord }: { text: string, className?: string, textColor?: string, isMulti?: boolean, commonWord?: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  
  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-char');
    gsap.from(chars, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: { each: 0.08, from: "start" },
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={`${className} will-change-transform flex flex-wrap justify-center gap-x-3 gap-y-1`}>
      {words.map((word, i) => (
        <WordRenderer 
          key={i} 
          word={word} 
          index={i} 
          charClassName="gsap-char opacity-0 translate-y-10" 
          textColor={textColor} 
          isMulti={isMulti} 
          commonWord={commonWord} 
        />
      ))}
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
    <div style={{ transform: 'translateZ(0)' }}> {/* GPU hint */}
      <FilmGrainOverlay />
      {status === 'active' && isThemedWorld ? (
         <ThemedParallaxWorld theme={style} worldX={worldX} worldY={worldY} />
      ) : (
        <motion.div
          className="absolute inset-[-1000%] pointer-events-none"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-500px) scale(8)', zIndex: -10 }}
          animate={{
            opacity: status === 'active' ? 1 : 0.4
          }}
          transition={{ duration: 0.5 }}
        >
          {status === 'active' && style === 'particles' && <ParticleTrails />}
        </motion.div>
      )}
    </div>
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
  globalTextColor,
  globalIsMultiColor,
  globalFontFamily,
  socialHandle,
  websiteSiteName,
}: {
  comp: Composition;
  status: 'past' | 'active' | 'future';
  globalTextColor: string;
  globalIsMultiColor: boolean;
  globalFontFamily: string;
  socialHandle: string;
  websiteSiteName: string;
}) => {
  const accentColor = globalTextColor || '#A855F7';
  const duration = comp.transitionDuration;
  const [hasError, setHasError] = useState(false);

  const getTransitionVariants = (type: TransitionType) => {
    const ghostOpacity = 0;
    const ghostBlur = 'blur(40px)';
    const ghostScale = 0.4;

    const isMorph = type?.startsWith('morph-');

    return {
      future: { 
        opacity: isMorph ? 1 : ghostOpacity, 
        scale: isMorph ? 1 : ghostScale, 
        filter: isMorph ? 'none' : ghostBlur, 
        transition: { duration: 1.2 } 
      },
      active: { 
        opacity: 1, 
        scale: 1, 
        filter: 'blur(0px)', 
        transition: { duration: 1.2 } 
      },
      past: { 
        opacity: isMorph ? 1 : ghostOpacity, 
        scale: isMorph ? 1 : ghostScale, 
        filter: isMorph ? 'none' : ghostBlur, 
        transition: { duration: 1.2 } 
      }
    };
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
        {comp.transitionType?.startsWith('morph-') || comp.transitionType === 'item-portal' ? (
          <MorphTransitionOverlay 
            type={comp.transitionType} 
            status={status} 
            duration={comp.transitionDuration} 
            itemUrl={comp.transitionType === 'item-portal' ? comp.transitionItemAsset : undefined}
          >
            <SceneBackground style={comp.activeBackground} status={status} />
            <div className="vignette-overlay" />
          </MorphTransitionOverlay>
        ) : (
          <>
            <SceneBackground style={comp.activeBackground} status={status} />
            <div className="vignette-overlay" />
          </>
        )}
        
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
          {!['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post', 'coin-flip'].includes(comp.sceneType) && comp.media.map((m, i) => {
            const shapeStyle = getM3ShapeStyle(m.m3Shape, comp.caption);

            // Ken Burns cinematic motions for fullscreen assets
            const kenBurnsVariants = [
              { scale: [1, 1.15], x: [0, 0], y: [0, 0] },           // Slow zoom in
              { scale: [1.15, 1], x: [0, 0], y: [0, 0] },           // Slow zoom out
              { scale: [1.08, 1.12], x: ['-3%', '3%'], y: [0, 0] }, // Pan left to right
              { scale: [1.08, 1.12], x: ['3%', '-3%'], y: [0, 0] }, // Pan right to left
              { scale: [1.05, 1.15], x: [0, 0], y: ['2%', '-2%'] }, // Slow crane up
              { scale: [1.1, 1.05], x: ['-2%', '2%'], y: ['1%', '-1%'] }, // Diagonal drift
            ];
            const kenBurns = kenBurnsVariants[(i + comp.id.charCodeAt(0)) % kenBurnsVariants.length];

            const mediaElement = m.url && (
              m.type === 'video' ? (
                <motion.video
                  src={m.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={m.isFullscreen ? `absolute inset-0 w-full h-full ${m.objectFit === 'contain' ? 'object-contain' : 'object-cover'}` : shapeStyle.className}
                  style={m.isFullscreen ? { zIndex: -1 } : shapeStyle.style}
                  onError={() => setHasError(true)}
                  animate={status === 'active' ? (m.isFullscreen ? kenBurns : (() => {
                    switch(m.animation) {
                      case 'pulse': return { scale: [1, 1.1, 1] };
                      case 'scale-up': return { scale: [0.8, 1.2] };
                      case 'scale-down': return { scale: [1.2, 0.8] };
                      case 'breathing': return { scale: [1, 1.05, 1], y: [0, -10, 0] };
                      default: return {
                        scale: [1, 1.05],
                        rotate: [(i % 2 === 0 ? 1 : -1), (i % 2 === 0 ? -1 : 1)],
                      };
                    }
                  })()) : { scale: 1, rotate: 0 }}
                  transition={m.isFullscreen 
                    ? { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }
                    : { duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }
                  }
                />
              ) : (
                <motion.img
                  src={m.url}
                  alt={comp.caption}
                  className={m.isFullscreen ? `absolute inset-0 w-full h-full ${m.objectFit === 'contain' ? 'object-contain' : 'object-cover'}` : shapeStyle.className}
                  style={m.isFullscreen ? { zIndex: -1 } : shapeStyle.style}
                  onError={() => setHasError(true)}
                  animate={status === 'active' ? (m.isFullscreen ? kenBurns : (() => {
                    switch(m.animation) {
                      case 'pulse': return { scale: [1, 1.1, 1] };
                      case 'scale-up': return { scale: [0.8, 1.2] };
                      case 'scale-down': return { scale: [1.2, 0.8] };
                      case 'breathing': return { scale: [1, 1.05, 1], y: [0, -10, 0] };
                      default: return {
                        scale: [1, 1.05],
                        rotate: [(i % 2 === 0 ? 1 : -1), (i % 2 === 0 ? -1 : 1)],
                      };
                    }
                  })()) : { scale: 1, rotate: 0 }}
                  transition={m.isFullscreen 
                    ? { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }
                    : { duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }
                  }
                />
              )
            );

            return (
              <motion.div
                key={i}
                className={m.isFullscreen ? "absolute inset-0 z-0 overflow-hidden" : "absolute z-10"}
                style={m.isFullscreen ? { width: '100%', height: '100%' } : {
                  transformStyle: 'preserve-3d',
                  x: m.xOffset || 0,
                  y: m.yOffset || 0,
                  scale: m.scale || 1
                }}
              >
                {/* Cinematic vignette overlay for fullscreen assets */}
                {m.isFullscreen && (
                  <div className="absolute inset-0 z-10 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
                  }} />
                )}
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

        {/* TOP LAYER: Secondary Motion Assets (Floating on top) */}
        {comp.secondaryAssets?.map(asset => {
          if (asset.type === '3d-item') {
            return (
              <motion.div
                key={asset.id}
                className="absolute pointer-events-none select-none z-[100]"
                style={{
                  left: asset.x,
                  top: asset.y,
                  translateZ: asset.z,
                  transformStyle: 'preserve-3d'
                }}
                animate={status === 'active' ? {
                  x: asset.drift,
                  rotateZ: asset.rotation + 360,
                  y: [0, -10, 0] // Breathing float
                } : {}}
                transition={{ 
                   x: { duration: 20, repeat: Infinity, ease: 'linear' },
                   rotateZ: { duration: 20, repeat: Infinity, ease: 'linear' },
                   y: { duration: 3, repeat: Infinity, ease: 'sine.inOut' }
                }}
              >
                <img 
                  src={asset.content} 
                  className="w-48 h-48 object-contain opacity-60 filter blur-[1px] hover:blur-0 transition-all duration-700" 
                  style={{ transform: `scale(${asset.scale})` }} 
                />
              </motion.div>
            );
          } else if (asset.type === 'motion-icon') {
            return (
              <motion.div
                key={asset.id}
                className="absolute pointer-events-none select-none z-[100]"
                style={{
                  left: asset.x,
                  top: asset.y,
                  translateZ: asset.z,
                  transformStyle: 'preserve-3d'
                }}
                animate={status === 'active' ? {
                  x: asset.drift,
                  rotateZ: asset.rotation,
                  scale: [asset.scale, asset.scale * 1.1, asset.scale],
                } : {}}
                transition={{ 
                   x: { duration: 15, repeat: Infinity, ease: 'linear' },
                   scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }}
              >
                <MotionIcon 
                  name={asset.content} 
                  size={220} 
                  color="#fff" 
                  autoAnimate={status === 'active'}
                  className="drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
                />
              </motion.div>
            );
          } else {
            const shapeData = getM3ShapeStyle(asset.content, comp.caption);
            return (
              <motion.div
                key={asset.id}
                className="absolute pointer-events-none select-none flex items-center justify-center z-[100]"
                style={{
                  left: asset.x,
                  top: asset.y,
                  translateZ: asset.z,
                  transformStyle: 'preserve-3d'
                }}
                animate={status === 'active' ? {
                  y: asset.drift,
                  rotateX: 360,
                  rotateY: 180
                } : {}}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div 
                  className={`w-32 h-32 ${shapeData.className} opacity-10`}
                  style={{ 
                    ...shapeData.style, 
                    backgroundColor: accentColor,
                    transform: `scale(${asset.scale})`
                  }}
                />
              </motion.div>
            );
          }
        })}
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userTrailers, setUserTrailers] = useState<any[]>([]);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRenderingTrailer, setIsRenderingTrailer] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [textOnlyLines, setTextOnlyLines] = useState<Set<number>>(new Set());
  const [mediaMapping, setMediaMapping] = useState<Record<number, string>>({});
  const [authModalPromise, setAuthModalPromise] = useState<{ resolve: (user: any) => void; reject: (err: any) => void } | null>(null);
  const [useGiphy, setUseGiphy] = useState(false);
  const [globalAudioUrl, setGlobalAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [explosionTriggerId, setExplosionTriggerId] = useState(0);
  const [explosionEnabled, setExplosionEnabled] = useState(true);
  const [explosionSize, setExplosionSize] = useState(1);
  const [explosionDuration, setExplosionDuration] = useState(1);
  const [rainbowEnabled, setRainbowEnabled] = useState(true);
  const [isRainbowActive, setIsRainbowActive] = useState(false);

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
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Detect payment return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setToastMessage('Payment successful! 30 credits have been added to your account.');
      setTimeout(() => setToastMessage(null), 6000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('payment') === 'canceled') {
      setToastMessage('Payment was canceled.');
      setTimeout(() => setToastMessage(null), 4000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const [aiChoreography, setAiChoreography] = useState<any>(null);
  const [choreographySkeleton, setChoreographySkeleton] = useState<string>('custom');

  const [scrapeUrl, setScrapeUrl] = useState("https://");
  const [isScraping, setIsScraping] = useState(false);
  const [websiteSiteName, setWebsiteSiteName] = useState<string>('');
  const [designTokens, setDesignTokens] = useState<any>(null);

  const [fontStyle, setFontStyle] = useState<FontStyle>('font-sans');
  const [fontFamily, setFontFamily] = useState<FontFamily>('font-display');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [isMultiColor, setIsMultiColor] = useState<boolean>(false);
  const [selectedEffects, setSelectedEffects] = useState<TextEffect[]>(['gsap-stagger', 'gsap-cascade', 'gsap-3d-roll', 'gsap-elastic', 'gsap-tornado', 'gsap-funnel', 'gsap-stack', 'gsap-typewriter', 'gsap-slide-type', 'gsap-wave', 'gsap-blur-reveal']);
  const [textEffect, setTextEffect] = useState<TextEffect>('random');
  const [thiccTheme, setThiccTheme] = useState<ThiccThemeId>('none');
  const [preferredTextPosition, setPreferredTextPosition] = useState<TextPosition>('random');
  const [preferredTextSize, setPreferredTextSize] = useState<string>('random');
  const [preferredCameraPath, setPreferredCameraPath] = useState<string>('random');
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [transitionType, setTransitionType] = useState<TransitionType>('morph-star');
  const [sceneDuration, setSceneDuration] = useState<number>(4.5);
  const [preset, setPreset] = useState<string>('custom');
  const [transitionDuration, setTransitionDuration] = useState(1.2);
  const [textAnimationSpeed, setTextAnimationSpeed] = useState<number>(1.2);
  const [globalAssetScale, setGlobalAssetScale] = useState<number>(1.0);
  const [globalAssetAnimation, setGlobalAssetAnimation] = useState<'none' | 'pulsate' | 'breathe' | 'float'>('float');
  const [generationId, setGenerationId] = useState(0);
  const [automatedSecondaryAssets, setAutomatedSecondaryAssets] = useState(false);

  const [backgroundStyles, setBackgroundStyles] = useState<BackgroundStyle[]>(['black']);
  const [activeShaderTransition, setActiveShaderTransition] = useState<{
    name: string;
    fromUrl: string;
    toUrl: string;
    isActive: boolean;
    progress: number;
  }>({ name: 'whip-pan', fromUrl: '', toUrl: '', isActive: false, progress: 0 });

  const globalTransitionProgress = useMotionValue(0);


  const [showProfile, setShowProfile] = useState(false);
  const [socialHandle, setSocialHandle] = useState('@Handle');
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sceneStartTime, setSceneStartTime] = useState(Date.now());

  const [isSpatialWorld, setIsSpatialWorld] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // New: Calculate common word across all script lines for highlighting
  const commonWord = useMemo(() => {
    if (!scriptText) return null;
    const lines = scriptText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return null;
    
    const sets = lines.map(line => {
      const words = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
      return new Set(words);
    });
    
    if (sets.length === 0) return null;
    
    const candidates = Array.from(sets[0]).filter(word => {
      // Avoid boring common words if possible, but prioritize literal presence
      const stopWords = ['the', 'and', 'this', 'that', 'with', 'your', 'from'];
      if (stopWords.includes(word)) return false;
      return sets.every(set => set.has(word));
    });
    
    return candidates.length > 0 ? candidates[0] : null;
  }, [scriptText]);

  useEffect(() => {
    if (isRecording) {
      document.body.setAttribute('data-recording', 'true');
    } else {
      document.body.removeAttribute('data-recording');
    }
  }, [isRecording]);

  const totalStorageBytes = [...libraryAssets, ...userVideos].reduce((acc, curr) => acc + (curr.size || 0), 0);
  const isOverStorageCap = totalStorageBytes > 500 * 1024 * 1024;

  const checkStorageCap = () => {
    if (isOverStorageCap) {
      setToastMessage("Storage limit reached (500MB). Please delete assets or videos in your profile.");
      return false;
    }
    return true;
  };

  const generateWorldTemplate = () => {
    setCompositions(prev => {
      const newComps = [...prev];
      newComps.forEach((comp, i) => {
        const spiralFactor = 0.6;
        const spacing = 2200;
        comp.x = Math.cos(i * spiralFactor) * (i * spacing);
        comp.y = Math.sin(i * spiralFactor) * (i * spacing * 0.3);
        comp.z = -i * 1500;
        comp.rotY = (i * spiralFactor * 180 / Math.PI);
        comp.cameraPath = 'zoom-in';
      });
      return newComps;
    });
    setToastMessage("World Layout Generated! Hit Play to explore.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetProject = () => {
    if (compositions.length > 0) {
       if (!window.confirm("Abandon this production? All unsaved cinematic choreography will be lost.")) return;
    }
    setCompositions([]);
    setMediaFiles([]);
    setScriptText("");
    setDesignTokens(null);
    setCurrentProjectId(null);
    setAppMode('landing');
    setSetupStep(1);
    setScrapeUrl("https://");
    setHistory([]);
    setMediaMapping({});
    setTextOnlyLines(new Set());
    setGlobalAudioUrl(null);
    setAiChoreography(null);
    setWebsiteSiteName('');
    setSiteUrl('');
  };

  const handleStartOver = () => {
    resetProject();
  };

  const currentComp = compositions[currentIndex];

  // Secondary graphics trigger removed for cleaner output

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const [isHyperRendering, setIsHyperRendering] = useState(false);
  const [hyperRenderProgress, setHyperRenderProgress] = useState(0);
  const [hyperRenderMessage, setHyperRenderMessage] = useState('');

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

      const vq = query(collection(db, 'videos'), where('userId', '==', user.uid));
      const unsubscribeVideos = onSnapshot(vq, (snapshot) => {
        setUserVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'videos');
      });

      // Removed daily credit refresh logic as requested

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
        unsubscribeVideos();
        unsubscribeUser();
      };
    }
  }, [user]);

  const handleLogin = async () => {
    return new Promise<any>((resolve, reject) => {
      setAuthModalPromise({ resolve, reject });
    });
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
        size: file.size,
        createdAt: serverTimestamp()
      });
      return { url, uploaded: true };
    } catch (err) {
      console.error("Upload failed", err);
      return { url: URL.createObjectURL(file), uploaded: false };
    }
  };

  const sanitizeForFirestore = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(v => sanitizeForFirestore(v));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, sanitizeForFirestore(v)])
      );
    }
    return obj;
  };

  const saveProject = async (isAutoSave = false): Promise<string | null> => {
    if (!user) {
      if (!isAutoSave) {
        setToastMessage("Please login to save your project.");
        setTimeout(() => setToastMessage(null), 3000);
      }
      return null;
    }

    if (mediaFiles.length === 0 && !scriptText.trim()) return currentProjectId;

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
          preset: preset || 'custom',
          textOnlyLines: Array.from(textOnlyLines),
          mediaMapping,
          useGiphy
        },
        media: mediaData,
        compositions: compositions, // Save full timeline for deterministic rendering
        updatedAt: serverTimestamp(),
        isAutoSave
      };

      const cleanData = sanitizeForFirestore(trailerData);

      let finalId = currentProjectId;
      if (currentProjectId) {
        await setDoc(doc(db, 'trailers', currentProjectId), cleanData, { merge: true });
        if (!isAutoSave) setToastMessage("Project saved successfully!");
      } else {
        cleanData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'trailers'), cleanData);
        finalId = docRef.id;
        setCurrentProjectId(finalId);
        if (!isAutoSave) setToastMessage("Project saved successfully!");
      }
      return finalId;
    } catch (err) {
      console.error("Save project failed:", err);
      if (!isAutoSave) setToastMessage("Failed to save project. Check your connection.");
      throw err; // Re-throw so callers know it failed
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

    if (project.compositions && project.compositions.length > 0) {
      setCompositions(project.compositions);
    } else {
      const newComps: Composition[] = [];
      let prev: Composition | undefined = undefined;
      project.media.forEach((m: any, i: number) => {
        const isTextOnly = new Set(project.settings.textOnlyLines || []).has(i);
        const comp = generateCompositionFromData([m], i, project.settings.textEffect, project.settings.transitionType, project.settings.transitionDuration, prev, isTextOnly, project.settings.preset, loadedBackgrounds, m.giphyStickerUrl, m.stickerScale, m.stickerX, m.stickerY);
        newComps.push(comp);
        prev = comp;
      });
      setCompositions(newComps);
    }

    setAppMode('playing');
  };

  const startHyperRender = async () => {
    const isAdmin = user?.email === 'philipsimmons67@gmail.com';
    if (!isAdmin && credits < 5) {
       setShowPricing(true);
       return;
    }
    
    try {
      setShowExportExplainer(false);
      setToastMessage("Activating HyperFlow Cloud Engine...");
      setIsRenderingTrailer(true);
      setRenderProgress(0);
      
      // 1. Save project first
      const savedId = await saveProject(true);
      if (!savedId) throw new Error("Cloud sync failed. Please save project.");
      
      // 2. Trigger server-side render
      const totalDuration = compositions.reduce((acc, c) => acc + (c.sceneDuration || 5), 0);
      const res = await fetch(getApiUrl('/api/render-hyperframes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${window.location.origin}/?mode=render&projectId=${savedId}`,
          duration: totalDuration,
          jobId: `render_${savedId}_${Date.now()}`
        })
      });
      
      let responseData: any = null;
      try {
        responseData = await res.json();
      } catch (e) {
        // Fallback for non-JSON errors (HTML error pages)
        console.error("Failed to parse render response", e);
      }

      if (!res.ok) {
        throw new Error(responseData?.error || `Elite Render Engine is currently offline (HTTP ${res.status}).`);
      }
      
      const { jobId } = responseData;
      
      setIsHyperRendering(true);
      setHyperRenderProgress(0);
      setHyperRenderMessage('Initializing HyperFlow Engine...');
      
      // 3. Poll for progress
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(getApiUrl(`/api/render-job/${jobId}`));
          const statusData = await statusRes.json();
          setHyperRenderProgress(statusData.progress || 0);

          if (statusData.status === 'rendering') {
            const messages = ['Igniting Shaders...', 'Orchestrating Director...', 'Capturing Cinematic Frames...', 'Baking 4K Master...'];
            const msgIndex = Math.min(Math.floor((statusData.progress / 100) * messages.length), messages.length - 1);
            setHyperRenderMessage(messages[msgIndex]);
          }
          
          if (statusData.status === 'complete') {
            clearInterval(poll);
            setIsHyperRendering(false);
            setToastMessage("Elite Video Production Complete!");
            if (statusData.videoId) {
              setShareVideoId(statusData.videoId);
              setAppMode('share');
            }
          } else if (statusData.status === 'failed') {
            clearInterval(poll);
            setIsHyperRendering(false);
            setToastMessage(`Render failed: ${statusData.error}`);
          }
        } catch (err) {
          console.error("Polling check failed:", err);
        }
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setIsHyperRendering(false);
      setToastMessage(err.message || "HyperRender failure.");
    }
  };

  const handleGiphySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!giphySearchQuery.trim()) return;

    setIsSearchingGiphy(true);
    try {
      const { data } = await searchGiphy(giphySearchQuery);
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




  const handleUrlAnalysis = async () => {
    if (!scrapeUrl || !scrapeUrl.includes('.')) return;
    setIsScraping(true);
    setToastMessage("AI Director is analyzing your website...");

    try {
      const resp = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });

      const data = await resp.json();

      if (data.error) throw new Error(data.error);

      // 1. Populate Script
      if (data.script) {
        const textValue = Array.isArray(data.script) ? data.script.join('\n') : String(data.script);
        setScriptText(textValue);
      }

      // 2. Populate Brand Settings
      if (data.brandTitle) setWebsiteSiteName(data.brandTitle);

      if (data.colors) {
        if (data.colors.primary) setTextColor(data.colors.primary);
        if (data.colors.background) {
            // Check if it's a known style or just a color
            const colors = ['black', 'ivory', 'cream'];
            if (colors.includes(data.colors.background.toLowerCase())) {
              setBackgroundStyles([data.colors.background.toLowerCase()]);
            } else {
              setBackgroundStyles([data.colors.background]);
            }
        }
      }

      if (data.typography) {
        const fontMap: Record<string, FontFamily> = {
            'sans': 'font-outfit',
            'serif': 'font-serif',
            'mono': 'font-mono',
            'display': 'font-syne',
            'modern': 'font-grotesk',
            'bold': 'font-impact',
            'playful': 'font-bangers'
        };
        setFontFamily(fontMap[data.typography.vibe] || 'font-outfit');
      }

      // Actionable Brand Intelligence: Pacing & Density
      if (data.pacing) {
        const pacingMap: Record<string, number> = {
          'rapid-tiktok': 1.8,
          'standard': 1.0,
          'cinematic-slow': 0.6
        };
        setTextAnimationSpeed(pacingMap[data.pacing] || 1.0);
        setSceneDuration(data.pacing === 'rapid-tiktok' ? 3.5 : 5.5);
      }

      if (data.sceneComplexity === 'dense' || data.sceneComplexity === 'layered') {
        // Force random kinetic for maximum dynamism in complex scenes
        setTextEffect('random');
        setTransitionDuration(0.8); // Snappier transitions for density
      }
      setDesignTokens(data);

      // 3. Populate Scraped Assets
      if (data.scrapedImages && data.scrapedImages.length > 0) {
        const newAssets: MediaItem[] = data.scrapedImages.map((url: string, i: number) => ({
            id: `scraped-${i}-${Date.now()}`,
            url,
            type: 'image',
            name: `Website Asset ${i + 1}`
        }));
        setMediaFiles(prev => [...prev, ...newAssets]);
      }

      if (data.choreography) {
        setAiChoreography(data.choreography);
      }
      if (data.choreographySkeleton) {
        setChoreographySkeleton(data.choreographySkeleton);
      }
      setDesignTokens(data);
      setToastMessage("Success! Your brand vibe has been extracted.");
      setSetupStep(2); // Move to Assets review
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      setToastMessage(err.message || "Failed to analyze URL.");
    } finally {
      setIsScraping(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const updateCurrentStickerTransform = (scale: number, x: number, y: number) => {
    setCompositions(prev => prev.map((comp, i) => {
      if (i === currentIndex) {
        return { ...comp, stickerScale: scale, stickerX: x, stickerY: y };
      }
      return comp;
    }));
  };


  const updateSceneProperty = (idx: number, prop: keyof Composition, value: any) => {
    setCompositions(prev => {
      const newComps = [...prev];
      newComps[idx] = { ...newComps[idx], [prop]: value };
      if (prop === 'textEffect') {
        newComps[idx].textEffectSource = 'manual';
      }
      return newComps;
    });
  };

  const applyTextEffectToAllScenes = (idx: number) => {
    setCompositions(prev => {
      const sourceEffect = prev[idx].textEffect;
      return prev.map((comp, i) => i === idx ? comp : {
        ...comp,
        textEffect: sourceEffect,
        textEffectSource: 'manual'
      });
    });
    setToastMessage("Text animation applied to all scenes");
  };

  const updateGlobalTextPosition = (pos: TextPosition) => {
    setPreferredTextPosition(pos);
    if (pos !== 'random') {
        setCompositions(prev => prev.map(c => ({ ...c, textPosition: pos })));
    }
  };

  const updateGlobalTextSize = (size: string) => {
    setPreferredTextSize(size);
    if (size !== 'random') {
        setCompositions(prev => prev.map(c => ({ ...c, fontSize: size })));
    }
  };

  const updateGlobalTextEffect = (effect: TextEffect) => {
    setTextEffect(effect);
    if (effect !== 'random') {
        setCompositions(prev => prev.map(c => ({ ...c, textEffect: effect })));
    }
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
      const response = await fetch(getApiUrl('/api/animate-media'), {
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
  const camRoll = useMotionValue(0);

  const artistryX = useMotionValue(0);
  const artistryY = useMotionValue(0);
  const artistryZ = useMotionValue(0);
  const artistryRotX = useMotionValue(0);
  const artistryRotY = useMotionValue(0);
  const artistryRoll = useMotionValue(0);

  const userRotX = useMotionValue(0);
  const userRotY = useMotionValue(0);
  const userPanX = useMotionValue(0);
  const userPanY = useMotionValue(0);

  const smoothX = useSpring(camX, { damping: 30, stiffness: 80, mass: 1 });
  const smoothY = useSpring(camY, { damping: 30, stiffness: 80, mass: 1 });
  const smoothZ = useSpring(camZ, { damping: 30, stiffness: 80, mass: 1 });
  const smoothRoll = useSpring(camRoll, { damping: 40, stiffness: 50 });

  const smoothArtX = useSpring(artistryX, { damping: 30, stiffness: 100 });
  const smoothArtY = useSpring(artistryY, { damping: 30, stiffness: 100 });
  const smoothArtZ = useSpring(artistryZ, { damping: 30, stiffness: 100 });
  const smoothArtRotX = useSpring(artistryRotX, { damping: 40, stiffness: 80 });
  const smoothArtRotY = useSpring(artistryRotY, { damping: 40, stiffness: 80 });
  const smoothArtRoll = useSpring(artistryRoll, { damping: 40, stiffness: 80 });

  const smoothRotX = useSpring(userRotX, { damping: 50, stiffness: 150 });
  const smoothRotY = useSpring(userRotY, { damping: 50, stiffness: 150 });
  const smoothPanX = useSpring(userPanX, { damping: 50, stiffness: 150 });
  const smoothPanY = useSpring(userPanY, { damping: 50, stiffness: 150 });

  const wiggleX = useMotionValue(0);
  const wiggleY = useMotionValue(0);

  useEffect(() => {
    if (appMode === 'playing') {
      const controlsX = animate(wiggleX, [-5, 5, -5], { duration: 4, repeat: Infinity, ease: "easeInOut" });
      const controlsY = animate(wiggleY, [-3, 3, -3], { duration: 5, repeat: Infinity, ease: "easeInOut" });

      // Smooth subtle pan
      const panControlsX = animate(userPanX, [0, 15, 0], { duration: 8, repeat: Infinity, ease: "easeInOut" });

      return () => {
        controlsX.stop();
        controlsY.stop();
        panControlsX.stop();
      };
    }
  }, [appMode]);

  const smoothWiggleX = useSpring(wiggleX, { damping: 20, stiffness: 50 });
  const smoothWiggleY = useSpring(wiggleY, { damping: 20, stiffness: 50 });

  const velX = useVelocity(smoothX);
  const velY = useVelocity(smoothY);
  const velZ = useVelocity(smoothZ);

  const cameraFilter = useTransform([velX, velY, velZ], ([vx, vy, vz]) => {
    const speed = Math.sqrt(Math.pow(Number(vx), 2) + Math.pow(Number(vy), 2) + Math.pow(Number(vz), 2));
    const blurAmount = Math.min(speed / 200, 10);

    // Auto-tilt based on horizontal speed
    camRoll.set(Number(vx) / 100);

    if (speed < 15) return `blur(0px)`;

    return `blur(${blurAmount}px)`;
  });

  const worldFOV = useTransform([velX, velY, velZ, artistryZ], ([vx, vy, vz, az]) => {
    const speed = Math.sqrt(Math.pow(Number(vx), 2) + Math.pow(Number(vy), 2) + Math.pow(Number(vz), 2));
    const speedScale = 1 + Math.min(speed / 8000, 0.2);

    // Speed scaling logic
    return speedScale;
  });

  const worldX = useTransform([smoothX, smoothPanX, smoothWiggleX, smoothArtX], ([x, px, wx, ax]) => Number(x) + Number(px) + Number(wx) + Number(ax));
  const worldY = useTransform([smoothY, smoothPanY, smoothWiggleY, smoothArtY], ([y, py, wy, ay]) => Number(y) + Number(py) + Number(wy) + Number(ay));
  const worldZ = useTransform([smoothZ, smoothArtZ], ([z, az]) => Number(z) + Number(az));
  const worldRotX = useTransform([smoothRotX, smoothArtRotX], ([rx, arx]) => Number(rx) + Number(arx));
  const worldRotY = useTransform([smoothRotY, smoothArtRotY], ([ry, ary]) => Number(ry) + Number(ary));
  const worldRoll = useTransform([smoothRoll, smoothArtRoll], ([sr, ar]) => Number(sr) + Number(ar));

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

      // Reset artistry offsets
      artistryX.set(0);
      artistryY.set(0);
      artistryZ.set(0);
      artistryRotX.set(0);
      artistryRotY.set(0);
      artistryRoll.set(0);

      // AI-Driven Camera Path Animations
      const duration = currentComp.sceneDuration || 5;

      if (currentComp.cameraPath === 'zoom-in') {
        animate(artistryZ, 800, { duration, ease: "linear" });
      } else if (currentComp.cameraPath === 'zoom-out') {
        animate(artistryZ, -800, { duration, ease: "linear" });
      } else if (currentComp.cameraPath === 'orbit-right') {
        animate(artistryX, 600, { duration, ease: "linear" });
        animate(artistryRotY, -20, { duration, ease: "linear" });
        animate(artistryRoll, 5, { duration, ease: "linear" });
      } else if (currentComp.cameraPath === 'pan-down-tilt') {
        animate(artistryY, -400, { duration, ease: "linear" });
        animate(artistryRotX, 15, { duration, ease: "linear" });
      } else if (currentComp.cameraPath === 'hyper-glide') {
        animate(artistryZ, [0, 400, 0], { duration, ease: "anticipate" });
        animate(artistryRotY, [0, 10, 0], { duration, ease: "anticipate" });
      } else if (currentComp.cameraPath === 'static') {
        // Subtle drift
        animate(artistryX, [(Math.random()-0.5)*100, (Math.random()-0.5)*100], { duration, ease: "easeInOut" });
      } else if (currentComp.cameraPath === 'crane-up') {
        // Slow upward dolly revealing the scene from below
        animate(artistryY, 500, { duration, ease: "easeInOut" });
        animate(artistryRotX, -10, { duration, ease: "easeInOut" });
        animate(artistryZ, 200, { duration, ease: "easeInOut" });
      } else if (currentComp.cameraPath === 'parallax-drift') {
        // Subtle horizontal drift with depth parallax
        animate(artistryX, [0, 300, 0], { duration, ease: "easeInOut" });
        animate(artistryZ, [0, 100, -50], { duration, ease: "easeInOut" });
        animate(artistryRoll, [0, 2, 0], { duration, ease: "easeInOut" });
      }
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
    let timer: NodeJS.Timeout;
    if (appMode === 'playing' && !isRecording && compositions.length > 0) {
      const hf = (window as any).__HYPERFRAMES_COMPOSITION__;

      const playNext = () => {
        const nextIdx = (currentIndex + 1) % compositions.length;

        setCurrentIndex(nextIdx);
        if (hf) {
          const nextTime = compositions.slice(0, nextIdx).reduce((acc, c) => acc + (c.sceneDuration || 5), 0);
          hf.seek(nextTime);
        }
      };

      const hasText = currentComp?.caption && currentComp.caption.trim().length > 0;
      const animDuration = hasText ? (4 / textAnimationSpeed) * 1000 : 0;
      const effectiveSceneDuration = Math.max((currentComp?.sceneDuration || sceneDuration || 5) * 1000, hasText ? animDuration + 500 : 0);

      timer = setTimeout(playNext, effectiveSceneDuration);
    }
    return () => clearTimeout(timer);
  }, [appMode, isRecording, compositions, sceneDuration, textAnimationSpeed, currentIndex, currentComp]);

  useEffect(() => {
    if (appMode === 'playing' && currentIndex === 0 && audioRef.current && globalAudioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [appMode, currentIndex, globalAudioUrl, isRecording, recordingKey]);

  const [addingAssetToSceneIdx, setAddingAssetToSceneIdx] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkStorageCap()) return;
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
            media: [{ id: asset.id, url: asset.url, type: asset.type, name: asset.name, isFullscreen: true }]
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

        if (data.choreography) {
          setAiChoreography(data.choreography);
          setToastMessage("AI has designed your video choreography!");
        } else {
          setToastMessage("Content fetched — script & assets ready!");
        }

        if (data.siteName) {
          setWebsiteSiteName(data.siteName);
        }

        // Add scraped images to media assets
        const newAssets: MediaItem[] = [];
        if (data.screenshotUrl) {
          newAssets.push({
            id: `scrape-screenshot-${Date.now()}`,
            url: data.screenshotUrl,
            type: 'image',
            name: `${data.brandTitle || data.siteName || 'Website'} Screenshot`
          });
        }
        if (data.scrapedImages && Array.isArray(data.scrapedImages)) {
          data.scrapedImages.forEach((imgUrl: string, idx: number) => {
            newAssets.push({
              id: `scrape-img-${Date.now()}-${idx}`,
              url: imgUrl,
              type: 'image',
              name: `Extracted Image ${idx + 1}`
            });
          });
        }
        
        if (newAssets.length > 0) {
          setMediaFiles(prev => [...prev, ...newAssets]);
        }

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

    const skeletonData = CHOREOGRAPHY_SKELETONS[choreographySkeleton as keyof typeof CHOREOGRAPHY_SKELETONS];

    for (let sceneIdx = 0; sceneIdx < scriptLines.length; sceneIdx++) {
      let caption = scriptLines[sceneIdx] || '';
      const complexity = designTokens?.sceneComplexity || 'standard';
      const sceneChoreography = aiChoreography?.scenes?.[sceneIdx];
      const skelScene = skeletonData?.scenes?.[sceneIdx % skeletonData.scenes.length];
      
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

      const existingComp = compositions[sceneIdx];

      // Logical Hierarchy: Manual > Skeleton > AI > Random
      const currentSceneType: any = existingComp?.sceneType || sceneChoreography?.sceneType || (
        complexity === 'dense' || complexity === 'layered' 
          ? (sceneIdx % 2 === 0 ? 'standard' : (['macos-notification', 'instagram-follow', 'reddit-post', 'x-post'][Math.floor(Math.random() * 4)]))
          : 'standard'
      );

      const effectList: TextEffect[] = ['gsap-cascade', 'gsap-3d-roll', 'gsap-elastic', 'gsap-tornado', 'gsap-funnel', 'gsap-stack', 'gsap-glow', 'gsap-stagger', 'gsap-typewriter', 'gsap-slide-type', 'gsap-glitch', 'gsap-wave', 'gsap-blur-reveal'];
      const activeEffectList = selectedEffects.length > 0 ? selectedEffects : effectList;
      
      // Logic: Global Override (if not random) > Manual Scene Edit > AI Choreography > Random from Selection
      const currentEffect: TextEffect = (textEffect !== 'random')
        ? textEffect
        : (existingComp?.textEffectSource === 'manual' ? existingComp.textEffect : (sceneChoreography?.textEffect || activeEffectList[Math.floor(Math.random() * activeEffectList.length)]));
      const currentEffectSource = (textEffect !== 'random') ? 'auto' : (existingComp?.textEffectSource || 'auto');

      const posList: TextPosition[] = ['top', 'center', 'bottom', 'left', 'right'];
      const currentTextPosition = (preferredTextPosition === 'random')
        ? (existingComp?.textPosition || posList[Math.floor(Math.random() * posList.length)])
        : preferredTextPosition;

      const sizeList = ['text-3xl', 'text-5xl', 'text-7xl', 'text-[120px]'];
      const currentFontSize = (preferredTextSize !== 'random')
        ? preferredTextSize
        : (existingComp?.fontSize || sizeList[Math.floor(Math.random() * sizeList.length)]);
        
      const currentFontFamily = existingComp?.fontFamily || (
        fontFamily === 'font-display'
          ? (designTokens?.typography?.pairing || 'font-display')
          : fontFamily
      );

      const allowedPaths = ['zoom-in', 'zoom-out', 'hyper-glide', 'parallax-drift', 'static'];
      const currentCameraPath: any = (preferredCameraPath !== 'random')
        ? preferredCameraPath
        : (existingComp?.cameraPath || sceneChoreography?.cameraPath || (['zoom-in', 'zoom-out', 'hyper-glide', 'parallax-drift'][Math.floor(Math.random() * 4)]));
      const currentBackground = existingComp?.activeBackground || sceneChoreography?.backgroundStyle || (backgroundStyles[sceneIdx % backgroundStyles.length] || 'black');

      const customDur = existingComp?.sceneDuration || skelScene?.duration || sceneChoreography?.duration;
      const finalTransition = (existingComp?.transitionType || skelScene?.transition || sceneChoreography?.transition || transitionType) as TransitionType;

      const comp = generateCompositionFromData(
        sceneItems, 
        sceneIdx, 
        currentEffect, 
        finalTransition, 
        transitionDuration, 
        prev, 
        isTextOnly, 
        preset, 
        backgroundStyles,
        undefined, // sticker
        1, 0, 0,
        customDur,
        caption,
        currentFontFamily,
        textColor,
        isMultiColor
      );
      
      comp.sceneType = currentSceneType;
      comp.cameraPath = currentCameraPath;
      comp.activeBackground = currentBackground as BackgroundStyle;
      comp.textPosition = currentTextPosition;
      comp.fontSize = currentFontSize;
      comp.textEffectSource = currentEffectSource;

      // Deep preserve media settings (Scale, Fit, Motion)
      if (existingComp) {
        comp.media = comp.media.map(m => {
          const existingMedia = existingComp.media.find(em => em.url === m.url);
          if (existingMedia) {
            return {
              ...m,
              scale: existingMedia.scale || m.scale,
              objectFit: existingMedia.objectFit || m.objectFit,
              animation: existingMedia.animation || m.animation
            };
          }
          return m;
        });
      }
      
      // Inject Thicc Typography Theme
      if (thiccTheme === 'random') {
        comp.thiccTheme = THICC_THEME_IDS[Math.floor(Math.random() * THICC_THEME_IDS.length)];
      } else if (thiccTheme !== 'none') {
        comp.thiccTheme = thiccTheme;
      }
      
      // Inject AI Shape decision
      if (sceneChoreography?.shape) {
        if (sceneChoreography.shape === 'fullscreen') {
          // Fullscreen: asset fills entire scene with Ken Burns cinematic effect
          comp.media = comp.media.map(m => ({ ...m, isFullscreen: true }));
        } else {
          comp.media = comp.media.map(m => ({ ...m, m3Shape: sceneChoreography.shape }));
        }
      }
      
      // Secondary Assets (floating items)
      let secondaryAssets: SecondaryAsset[] = [];
      if (existingComp?.secondaryAssets) {
        secondaryAssets = existingComp.secondaryAssets;
      } else if (automatedSecondaryAssets) {
        const assetCount = complexity === 'dense' || complexity === 'layered' ? 3 : 1;
        for (let i = 0; i < assetCount; i++) {
          let type: SecondaryAsset['type'] = '3d-item';
          let content = '';

          const intent = sceneChoreography?.secondaryAssetIntent || caption;
          if (intent) {
            const motionIcon = findBestMotionIcon(intent);
            if (motionIcon) {
              type = 'motion-icon';
              content = motionIcon;
            } else {
              const matched = findBestTransitionItem(sceneChoreography.secondaryAssetIntent);
              if (matched) {
                type = '3d-item';
                content = matched;
              } else if (i > 0) {
                continue;
              } else {
                // Fallback to random
                const is3D = Math.random() > 0.5;
                type = is3D ? '3d-item' : 'hyper-shape';
                content = is3D 
                  ? SECONDARY_3D_ITEMS[Math.floor(Math.random() * SECONDARY_3D_ITEMS.length)]
                  : HYPER_SHAPES[Math.floor(Math.random() * HYPER_SHAPES.length)];
              }
            }
          } else {
            // Force a 40% chance for a motion icon even if no intent is matched
            if (Math.random() > 0.6) {
               const iconKeys = Object.keys(MOTION_ICON_MAP);
               type = 'motion-icon';
               content = iconKeys[Math.floor(Math.random() * iconKeys.length)];
            } else {
              const is3D = Math.random() > 0.5;
              type = is3D ? '3d-item' : 'hyper-shape';
              content = is3D 
                ? SECONDARY_3D_ITEMS[Math.floor(Math.random() * SECONDARY_3D_ITEMS.length)]
                : HYPER_SHAPES[Math.floor(Math.random() * HYPER_SHAPES.length)];
            }
          }

            secondaryAssets.push({
              id: `sec-${sceneIdx}-${i}`,
              type,
              content,
              x: (Math.random() * 1400 - 700),
              y: (Math.random() * 1000 - 500),
              z: type === 'motion-icon' ? (Math.random() * 400 + 100) : (Math.random() * -800 - 200),
              scale: type === 'motion-icon' ? (1.5 + Math.random() * 1.5) : (0.5 + Math.random() * 0.7),
              rotation: type === 'motion-icon' ? (Math.random() * 40 - 20) : (Math.random() * 360),
              drift: Math.random() * 200 - 100
            });
        }
      }

      comp.secondaryAssets = secondaryAssets;

      newComps.push(comp);
      prev = comp;
      setRenderProgress(Math.min(((sceneIdx / Math.max(scriptLines.length, 1)) * 100), 100));
      await new Promise(r => setTimeout(r, 100));
    }

    setCompositions(newComps);
    setGenerationId(prev => prev + 1);
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

  const generateCompositionFromData = (media: any[], index: number, effect: TextEffect, tType: TransitionType, tDur: number, prevComp?: Composition, isTextOnly?: boolean, preset?: string, backgroundStyles?: string[], giphyStickerUrl?: string, stickerScale?: number, stickerX?: number, stickerY?: number, customSceneDuration?: number, caption?: string): Composition => {
    const angle = prevComp ? prevComp.angle + (Math.random() * 1.5 - 0.75) : 0;
    const distance = 2000;
    const x = prevComp ? prevComp.x + Math.cos(angle) * distance : 0;
    const y = prevComp ? prevComp.y + Math.sin(angle) * distance : 0;
    const z = 0;

    return {
      id: Math.random().toString(36).substr(2, 9),
      media: media.map((m, i) => {
        // Constrain positions: center, left-center, or right-center
        const positions = [
          { xOffset: 0, yOffset: 0 },       // center
          { xOffset: -200, yOffset: 0 },     // left-center
          { xOffset: 200, yOffset: 0 },      // right-center
        ];
        const pos = positions[i % positions.length];
        return {
          url: m.url,
          type: m.type,
          name: m.name || 'Asset',
          xOffset: m.xOffset || pos.xOffset,
          yOffset: m.yOffset || pos.yOffset,
          scale: m.scale || 1,
          objectFit: m.objectFit || 'cover',
          animation: m.animation || 'none'
        };
      }),
      x, y, z,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      angle,
      caption: caption || media[0]?.caption || '',
      textPosition: 'bottom',
      sceneType: 'standard',
      textEffect: effect,
      textEffectSource: 'auto',
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
      transitionItemAsset: findBestTransitionItem(caption || media[0]?.caption || '') || undefined,
      sceneDuration: customSceneDuration,
      fontSize: 'text-5xl'
    };
  };

  const startRecording = async () => {
    if (!checkStorageCap()) return;
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

      let combinedStream = stream;
      if (audioRef.current && globalAudioUrl) {
        try {
          const audioStream = (audioRef.current as any).captureStream ? (audioRef.current as any).captureStream() : (audioRef.current as any).mozCaptureStream ? (audioRef.current as any).mozCaptureStream() : null;
          if (audioStream && audioStream.getAudioTracks().length > 0) {
            combinedStream = new MediaStream([
              ...stream.getVideoTracks(),
              ...audioStream.getAudioTracks()
            ]);
          }
        } catch (err) {
          console.error("Failed to capture audio stream:", err);
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
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
          const uploadRes = await fetch(getApiUrl('/api/video/upload'), {
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

      setCurrentIndex(0);

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

      setIsRecording(true);
      setRecordingKey(prev => prev + 1);
      setRecordingProgress(0);

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))));
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
        <LandingPage user={user} onStart={async () => {
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
            if (libraryAssets.length + assets.length > 50) {
                setToastMessage("Storage limit exceeded. Please delete old assets.");
                return;
            }
            addFromLibrary(assets);
            setAppMode('setup');
            setSetupStep(1);
          }}
          notifications={notifications}
          onShowPricing={() => setShowPricing(true)}
          userVideos={userVideos}
          onStartNewProject={() => {
            setAppMode('setup');
            setSetupStep(1);
          }}
        />
      );
    }

    if (appMode === 'setup') {
      return (
        <div className="min-h-screen bg-cream text-ink font-sans flex items-start md:items-center justify-center p-4 md:p-6 pt-24 overflow-y-auto relative z-10">
          <div className="w-full max-w-4xl border border-black/10 bg-white p-8 md:p-16 my-auto max-h-[85vh] overflow-y-auto custom-scrollbar relative shadow-2xl">
            <AnimatePresence>
              {(isUploading || isSaving) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-ivory/95 backdrop-blur-md flex flex-col items-center justify-center border border-black/10"
                >
                  <div className="w-16 h-16 border-4 border-black/10 border-t-ink rounded-full animate-spin mb-6"></div>
                  <p className="mono font-bold uppercase text-lg">
                    {isUploading ? "Uploading Assets..." : "Saving World..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Indicators */}
            <div className="flex items-center gap-1 mb-12 overflow-x-auto pb-4 custom-scrollbar">
              {[1, 2, 3, 4, 5].map((step) => (
                <button
                  key={step}
                  onClick={() => user && setSetupStep(step as any)}
                  disabled={!user || (step > setupStep && !mediaFiles.length && !scriptText && step > 2)}
                  className={`flex items-center gap-4 px-8 py-4 mono text-[10px] font-bold uppercase tracking-widest transition-all ${
                    setupStep === step
                      ? 'bg-ink text-cream'
                      : 'bg-ivory text-ink/30 hover:text-ink border border-black/5'
                  }`}
                >
                  <span className="opacity-30">0{step}.</span>
                  {['Vision', 'Assets', 'Script', 'Mapping', 'Studio'][step - 1]}
                </button>
              ))}
            </div>

            {setupStep === 1 && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                 <div className="pb-8 border-b border-black/5">
                    <p className="mono text-[10px] uppercase opacity-40 mb-2">Step One</p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Establish the Vibe.</h2>
                    <p className="text-muted text-lg">Input your website URL or project goal. Our AI Director will analyze your brand, extract assets, and draft your cinematic script instantly.</p>
                 </div>

                 <div className="space-y-8">
                   <div className="relative group">
                     <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-ink transition-colors" size={20} />
                     <input
                       type="text"
                       placeholder="https://your-website.com"
                       className="elite-input w-full py-5 pl-16 pr-8 text-xl font-bold bg-ivory/30 border-black/5"
                       value={scrapeUrl}
                       onChange={(e) => setScrapeUrl(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleUrlAnalysis()}
                     />
                   </div>

                   <div className="flex flex-col md:flex-row gap-4">
                     <button
                       onClick={handleUrlAnalysis}
                       disabled={isScraping || !scrapeUrl.includes('.')}
                       className="btn-primary flex-1 py-6 text-lg flex items-center justify-center gap-4 disabled:opacity-50"
                     >
                       {isScraping ? (
                         <>
                           <Loader2 className="animate-spin" size={24} />
                           Analyzing Brand...
                         </>
                       ) : (
                         <>
                           <Sparkles size={24} />
                           Run AI Analysis
                         </>
                       )}
                     </button>
                     <button
                       onClick={() => setSetupStep(2)}
                       className="btn-outline px-12 py-6 text-sm"
                     >
                       Skip & Manual Setup
                     </button>
                   </div>
                 </div>

                 <div className="p-8 bg-ivory border border-black/5 flex gap-6">
                    <Zap className="text-ink/20 shrink-0" size={32} />
                    <div className="space-y-2">
                      <p className="mono text-[10px] font-bold uppercase tracking-widest">Automation Note</p>
                      <p className="text-xs text-ink/60 leading-relaxed">The AI analyzes your homepage for color palettes, font styles, and high-quality imagery to pre-populate your studio world.</p>
                    </div>
                 </div>
               </motion.div>
            )}

            {setupStep === 2 && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                 <div className="pb-8 border-b border-black/5">
                    <p className="mono text-[10px] uppercase opacity-40 mb-2">Step Two</p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Capture the vision.</h2>
                    <p className="text-muted text-lg">Upload the screenshots or videos that define your application's core value.</p>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                   <label className="aspect-square bg-ivory border border-dashed border-ink/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-ink transition-all group">
                     <Upload className="mb-4 text-ink/20 group-hover:text-ink transition-colors" size={32} />
                     <span className="mono text-[9px] font-bold uppercase">Add Media</span>
                     <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                   </label>

                   <button
                     onClick={() => setShowLibrary(true)}
                     className="aspect-square bg-white border border-black/5 flex flex-col items-center justify-center hover:bg-ivory transition-all group"
                   >
                     <ImageIcon className="mb-4 text-ink/20 group-hover:text-ink transition-colors" size={32} />
                     <span className="mono text-[9px] font-bold uppercase">Library</span>
                   </button>

                   {mediaFiles.map((m, i) => (
                     <div key={m.id} className="aspect-square bg-ivory border border-black/5 relative group overflow-hidden p-1">
                       {m.type === 'video' ? (
                         <video src={m.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" muted />
                       ) : (
                         <img src={m.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                       )}
                       <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => removeFile(i)} className="w-10 h-10 bg-ivory text-red-500 flex items-center justify-center hover:bg-white transition-colors">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>

                 <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="mono text-[10px] font-bold uppercase opacity-40 mb-4 block">Engine Branding</label>
                     <div className="relative group">
                       <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-ink transition-colors" size={20} />
                       <input
                         type="text"
                         placeholder="e.g. VibeTrailer Elite"
                         className="elite-input w-full py-5 pl-16 pr-8 text-xl font-bold bg-ivory/30 border-black/5"
                         value={websiteSiteName}
                         onChange={(e) => setWebsiteSiteName(e.target.value)}
                       />
                     </div>
                   </div>
                   <div>
                     <label className="mono text-[10px] font-bold uppercase opacity-40 mb-4 block">Social Handle</label>
                     <div className="relative group">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-ink transition-colors font-bold">@</span>
                       <input
                         type="text"
                         placeholder="e.g. kaspermotion"
                         className="elite-input w-full py-5 pl-12 pr-8 text-xl font-bold bg-ivory/30 border-black/5"
                         value={socialHandle.replace('@', '')}
                         onChange={(e) => setSocialHandle(e.target.value ? `@${e.target.value.replace('@', '')}` : '')}
                       />
                     </div>
                   </div>
                 </div>

               <AnimatePresence>
                 {showLibrary && (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="fixed inset-0 z-[100] bg-cream/90 backdrop-blur-xl flex items-center justify-center p-8"
                   >
                     <motion.div
                       initial={{ scale: 0.95, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.95, opacity: 0 }}
                       className="bg-white border border-black/10 w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl"
                     >
                       <div className="p-10 border-b border-black/5 flex items-center justify-between">
                         <h3 className="text-3xl font-black uppercase flex items-center gap-4">
                           <History size={28} /> Asset Collection
                         </h3>
                         <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-ivory transition-colors">
                           <X size={28} />
                         </button>
                       </div>

                       <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                         {libraryAssets.length === 0 ? (
                           <div className="h-64 flex flex-col items-center justify-center opacity-20">
                             <ImageIcon size={64} className="mb-6" />
                             <p className="mono font-bold uppercase tracking-widest">Library is empty.</p>
                           </div>
                         ) : (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
                             {libraryAssets.map((asset) => {
                               const isSelected = selectedLibraryAssets.has(asset.id);
                               return (
                                 <div
                                   key={asset.id}
                                   onClick={() => toggleLibraryAssetSelection(asset.id)}
                                   className={`relative aspect-square border transition-all p-1 cursor-pointer ${isSelected ? 'border-ink bg-ivory' : 'border-black/5 opacity-60 hover:opacity-100'}`}
                                 >
                                   {asset.type === 'video' ? (
                                     <video src={asset.url} className="w-full h-full object-cover grayscale" />
                                   ) : (
                                     <img src={asset.url} className="w-full h-full object-cover grayscale" alt={asset.name} />
                                   )}
                                   <button
                                     onClick={(e) => { e.stopPropagation(); deleteLibraryAsset(e, asset); }}
                                     className="absolute top-2 right-2 text-ink opacity-0 group-hover:opacity-100"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>

                       <div className="p-10 border-t border-black/5 bg-ivory/50 flex items-center justify-between">
                         <p className="mono text-[10px] uppercase opacity-40">Add assets to project flow.</p>
                         <button
                           disabled={selectedLibraryAssets.size === 0}
                           onClick={() => {
                             const selectedAssets = libraryAssets.filter(a => selectedLibraryAssets.has(a.id));
                             addFromLibrary(selectedAssets);
                             setShowLibrary(false);
                             setSelectedLibraryAssets(new Set());
                           }}
                           className="bg-ink text-cream px-10 py-4 mono text-[10px] font-bold uppercase disabled:opacity-20"
                         >
                           Import ({selectedLibraryAssets.size})
                         </button>
                       </div>
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>


               <div className="flex justify-end mt-12">
                 <button
                   onClick={() => setSetupStep(3)}
                   className="btn-primary px-12 py-5 text-lg"
                 >
                   Proceed to Scripts <ArrowRight size={20} className="ml-3" />
                 </button>
               </div>
            </motion.div>
           )}

          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="pb-8 border-b border-black/5 mb-12">
                  <p className="mono text-[10px] uppercase opacity-40 mb-2">Step Three</p>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Draft the Beats.</h2>
                  <p className="text-muted text-lg">Every line break creates a new cinematic scene. Be concise, be kinetic.</p>
               </div>

               <div className="space-y-8">
                 <textarea
                   value={scriptText}
                   onChange={(e) => handleScriptChange(e.target.value)}
                   placeholder="Showcase Your Vision...\nThe Future of Interaction\nKinetic Motion"
                   className="elite-input h-64 resize-none text-xl md:text-2xl font-bold p-8"
                 />
                 <div className="p-8 bg-ivory border border-black/5 flex gap-6">
                    <Sparkles className="text-ink/20 shrink-0" size={32} />
                    <div className="space-y-2">
                      <p className="mono text-[10px] font-bold uppercase tracking-widest">Engine Tips</p>
                      <p className="text-xs text-ink/60 leading-relaxed">The AI director calculates camera timing based on script length. Keep lines between 4-10 words for the most professional flow.</p>
                    </div>
                 </div>
               </div>

               <div className="flex gap-4 mt-12">
                 <button onClick={() => setSetupStep(2)} className="btn-outline flex-1 py-5">Back</button>
                 <button onClick={() => setSetupStep(4)} className="btn-primary flex-[2] py-5">Proceed to Mapping</button>
               </div>
            </motion.div>
          )}

          {setupStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="pb-8 border-b border-black/5 mb-12">
                  <p className="mono text-[10px] uppercase opacity-40 mb-2">Step Four</p>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Logic Flow.</h2>
                  <p className="text-muted text-lg">Assign your visual assets to the corresponding beats in your script.</p>
               </div>

               <div className="space-y-2">
                {(typeof scriptText === 'string' ? scriptText : '').split('\n').filter(l => l.trim().length > 0).map((line, idx) => (
                   <div key={idx} className="p-8 border border-black/5 bg-ivory/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-white transition-colors">
                      <div className="flex-1">
                         <p className="mono text-[9px] opacity-40 mb-2 font-bold uppercase">Scene Sequence {idx+1}</p>
                         <p className="text-xl font-bold uppercase tracking-tight line-clamp-2">{line}</p>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto">
                         <label className="flex items-center gap-2 mono text-[10px] font-bold uppercase cursor-pointer hover:text-ink transition-colors opacity-40 hover:opacity-100">
                           <input
                             type="checkbox"
                             checked={textOnlyLines.has(idx)}
                             onChange={() => toggleTextOnly(idx)}
                             className="w-4 h-4 accent-ink"
                           />
                           Text Only
                         </label>
                         {!textOnlyLines.has(idx) && (
                           <select
                             value={mediaMapping[idx] || ""}
                             onChange={(e) => setMediaMapping({ ...mediaMapping, [idx]: e.target.value })}
                             className="bg-white border border-black/10 px-4 py-3 mono text-[10px] uppercase font-bold outline-none focus:border-ink transition-colors w-full md:w-64"
                           >
                             <option value="">Select Asset...</option>
                             {mediaFiles.map(m => (
                               <option key={m.id} value={m.id}>{m.name.slice(0, 30)}</option>
                             ))}
                           </select>
                         )}
                      </div>
                   </div>
                 ))}
               </div>

               <div className="flex gap-4 mt-12">
                 <button onClick={() => setSetupStep(3)} className="btn-outline flex-1 py-5 text-sm">Back</button>
                 <button onClick={() => setSetupStep(5)} className="btn-primary flex-[2] py-5 text-sm">Proceed to Studio</button>
               </div>
            </motion.div>
           )}

           {setupStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="pb-8 border-b border-black/5 mb-12">
                  <p className="mono text-[10px] uppercase opacity-40 mb-2">Final Step</p>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Studio Profile.</h2>
                  <p className="text-muted text-lg">Fine-tune the cinematic engine and engine-wide motion parameters.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                 <div className="space-y-10">
                    <div>
                        <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block text-left">Typography System</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <select
                              value={fontFamily}
                              onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                              className="elite-input w-full p-5 mono text-[10px] font-bold uppercase transition-transform focus:scale-[1.02]"
                           >
                              {[
                                  { val: 'font-outfit', label: 'Outfit (Modern)' },
                                  { val: 'font-grotesk', label: 'Space Grotesk' },
                                  { val: 'font-lexend', label: 'Lexend' },
                                  { val: 'font-syne', label: 'Syne (Elite)' },
                                  { val: 'font-serif', label: 'Cormorant (Elegant)' },
                                  { val: 'font-bricolage', label: 'Bricolage (Editorial)' },
                                  { val: 'font-instrument', label: 'Instrument (Clean)' },
                                  { val: 'font-montserrat', label: 'Montserrat (Brand)' },
                                  { val: 'font-mono', label: 'JetBrains Mono' },
                                  { val: 'font-bangers', label: 'Bangers Kinetic' },
                                  { val: 'font-impact', label: 'Impact' }
                              ].map(f => (
                                 <option key={f.val} value={f.val}>{f.label}</option>
                              ))}
                           </select>

                           <div className="flex items-center gap-4 bg-ivory border border-black/5 p-4">
                              <input 
                                 type="color" 
                                 value={textColor} 
                                 onChange={(e) => setTextColor(e.target.value)} 
                                 className="w-12 h-12 bg-transparent border-none cursor-pointer"
                              />
                              <span className="mono text-[10px] font-bold uppercase">Accent Color</span>
                           </div>

                           <select
                              value={preferredTextPosition}
                              onChange={(e) => updateGlobalTextPosition(e.target.value as TextPosition)}
                              className="elite-input w-full p-5 mono text-[10px] font-bold uppercase"
                           >
                              <option value="random">Random Position</option>
                              <option value="top">Top</option>
                              <option value="center">Center</option>
                              <option value="bottom">Bottom</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                           </select>

                           <select
                              value={preferredTextSize}
                              onChange={(e) => updateGlobalTextSize(e.target.value)}
                              className="elite-input w-full p-5 mono text-[10px] font-bold uppercase"
                           >
                              <option value="random">Random Size</option>
                              <option value="text-3xl">Small</option>
                              <option value="text-5xl">Medium</option>
                              <option value="text-7xl">Large</option>
                              <option value="text-[120px]">XL Massive</option>
                           </select>
                        </div>
                     </div>

                    <div>
                        {/* Kinetic Animations (Multi-Select) Hidden
                         <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Kinetic Animations (Multi-Select)</label>
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                { id: 'gsap-stagger', label: 'Stagger Reveal' },
                                { id: 'gsap-cascade', label: 'Cascade Fall' },
                                { id: 'gsap-glow', label: 'Glow Pulse' },
                                { id: 'gsap-3d-roll', label: '3D Roll' },
                                { id: 'gsap-elastic', label: 'Spring Elastic' },
                                { id: 'gsap-tornado', label: 'Vortex Tornado' },
                                { id: 'gsap-funnel', label: 'Gravity Funnel' },
                                { id: 'gsap-stack', label: 'Letter Stack' },
                                { id: 'gsap-focus-flash', label: 'Focus Flash' },
                                { id: 'gsap-typewriter', label: 'Typewriter' },
                                { id: 'gsap-slide-type', label: 'Slide Typewriter' },
                                { id: 'gsap-glitch', label: 'Glitch' },
                                { id: 'gsap-wave', label: 'Wave Motion' },
                                { id: 'gsap-blur-reveal', label: 'Blur Reveal' },
                              ].map(effect => (
                                <button
                                  key={effect.id}
                                  onClick={() => {
                                    setTextEffect('random');
                                    setSelectedEffects(prev => 
                                      prev.includes(effect.id as TextEffect)
                                        ? prev.filter(e => e !== effect.id)
                                        : [...prev, effect.id as TextEffect]
                                    );
                                  }}
                                  className={`p-3 border mono text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${selectedEffects.includes(effect.id as TextEffect) ? 'bg-ink text-cream border-ink' : 'bg-ivory border-black/5 opacity-60 hover:opacity-100'}`}
                                >
                                  <span className={`w-3 h-3 flex items-center justify-center rounded-sm shrink-0 border ${selectedEffects.includes(effect.id as TextEffect) ? 'border-cream bg-ink' : 'border-black/20'}`}>
                                    {selectedEffects.includes(effect.id as TextEffect) && <div className="w-1.5 h-1.5 bg-cream rounded-sm" />}
                                  </span>
                                  {effect.label}
                                </button>
                              ))}
                            </div>
                         </div>
                         */}
                         
                         <div className="space-y-4">
                            <div className="hidden">
                               <select
                                   value={transitionType}
                                   onChange={(e) => setTransitionType(e.target.value as TransitionType)}
                                   className="elite-input w-full p-5 mono text-[10px] font-bold uppercase"
                                >
                                    <option value="random">Random Transition</option>
                                    <option value="item-portal">3D Item Portal</option>
                                    <option value="morph-star">Morph: Cinematic Star</option>
                                    <option value="morph-circle">Morph: Liquid Circle</option>
                                    <option value="morph-diamond">Morph: Geometric Diamond</option>
                                    <option value="morph-hexagon">Morph: Tech Hexagon</option>
                                    <option value="morph-heart">Morph: Social Heart</option>
                                    <option value="fade">Classic Fade</option>
                                    <option value="zoom">Optical Zoom</option>
                                    <option value="minimal-reveal">Minimal Wipe</option>
                                </select>
                             </div>

                           {/* Thicc Typography Themes */}
                           <div className="space-y-2">
                              <span className="mono text-[10px] uppercase opacity-40 font-bold">Theme Style</span>
                              <div className="grid grid-cols-5 gap-2">
                                <button
                                  onClick={() => setThiccTheme('none')}
                                  className={`p-2 border text-[9px] uppercase font-bold transition-all ${thiccTheme === 'none' ? 'border-black bg-black text-white' : 'border-black/10 hover:border-black/30'}`}
                                >
                                  None
                                </button>
                                <button
                                  onClick={() => setThiccTheme('random')}
                                  className={`p-2 border text-[9px] uppercase font-bold transition-all ${thiccTheme === 'random' ? 'border-black bg-black text-white' : 'border-black/10 hover:border-black/30'}`}
                                >
                                  🎲 Random
                                </button>
                                {THICC_THEME_IDS.map(id => {
                                  const theme = THICC_THEMES[id];
                                  return (
                                    <button
                                      key={id}
                                      onClick={() => setThiccTheme(id)}
                                      className={`p-2 border text-[10px] font-black uppercase transition-all overflow-hidden ${thiccTheme === id ? 'ring-2 ring-black scale-105' : 'hover:scale-102 border-black/10'}`}
                                      style={{
                                        backgroundColor: theme.bgColor,
                                        color: theme.textColor,
                                        fontFamily: theme.fontFamily,
                                        textShadow: theme.textShadow !== 'none' ? theme.textShadow : undefined,
                                      }}
                                    >
                                      {theme.label}
                                    </button>
                                  );
                                })}
                              </div>
                           </div>
                        </div>
                     </div>
                 </div>

                 <div className="space-y-10">
                    <div>
                       <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Global Audio Track</label>
                       <div className="p-8 bg-white border border-black/5 space-y-4">
                           <div className="flex items-center gap-4">
                               {globalAudioUrl ? (
                                   <div className="flex items-center gap-4 w-full bg-ivory p-4 border border-black/10">
                                       <Music className="w-4 h-4 text-ink opacity-50" />
                                       <span className="mono text-[10px] uppercase flex-1 truncate">Custom Audio Selected</span>
                                       <button 
                                           onClick={() => {
                                               if (audioRef.current) {
                                                   audioRef.current.pause();
                                                   audioRef.current.src = "";
                                               }
                                               setGlobalAudioUrl(null);
                                           }}
                                           className="text-red-500 hover:text-red-700 transition-colors"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               ) : (
                                   <label className="flex-1 border-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-black/40 hover:bg-black/5 transition-all text-center">
                                       <Music className="w-6 h-6 mb-2 opacity-50" />
                                       <span className="mono text-[10px] font-bold uppercase block mb-1">Upload Audio</span>
                                       <span className="mono text-[9px] opacity-50">MP3, WAV, etc</span>
                                       <input 
                                           type="file" 
                                           className="hidden" 
                                           accept="audio/*"
                                           onChange={(e) => {
                                               const file = e.target.files?.[0];
                                               if (file) {
                                                   const url = URL.createObjectURL(file);
                                                   setGlobalAudioUrl(url);
                                               }
                                           }}
                                       />
                                   </label>
                               )}
                           </div>
                       </div>
                    </div>

                    <div>
                       <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Director Logic</label>
                       <div className="p-8 bg-white border border-black/5 space-y-8">
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <button onClick={() => setIsSpatialWorld(!isSpatialWorld)}
                                       className={`w-12 h-6 rounded-full relative transition-colors ${isSpatialWorld ? 'bg-ink' : 'bg-black/10'}`}>
                                       <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-cream transition-transform ${isSpatialWorld ? 'translate-x-6' : ''}`} />
                                    </button>
                                    <span className="mono text-[10px] font-bold uppercase">Spatial Engine</span>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <button onClick={() => setIsMultiColor(!isMultiColor)}
                                       className={`w-12 h-6 rounded-full relative transition-colors ${isMultiColor ? 'bg-ink' : 'bg-black/10'}`}>
                                       <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-cream transition-transform ${isMultiColor ? 'translate-x-6' : ''}`} />
                                    </button>
                                    <span className="mono text-[10px] font-bold uppercase">Vibrant Multi</span>
                                 </div>
                              </div>
                           </div>

                          <div className="grid grid-cols-1">
                             <button onClick={() => setShowLibrary(true)} className="flex items-center justify-center gap-3 py-4 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all rounded-lg">
                                <ImageIcon size={16} /> View Assets
                             </button>
                          </div>

                          <button onClick={generateWorldTemplate} className="w-full py-4 bg-ivory border border-black/5 mono text-[10px] font-bold uppercase hover:bg-white transition-all flex items-center justify-center gap-3">
                                   <Sparkles size={16} /> Recalculate Galaxy Path
                          </button>
                       </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Choreography Architecture (Skeletons)</label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {[
                            { id: 'custom', name: 'Custom (AI)', desc: 'AI-generated flow' },
                            { id: 'launch_teaser', name: 'Launch Teaser', desc: 'Skel B: 25s, 8 scenes' },
                            { id: 'product_explainer', name: 'Product Explainer', desc: 'Skel C: 45s, 12 scenes' },
                            { id: 'cinematic_title', name: 'Cinematic Title', desc: 'Skel D: 60s, 7 scenes' }
                          ].map(skel => (
                            <button
                              key={skel.id}
                              onClick={() => setChoreographySkeleton(skel.id)}
                              className={`p-6 border text-left transition-all ${choreographySkeleton === skel.id ? 'bg-ink text-cream border-ink' : 'bg-ivory border-black/5 hover:bg-white'}`}
                            >
                              <p className="mono text-[10px] font-bold uppercase mb-1">{skel.name}</p>
                              <p className="text-[9px] opacity-40 leading-none">{skel.desc}</p>
                            </button>
                          ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                           <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Animation Speed</label>
                           <input
                              type="range" min="0.5" max="2" step="0.1"
                              value={textAnimationSpeed}
                              onChange={(e) => setTextAnimationSpeed(parseFloat(e.target.value))}
                              className="w-full h-1 bg-black/10 appearance-none accent-ink mb-2"
                           />
                           <div className="flex justify-between mono text-[9px] opacity-40 font-bold uppercase">
                              <span>Cinematic</span>
                              <span>Kinetic ({textAnimationSpeed}x)</span>
                           </div>
                        </div>

                         <div>
                           <label className="mono text-[10px] uppercase opacity-40 font-bold mb-4 block">Scene Pacing</label>
                           <input
                              type="range" min="2" max="10" step="0.5"
                              value={sceneDuration}
                              onChange={(e) => setSceneDuration(parseFloat(e.target.value))}
                              className="w-full h-1 bg-black/10 appearance-none accent-ink mb-2"
                           />
                           <div className="flex justify-between mono text-[9px] opacity-40 font-bold uppercase">
                              <span>Rapid</span>
                              <span>Atmospheric ({sceneDuration}s)</span>
                           </div>
                        </div>
                     </div>
                 </div>
               </div>

               <div className="border-t border-black/5 pt-12 mb-16">
                  <h3 className="mono text-[10px] font-bold uppercase opacity-40 mb-8">Scene Sequence Editor</h3>
                  <div className="space-y-4">
                    {compositions.map((comp, idx) => (
                      <div key={comp.id} className="p-8 border border-black/5 bg-ivory/30 flex flex-col md:flex-row items-center gap-12 group hover:bg-white transition-all">
                        <div className="w-12 h-12 bg-ink text-cream flex items-center justify-center font-black text-xl shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xl font-bold uppercase tracking-tight truncate mb-4">{comp.caption || "Untitled Scene"}</p>
                           <div className="flex gap-2">
                             {comp.media.map((m, mIdx) => (
                               <div key={mIdx} className="w-16 h-16 border border-black/10 p-1 bg-white">
                                 <img src={m.url} className={`w-full h-full grayscale ${m.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                               </div>
                             ))}
                           </div>
                           
                        </div>
                        <div className="flex flex-wrap gap-4">
                           <select
                             value={comp.sceneType || 'standard'}
                             onChange={(e) => updateSceneProperty(idx, 'sceneType', e.target.value)}
                             className="bg-white border border-black/10 px-4 py-3 mono text-[9px] uppercase font-bold outline-none focus:border-ink transition-colors flex-1"
                           >
                             <option value="standard">Standard Scene</option>
                             <option value="asset-only">Asset Only (No Text)</option>
                             <option value="macos-notification">MacOS Notification</option>
                             <option value="instagram-follow">Instagram Follow</option>
                             <option value="reddit-post">Reddit Card</option>
                             <option value="x-post">X / Twitter Post</option>
                             <option value="spotify-card">Spotify Now Playing</option>
                             <option value="data-chart">Dynamic Data Chart</option>
                             <option value="coin-flip">3D Coin Flip Card</option>
                           </select>
                           
                           <button
                              onClick={() => {
                                setAddingAssetToSceneIdx(idx);
                                setShowLibrary(true);
                              }}
                              className="bg-ivory border border-black/10 px-4 py-3 hover:bg-ink hover:text-white transition-colors flex items-center justify-center mono text-[9px] font-bold uppercase whitespace-nowrap shrink-0 gap-2"
                            >
                              <ImageIcon size={12} /> Swap Asset
                            </button>

                           <div className="flex flex-1 gap-2">
                             <select
                                value={comp.textEffect || 'gsap-stagger'}
                                onChange={(e) => updateSceneProperty(idx, 'textEffect', e.target.value)}
                                className="bg-white border border-black/10 px-4 py-3 mono text-[9px] uppercase font-bold outline-none focus:border-ink transition-colors flex-1"
                              >
                                <option value="gsap-stagger">Stagger Reveal</option>
                                <option value="gsap-cascade">Cascade Fall</option>
                                <option value="gsap-glow">Glow Pulse</option>
                                <option value="gsap-3d-roll">3D Roll</option>
                                <option value="gsap-elastic">Spring Elastic</option>
                                <option value="gsap-tornado">Vortex Tornado</option>
                                <option value="gsap-funnel">Gravity Funnel</option>
                                <option value="gsap-stack">Letter Stack</option>
                                <option value="gsap-typewriter">Typewriter</option>
                                <option value="gsap-slide-type">Slide Typewriter</option>
                                <option value="gsap-glitch">Glitch</option>
                                <option value="gsap-wave">Wave Motion</option>
                                <option value="gsap-blur-reveal">Blur Reveal</option>
                              </select>
                              <button 
                                onClick={() => applyTextEffectToAllScenes(idx)}
                                className="bg-ivory border border-black/10 px-3 hover:bg-ink hover:text-white transition-colors flex items-center justify-center mono text-[8px] font-bold uppercase whitespace-nowrap shrink-0"
                                title="Apply this text animation to all scenes"
                              >
                                Apply All
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4">
                 <button onClick={() => setSetupStep(3)} className="btn-outline flex-1 py-6 text-sm">Back</button>
                 <button onClick={resetProject} className="btn-outline flex-1 py-6 text-sm !border-red-500/30 !text-red-500 hover:!bg-red-500 hover:!text-white">Reset & Create New</button>
                 <button onClick={generateWorld} className="btn-primary flex-[3] py-6 text-lg flex items-center justify-center gap-4">
                   <Play size={24} fill="currentColor" /> Generate Cinema Preview
                 </button>
               </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (appMode === 'playing') {
      const getBackgroundClass = () => {
        // If thicc theme is active, use its background color
        const thiccThemeActive = currentComp?.thiccTheme && currentComp.thiccTheme !== 'none'
          ? THICC_THEMES[currentComp.thiccTheme as keyof typeof THICC_THEMES]
          : null;
        if (thiccThemeActive) return '';

        const style = currentComp?.activeBackground || backgroundStyles[0] || 'black';

        switch (style) {
            case 'vibrant-glow': return 'bg-purple-900';
            case 'midnight': return 'bg-slate-950';
            case 'deep-ocean': return 'bg-blue-950';
            case 'sunset-fire': return 'bg-orange-600';
            case 'gradient-teal': return 'bg-teal-900';
            case 'gradient-rose': return 'bg-rose-900';
            case 'gradient-amber': return 'bg-amber-900';
            case 'gradient-emerald': return 'bg-emerald-950';
            case 'gradient-indigo': return 'bg-indigo-950';
            case 'gradient-slate': return 'bg-slate-800';
            case 'textured-paper': return 'bg-[#f5f0e8]';
            case 'black': return 'bg-black';
            default: return 'bg-ivory';
          }
      };

      const thiccBgColor = currentComp?.thiccTheme && currentComp.thiccTheme !== 'none'
        ? THICC_THEMES[currentComp.thiccTheme as keyof typeof THICC_THEMES]?.bgColor
        : undefined;

      return (
        <div
          className={`relative w-screen h-screen overflow-hidden transition-colors duration-1000 ${getBackgroundClass()}`}
          style={{ perspective: '2000px', backgroundColor: thiccBgColor }}
        >
          <div className="grain-overlay" />
          
          {globalAudioUrl && (
            <audio 
              ref={audioRef} 
              src={globalAudioUrl} 
              preload="auto" 
              className="hidden" 
            />
          )}

          {/* Spatial Canvas */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentComp?.activeBackground || 'default'}-${currentComp?.thiccTheme || ''}`}
                className={`absolute inset-0 ${getBackgroundClass()}`}
                style={{ backgroundColor: thiccBgColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            </AnimatePresence>
          </div>

          <VideoCanvas key={recordingKey} isRecording={isRecording}>
            <CompositionProvider duration={compositions.length * 5}>
              <motion.div
                className="absolute inset-0 overflow-visible"
                style={{
                  transformStyle: 'preserve-3d',
                  x: worldX,
                  y: worldY,
                  z: worldZ,
                  rotateX: worldRotX,
                  rotateY: worldRotY,
                  rotateZ: worldRoll,
                  scale: worldFOV,
                }}
              >
                <WorldNavigationPaths compositions={compositions} currentIndex={currentIndex} />

                {compositions.map((comp, index) => {
                  let status: 'past' | 'active' | 'future' = 'future';
                  if (index === currentIndex) status = 'active';
                  else if (index < currentIndex) status = 'past';

                  return (
                    <div
                      key={comp.id}
                      className="absolute inset-0 pointer-events-none"
                      style={{ transformStyle: 'preserve-3d' }}
                      data-hf-duration="5"
                      data-hf-trigger={index * 5}
                    >
                      <CompositionNode
                        comp={comp}
                        status={status}
                        globalTextColor={textColor}
                        globalIsMultiColor={isMultiColor}
                        globalFontFamily={fontFamily}
                        socialHandle={socialHandle}
                        websiteSiteName={websiteSiteName}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </CompositionProvider>
          </VideoCanvas>

          {/* GLOBAL TYPOGRAPHY LAYER - FIXED ABOVE WORLD */}
          <div key={`typo-layer-${recordingKey}`} className="absolute inset-0 z-[500] pointer-events-none overflow-hidden">
             <AnimatePresence mode="wait">
               {currentComp && (
                 <motion.div 
                   key={currentIndex + (currentComp.caption || 'empty')}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0"
                 >
                   {/* 1. Social Overlays layer */}
                   {['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post'].includes(currentComp.sceneType) && (
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <PremiumSocialOverlays
                          type={currentComp.sceneType}
                          status="active"
                          caption={currentComp.caption}
                          accentColor={textColor}
                          handle={socialHandle}
                          name={websiteSiteName || "KasperMotion"}
                        />
                      </div>
                   )}
                   
                   {currentComp.sceneType === 'coin-flip' && (
                     <CoinFlipCard caption={currentComp.caption} isActive={appMode === 'playing'} />
                   )}

                   {/* 2. Kinetic Typography layer */}
                   {currentComp.caption && !['instagram-follow', 'x-post', 'macos-notification', 'data-chart', 'spotify-card', 'reddit-post', 'coin-flip', 'asset-only'].includes(currentComp.sceneType) && (() => {
                      const activeTheme = currentComp.thiccTheme && currentComp.thiccTheme !== 'none' 
                        ? THICC_THEMES[currentComp.thiccTheme as keyof typeof THICC_THEMES] 
                        : null;
                      
                      return (
                     <div className={`absolute flex flex-col items-center justify-center text-center px-12 md:px-24 ${getTextPositionClass(currentComp.textPosition)}`}>
                        <motion.div 
                          initial={{ scale: 0.9, y: 30, opacity: 0 }}
                          animate={{ scale: 1, y: 0, opacity: 1 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                          className={`transform -rotate-1 font-black tracking-tight uppercase pointer-events-none ${activeTheme ? (activeTheme.extraClass || '') : (currentComp.fontFamily || fontFamily)}`}
                          style={activeTheme ? {
                            fontFamily: activeTheme.fontFamily,
                            textShadow: activeTheme.textShadow !== 'none' ? activeTheme.textShadow : undefined,
                            letterSpacing: activeTheme.letterSpacing,
                            WebkitTextStroke: activeTheme.textStroke,
                          } : {
                            filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.4))'
                          }}
                        >
                          <AnimatedCaption
                            key={`${currentComp.id}-${currentComp.textEffect}-${generationId}`}
                            text={currentComp.caption}
                            effect={currentComp.textEffect}
                            className={`${currentComp.fontSize || (currentComp.isTextOnly ? 'text-7xl md:text-9xl' : 'text-5xl md:text-7xl')} leading-none`}
                            textColor={activeTheme ? activeTheme.textColor : (currentComp.textColor || textColor)}
                            isMulti={activeTheme ? false : (currentComp.isMultiColor || isMultiColor)}
                            commonWord={commonWord}
                          />
                        </motion.div>
                     </div>
                      );
                   })()}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Vignette & Grime */}
          <div className="vignette-overlay z-[450]" />
          <div className="absolute bottom-12 left-12 z-[600] flex items-center gap-4 opacity-40">
             <div className="w-8 h-px bg-ink" />

          </div>
        </div>
      );
    }

    return null;
  };

  // Render Mode Detection (for HyperFrames headless output)
  const isRenderMode = typeof window !== 'undefined' && window.location.search.includes('mode=render');
  
  useEffect(() => {
    if (isRenderMode) {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('projectId');
      if (projectId) {
        const fetchAndLoad = async () => {
          const docRef = doc(db, 'trailers', projectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             loadProject({ id: docSnap.id, ...docSnap.data() });
          }
        };
        fetchAndLoad();
      }
    }
  }, [isRenderMode]);

  if (isRenderMode) {
     const totalDuration = compositions.reduce((acc, c) => acc + (c.sceneDuration || 5), 0);
     return (
        <div className="fixed inset-0 bg-black overflow-hidden" data-hf-render="true">
           <VideoCanvas isRecording={true}>
              <CompositionProvider duration={totalDuration}>
                 <div className="w-full h-full relative" data-hf-timeline="true">
                    {compositions.map((comp, i) => (
                       <div key={comp.id} style={{ display: currentIndex === i ? 'block' : 'none' }} data-hf-scene={i} data-hf-scene-duration={comp.sceneDuration || 5}>
                          <VideoPlayer 
                            comp={comp} 
                            isActive={currentIndex === i} 
                            onComplete={() => {}}
                            index={i}
                            isRecording={true}
                          />
                       </div>
                    ))}
                 </div>
              </CompositionProvider>
           </VideoCanvas>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-cream selection:bg-ink selection:text-cream font-sans">
      <HandDrawnCursor />

      <AppHeader
        appMode={appMode}
        user={user}
        credits={credits}
        onNavigate={setAppMode}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onNewProject={handleStartOver}
        onReset={resetProject}
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
      {/* HyperFlow Fulfillment Loader */}
      <AnimatePresence>
        {isHyperRendering && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black"
          >
            {/* Animated Background Pulse */}
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
               <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-lg p-12 text-center">
              <div className="mb-12 relative">
                <div className="w-24 h-24 border-4 border-white/5 rounded-full mx-auto flex items-center justify-center p-6 bg-black shadow-2xl">
                   <Zap size={32} className="text-white animate-pulse" fill="currentColor" />
                </div>
                <motion.div 
                  className="absolute -inset-4 border border-white/10 rounded-full"
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h2 className="mono text-2xl font-black uppercase tracking-[0.2em] mb-2 text-white">HyperFlow Rendering</h2>
              <p className="mono text-[10px] uppercase font-bold tracking-widest text-white/40 mb-12">Elite Fulfillment Cluster: Render.com</p>

              <div className="space-y-6">
                <div className="relative h-1 bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${hyperRenderProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-white"
                    transition={{ type: "spring", bounce: 0, duration: 2 }}
                  />
                </div>
                
                <div className="flex justify-between items-center mono text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/60">{hyperRenderMessage}</span>
                  <span className="text-white">{hyperRenderProgress}%</span>
                </div>
              </div>

              <div className="mt-20 flex items-center justify-center gap-2 opacity-20">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExportExplainer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-black/10 p-10 max-w-md w-full text-ink shadow-2xl rounded-none"
            >
               <h2 className="mono text-2xl font-black uppercase mb-2 text-black">Export Engine</h2>
               <p className="font-sans text-[11px] mb-8 opacity-40">Broadcast-quality video capture</p>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="space-y-2">
                   <label className="mono text-[10px] font-bold uppercase opacity-40">Format</label>
                   <select 
                     value={exportFormat} 
                     onChange={(e) => setExportFormat(e.target.value as any)}
                     className="w-full bg-ivory border border-black/10 p-3 mono text-[10px] font-bold uppercase"
                   >
                     <option value="webm">WebM (Alpha)</option>
                     <option value="mp4">MP4 (Standard)</option>
                     <option value="mov">MOV (ProRes)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="mono text-[10px] font-bold uppercase opacity-40">Quality</label>
                   <select 
                     value={exportResolution} 
                     onChange={(e) => setExportResolution(e.target.value as any)}
                     className="w-full bg-ivory border border-black/10 p-3 mono text-[10px] font-bold uppercase"
                   >
                     <option value="4K">ULTRA 4K</option>
                     <option value="1080p">FULL 1080P</option>
                     <option value="720p">HD 720P</option>
                   </select>
                 </div>
               </div>

               <div className="bg-ivory border border-black/5 p-4 mb-8 space-y-2">
                 <p className="font-sans text-[11px] leading-relaxed opacity-60">
                   <span className="font-bold opacity-100">1.</span> Click <span className="bg-ink text-white px-1">EXPORT VIDEO</span> below.
                 </p>
                 <p className="font-sans text-[11px] leading-relaxed opacity-60">
                   <span className="font-bold opacity-100">2.</span> Select <span className="underline font-bold">Current Tab</span> when prompted.
                 </p>
                 <p className="font-sans text-[11px] leading-relaxed opacity-60">
                   <span className="font-bold opacity-100">3.</span> Don't switch tabs. Recording starts after a 3s countdown.
                 </p>
               </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startRecording}
                  className="w-full p-4 bg-ink text-cream rounded-none font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl"
                >
                  <Zap size={18} fill="currentColor" /> Export Video (2 CR)
                </button>
                <button
                  onClick={() => setShowExportExplainer(false)}
                  className="w-full p-3 border border-black/10 hover:bg-black/5 font-bold uppercase text-[10px]"
                >
                  Cancel
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
            className="fixed inset-0 z-[1100] bg-cream/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-ink/10 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-ivory text-ink">
                <h3 className="mono font-bold uppercase flex items-center gap-3 text-sm"><Sparkles size={16} /> Add Giphy Sticker</h3>
                <button onClick={() => setShowGiphyModal(false)} className="p-2 hover:bg-black/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 border-b border-black/5 bg-white">
                <form onSubmit={handleGiphySearch} className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={giphySearchQuery}
                      onChange={(e) => setGiphySearchQuery(e.target.value)}
                      placeholder="Search for a sticker..."
                      className="elite-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary py-2 px-8 text-xs">
                    Search
                  </button>
                </form>
              </div>

              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-white text-ink">
                {isSearchingGiphy ? (
                  <div className="flex flex-col items-center justify-center h-48 opacity-40">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p className="mono font-bold">Searching Giphy...</p>
                  </div>
                ) : giphySearchResults.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4">
                    {giphySearchResults.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => applyStickerToCurrentScene(gif.images.original.url)}
                        className="aspect-square bg-ivory border border-transparent hover:border-ink transition-all p-2 flex items-center justify-center group"
                      >
                        <img src={gif.images.fixed_height.url} alt={gif.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 opacity-20">
                    <ImageIcon size={48} className="mb-4" />
                    <p className="mono font-bold">Search stickers for Scene {currentIndex + 1}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {authModalPromise && (
        <AuthModal
          onSuccess={(u) => {
            authModalPromise.resolve(u);
            setAuthModalPromise(null);
          }}
          onClose={() => {
            authModalPromise.resolve(null);
            setAuthModalPromise(null);
          }}
        />
      )}

    </div>
  );
}
