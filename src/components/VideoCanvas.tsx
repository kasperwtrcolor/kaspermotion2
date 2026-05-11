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
      const padding = 0;
      const availW = vw;
      const availH = vh;
      const s = Math.min(availW / canvasW, availH / canvasH);
      setScale(s);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isRecording]);

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none bg-transparent">
      <div
        id="video-canvas"
        className="relative pointer-events-auto shadow-2xl overflow-hidden bg-black"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}
