import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface RainbowPhysicsOverlayProps {
  isActive: boolean;
}

export default function RainbowPhysicsOverlay({ isActive }: RainbowPhysicsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const count = 160;
    const hi = 300 / count;
    const wi = 100 / count;

    const timelines: gsap.core.Timeline[] = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = gsap.utils.random(5, 50);
      
      p.style.position = 'absolute';
      p.style.borderRadius = '50%';
      p.style.left = `${i * wi}vw`;
      p.style.top = `101vh`;
      p.style.transform = `translateZ(${gsap.utils.random(-100, 100)}px)`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.opacity = '1';
      p.style.border = `2px solid hsl(${i * hi - 5}, 100%, 50%)`;
      p.style.boxSizing = 'border-box';

      container.appendChild(p);

      const duration = gsap.utils.random(2, 6);
      const velocity = gsap.utils.random(100, 300);
      const angle = gsap.utils.random(-80, -100);
      
      const tl = gsap.timeline({ repeat: -1, delay: i * -0.2 });
      
      tl.to(p, {
        physics2D: {
          velocity: velocity,
          angle: angle,
          gravity: 100
        },
        scale: 0.1,
        opacity: 0,
        duration: duration,
        ease: "none"
      }, 0);

      timelines.push(tl);
    }

    return () => {
      timelines.forEach(tl => tl.kill());
      if (containerRef.current) {
         containerRef.current.innerHTML = '';
      }
    };
  }, [isActive]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[1100] transition-opacity duration-500 overflow-hidden ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ perspective: '800px', perspectiveOrigin: '50% 100%' }}
      />
    </div>
  );
}
