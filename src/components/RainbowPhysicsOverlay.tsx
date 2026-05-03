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
      const angleDeg = gsap.utils.random(-80, -100);
      const angleRad = angleDeg * (Math.PI / 180);
      
      const vx = Math.cos(angleRad) * velocity;
      const vy = Math.sin(angleRad) * velocity; // Upwards is negative
      
      const tl = gsap.timeline({ repeat: -1, delay: i * -0.2 });
      
      const endX = vx * duration;
      const gravity = 100;
      
      tl.to(p, {
        x: endX,
        ease: "none",
        duration: duration
      }, 0);

      // Apex calculation: v = u + at => 0 = vy + gravity * t
      const apexDuration = Math.abs(vy / gravity);
      const endY = (vy * duration) + (0.5 * gravity * duration * duration);

      if (apexDuration > 0 && apexDuration < duration) {
          const apexY = (vy * apexDuration) + (0.5 * gravity * apexDuration * apexDuration);
          tl.to(p, {
             y: apexY,
             duration: apexDuration,
             ease: "power2.out"
          }, 0);
          tl.to(p, {
             y: endY,
             duration: duration - apexDuration,
             ease: "power2.in"
          }, apexDuration);
      } else {
          tl.to(p, {
             y: endY,
             duration: duration,
             ease: "power1.out"
          }, 0);
      }

      tl.to(p, {
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
