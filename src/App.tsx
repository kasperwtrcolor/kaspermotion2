import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform } from 'motion/react';
import { Upload, Video, X, AlertCircle, Play, FileText, Image as ImageIcon, ArrowRight, CheckCircle2, Link as LinkIcon, Loader2, LogOut, User as UserIcon, Save, History, Trash2, Sparkles, Wand2, ChevronLeft, ChevronRight, Search, Github, Twitter, Youtube, Figma, Slack, Instagram, Chrome } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { GoogleGenAI } from "@google/genai";
import { GiphyFetch } from '@giphy/js-fetch-api';
import LandingPage from './components/LandingPage';
import AppHeader from './components/AppHeader';
import ProfilePage from './components/ProfilePage';
import VideoCanvas from './components/VideoCanvas';
import WebsiteShowcaseScene from './components/WebsiteShowcaseScene';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'dummy_key_to_prevent_crash');

type TextPosition = 'bottom' | 'top' | 'center' | 'left' | 'right' | 'random';
type FontStyle = 'font-sans' | 'font-serif' | 'font-mono' | 'font-display';
type BackgroundStyle = 'black' | 'gradient-blue' | 'gradient-purple' | 'grid' | 'vibrant-glow' | 'particles' | 'parallax' | 'gradient-teal' | 'gradient-rose' | 'gradient-amber' | 'gradient-emerald' | 'gradient-indigo' | 'gradient-slate' | 'deep-ocean' | 'sunset-fire' | 'midnight';
type TextEffect = 'gsap-split' | 'typewriter' | 'fade' | 'kinetic' | 'bounce' | 'glitch' | 'reveal' | 'zoom' | 'blur' | 'neon' | 'wave' | 'shake' | 'slide' | 'perspective' | 'random' | 'gsap-cascade' | 'gsap-3d-roll' | 'gsap-elastic' | 'gsap-expand' | 'gsap-tornado' | 'gsap-merge-elastic' | 'gsap-funnel' | 'gsap-triangle' | 'gsap-square' | 'gsap-heart' | 'gsap-stack';
type FontFamily = 'font-sans' | 'font-display' | 'font-serif' | 'font-mono' | 'font-archivo' | 'font-bebas' | 'font-outfit' | 'font-syne' | 'font-unbounded' | 'font-kanit' | 'font-public' | 'font-work' | 'font-montserrat' | 'font-impact';
type TransitionType = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'explode' | 'spin' | 'expand' | 'contract' | 'random';

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
  sceneType: 'standard' | 'text-morph' | 'grid' | 'split' | 'website-showcase';
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
  websiteScreenshot?: string;
  websiteUrl?: string;
  fontFamily?: FontFamily;
  textColor?: string;
  isMultiColor?: boolean;
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
  giphyStickerUrl?: string,
  fontFamily?: FontFamily,
  textColor?: string,
  isMultiColor?: boolean
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

  const positions: Exclude<TextPosition, 'random'>[] = items.length > 0 
    ? ['left', 'right'] 
    : ['bottom', 'top', 'center', 'left', 'right'];
    
  const textPosition = preferredPosition === 'random' 
    ? positions[Math.floor(Math.random() * positions.length)]
    : (items.length > 0 && (preferredPosition === 'center' || preferredPosition === 'top' || preferredPosition === 'bottom'))
      ? (Math.random() > 0.5 ? 'left' : 'right')
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
    giphyStickerUrl,
    fontFamily,
    textColor,
    isMultiColor
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
        "70%": { scale: 1.1, opacity: 1 },
        "100%": { scale: 30, opacity: 0 }
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
        "20%": { 
          x: (i) => (i % 3 === 0 ? 0 : i % 3 === 1 ? -40 : 40) + (Math.random()*10-5),
          y: (i) => (i % 3 === 0 ? -40 : 40) + (Math.random()*10-5),
          opacity: 1
        },
        "60%": { x: 0, y: 0, opacity: 1 },
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
        "20%": { 
          x: (i) => (i % 4 === 0 || i % 4 === 3 ? -40 : 40),
          y: (i) => (i % 4 === 0 || i % 4 === 1 ? -40 : 40),
          opacity: 1
        },
        "60%": { x: 0, y: 0, opacity: 1 },
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
        "20%": { 
          x: (i) => 2.5 * (16 * Math.pow(Math.sin(i * 0.5), 3)), 
          y: (i) => -2.5 * (13 * Math.cos(i * 0.5) - 5 * Math.cos(2*i*0.5) - 2 * Math.cos(3*i*0.5) - Math.cos(4*i*0.5)),
          opacity: 1
        },
        "60%": { x: 0, y: 0, opacity: 1 },
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
    case 'typewriter': return <TypewriterText {...props} />;
    case 'fade': return <FadeText {...props} />;
    case 'kinetic': return <KineticText {...props} />;
    case 'bounce': return <BounceText {...props} />;
    case 'glitch': return <GlitchText {...props} />;
    case 'reveal': return <RevealText {...props} />;
    case 'zoom': return <ZoomText {...props} />;
    case 'blur': return <BlurText {...props} />;
    case 'neon': return <NeonText {...props} />;
    case 'wave': return <WaveText {...props} />;
    case 'shake': return <ShakeText {...props} />;
    case 'slide': return <SlideText {...props} />;
    case 'perspective': return <PerspectiveText {...props} />;
    case 'gsap-split': return <GSAPSplitText {...props} />;
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
    default: return <SplitText {...props} />;
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
    // Variant 0: Standard Perspective Tilt
    { 
      rotateY: [-20, 20, -20], 
      rotateX: [10, -5, 10], 
      scale: [0.8, 1.1, 0.8] 
    },
    // Variant 1: Spin & Reveal
    {
      rotateY: [0, 360],
      scale: [0.7, 1.2, 0.7],
      rotateZ: [0, 5, -5, 0]
    },
    // Variant 2: Zoom Dive
    {
      z: [0, 400, 0],
      rotateY: [-10, 10, -10],
      scale: [0.8, 1.5, 0.8]
    },
    // Variant 3: Kinetic Shake
    {
      x: [0, 20, -20, 0],
      rotateY: [-15, 15],
      scale: [0.9, 1.1]
    }
  ];

  return (
    <motion.div
      initial={{ rotateY: -20, rotateX: 10, scale: 0.8 }}
      animate={status === 'active' ? animations[variant % animations.length] : { rotateY: -20, rotateX: 10, scale: 0.8 }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="relative bg-white brutal-border shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
      style={{ transformStyle: 'preserve-3d', width: 320, height: 650 }}
    >
      {/* Dynamic Island */}
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
      {/* Glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-30"></div>
    </motion.div>
  );
};

// Helper components formerly here (icons/shapes) have been decommissioned for a cleaner cinematic look.
const FlashOverlay = ({ status }: { status: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={status === 'active' ? { opacity: [0, 0.4, 0] } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-[1000] bg-white pointer-events-none"
    />
  );
};

const CinematicOverlay = ({ useGrainEffect }: { useGrainEffect: boolean }) => {
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
      {useGrainEffect && (
        <div 
          className="absolute opacity-[0.15] mix-blend-overlay pointer-events-none" 
          style={{ 
            top: '-50%', left: '-50%', width: '200%', height: '200%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            animation: 'film-grain 8s steps(10) infinite'
          }}
        ></div>
      )}
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.8)_120%)] mix-blend-multiply pointer-events-none"></div>
    </div>
  );
};

const CompositionNode = ({ 
  comp, 
  status, 
  fontSizeOverride,
  globalTextColor,
  globalIsMultiColor
}: { 
  key?: string; 
  comp: Composition; 
  status: 'past' | 'active' | 'future'; 
  fontSizeOverride?: string;
  globalTextColor: string;
  globalIsMultiColor: boolean;
}) => {
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
      z: 0,
      filter: ['blur(20px)', 'blur(10px)', 'blur(0px)'],
      transition: { times: [0, 0.3, 1], duration: 4, ease: 'easeOut' }
    } : { 
      ...transitionVariants.active,
      rotateY: [15, -5], 
      rotateX: [10, 5],
      z: [0, 200], // Zoom in effect
      transition: { 
        z: { duration: 8, ease: "easeOut" },
        filter: { duration: 0.4 },
        default: { type: 'spring', damping: 15, stiffness: 100, mass: 1, delay: 0.1 }
      }
    },
    past: {
      ...transitionVariants.past,
      rotateZ: 0,
      scale: 0,
      z: 400,
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

  const mediaClass = "max-w-[85vw] max-h-[75vh] w-auto h-auto block object-contain brutal-border bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-2";
  const multiMediaClass = "max-w-[40vw] max-h-[40vh] w-auto h-auto block object-contain brutal-border bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1";

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
            <AnimatedCaption 
              text={comp.caption} 
              effect={comp.textEffect} 
              className={`${fontSizeOverride || "text-5xl md:text-7xl"} font-bold tracking-tight drop-shadow-2xl ${comp.fontFamily || 'font-display'}`} 
              textColor={comp.textColor || globalTextColor}
              isMulti={comp.isMultiColor || globalIsMultiColor}
            />
          </motion.div>
        )}

        {/* Cinematic media display */}
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
        {comp.sceneType === 'website-showcase' && comp.websiteScreenshot && (
          <WebsiteShowcaseScene
            screenshotUrl={comp.websiteScreenshot}
            websiteUrl={comp.websiteUrl || ''}
            status={status}
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
                  <MobileMockup status={status} variant={index} isLandscape={m.url?.toLowerCase().includes('landscape') || (m.scale || 1) > 1.2}>
                    <MobileMockupContent m={m} caption={comp.caption} setHasError={setHasError} />
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

  const [appMode, setAppMode] = useState<'landing' | 'setup' | 'playing' | 'profile'>('landing');
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [selectedLibraryAssets, setSelectedLibraryAssets] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptText, setScriptText] = useState("");

  const [scrapeUrl, setScrapeUrl] = useState("https://");
  const [isScraping, setIsScraping] = useState(false);
  const [websiteScreenshot, setWebsiteScreenshot] = useState<string | null>(null);
  const [websiteSiteName, setWebsiteSiteName] = useState<string>('');
  
  const [fontStyle, setFontStyle] = useState<FontStyle>('font-sans');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('black');
  const [fontFamily, setFontFamily] = useState<FontFamily>('font-display');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [isMultiColor, setIsMultiColor] = useState<boolean>(false);
  const [textEffect, setTextEffect] = useState<TextEffect>('gsap-split');
  const [preferredTextPosition, setPreferredTextPosition] = useState<TextPosition>('random');
  const [transitionType, setTransitionType] = useState<TransitionType>('zoom');
  const [transitionDuration, setTransitionDuration] = useState(1.2);
  const [textAnimationSpeed, setTextAnimationSpeed] = useState<number>(1.0);
  const [sceneDuration, setSceneDuration] = useState<number>(5.0);
  const [dailyCreditsClaimed, setDailyCreditsClaimed] = useState(false);

  useEffect(() => {
    gsap.globalTimeline.timeScale(textAnimationSpeed);
  }, [textAnimationSpeed]);

  const [preset, setPreset] = useState<string>('custom');
  
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [useGrainEffect, setUseGrainEffect] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        if (dailyCreditsClaimed) return;
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const today = new Date().toISOString().split('T')[0];

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.lastRewardDate !== today) {
              const newCredits = (userData.credits || 0) + 5;
              await setDoc(userRef, { credits: newCredits, lastRewardDate: today }, { merge: true });
              setToastMessage("You received 5 daily credits!");
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
    if (credits < 3) {
      setToastMessage("Not enough credits. You need 3 credits to generate an image.");
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
          await setDoc(userRef, { credits: Math.max(0, credits - 3) }, { merge: true });
          setToastMessage("Image generated! 3 credits used.");
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
    
    if (mediaFiles.length === 0 && !scriptText.trim()) return;

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
              ...(giphyStickerUrl && { giphyStickerUrl }),
              ...(stickerScale && { stickerScale }),
              ...(stickerX !== undefined && { stickerX }),
              ...(stickerY !== undefined && { stickerY })
            };
          } catch (uploadErr) {
            console.error("File upload failed for:", item.name, uploadErr);
            // Fallback to current URL if upload fails (might be a blob but better than nothing)
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
          textAnimationSpeed,
          sceneDuration,
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
    setBackgroundStyle(project.settings.backgroundStyle);
    setTextEffect(project.settings.textEffect);
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

  // Auto-play logic — scene duration accounts for text animation time if text exists
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appMode === 'playing' && !isRecording && compositions.length > 0) {
      const hasText = currentComp?.caption && currentComp.caption.trim().length > 0;
      // Base GSAP animation duration is 4s; adjusted by speed multiplier
      const animDuration = hasText ? (4 / textAnimationSpeed) * 1000 : 0;
      // Scene stays at least long enough for text animation to finish + buffer (if gsap text exists)
      const effectiveSceneDuration = Math.max(sceneDuration * 1000, hasText ? animDuration + 1500 : 0);
      
      timer = setTimeout(() => {
        setCurrentIndex(prev => {
          if (prev < compositions.length - 1) return prev + 1;
          return 0;
        });
      }, effectiveSceneDuration); 
    }
    return () => clearTimeout(timer);
  }, [appMode, isRecording, compositions, sceneDuration, textAnimationSpeed, currentIndex, currentComp]);

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
        
        // Capture screenshot URL
        if (data.screenshotUrl) {
          setWebsiteScreenshot(data.screenshotUrl);
          
          const newScreenshotItem: MediaItem = {
            id: `screenshot-${Date.now()}`,
            type: 'image',
            url: data.screenshotUrl,
            file: null as any
          };
          setMediaFiles(prev => [...prev, newScreenshotItem]);
        }
        if (data.siteName) {
          setWebsiteSiteName(data.siteName);
        }
        
        setToastMessage("Content fetched — script, screenshot & assets ready!");
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
    if (preset === p) {
      setPreset(undefined as any);
      // Reset to defaults
      setFontStyle('font-display');
      setBackgroundStyle('black');
      setTextEffect('gsap-split');
      setTransitionType('dissolve');
      return;
    }
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
    if (mediaFiles.length === 0 && !scriptText.trim()) {
      setToastMessage("Please add some media files or write a script first.");
      return;
    }

    const isAdmin = user?.email === 'philipsimmons67@gmail.com';

    if (!isAdmin && credits < 1) {
      setToastMessage("Not enough credits. You need 1 credit to generate a trailer.");
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
      
      let activeEffect = textEffect;
      if (isTextOnly) {
        const textOnlyEffects: TextEffect[] = ['gsap-expand', 'gsap-tornado', 'gsap-merge-elastic', 'gsap-funnel', 'gsap-triangle', 'gsap-square', 'gsap-heart', 'gsap-stack'];
        activeEffect = textOnlyEffects[Math.floor(Math.random() * textOnlyEffects.length)];
      } else if (textEffect === 'random') {
        const effects: TextEffect[] = ['gsap-split', 'typewriter', 'fade', 'kinetic', 'bounce', 'glitch', 'reveal', 'zoom', 'blur', 'neon', 'wave', 'shake', 'slide', 'perspective'];
        activeEffect = effects[Math.floor(Math.random() * effects.length)];
      }

      const transitions: TransitionType[] = ['fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract'];
      const activeTransition = transitionType === 'random' ? transitions[Math.floor(Math.random() * transitions.length)] : transitionType;

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
        backgroundStyle,
        undefined, // Dedicated Giphy scenes handled below
        fontFamily,
        textColor,
        isMultiColor
      );
      
      newComps.push(comp);
      prev = comp;

      // Dedicated Giphy Scene Insertion
      if (useGiphy && caption && sceneIdx % 3 === 0) {
        try {
          const words = caption.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
          const searchTerm = words.slice(0, 2).join(' ') || words[0] || 'dynamic';
          const { data } = await gf.search(searchTerm, { type: 'stickers', limit: 1 });
          
          if (data && data.length > 0) {
            const stickerUrl = data[0].images.original.url;
            const giphyComp = generateComposition(
              [], // No media, focus on sticker
              sceneIdx + 100, 
              searchTerm.toUpperCase(), 
              'center', 
              activeEffect, 
              'zoom', 
              transitionDuration, 
              prev,
              true, // isTextOnly logic
              preset,
              backgroundStyle,
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

    // Inject Website Showcase scene if screenshot is available
    if (websiteScreenshot) {
      const showcaseCaption = websiteSiteName || scrapeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const showcaseAngle = prev ? prev.angle + (Math.random() * 1.5 - 0.75) : 0;
      const distance = 2000;
      const showcaseX = prev ? prev.x + Math.cos(showcaseAngle) * distance : 0;
      const showcaseY = prev ? prev.y + Math.sin(showcaseAngle) * distance : 0;
      
      const websiteComp: Composition = {
        id: Math.random().toString(36).substr(2, 9),
        media: [],
        x: showcaseX,
        y: showcaseY,
        z: 0,
        rotX: 0, rotY: 0, rotZ: 0,
        angle: showcaseAngle,
        caption: `Visit ${showcaseCaption}`,
        textPosition: 'bottom',
        sceneType: 'website-showcase',
        textEffect,
        transitionType: 'zoom',
        transitionDuration: 1.5,
        isTextOnly: false,
        preset,
        backgroundStyle,
        websiteScreenshot,
        websiteUrl: scrapeUrl,
        fontFamily,
        textColor,
        isMultiColor
      };
      
      // Insert website scene early in the trailer (after scene 1)
      if (newComps.length > 1) {
        newComps.splice(1, 0, websiteComp);
      } else {
        newComps.push(websiteComp);
      }
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
    const isAdmin = user?.email === 'philipsimmons67@gmail.com';
    if (!isAdmin && credits < 2) {
      setToastMessage("Not enough credits. You need 2 credits to export.");
      return;
    }
    try {
      setShowExportExplainer(false);
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
        document.body.style.cursor = 'default';
        const header = document.querySelector('header');
        if (header) (header as HTMLElement).style.display = '';
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      // Hide cursor, header, and show countdown before recording
      document.body.style.cursor = 'none';
      const header = document.querySelector('header');
      if (header) (header as HTMLElement).style.display = 'none';
      
      // Countdown overlay
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

      // Start actual recording and remount scene 0
      setIsRecording(true);
      setRecordingKey(prev => prev + 1);
      setCurrentIndex(0);
      setRecordingProgress(0);

      // Brief delay for React flush
      await new Promise(r => setTimeout(r, 100));
      mediaRecorder.start();
      
      for (let i = 0; i < compositions.length; i++) {
        if (!sequenceActiveRef.current) break;
        
        // Update index
        setCurrentIndex(i);
        setRecordingProgress((i / compositions.length) * 100);
        
        // Calculate duration per scene dynamically
        const hasText = compositions[i].caption && compositions[i].caption.trim().length > 0;
        const animDuration = hasText ? (4 / textAnimationSpeed) * 1000 : 0;
        const effectiveSceneDuration = Math.max(sceneDuration * 1000, hasText ? animDuration + 1500 : 0);

        // Wait for current scene duration
        await new Promise(r => setTimeout(r, effectiveSceneDuration)); 
      }

      if (sequenceActiveRef.current) {
        setRecordingProgress(100);
        // Final wait for the last scene to settle
        const finalAnimDuration = (4 / textAnimationSpeed) * 1000;
        await new Promise(r => setTimeout(r, Math.max(2000, finalAnimDuration))); 
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        // Deduct export credits
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

  // --- RENDER MAIN CONTENT ---
  const renderContent = () => {
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
        />
      );
    }

    if (appMode === 'setup') {
      return (
        <div className="min-h-screen bg-isometric-grid text-black font-sans flex items-start md:items-center justify-center p-4 md:p-6 pt-16 overflow-y-auto">
          <div className="w-full max-w-3xl brutal-card p-6 md:p-12 my-auto max-h-[85vh] overflow-y-auto custom-scrollbar relative">
            {/* Loading Overlays (Excluding Generation) */}
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
            
            {/* Card Header */}
            <div className="flex items-center justify-between mb-8 md:mb-12 border-b-4 border-black pb-4">
              <div>
                <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-1">Create Trailer</h1>
                <p className="text-black font-mono text-xs md:text-sm font-bold bg-brutal-green inline-block px-2 py-1 brutal-border transform -rotate-2">Step {setupStep} of 4</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(step => (
                  <div 
                    key={step} 
                    className={`w-4 h-4 brutal-border transition-colors ${setupStep >= step ? 'bg-black' : 'bg-white'}`} 
                  />
                ))}
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
                          IMPORT SELECTED ({selectedLibraryAssets.size})
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
                    <span className="hidden sm:inline">CREATE IMAGE</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setSetupStep(2)}
                  className="brutal-button bg-brutal-orange px-8 py-3 text-lg flex items-center gap-2"
                >
                  Continue <ArrowRight size={18} />
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
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : 'Fetch Content'}
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
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Typography Style</h3>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full brutal-input px-3 py-3 text-sm font-bold uppercase transition-all"
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
                      { val: 'font-impact', label: 'Impact Display' }
                    ].map(f => (
                      <option key={f.val} value={f.val} className={f.val}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Font Color</h3>
                  <div className="flex gap-4">
                    <input 
                      type="color" 
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-12 brutal-border cursor-pointer bg-white p-1"
                    />
                    <label className="flex items-center gap-2 cursor-pointer flex-1 brutal-border px-3 bg-white">
                      <input 
                        type="checkbox" 
                        checked={isMultiColor}
                        onChange={(e) => setIsMultiColor(e.target.checked)}
                        className="w-5 h-5 border-2 border-black rounded-none text-brutal-green focus:ring-0"
                      />
                      <span className="text-[10px] font-mono font-bold uppercase">Multicolors</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Background</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(['black', 'gradient-blue', 'gradient-purple', 'gradient-teal', 'gradient-rose', 'gradient-amber', 'gradient-emerald', 'gradient-indigo', 'gradient-slate', 'deep-ocean', 'sunset-fire', 'midnight', 'grid', 'vibrant-glow', 'particles', 'parallax'] as BackgroundStyle[]).map(bg => (
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


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Text Animation</h3>
                  <select 
                    value={textEffect}
                    onChange={(e) => setTextEffect(e.target.value as TextEffect)}
                    className="w-full brutal-input px-3 py-3 text-sm font-bold uppercase transition-all bg-white"
                  >
                    {[
                      'gsap-split', 'typewriter', 'fade', 'kinetic', 'bounce', 'glitch', 
                      'reveal', 'zoom', 'blur', 'neon', 'wave', 'shake', 'slide', 'perspective', 'random'
                    ].map(effect => (
                      <option key={effect} value={effect}>{effect.replace('-', ' ')}</option>
                    ))}
                  </select>
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
                    {(['fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract', 'random'] as TransitionType[]).map(type => (
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
                    
                    <h4 className="text-xs font-mono font-bold uppercase mt-4 mb-2 text-black border-t-2 border-black pt-4">Text Anim Speed</h4>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1" 
                      value={textAnimationSpeed}
                      onChange={(e) => setTextAnimationSpeed(parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-black font-bold">
                      <span>SLOWER (0.5x)</span>
                      <span>{textAnimationSpeed}x</span>
                      <span>FASTER (2x)</span>
                    </div>

                    <h4 className="text-xs font-mono font-bold uppercase mt-4 mb-2 text-black border-t-2 border-black pt-4">Scene Length</h4>
                    <input 
                      type="range" 
                      min="2" 
                      max="15" 
                      step="0.5" 
                      value={sceneDuration}
                      onChange={(e) => setSceneDuration(parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-black font-bold">
                      <span>SHORT (2s)</span>
                      <span>{sceneDuration}s</span>
                      <span>LONG (15s)</span>
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

              <div className="mb-8 md:mb-12">
                <h3 className="text-sm font-mono font-bold uppercase mb-3 border-b-2 border-black pb-1 inline-block text-black">Video Effects</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUseGrainEffect(!useGrainEffect)}
                    className={`w-12 h-6 brutal-border relative transition-colors ${useGrainEffect ? 'bg-brutal-green' : 'bg-white'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-black transition-all ${useGrainEffect ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-black">Film Grain Overlay</span>
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
        switch (backgroundStyle) {
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
          case 'black': return 'bg-black';
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

          // Randomize text size for text-only scenes
          const randomFontSize = comp.isTextOnly 
            ? ['text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'][Math.floor(Math.random() * 5)]
            : 'text-4xl md:text-6xl';

          return (
            <div key={comp.id} className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
              <FlashOverlay status={status} />
              <CompositionNode 
                comp={comp} 
                status={status} 
                fontSizeOverride={randomFontSize} 
                globalTextColor={textColor}
                globalIsMultiColor={isMultiColor}
              />
            </div>
          );
        })}
      </motion.div>

      {/* Cinematic Overlay (Film Grain, Vignette, Chromatic Aberration) */}
      <CinematicOverlay useGrainEffect={useGrainEffect} />

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
            <div className={`transform -rotate-2 ${fontFamily} font-bold tracking-tighter uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}>
              <AnimatedCaption 
                text={currentComp.caption} 
                effect={currentComp.textEffect} 
                className="text-4xl md:text-6xl"
                textColor={currentComp.textColor || textColor}
                isMulti={currentComp.isMultiColor || isMultiColor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        onExport={() => setShowExportExplainer(true)}
        onStudio={() => setAppMode('setup')}
        onStickers={() => setShowGiphyModal(true)}
        onResetCamera={resetCamera}
        isRendering={isRenderingTrailer}
        renderProgress={renderProgress}
      />
      
      {renderContent()}

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
              className="bg-white brutal-border p-8 max-w-md w-full text-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="font-display text-2xl font-bold uppercase mb-4 text-brutal-blue">Export Instructions</h2>
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
                  className="flex-1 px-4 py-3 bg-white brutal-border font-bold font-mono text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={startRecording}
                  className="flex-1 px-4 py-3 bg-brutal-blue text-black brutal-border font-bold font-mono text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex items-center justify-center gap-2"
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
                      className="brutal-input w-full py-3 pl-10 pr-4 text-sm bg-white"
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
    </>
  );
}
