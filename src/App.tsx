import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useVelocity, useTransform } from 'motion/react';
import { Upload, Video, X, AlertCircle, Play, FileText, Image as ImageIcon, ArrowRight, CheckCircle2, Link as LinkIcon, Loader2, LogOut, User as UserIcon, Save, History, Trash2, Sparkles, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type TextPosition = 'bottom' | 'top' | 'center' | 'left' | 'right' | 'random';
type FontStyle = 'font-sans' | 'font-serif' | 'font-mono' | 'font-display';
type BackgroundStyle = 'black' | 'gradient-blue' | 'gradient-purple' | 'grid' | 'vibrant-glow';
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
};

const generateComposition = (
  items: MediaItem[],
  index: number,
  caption: string,
  preferredPosition: TextPosition,
  preferredEffect: TextEffect,
  preferredTransition: TransitionType,
  preferredDuration: number,
  prevComp?: Composition
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
    transitionDuration: preferredDuration
  };
};

const SplitText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <div key={i} className="overflow-hidden pb-2">
          <motion.div
            initial={{ y: '100%', opacity: 0, rotateX: -45 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block origin-bottom"
          >
            {word}
          </motion.div>
        </div>
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
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
};

const FadeText = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.9 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={className}
    >
      {text}
    </motion.div>
  );
};

