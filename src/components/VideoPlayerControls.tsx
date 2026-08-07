import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Download, Loader2 } from 'lucide-react';

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentIndex: number;
  totalScenes: number;
  onSceneSelect: (index: number) => void;
  sceneDurations: number[]; // duration of each scene in seconds
  currentSceneElapsed: number; // 0-1 progress within current scene
  onExport: () => void;
  isExporting: boolean;
  exportProgress: number; // 0-100
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  currentIndex,
  totalScenes,
  onSceneSelect,
  sceneDurations,
  currentSceneElapsed,
  onExport,
  isExporting,
  exportProgress,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsVisible(true);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsVisible(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleActivity = () => resetHideTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timer
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying]);

  // When paused or exporting, always show controls
  useEffect(() => {
    if (!isPlaying || isExporting) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsVisible(true);
    } else {
      resetHideTimer();
    }
  }, [isPlaying, isExporting]);

  const totalTime = sceneDurations.reduce((sum, duration) => sum + duration, 0);
  
  let currentTime = 0;
  for (let i = 0; i < currentIndex; i++) {
    currentTime += sceneDurations[i] || 0;
  }
  const currentSceneDuration = sceneDurations[currentIndex] || 0;
  currentTime += currentSceneDuration * Math.max(0, Math.min(1, currentSceneElapsed));

  return (
    <div 
      className={`absolute inset-0 z-[1000] pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none flex flex-col justify-end h-48">
        
        {isExporting ? (
          <div className="w-full max-w-2xl mx-auto bg-black/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 pointer-events-auto">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center space-x-3 text-white">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-lg font-medium">Exporting Video...</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, exportProgress))}%` }}
                />
              </div>
              <div className="text-sm text-white/70 font-mono">
                {Math.round(exportProgress)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto bg-black/60 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 pointer-events-auto flex flex-col space-y-3 transition-transform hover:scale-[1.01] duration-300">
            
            {/* Progress Bar Area */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/80 font-mono w-12 text-right">{formatTime(currentTime)}</span>
              
              <div className="flex-1 flex flex-col group relative">
                {/* Main Progress Track */}
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden flex relative cursor-pointer group-hover:h-3 transition-all duration-200">
                  {sceneDurations.map((duration, idx) => {
                    const sceneRatio = totalTime > 0 ? (duration / totalTime) * 100 : 0;
                    
                    let fillPercent = 0;
                    if (idx < currentIndex) {
                      fillPercent = 100;
                    } else if (idx === currentIndex) {
                      fillPercent = currentSceneElapsed * 100;
                    }

                    return (
                      <div 
                        key={idx}
                        className="h-full relative border-r border-black/30 last:border-r-0"
                        style={{ width: `${sceneRatio}%` }}
                        onClick={() => onSceneSelect(idx)}
                      >
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Scene Dots/Markers underneath */}
                <div className="w-full flex justify-between mt-1 px-1">
                  {Array.from({ length: totalScenes }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSceneSelect(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 hover:scale-150 hover:bg-white ${idx === currentIndex ? 'bg-blue-400 scale-125' : idx < currentIndex ? 'bg-white/60' : 'bg-white/20'}`}
                      aria-label={`Jump to scene ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <span className="text-xs text-white/80 font-mono w-12">{formatTime(totalTime)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-1">
              
              {/* Left Controls */}
              <div className="flex items-center space-x-4">
                <button 
                  onClick={onPlayPause}
                  className="text-white hover:text-blue-400 transition-colors focus:outline-none p-1 rounded-full hover:bg-white/10 transform hover:scale-110 active:scale-95 duration-200"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current" />
                  )}
                </button>
                <button 
                  onClick={onStop}
                  className="text-white/80 hover:text-red-400 transition-colors focus:outline-none p-1 rounded-full hover:bg-white/10 transform hover:scale-110 active:scale-95 duration-200"
                  aria-label="Stop"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-6">
                <div className="text-sm font-medium text-white/90 bg-white/10 px-3 py-1 rounded-full border border-white/5 shadow-inner">
                  Scene {Math.min(currentIndex + 1, totalScenes)} / {totalScenes}
                </div>
                
                <button
                  onClick={onExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full transition-all duration-200 border border-white/10 hover:border-white/30 transform hover:scale-105 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerControls;
