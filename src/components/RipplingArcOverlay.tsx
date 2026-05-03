import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface RipplingArcOverlayProps {
  isActive: boolean;
}

export default function RipplingArcOverlay({ isActive }: RipplingArcOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isActive || !svgRef.current) return;

    const svg = svgRef.current;
    
    // Elements
    const arch1 = svg.querySelector('.arch1') as SVGPathElement;
    const arch2 = svg.querySelector('.arch2') as SVGPathElement;
    const whole = svg.querySelectorAll('.whole');
    const upsideDown = svg.querySelector('.upsideDown');
    const rippleGroup = svg.querySelector('.rippleGroup');
    const rips = svg.querySelectorAll('.rip');
    const particleContainer = svg.querySelector('.particleContainer');
    const particles = Array.from(svg.querySelectorAll('.particleContainer circle')) as SVGCircleElement[];

    const colorArray = ["#EF476F", "#FFD166", "#06D6A0", "#118AB2", "#073B4C"];
    let repeatCount = 0;

    // Reset initial states
    gsap.set(upsideDown, {
      scaleY: -1,
      transformOrigin: '50% 100%',
      y: 2
    });

    // Dash array for arch paths (radius 125 -> half circle circumference ~393)
    gsap.set([arch1, arch2], { strokeDasharray: 393, strokeDashoffset: 0 });

    const playParticles = () => {
      gsap.set(particles, {
        x: 540,
        y: 362,
        attr: { r: 4 },
        opacity: 1,
        scale: () => gsap.utils.random(0.5, 1.3),
        transformOrigin: '50% 50%'
      });

      particles.forEach((p) => {
        const duration = gsap.utils.random(0.3, 0.9);
        const velocity = gsap.utils.random(224, 350);
        const angleDeg = gsap.utils.random(-120, -50);
        const angleRad = angleDeg * (Math.PI / 180);
        const gravity = gsap.utils.random(555, 970);

        const vx = Math.cos(angleRad) * velocity;
        const vy = Math.sin(angleRad) * velocity;

        const tl = gsap.timeline();
        
        tl.to(p, {
          x: `+=${vx * duration}`,
          ease: "none",
          duration: duration
        }, 0);

        const apexDuration = Math.abs(vy / gravity);
        const endY = (vy * duration) + (0.5 * gravity * duration * duration);

        if (apexDuration > 0 && apexDuration < duration) {
            const apexY = (vy * apexDuration) + (0.5 * gravity * apexDuration * apexDuration);
            tl.to(p, {
               y: `+=${apexY}`,
               duration: apexDuration,
               ease: "power2.out"
            }, 0);
            tl.to(p, {
               y: `+=${endY - apexY}`,
               duration: duration - apexDuration,
               ease: "power2.in"
            }, apexDuration);
        } else {
            tl.to(p, {
               y: `+=${endY}`,
               duration: duration,
               ease: "power1.out"
            }, 0);
        }

        tl.to(p, {
          scale: 0,
          duration: duration,
          ease: "none"
        }, 0);
      });
    };

    const doRipple = () => {
      const tl = gsap.timeline();
      
      const rxTarget = [220, 200, 180];
      const ryTarget = [38, 35, 30];

      rips.forEach((rip, i) => {
        gsap.fromTo(rip, {
          attr: { rx: 0, ry: 0 },
          opacity: 0.6
        }, {
          attr: { rx: rxTarget[i], ry: ryTarget[i] },
          opacity: 0,
          ease: "circ.out",
          duration: 2,
          delay: i * 0.03
        });
      });
    };

    const onRepeat = () => {
      repeatCount = (repeatCount < colorArray.length - 1) ? repeatCount + 1 : 0;
      
      gsap.to([whole, rippleGroup], {
        stroke: colorArray[repeatCount],
        ease: "sine.in",
        duration: 0.5
      });
      gsap.to(particleContainer, {
        fill: colorArray[repeatCount],
        ease: "sine.in",
        duration: 0.5
      });
      
      playParticles();
      doRipple();
    };

    const masterTl = gsap.timeline({ onStart: onRepeat, repeat: -1, onRepeat: onRepeat });

    masterTl.to(arch1, {
      strokeDashoffset: -393, // Simulates drawSVG: '100% 100%'
      ease: "expo.out",
      duration: 1
    }, 0)
    .fromTo(arch2, {
      strokeDashoffset: 393 // Simulates drawSVG: '0% 0%'
    }, {
      strokeDashoffset: 0,
      ease: "expo.in",
      duration: 1
    }, '-=1')
    .fromTo(whole, {
      x: 0
    }, {
      x: -125,
      ease: "sine.out",
      duration: 0.5
    }, '-=1')
    .fromTo(whole, {
      x: -125
    }, {
      x: -250,
      immediateRender: false,
      ease: "sine.in",
      duration: 0.5
    }, '-=0.5')
    .fromTo(rippleGroup, {
      x: 0
    }, {
      x: -250,
      ease: "none",
      duration: 1
    }, 0);

    return () => {
      masterTl.kill();
      gsap.killTweensOf(particles);
      gsap.killTweensOf(rips);
    };
  }, [isActive]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[1150] transition-opacity duration-500 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <svg ref={svgRef} viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-5xl">
        <defs>
          <g className="whole" id="arch" stroke="#EF476F" fill="none" strokeMiterlimit="10" strokeWidth="100">
            <path className="arch1" d="M265,362.5a125,125,0,0,1,250,0" />
            <path className="arch2" d="M515,362.5a125,125,0,0,1,250,0" />
          </g>
        </defs>
        <g className="rippleGroup" stroke="#EF476F" strokeWidth="0.5" fill="none">
          <ellipse className="rip" cx="560" cy="362" rx="0" ry="0" />
          <ellipse className="rip" cx="560" cy="362" rx="0" ry="0" />
          <ellipse className="rip" cx="560" cy="362" rx="0" ry="0" />
        </g>  
        <use href="#arch" className="whole" />
        <use href="#arch" className="whole upsideDown" opacity="0.05" />
        <g className="particleContainer" fill="#EF476F">
          {Array.from({ length: 17 }).map((_, i) => (
            <circle key={i} cx="0" cy="0" r="1" opacity="0" />
          ))}
        </g> 
      </svg>
    </div>
  );
}
