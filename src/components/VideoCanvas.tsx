import React, { useEffect, useState } from 'react';

interface VideoCanvasProps {
  children: React.ReactNode;
  isRecording?: boolean;
}

export default function VideoCanvas({ children, isRecording }: VideoCanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Target: 1920x1080 logical canvas
      const canvasW = 1920;
      const canvasH = 1080;
      // Fit within viewport with some padding (unless recording)
      const padding = isRecording ? 0 : 40;
      const availW = vw - padding * 2;
      const availH = vh - padding * 2;
      const s = Math.min(availW / canvasW, availH / canvasH);
      setScale(s);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isRecording]);

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
      <div
        id="video-canvas"
        className="relative pointer-events-auto"
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Canvas border glow (hidden during recording) */}
        {!isRecording && (
          <div
            className="absolute -inset-[3px] border-2 border-black/20 pointer-events-none z-[999]"
            style={{
              boxShadow: '0 0 30px rgba(0,0,0,0.15), inset 0 0 30px rgba(0,0,0,0.05)',
            }}
          />
        )}

        {/* Overflow hidden container for clipping */}
        <div className="absolute inset-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
