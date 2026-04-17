import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Image as ImageIcon, User as UserIcon, Trash2, Play, Coins, Calendar, Award, CreditCard, Sparkles, Zap } from 'lucide-react';

interface ProfilePageProps {
  user: any;
  credits: number;
  libraryAssets: any[];
  userTrailers: any[];
  onLoadProject: (project: any) => void;
  onDeleteProject: (id: string) => void;
  onDeleteAsset: (e: React.MouseEvent, asset: any) => void;
  onUseAssetInProject: (assets: any[]) => void;
  notifications: string[];
  onShowPricing: () => void;
}

type ProfileTab = 'videos' | 'assets' | 'account';

export default function ProfilePage({
  user,
  credits,
  libraryAssets,
  userTrailers,
  onLoadProject,
  onDeleteProject,
  onDeleteAsset,
  onUseAssetInProject,
  notifications,
  onShowPricing,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('videos');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'videos', label: 'My Videos', icon: <Film size={16} />, count: userTrailers.length },
    { id: 'assets', label: 'My Assets', icon: <ImageIcon size={16} />, count: libraryAssets.length },
    { id: 'account', label: 'Account', icon: <UserIcon size={16} /> },
  ];

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-isometric-grid text-black font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="brutal-card p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 brutal-border overflow-hidden shrink-0 bg-brutal-purple">
            <img
              src={user?.photoURL || ''}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tighter">
              {user?.displayName || 'Creator'}
            </h1>
            <p className="font-mono text-xs text-black/60 uppercase tracking-wider mt-1">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-brutal-orange brutal-border p-4 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Coins size={16} />
              </div>
              <p className="font-display text-2xl font-bold">{credits}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Credits</p>
            </div>
            <div className="bg-brutal-blue brutal-border p-4 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Film size={16} />
              </div>
              <p className="font-display text-2xl font-bold">{userTrailers.length}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Videos</p>
            </div>
            <div className="bg-brutal-green brutal-border p-4 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ImageIcon size={16} />
              </div>
              <p className="font-display text-2xl font-bold">{libraryAssets.length}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Assets</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 brutal-border transition-all ${
                activeTab === tab.id
                  ? 'bg-brutal-blue translate-x-0.5 translate-y-0.5 shadow-none'
                  : 'bg-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* MY VIDEOS */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {userTrailers.length === 0 ? (
                <div className="brutal-card p-12 text-center">
                  <Film size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-mono text-sm font-bold uppercase text-black/40">
                    No trailers yet. Create your first one!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userTrailers.map((project) => (
                    <div
                      key={project.id}
                      className="brutal-card p-0 overflow-hidden group hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      {/* Preview thumbnail area */}
                      <div className="aspect-video bg-black/90 relative flex items-center justify-center overflow-hidden">
                        {project.media?.[0]?.url ? (
                          <img
                            src={project.media[0].url}
                            alt="Trailer thumbnail"
                            className="w-full h-full object-cover opacity-60"
                          />
                        ) : (
                          <Film size={48} className="text-white/20" />
                        )}
                        <button
                          onClick={() => onLoadProject(project)}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-14 h-14 bg-brutal-green brutal-border flex items-center justify-center">
                            <Play size={24} fill="black" />
                          </div>
                        </button>
                        <div className="absolute bottom-2 right-2 bg-white brutal-border px-2 py-0.5 font-mono text-[10px] font-bold">
                          {project.media?.length || 0} SCENES
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="cursor-pointer flex-1" onClick={() => onLoadProject(project)}>
                          <p className="font-mono font-bold text-sm uppercase truncate">
                            {project.name}
                          </p>
                          <p className="font-mono text-[10px] text-black/50 uppercase mt-0.5 flex items-center gap-2">
                            <Calendar size={10} />
                            {project.createdAt?.seconds
                              ? new Date(project.createdAt.seconds * 1000).toLocaleDateString()
                              : 'Unknown'}
                          </p>
                        </div>
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-2 brutal-border bg-white hover:bg-brutal-pink transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* MY ASSETS */}
          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {selectedAssets.size > 0 && (
                <div className="mb-4 bg-brutal-green brutal-border p-3 flex items-center justify-between">
                  <p className="font-mono text-xs font-bold uppercase">
                    {selectedAssets.size} asset{selectedAssets.size > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedAssets(new Set())}
                      className="brutal-button bg-white px-3 py-1.5 text-xs"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        const assets = libraryAssets.filter((a) => selectedAssets.has(a.id));
                        onUseAssetInProject(assets);
                        setSelectedAssets(new Set());
                      }}
                      className="brutal-button bg-brutal-blue px-3 py-1.5 text-xs"
                    >
                      Use in Project
                    </button>
                  </div>
                </div>
              )}

              {libraryAssets.length === 0 ? (
                <div className="brutal-card p-12 text-center">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-mono text-sm font-bold uppercase text-black/40">
                    No assets yet. Upload some or generate with AI!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {libraryAssets.map((asset) => {
                    const isSelected = selectedAssets.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)}
                        className={`relative aspect-square brutal-border overflow-hidden group cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-4 ring-brutal-blue bg-brutal-blue'
                            : 'bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {asset.type === 'video' ? (
                          <video
                            src={asset.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={asset.url}
                            className="w-full h-full object-cover"
                            alt={asset.name}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-[10px] truncate w-full font-mono font-bold text-white">
                            {asset.name}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-brutal-blue brutal-border flex items-center justify-center">
                            <span className="text-black font-bold text-xs">✓</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => onDeleteAsset(e, asset)}
                          className="absolute top-2 right-2 bg-brutal-pink brutal-border p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* User Info */}
              <div className="brutal-card p-6">
                <h3 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-3 border-b-2 border-black pb-3">
                  <UserIcon size={20} /> Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-brutal-bg brutal-border p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-1">Name</p>
                    <p className="font-mono text-sm font-bold">{user?.displayName || '—'}</p>
                  </div>
                  <div className="bg-brutal-bg brutal-border p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-1">Email</p>
                    <p className="font-mono text-sm font-bold">{user?.email || '—'}</p>
                  </div>
                  <div className="bg-brutal-bg brutal-border p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-1">Provider</p>
                    <p className="font-mono text-sm font-bold">
                      {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : user?.providerData?.[0]?.providerId || '—'}
                    </p>
                  </div>
                  <div className="bg-brutal-bg brutal-border p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-1">User ID</p>
                    <p className="font-mono text-[11px] font-bold truncate">{user?.uid || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Credit Economy Explainer */}
              <div className="brutal-card p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-3 border-b-2 border-black pb-3">
                  <Zap size={20} className="text-brutal-orange" /> Credit Economy Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-brutal-blue/10 p-3 brutal-border">
                      <span className="font-mono text-xs font-bold uppercase">AI Visual Gen</span>
                      <span className="font-display font-bold text-lg text-brutal-blue">3 pts</span>
                    </div>
                    <p className="text-[10px] font-mono leading-tight text-black/60 uppercase font-bold">
                      Use Gemini 2.5 Flash to generate custom cinematic assets from text prompts.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-brutal-purple/10 p-3 brutal-border">
                      <span className="font-mono text-xs font-bold uppercase">Trailer Draft</span>
                      <span className="font-display font-bold text-lg text-brutal-purple">1 pt</span>
                    </div>
                    <p className="text-[10px] font-mono leading-tight text-black/60 uppercase font-bold">
                      Compile your scenes, scripts, and media into a full cinematic preview.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-brutal-green/10 p-3 brutal-border">
                      <span className="font-mono text-xs font-bold uppercase">4K / HD Export</span>
                      <span className="font-display font-bold text-lg text-brutal-green">2 pts</span>
                    </div>
                    <p className="text-[10px] font-mono leading-tight text-black/60 uppercase font-bold">
                      Render and download high-bitrate WebM or MP4 files for distribution.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 bg-black text-white p-4 brutal-border flex items-center gap-4">
                  <Award size={24} className="text-brutal-yellow" />
                  <div>
                    <h4 className="font-display font-bold text-sm uppercase">Loyalty Reward</h4>
                    <p className="font-mono text-[10px] uppercase font-bold opacity-80">
                      Vibe Coders receive 5 complementary credits every single day just for showing up.
                    </p>
                  </div>
                </div>
              </div>

              {/* Credits Balance & Top-up */}
              <div className="brutal-card p-6">
                <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-3">
                  <h3 className="font-display text-xl font-bold uppercase flex items-center gap-3">
                    <Coins size={20} /> Current Balance
                  </h3>
                  <button 
                    onClick={onShowPricing}
                    className="brutal-button bg-brutal-orange px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <CreditCard size={14} /> Refill Credits
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-brutal-orange brutal-border p-6 text-center">
                    <p className="font-display text-4xl font-bold">{credits}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1">Available Credits</p>
                  </div>
                  <div className="bg-brutal-green brutal-border p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Award size={20} />
                    </div>
                    <p className="font-display text-xl font-bold">+5 Daily</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1">Next Reward in 24h</p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="brutal-card p-6">
                <h3 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-3 border-b-2 border-black pb-3">
                   Activity Notifications
                </h3>
                {notifications.length === 0 ? (
                  <p className="font-mono text-sm uppercase text-black/50">No notifications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((msg, idx) => (
                      <div key={idx} className="bg-white brutal-border p-3 flex items-start gap-3">
                        <div className="mt-0.5 text-black">
                           <span className="font-bold">›</span>
                        </div>
                        <p className="font-mono text-xs font-bold uppercase">{msg}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
