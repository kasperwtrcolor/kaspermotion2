import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User as UserIcon, LogOut, Coins, Home, Film, UserCircle, Plus, Video, RefreshCcw } from 'lucide-react';

type AppMode = 'landing' | 'setup' | 'playing' | 'profile' | 'share';

interface AppHeaderProps {
  appMode: AppMode;
  user: any;
  credits: number;
  onNavigate: (mode: AppMode) => void;
  onLogin: () => void;
  onLogout: () => void;
  onNewProject: () => void;
  onReset: () => void;
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
  onNavigate, onLogin, onLogout, onNewProject, onReset, onRefill,
  onExport, onStudio, onStickers, onResetCamera,
  isRendering, renderProgress = 0
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Auto-hide header in playing mode
  useEffect(() => {
    if (appMode !== 'playing') {
      setHeaderVisible(true);
      return;
    }

    let hideTimeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        setHeaderVisible(true);
        clearTimeout(hideTimeout);
      } else {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => setHeaderVisible(false), 2500);
      }
    };

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
        className="fixed top-0 left-0 right-0 z-[500] bg-ivory/80 backdrop-blur-md border-b border-black/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 group"
          >
            <span className="font-display font-black text-2xl tracking-tighter uppercase text-ink">
              vibe<span className="opacity-40">trailer</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {appMode === 'playing' ? (
              <>
                <button
                  onClick={onExport}
                  className="btn-primary py-2 px-6 text-xs"
                >
                  <Video size={14} className="mr-2" />
                  Export
                </button>
                <button
                  onClick={onStudio}
                  className="btn-outline py-2 px-6 text-xs"
                >
                  Studio
                </button>
                <button
                  onClick={onResetCamera}
                  className="p-2 border border-black/10 hover:bg-black/5 transition-colors"
                  title="Reset Camera"
                >
                  <RefreshCcw size={14} />
                </button>
                <div className="w-px h-6 bg-black/10 mx-2" />
                <button
                  onClick={onNewProject}
                  className="btn-outline py-2 px-6 text-xs flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create New
                </button>
                <button
                  onClick={onReset}
                  className="btn-outline border-red-500/20 text-red-600 py-2 px-6 text-xs hover:bg-red-50"
                >
                  <RefreshCcw size={14} className="mr-2" />
                  Reset
                </button>
              </>
            ) : (
              <div className="flex bg-white/50 backdrop-blur-sm border border-black/5 px-2 py-1.5 rounded-full items-center gap-1">
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
                      className={`px-6 py-2 font-mono text-[10px] uppercase font-bold flex items-center gap-2 rounded-full transition-all active:scale-95 ${
                        isDisabled ? 'opacity-20 cursor-not-allowed' :
                        appMode === item.id
                          ? 'bg-ink text-cream shadow-xl'
                          : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {item.label}
                      {item.id === 'profile' && user && (
                         <span className="new-badge mono text-[8px]">5</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Right side: Credits + User */}
          <div className="flex items-center gap-4">
            {/* Credits Badge */}
            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors"
                >
                  <Coins size={12} className="text-ink" />
                  <span className="mono text-xs font-bold text-ink">{credits}</span>
                </button>
                <button
                  onClick={onRefill}
                  className="bg-ink text-cream rounded-full h-8 w-8 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  title="Buy Credits"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            {/* User Avatar / Login */}
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-10 h-10 rounded-full border border-black/10 overflow-hidden hover:scale-110 transition-all p-0.5"
                >
                  <img
                    src={user.photoURL || ''}
                    className="w-full h-full object-cover rounded-full"
                    alt="Profile"
                  />
                </button>
                <button
                  onClick={onLogout}
                  className="hidden md:flex p-2 border border-black/10 text-ink/40 hover:text-ink hover:bg-black/5 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="btn-primary py-2 px-6 text-xs h-10"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
              className="absolute left-0 right-0 bottom-0 bg-cream overflow-hidden pointer-events-none"
            >
              <motion.div 
                className="h-full bg-ink"
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
              className="fixed inset-0 bg-ink/10 backdrop-blur-sm z-[499] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-20 right-4 bottom-4 w-72 bg-white border border-black/10 z-[500] md:hidden flex flex-col p-8 md:p-12 gap-4 shadow-2xl"
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
                    className={`w-full px-6 py-4 font-mono text-xs uppercase font-bold flex items-center justify-between transition-all ${
                      isDisabled ? 'opacity-20 cursor-not-allowed' :
                      appMode === item.id
                        ? 'bg-ink text-cream'
                        : 'bg-ivory text-ink/60'
                    }`}
                  >
                    {item.label}
                    {item.icon}
                  </button>
                );
              })}

              {user && (
                <div className="mt-auto pt-8 border-t border-black/5">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={user.photoURL || ''}
                      className="w-12 h-12 rounded-full border border-black/10 p-0.5 object-cover"
                      alt="Profile"
                    />
                    <div>
                      <p className="mono text-xs font-bold text-ink truncate max-w-[140px]">
                        {user.displayName}
                      </p>
                      <p className="mono text-[10px] opacity-40">
                        {credits} credits
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-6 py-4 mono text-[10px] font-bold bg-cream text-red-500 border border-red-500/10 uppercase"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under the fixed header */}
      {appMode !== 'playing' && <div className="h-20" />}
    </>
  );
}
