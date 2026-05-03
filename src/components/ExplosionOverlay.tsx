import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const EXPLOSION_ASSETS = [
  "https://assets.codepen.io/16327/2D-circles.png",
  "https://assets.codepen.io/16327/2D-keyframe.png",
  "https://assets.codepen.io/16327/2D-lightning.png",
  "https://assets.codepen.io/16327/2D-star.png",
  "https://assets.codepen.io/16327/2D-flower.png",
  "https://assets.codepen.io/16327/3D-cone.png",
  "https://assets.codepen.io/16327/3D-spiral.png",
  "https://assets.codepen.io/16327/3D-tunnel.png",
  "https://assets.codepen.io/16327/3D-hoop.png",
  "https://assets.codepen.io/16327/3D-semi.png"
];

interface ExplosionOverlayProps {
  triggerId: number; // Increment or change to trigger
  distance?: number;
}

export default function ExplosionOverlay({ triggerId, distance = 600 }: ExplosionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerId === 0 || !containerRef.current) return;

    // Center of screen
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    const count = Math.round(gsap.utils.clamp(3, 100, distance / 20));
    const angleSpread = Math.PI * 2;
    const speed = gsap.utils.mapRange(0, 500, 0.3, 1.5, distance);
    const sizeRange = gsap.utils.mapRange(0, 500, 20, 60, distance);

    const container = containerRef.current;

    for (let i = 0; i < count; i++) {
      const src = gsap.utils.random(EXPLOSION_ASSETS);
      const img = document.createElement('img');
      img.src = src;
      img.className = 'explosion-particle';
      img.style.position = 'absolute';
      img.style.pointerEvents = 'none';
      img.style.height = `${gsap.utils.random(20, sizeRange)}px`;
      
      // Initial centered position before physics displacement
      // Offset by half height to center origin
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      img.style.transform = `translate(-50%, -50%)`;
      img.style.zIndex = '500';

      container.appendChild(img);

      const angle = Math.random() * angleSpread;
      const velocity = gsap.utils.random(500, 1500) * speed;
      const duration = 1 + Math.random();

      const vx = Math.cos(angle) * velocity;
      // Negative Y because screen Y goes down, so negative is UP.
      const vy = -Math.sin(angle) * velocity; 

      // We'll use two tweens: 
      // 1. linear X translation
      gsap.to(img, {
        x: `+=${vx * duration}`,
        rotation: gsap.utils.random(-180, 180),
        duration: duration,
        ease: 'linear',
      });

      // 2. Y translation with power2.in to simulate gravity
      // Since initial vy can be upwards (negative), it goes up then falls down
      // Standard gsap eases can't perfectly emulate initial velocity + gravity in one tween without CustomEase
      // But we can approximate a parabolic arc using a motion path or two tweens
      
      gsap.to(img, {
        y: `+=${vy * duration + 0.5 * 3000 * duration * duration}`,
        duration: duration,
        ease: 'power1.in', // starts somewhat slow, accelerates down
      });

      // 3. Fade out
      gsap.to(img, {
        opacity: 0,
        duration: 0.2,
        delay: duration - 0.2,
        onComplete: () => {
          if (img.parentNode) {
            img.parentNode.removeChild(img);
          }
        }
      });
    }

  }, [triggerId, distance]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden" 
    />
  );
}