const KineticText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
      {words.map((word, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            delay: i * 0.1, 
            type: 'spring', 
            damping: 12, 
            stiffness: 200 
          }}
          className="inline-block"
        >
          {word}
        </motion.div>
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

  if (!url) return <div className="w-full h-full bg-white/5 animate-pulse" />;

  return item.type === 'video' ? (
    <video src={url} className="w-full h-full object-cover opacity-70" muted />
  ) : (
    <img src={url} className="w-full h-full object-cover opacity-70" alt="thumbnail" />
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
      <motion.div
        className="absolute -top-32 -left-32 w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 shadow-2xl"
        initial={{ x: -800, y: -500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [-800, 0, 150, 800],
          y: [-500, 0, -150, -500],
          rotateX: [0, 360, 720],
          rotateY: [0, 360, 720],
          rotateZ: [0, 180, 360],
          scale: [0, 1.5, 1, 0],
        }}
        transition={{
          duration: 4.5,
          times: [0, 0.4, 0.8, 1],
          ease: "easeInOut",
        }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-2xl"
        initial={{ x: 800, y: 500, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
        animate={{
          x: [800, 0, -100, -800],
          y: [500, 0, 100, 500],
          rotateX: [0, -360, -720],
          rotateY: [0, -360, -720],
          rotateZ: [0, -180, -360],
          scale: [0, 1.2, 1, 0],
        }}
        transition={{
          duration: 4.5,
          times: [0, 0.4, 0.8, 1],
          ease: "easeInOut",
          delay: 0.5
        }}
        style={{ transformStyle: 'preserve-3d' }}
      />
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

  const mediaClass = "max-w-[85vw] max-h-[75vh] w-auto h-auto block object-contain shadow-[0_0_60px_rgba(255,255,255,0.2)] border-[4px] border-white/90 rounded-[2rem] bg-black/20";
  const multiMediaClass = "max-w-[40vw] max-h-[40vh] w-auto h-auto block object-contain shadow-[0_0_40px_rgba(255,255,255,0.15)] border-[3px] border-white/80 rounded-[1.5rem] bg-black/20";

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
            <AnimatedCaption text={comp.caption} effect={comp.textEffect} className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl" />
          </motion.div>
        )}

        {comp.media.length > 0 && (
          <>
            <ParticleTrails />
            <CartoonShapes status={status} />
          </>
        )}

        {comp.media.map((m, i) => (
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
              <div className={`${isMulti ? multiMediaClass : mediaClass} flex flex-col items-center justify-center gap-4 bg-white/5 border-white/10`}>
                <AlertCircle size={isMulti ? 24 : 48} className="text-white/20" />
                <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Error</p>
              </div>
            ) : (
              m.url && (
                m.type === 'video' ? (
                  <video
                    src={m.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={isMulti ? multiMediaClass : mediaClass}
                    onError={() => setHasError(true)}
                  />
                ) : (
                  <img
                    src={m.url}
                    alt={comp.caption}
                    className={isMulti ? multiMediaClass : mediaClass}
                    style={{ imageOrientation: 'from-image' }}
                    onError={() => setHasError(true)}
                  />
                )
              )
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userTrailers, setUserTrailers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRenderingTrailer, setIsRenderingTrailer] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const [appMode, setAppMode] = useState<'setup' | 'playing'>('setup');
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptText, setScriptText] = useState("");

  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  
  const [fontStyle, setFontStyle] = useState<FontStyle>('font-sans');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('black');
  const [textEffect, setTextEffect] = useState<TextEffect>('gsap-split');
  const [preferredTextPosition, setPreferredTextPosition] = useState<TextPosition>('random');
  const [transitionType, setTransitionType] = useState<TransitionType>('zoom');
  const [transitionDuration, setTransitionDuration] = useState(1.2);
  const [preset, setPreset] = useState<'custom' | 'blockbuster' | 'documentary' | 'music-video'>('custom');
  
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'mov'>('webm');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');

  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentComp = compositions[currentIndex];
  
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [isRecording, setIsRecording] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

      return () => {
        unsubscribe();
        unsubscribeAssets();
      };
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setToastMessage("Login failed. Please try again.");
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
        if (!uploaded) {
          setToastMessage("AI Image generated locally, but failed to save to cloud library (CORS/Permissions).");
        } else {
          setToastMessage("AI Image generated and saved to library!");
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
      // 1. Upload media if they are local files and add to library
      const mediaData = await Promise.all(mediaFiles.map(async (item, i) => {
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

            return {
              url,
              type: item.type,
              name: item.name,
              caption: scriptText.split('\n')[i] || ''
            };
          } catch (uploadErr) {
            console.error("File upload failed for:", item.name, uploadErr);
            // Fallback to current URL if upload fails (might be a blob but better than nothing)
            return {
              url: item.url,
              type: item.type,
              name: item.name,
              caption: scriptText.split('\n')[i] || ''
            };
          }
        } else {
          return {
            url: item.url,
            type: item.type,
            name: item.name,
            caption: scriptText.split('\n')[i] || ''
          };
        }
      }));

      // 2. Save the trailer project
      const trailerData = {
        userId: user.uid,
        name: `Trailer ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}${isAutoSave ? ' (Auto-saved)' : ''}`,
        script: scriptText,
        settings: {
          fontStyle,
          backgroundStyle,
          textEffect,
          transitionType,
          transitionDuration,
          preset
        },
        media: mediaData,
        createdAt: serverTimestamp(),
        isAutoSave
      };

      await addDoc(collection(db, 'trailers'), trailerData);
      setToastMessage(isAutoSave ? "Project auto-saved" : "Project saved successfully!");
    } catch (err) {
      console.error("Save project failed:", err);
      if (!isAutoSave) setToastMessage("Failed to save project. Check your connection.");
    } finally {
      if (!isAutoSave) setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const loadProject = (project: any) => {
    setScriptText(project.script);
    setFontStyle(project.settings.fontStyle);
    setBackgroundStyle(project.settings.backgroundStyle);
    setTextEffect(project.settings.textEffect);
    setTransitionType(project.settings.transitionType);
    setTransitionDuration(project.settings.transitionDuration);
    
    // We can't easily convert URLs back to File objects for the current setup
    // So we'll need to modify generateWorld to handle URLs directly
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;
    project.media.forEach((m: any, i: number) => {
      const comp = generateCompositionFromData([m], i, project.settings.textEffect, project.settings.transitionType, project.settings.transitionDuration, prev);
      newComps.push(comp);
      prev = comp;
    });
    setCompositions(newComps);
    setAppMode('playing');
  };

  const handleStartOver = () => {
    setMediaFiles([]);
    setScriptText('');
    setCompositions([]);
    setAppMode('setup');
    setSetupStep(1);
    setToastMessage("Started over. Ready for a new project.");
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trailers', id));
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

  const cameraBlur = useTransform([velX, velY, velZ], ([vx, vy, vz]) => {
    const speed = Math.sqrt(Math.pow(Number(vx), 2) + Math.pow(Number(vy), 2) + Math.pow(Number(vz), 2));
    const blurAmount = Math.min(speed / 120, 20); 
    return `blur(${blurAmount}px)`;
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
  }, [user, mediaFiles.length, scriptText, fontStyle, backgroundStyle, textEffect, transitionType, transitionDuration, preset]);

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

  const addFromLibrary = (asset: LibraryAsset) => {
    const newItem: MediaItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: asset.url,
      type: asset.type,
      name: asset.name
    };
    setMediaFiles(prev => [...prev, newItem]);
    setToastMessage("Added from library!");
    setTimeout(() => setToastMessage(null), 2000);
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
        setScriptText(data.script);
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

  const applyPreset = (p: 'blockbuster' | 'documentary' | 'music-video') => {
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
    }
  };

  const generateWorld = async () => {
    if (mediaFiles.length === 0) {
      setToastMessage("Please add some media files first.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsRenderingTrailer(true);
    setRenderProgress(0);
    
    const scriptLines = scriptText.split('\n').filter(line => line.trim() !== '');
    const newComps: Composition[] = [];
    let prev: Composition | undefined = undefined;

    // Group media files into scenes (some single, some multi)
    let mediaIdx = 0;
    let sceneIdx = 0;

    while (mediaIdx < mediaFiles.length || sceneIdx < scriptLines.length) {
      let caption = scriptLines[sceneIdx] || '';
      let isTextOnly = false;
      
      if (caption.toUpperCase().includes('[TEXT]') || caption.toUpperCase().includes('[TEXT ONLY]')) {
        isTextOnly = true;
        caption = caption.replace(/\[TEXT ONLY\]/gi, '').replace(/\[TEXT\]/gi, '').trim();
      }
      
      let sceneItems: MediaItem[] = [];
      if (!isTextOnly && mediaIdx < mediaFiles.length) {
        sceneItems = [mediaFiles[mediaIdx]];
        mediaIdx++;
      } else if (!isTextOnly && mediaIdx >= mediaFiles.length) {
        isTextOnly = true;
      }
      
      if (isTextOnly && !caption && mediaIdx >= mediaFiles.length) {
        break;
      }
      
      const comp = generateComposition(
        sceneItems, 
        sceneIdx, 
        caption, 
        preferredTextPosition, 
        textEffect, 
        transitionType, 
        transitionDuration, 
        prev
      );
      
      newComps.push(comp);
      prev = comp;
      
      sceneIdx++;
      
      setRenderProgress(Math.min(((mediaIdx / Math.max(mediaFiles.length, 1)) * 100), 100));
      await new Promise(r => setTimeout(r, 100));
    }

    setCompositions(newComps);
    setCurrentIndex(0);
    
    if (newComps.length > 0) {
      setTimeout(() => {
        setIsRenderingTrailer(false);
        setAppMode('playing');
      }, 500);
    } else {
      setIsRenderingTrailer(false);
      setToastMessage("Failed to generate trailer.");
    }
  };

  const generateCompositionFromData = (media: any[], index: number, effect: TextEffect, tType: TransitionType, tDur: number, prevComp?: Composition): Composition => {
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
      transitionDuration: tDur
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
      await new Promise(r => setTimeout(r, 3000)); 

      for (let i = 1; i < compositions.length; i++) {
        if (!sequenceActiveRef.current) break;
        
        // Update index
        setCurrentIndex(i);
        
        // Wait for the transition and scene duration
        // We use a slightly longer wait to ensure the transition completes fully
        await new Promise(r => setTimeout(r, 5000)); 
      }

      if (sequenceActiveRef.current) {
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

  // --- RENDER SETUP WIZARD ---
  if (appMode === 'setup') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-12 backdrop-blur-xl shadow-2xl my-auto max-h-[90vh] overflow-y-auto custom-scrollbar relative">
          
          {/* Loading Overlays */}
          <AnimatePresence>
            {(isUploading || isGeneratingImage || isRenderingTrailer || isSaving) && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl md:rounded-3xl"
              >
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-white font-mono text-sm">
                  {isUploading && "Uploading assets..."}
                  {isGeneratingImage && "Generating AI image..."}
                  {isRenderingTrailer && "Rendering world..."}
                  {isSaving && "Saving project..."}
                </p>
                {isRenderingTrailer && (
                  <div className="w-48 h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${renderProgress}%` }} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:12">
            <div>
              <h1 className="font-display text-2xl md:3xl font-bold tracking-tight mb-1 md:mb-2">Create Trailer</h1>
              <p className="text-white/50 font-mono text-[10px] md:text-sm">Motion Graphics Generator</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <img src={user.photoURL || ''} className="w-6 h-6 rounded-full" alt="Profile" />
                  <span className="text-xs font-medium hidden sm:inline">{user.displayName}</span>
                  <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/90 transition-colors"
                >
                  <UserIcon size={14} /> LOGIN
                </button>
              )}
              <div className="flex gap-2">
                {[1, 2, 3].map(step => (
                  <div 
                    key={step} 
                    className={`w-3 h-3 rounded-full transition-colors ${setupStep >= step ? 'bg-white' : 'bg-white/20'}`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step 1: Media */}
          {setupStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-medium mb-6 flex items-center gap-3">
                <ImageIcon className="text-blue-400" /> Step 1: Add Media
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {mediaFiles.map((item, i) => (
                  <div key={i} className="relative aspect-square bg-black/50 rounded-xl border border-white/10 overflow-hidden group">
                    <MediaThumbnail item={item} />
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex flex-col gap-2">
                  <label className="flex-1 aspect-square bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-white/50 hover:text-white">
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] uppercase font-mono">Upload</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={() => setShowLibrary(true)}
                    className="h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-mono transition-colors"
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
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
                    >
                      <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <History className="text-blue-400" /> Your Asset Library
                        </h3>
                        <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {libraryAssets.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-white/30">
                            <ImageIcon size={48} className="mb-4 opacity-20" />
                            <p>Your library is empty. Upload assets to see them here.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {libraryAssets.map((asset) => (
                              <button
                                key={asset.id}
                                onClick={() => {
                                  addFromLibrary(asset);
                                  setShowLibrary(false);
                                }}
                                className="relative aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden group hover:border-blue-500/50 transition-all"
                              >
                                {asset.type === 'video' ? (
                                  <video src={asset.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                ) : (
                                  <img src={asset.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" alt={asset.name} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                  <p className="text-[10px] truncate w-full font-mono">{asset.name}</p>
                                </div>
                                <button 
                                  onClick={(e) => deleteLibraryAsset(e, asset)}
                                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 border-t border-white/10 bg-white/5">
                        <p className="text-xs text-white/40">Select an asset to add it to your current project.</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Generation Tool */}
              <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Visual Generator</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Create unique motion assets</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Describe the visual you want (e.g. 'Cyberpunk city at night, cinematic lighting')"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <button 
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || !aiPrompt}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 h-full rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
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
                  className="bg-white text-black px-8 py-3 rounded-full font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Script */}
          {setupStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-medium mb-6 flex items-center gap-3">
                <FileText className="text-green-400" /> Step 2: Add Script
              </h2>
              
              <div className="mb-6 bg-black/30 p-3 md:p-4 rounded-xl border border-white/5">
                <label className="block text-xs md:text-sm text-white/70 mb-2">AI URL Scraper (Optional)</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                    <input 
                      type="url" 
                      placeholder="https://example.com/article" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-white/30"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleScrape}
                    disabled={isScraping || !scrapeUrl}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 px-4 py-2 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {isScraping ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
                  </button>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-4">Each line of text will be displayed as a caption for the corresponding media file.</p>
              
              <textarea
                className="w-full bg-black/50 border border-white/10 rounded-xl p-6 text-white font-mono text-sm focus:outline-none focus:border-white/30 transition-colors resize-none h-48 mb-8"
                placeholder="Line 1: Welcome to the presentation&#10;Line 2: Here is our first product&#10;Line 3: Notice the sleek design..."
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
              />

              <div className="flex justify-between">
                <button 
                  onClick={() => setSetupStep(1)}
                  className="text-white/50 hover:text-white px-6 py-3 font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setSetupStep(3)}
                  className="bg-white text-black px-8 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Ready & Styling */}
          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-2 md:py-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} className="md:w-8 md:h-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-medium mb-1 md:mb-2 text-center">Style & Generate</h2>
              <p className="text-white/50 mb-6 md:mb-8 text-center text-xs md:text-sm">Loaded {mediaFiles.length} media files and {scriptText.split('\n').filter(l => l.trim()).length} script lines.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-white/70 mb-3">Professional Presets (AE Style)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(['blockbuster', 'documentary', 'music-video'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => applyPreset(p)}
                        className={`px-4 py-4 rounded-xl border text-center transition-all ${preset === p ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="font-bold capitalize mb-1">{p.replace('-', ' ')}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Automated Engine</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Typography</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['font-sans', 'font-serif', 'font-mono', 'font-display'] as FontStyle[]).map(font => (
                      <button
                        key={font}
                        onClick={() => setFontStyle(font)}
                        className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-left border transition-colors text-xs md:text-sm ${fontStyle === font ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'} ${font}`}
                      >
                        {font.replace('font-', '').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Background</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['black', 'gradient-blue', 'gradient-purple', 'grid', 'vibrant-glow'] as BackgroundStyle[]).map(bg => (
                      <button
                        key={bg}
                        onClick={() => setBackgroundStyle(bg)}
                        className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-left border transition-colors capitalize text-xs md:text-sm ${backgroundStyle === bg ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {bg.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Text Animation</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['gsap-split', 'typewriter', 'fade', 'kinetic'] as TextEffect[]).map(effect => (
                      <button
                        key={effect}
                        onClick={() => setTextEffect(effect)}
                        className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-left border transition-colors capitalize text-xs md:text-sm ${textEffect === effect ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {effect.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Text Position</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['random', 'top', 'bottom', 'center', 'left', 'right'] as TextPosition[]).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setPreferredTextPosition(pos)}
                        className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-left border transition-colors capitalize text-xs md:text-sm ${preferredTextPosition === pos ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Transition Effect</h3>
                  <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                    {(['fade', 'slide', 'zoom', 'dissolve', 'explode', 'spin', 'expand', 'contract'] as TransitionType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setTransitionType(type)}
                        className={`px-3 py-2 md:px-4 md:py-3 rounded-lg text-left border transition-colors capitalize text-xs md:text-sm ${transitionType === type ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Transition Speed</h3>
                  <div className="flex flex-col gap-4 px-2">
                    <input 
                      type="range" 
                      min="0.2" 
                      max="3" 
                      step="0.1" 
                      value={transitionDuration}
                      onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                      className="w-full accent-white"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-white/40">
                      <span>FAST ({transitionDuration}s)</span>
                      <span>SLOW</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Export Format</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['webm', 'mp4', 'mov'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        className={`px-3 py-2 rounded-lg text-center border transition-colors uppercase text-[10px] font-mono ${exportFormat === f ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Export Resolution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '4K'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setExportResolution(r)}
                        className={`px-3 py-2 rounded-lg text-center border transition-colors uppercase text-[10px] font-mono ${exportResolution === r ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setSetupStep(2)}
                  className="text-white/50 hover:text-white px-6 py-3 font-medium transition-colors"
                >
                  Back
                </button>
                {user && (
                  <button 
                    onClick={saveProject}
                    disabled={isSaving || mediaFiles.length === 0}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-colors border border-white/10 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    SAVE PROJECT
                  </button>
                )}
                <button 
                  onClick={generateWorld}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-full font-bold flex items-center gap-3 transition-colors shadow-lg shadow-blue-500/25"
                >
                  <Play size={20} fill="currentColor" />
                  START TRAILER
                </button>
              </div>

              {user && userTrailers.length > 0 && (
                <div className="mt-12 pt-12 border-t border-white/10">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-3">
                    <History className="text-purple-400" /> Your Saved Trailers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userTrailers.map(project => (
                      <div key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                        <div className="cursor-pointer flex-1" onClick={() => loadProject(project)}>
                          <div className="font-medium text-sm mb-1">{project.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">{new Date(project.createdAt?.seconds * 1000).toLocaleDateString()} • {project.media.length} Scenes</div>
                        </div>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="text-white/20 hover:text-red-400 p-2 transition-colors opacity-0 group-hover:opacity-100"
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
      case 'gradient-blue': return 'bg-gradient-to-br from-blue-900 via-black to-black';
      case 'gradient-purple': return 'bg-gradient-to-br from-purple-900 via-black to-black';
      case 'grid': return 'bg-[#050505] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]';
      case 'vibrant-glow': return 'bg-vibrant-glow';
      default: return 'bg-[#050505]';
    }
  };

  const getTextPositionClass = (pos: TextPosition) => {
    switch (pos) {
      case 'top': return 'top-16 md:top-24 inset-x-0';
      case 'bottom': return 'bottom-16 md:bottom-24 inset-x-0';
      case 'center': return 'top-1/2 -translate-y-1/2 inset-x-0';
      case 'left': return 'left-4 md:left-16 top-1/2 -translate-y-1/2 max-w-[90vw] md:max-w-lg';
      case 'right': return 'right-4 md:right-16 top-1/2 -translate-y-1/2 max-w-[90vw] md:max-w-lg';
      default: return 'bottom-16 md:bottom-24 inset-x-0';
    }
  };

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden text-white ${fontStyle} ${getBackgroundClass()}`} 
      style={{ perspective: '1500px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      
      {/* The 3D World */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full overflow-visible"
        style={{ 
          transformStyle: 'preserve-3d',
          x: worldX,
          y: worldY,
          z: worldZ,
          rotateX: smoothRotX,
          rotateY: smoothRotY,
          filter: cameraBlur
        }}
      >
        {/* Post-Processing Filters (AE Style) */}
        <svg className="hidden">
          <filter id="chromatic-aberration">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feOffset in="red" dx="2" dy="0" result="red-offset" />
            <feOffset in="blue" dx="-2" dy="0" result="blue-offset" />
            <feBlend in="red-offset" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue-offset" mode="screen" />
          </filter>
          <filter id="film-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </svg>

        <div className="absolute inset-0 pointer-events-none z-[100] mix-blend-overlay opacity-20" style={{ filter: 'url(#film-grain)' }} />
        <div className="absolute inset-0 pointer-events-none z-[101] mix-blend-screen opacity-30" style={{ filter: 'url(#chromatic-aberration)' }} />

        {/* Cinematic Light Leaks */}
        <div className="absolute inset-0 pointer-events-none z-[102] overflow-hidden">
          <motion.div 
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,100,0,0.15)_0%,transparent_60%)]"
            animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,100,255,0.1)_0%,transparent_60%)]"
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
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase">
            Scene {currentIndex + 1} / {compositions.length}
          </span>
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-40" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
      }} />

      {/* Cinematic Letterboxing (AE Style) */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between">
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="h-[10vh] w-full bg-black"
        />
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="h-[10vh] w-full bg-black"
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
            <div className="px-8 py-4">
              <div className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                <AnimatedCaption text={currentComp.caption} effect={currentComp.textEffect} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${toastMessage.includes('success') ? 'bg-green-500/90 border-green-400/50' : 'bg-red-500/90 border-red-400/50'} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-4 max-w-md border`}>
          {toastMessage.includes('success') ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
          <p className="text-sm font-medium leading-relaxed">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>
      )}

      {/* UI Controls Overlay (Hidden during recording) */}
      <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-50 transition-opacity duration-500 ${isRecording ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button 
          onClick={startRecording}
          className="flex items-center gap-2 md:gap-3 bg-red-500/20 hover:bg-red-500/40 text-red-100 border border-red-500/30 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-full cursor-pointer transition-all font-mono text-[10px] md:text-sm"
        >
          <Video size={14} className="md:w-4 md:h-4" />
          <span>EXPORT</span>
        </button>
      </div>
      
      <div className={`fixed top-4 left-4 md:top-6 md:left-6 z-50 transition-opacity duration-500 ${isRecording ? 'opacity-0 pointer-events-none' : 'opacity-100'} flex gap-2 md:gap-3`}>
        <button 
          onClick={() => setAppMode('setup')}
          className="flex items-center gap-2 md:gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-full cursor-pointer transition-all font-mono text-[10px] md:text-sm"
        >
          <span>MENU</span>
        </button>
        <button 
          onClick={handleStartOver}
          className="flex items-center gap-2 md:gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-full cursor-pointer transition-all font-mono text-[10px] md:text-sm text-red-300 hover:text-red-200 hover:bg-red-500/20"
        >
          <span>START OVER</span>
        </button>
        <button 
          onClick={resetCamera}
          className="flex items-center gap-2 md:gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-full cursor-pointer transition-all font-mono text-[10px] md:text-sm"
          title="Reset Camera"
        >
          <Play size={12} className="rotate-90 md:w-3 md:h-3" />
          <span className="hidden md:inline">RESET CAMERA</span>
          <span className="md:hidden">RESET</span>
        </button>
      </div>

      {/* Manual Navigation Controls */}
      {!isRecording && compositions.length > 1 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
          <button 
            onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : compositions.length - 1))}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white/50 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            {compositions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500 w-4' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <button 
            onClick={() => setCurrentIndex(prev => (prev < compositions.length - 1 ? prev + 1 : 0))}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white/50 hover:text-white"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Interaction Hint */}
      {!isRecording && (
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none opacity-40 font-mono text-[10px] uppercase tracking-widest">
          Drag to Rotate • Shift+Drag to Pan
        </div>
      )}

      {/* AI Rendering Overlay */}
      <AnimatePresence>
        {isRenderingTrailer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">AI Rendering Engine</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Processing cinematic assets</p>
                  </div>
                </div>
                <span className="text-sm font-mono text-blue-400">{Math.round(renderProgress)}%</span>
              </div>
              
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${renderProgress}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Status</p>
                  <p className="text-xs font-medium">Analyzing Composition</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Task</p>
                  <p className="text-xs font-medium">Syncing 3D Coordinates</p>
                </div>
              </div>
              
              <p className="mt-12 text-center text-[10px] text-white/20 font-mono animate-pulse">
                INITIALIZING VIRTUAL CAMERA & LIGHTING SYSTEMS...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
