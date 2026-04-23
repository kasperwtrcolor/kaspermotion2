import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User as UserIcon, LogOut, Coins, Home, Film, UserCircle, Plus, Video, Sparkles, RefreshCcw } from 'lucide-react';

type AppMode = 'landing' | 'setup' | 'playing' | 'profile' | 'share';

interface AppHeaderProps {
  appMode: AppMode;
  user: any;
  credits: number;
  onNavigate: (mode: AppMode) => void;
  onLogin: () => void;
  onLogout: () => void;
  onNewProject: () => void;
  onRefill: () => void;
  // Studio Controls for Playing Mode
  onExport?: () => void;
  onStudio?: () => void;
  onStickers?: () => void;
  onResetCamera?: () => void;
  isRendering?: boolean;
  renderProgress?: number;
}

export default function AppHeader({ 
  appMode, user, credits, 
  onNavigate, onLogin, onLogout, onNewProject, onRefill,
  onExport, onStudio, onStickers, onResetCamera,
  isRendering, renderProgress = 0
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastMouseY, setLastMouseY] = useState(0);

  // Auto-hide header in playing mode
  useEffect(() => {
    if (appMode !== 'playing') {
      setHeaderVisible(true);
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = (e: MouseEvent) => {
      setLastMouseY(e.clientY);
      if (e.clientY < 80) {
        setHeaderVisible(true);
        clearTimeout(hideTimeout);
      } else {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => setHeaderVisible(false), 2500);
      }
    };

    // Initially show, then auto-hide after 3s
    hideTimeout = setTimeout(() => setHeaderVisible(false), 3000);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [appMode]);

  const navItems = [
    { id: 'landing' as AppMode, label: 'Home', icon: <Home size={16} /> },
    { id: 'setup' as AppMode, label: 'Create', icon: <Film size={16} /> },
    { id: 'profile' as AppMode, label: 'Profile', icon: <UserCircle size={16} /> },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: headerVisible ? 0 : -80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-[500] glass-panel border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <img
                src="/logo.png"
                alt="VibeTrailer Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = 'V';
                }}
              />
            </div>
            <span className="font-display font-bold text-lg tracking-tight lowercase hidden sm:inline text-white">
              vibe<span className="text-indigo-400">trailer</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {appMode === 'playing' ? (
              <>
                <button
                  onClick={onExport}
                  className="px-4 py-2 font-sans text-xs font-semibold flex items-center gap-2 rounded-full bg-white text-black hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-white/10"
                >
                  <Video size={14} />
                  Export
                </button>
                <button
                  onClick={onStudio}
                  className="px-4 py-2 font-sans text-xs font-semibold flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  Studio
                </button>
                <button
                  onClick={onResetCamera}
                  className="p-2 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                  title="Reset Camera"
                >
                  <RefreshCcw size={14} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                  onClick={onNewProject}
                  className="px-4 py-2 font-sans text-xs font-semibold flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95"
                >
                  <Plus size={14} />
                  New
                </button>
              </>
            ) : (
              <>
                {navItems.map((item) => {
                  const isDisabled = !user && (item.id === 'setup' || item.id === 'profile');
                  return (
                    <button
                      key={item.id}
                      disabled={isDisabled}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2 font-sans text-xs font-semibold flex items-center gap-2 rounded-full transition-all active:scale-95 ${
                        isDisabled ? 'opacity-30 cursor-not-allowed' :
                        appMode === item.id
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={onNewProject}
                  disabled={!user}
                  className={`px-4 py-2 font-sans text-xs font-bold flex items-center gap-2 rounded-full transition-all ml-1 ${
                    !user ? 'opacity-30 cursor-not-allowed' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Plus size={14} />
                  New
                </button>
              </>
            )}
          </nav>

          {/* Right side: Credits + User */}
          <div className="flex items-center gap-2">
            {/* Credits Badge */}
            {user && (
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-full transition-colors h-8"
                >
                  <Coins size={12} className="text-indigo-400" />
                  <span className="font-sans text-xs font-bold text-white">{credits}</span>
                </button>
                <button
                  onClick={onRefill}
                  className="bg-indigo-500 rounded-full h-6 w-6 flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white"
                  title="Buy Credits"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}

            {/* User Avatar / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-8 h-8 rounded-full border border-white/20 overflow-hidden hover:scale-110 transition-all shadow-lg"
                >
                  <img
                    src={user.photoURL || ''}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </button>
                <button
                  onClick={onLogout}
                  className="hidden md:flex p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="elite-button h-9 px-4 text-xs flex items-center gap-2 rounded-full"
              >
                <UserIcon size={14} /> Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        
        {/* Progress Bar (Visible when AI is working) */}
        <AnimatePresence>
          {isRendering && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 4, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute left-0 right-0 bottom-0 bg-white overflow-hidden pointer-events-none"
            >
              <motion.div 
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${renderProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[499] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-14 right-0 bottom-0 w-64 glass-panel border-l-0 z-[500] md:hidden flex flex-col p-4 gap-2"
            >
              {navItems.map((item) => {
                const isDisabled = !user && (item.id === 'setup' || item.id === 'profile');
                return (
                  <button
                    key={item.id}
                    disabled={isDisabled}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 font-sans text-sm font-bold flex items-center gap-3 rounded-xl transition-all ${
                      isDisabled ? 'opacity-30 cursor-not-allowed' :
                      appMode === item.id
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onNewProject();
                  setMobileMenuOpen(false);
                }}
                disabled={!user}
                className={`w-full px-4 py-3 font-sans text-sm font-bold flex items-center gap-3 rounded-xl transition-all ${
                  !user ? 'opacity-30 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Plus size={16} />
                New Project
              </button>

              {user && (
                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.photoURL || ''}
                      className="w-10 h-10 rounded-full border border-white/20 object-cover"
                      alt="Profile"
                    />
                    <div>
                      <p className="font-sans text-xs font-bold text-white truncate max-w-[140px]">
                        {user.displayName}
                      </p>
                      <p className="font-sans text-[10px] text-white/50">
                        {credits} credits
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 font-sans text-xs font-bold flex items-center gap-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under the fixed header */}
      {appMode !== 'playing' && <div className="h-14" />}
    </>
  );
}
