import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User as UserIcon, LogOut, Coins, Home, Film, UserCircle, Plus, Video, Sparkles, RefreshCcw } from 'lucide-react';

type AppMode = 'landing' | 'setup' | 'playing' | 'profile';

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
        className="fixed top-0 left-0 right-0 z-[500] bg-brutal-bg/95 backdrop-blur-md border-b-2 border-black"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-brutal-purple brutal-border flex items-center justify-center overflow-hidden group-hover:rotate-12 transition-transform">
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
            <span className="font-display font-bold text-lg tracking-tight uppercase hidden sm:inline">
              VibeTrailer
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {appMode === 'playing' ? (
              <>
                <button
                  onClick={onExport}
                  className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border bg-brutal-pink hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Video size={14} />
                  Export
                </button>
                <button
                  onClick={onStudio}
                  className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Studio
                </button>
                <button
                  onClick={onResetCamera}
                  className="p-2 brutal-border bg-brutal-blue hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  title="Reset Camera"
                >
                  <RefreshCcw size={14} />
                </button>
                <div className="w-px h-6 bg-black mx-2" />
                <button
                  onClick={onNewProject}
                  className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border bg-brutal-green hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
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
                      className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border transition-all ${
                        isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-200' :
                        appMode === item.id
                          ? 'bg-brutal-blue translate-x-0.5 translate-y-0.5 shadow-none'
                          : 'bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
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
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border transition-all ml-1 ${
                    !user ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-brutal-green hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
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
              <div className="flex items-center">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-1.5 bg-brutal-orange brutal-border px-3 py-1.5 hover:bg-white transition-colors h-9"
                >
                  <Coins size={14} />
                  <span className="font-mono text-xs font-bold">{credits}</span>
                </button>
                <button
                  onClick={onRefill}
                  className="bg-brutal-pink brutal-border p-1.5 h-9 w-9 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ml-[-2px]"
                  title="Buy Credits"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            {/* User Avatar / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-8 h-8 brutal-border overflow-hidden hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <img
                    src={user.photoURL || ''}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </button>
                <button
                  onClick={onLogout}
                  className="hidden md:flex p-2 brutal-border bg-white hover:bg-brutal-pink hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="brutal-button bg-brutal-green px-4 py-1.5 text-xs flex items-center gap-2"
              >
                <UserIcon size={14} /> Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 brutal-border bg-white hover:bg-gray-100 transition-colors"
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
                className="h-full bg-brutal-green"
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
              className="fixed top-14 right-0 bottom-0 w-64 bg-brutal-bg brutal-border border-t-0 z-[500] md:hidden flex flex-col p-4 gap-2 shadow-[-8px_0_0_0_rgba(0,0,0,1)]"
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
                    className={`w-full px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-3 brutal-border transition-all ${
                      isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-200' :
                      appMode === item.id
                        ? 'bg-brutal-blue'
                        : 'bg-white hover:bg-gray-50'
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
                className={`w-full px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-3 brutal-border ${
                  !user ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-brutal-green'
                }`}
              >
                <Plus size={16} />
                New Project
              </button>

              {user && (
                <div className="mt-auto pt-4 border-t-2 border-black">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.photoURL || ''}
                      className="w-10 h-10 brutal-border object-cover"
                      alt="Profile"
                    />
                    <div>
                      <p className="font-mono text-xs font-bold uppercase truncate max-w-[140px]">
                        {user.displayName}
                      </p>
                      <p className="font-mono text-[10px] text-black/60">
                        {credits} credits
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 font-mono text-xs font-bold uppercase flex items-center gap-2 brutal-border bg-brutal-pink"
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
