import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface CoinFlipCardProps {
  caption: string;
  isActive: boolean;
}

export default function CoinFlipCard({ caption, isActive }: CoinFlipCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const purseRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<HTMLSpanElement>(null);

  const colors = [
    { bg: '#1871f4', face: '#ffdc02', side: '#f4ae00', detail: '#e6a600' },
    { bg: '#e11d48', face: '#fcd34d', side: '#fbbf24', detail: '#d97706' },
    { bg: '#10b981', face: '#ffffff', side: '#e5e7eb', detail: '#9ca3af' },
    { bg: '#8b5cf6', face: '#f9a8d4', side: '#f472b6', detail: '#db2777' },
    { bg: '#000000', face: '#ffffff', side: '#e5e7eb', detail: '#9ca3af' },
  ];

  const [theme, setTheme] = React.useState(colors[0]);

  useEffect(() => {
    if (isActive) {
      setTheme(colors[Math.floor(Math.random() * colors.length)]);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !buttonRef.current || !coinRef.current || !holeRef.current || !purseRef.current) return;

    const button = buttonRef.current;
    const coin = coinRef.current;
    const hole = holeRef.current;
    const purse = purseRef.current;

    // Reset properties before animation
    gsap.set(button, { clearProps: 'all' });
    gsap.set(coin, { clearProps: 'all' });
    gsap.set(purse, { clearProps: 'all' });
    gsap.set(hole, { clearProps: 'all' });
    gsap.set(coin, { yPercent: 100 });

    const hangtime = 1.2;
    const distanceDuration = 0.6;
    const spin = 4;
    const bounce = 10;
    const offRotate = (Math.random() * 90) * (Math.random() > 0.5 ? 1 : -1);

    const tl = gsap.timeline();

    tl.to(button, {
      yPercent: bounce,
      repeat: 1,
      duration: 0.12,
      yoyo: true,
    })
    .fromTo(hole, { scale: 1 }, { scale: 0, duration: 0.2, delay: 0.2 })
    .set(coin, { clearProps: 'all' })
    .set(coin, { yPercent: -50 })
    .fromTo(purse, { xPercent: -200 }, { delay: 0.5, xPercent: 0, duration: 0.5, ease: 'power1.out' })
    .fromTo(coin, { rotate: -460 }, { rotate: 0, duration: 0.5, ease: 'power1.out' }, '<')
    
    // Physics arc (upwards then downwards)
    .to(coin, {
      y: "-=300",
      duration: hangtime / 2,
      ease: 'power1.out'
    }, `>-0.2`)
    .to(coin, {
      y: "+=300",
      duration: hangtime / 2,
      ease: 'power1.in',
      onComplete: () => {
        gsap.to(coin, { yPercent: 100, duration: 0.1 });
      }
    }, `>${hangtime / 2 - hangtime}`) // Run immediately after up

    // Spin and rotate
    .fromTo(coin, { rotateX: 0 }, { duration: hangtime, rotateX: spin * -360 }, `<`)
    .to(coin, { rotateY: offRotate, duration: distanceDuration }, `<`)
    .to(coin, { '--rx': offRotate, duration: distanceDuration }, `<`)
    
    // Bring hole back
    .fromTo(hole, { scale: 0 }, { scale: 1, duration: 0.2 }, `<${hangtime * 0.35}`);

    return () => {
      tl.kill();
    };
  }, [isActive]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <style>{`
        .coin-flip-container {
          --ru: 15;
          --lbl-fg: #fff;
          transform-style: preserve-3d;
          scale: 1.5;
        }

        .coin-flip-btn {
          touch-action: none;
          user-select: none;
          --bg: ${theme.bg};
          background: var(--bg);
          border-radius: 6px;
          font-size: 1.5rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #fff;
          font-family: inherit;
          border: 1px solid color-mix(in oklch, var(--bg), #000 12%);
          cursor: pointer;
          transform-origin: 75% 50%;
          padding: 0;
          --shadow-color: 0 0% 0%;
          box-shadow: 0px 0.6px 0.7px hsl(var(--shadow-color) / 0.14),
            0px 2.3px 2.6px -0.8px hsl(var(--shadow-color) / 0.14),
            0px 5.9px 6.6px -1.7px hsl(var(--shadow-color) / 0.14),
            0px 14.5px 16.3px -2.5px hsl(var(--shadow-color) / 0.14);
        }

        .coin-flip-content {
          align-items: center;
          clip-path: inset(-100vmax 0 1px 0);
          display: flex;
          gap: 1.5rem;
          padding: 1rem 1.5rem;
          height: 100%;
          transform-style: preserve-3d;
        }

        .coin-flip-purse {
          height: 100%;
          width: 100%;
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
        }

        .coin-flip-scene {
          --thickness: 4;
          display: inline-block;
          width: 1.5lh;
          aspect-ratio: 1;
          position: relative;
          transform-style: preserve-3d;
          perspective: 100vh;
        }

        .coin-flip-hole {
          position: absolute;
          z-index: 10;
          inset: 0;
          scale: 0;
          transform-style: preserve-3d;
          transform: translate3d(0, 0, calc(var(--thickness) * -2px));
          transform-origin: 50% 70%;
        }

        .coin-flip-hole::before {
          content: '';
          position: absolute;
          width: 125%;
          height: 40%;
          border-radius: 50%;
          top: 70%;
          left: 50%;
          translate: -50% -50%;
          background: black;
          box-shadow: 0 2px hsl(0 0% 20%) inset;
        }

        .coin-flip-hole::after {
          transform-style: preserve-3d;
          content: '';
          background: var(--bg);
          height: 200%;
          top: 0;
          left: 50%;
          translate: -50% 25%;
          width: 121%;
          position: absolute;
          transform: translate3d(0, 0, calc(var(--thickness) * 5px));
          mask: radial-gradient(
            125% 32% at 50% 3%,
            rgba(0, 0, 0, 0) 50%,
            #fff 50%
          );
          -webkit-mask: radial-gradient(
            125% 32% at 50% 3%,
            rgba(0, 0, 0, 0) 50%,
            #fff 50%
          );
        }

        .coin-flip-coin {
          --depth: 2;
          --detail: ${theme.detail};
          --face: ${theme.face};
          --side: ${theme.side};
          width: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          position: absolute;
          translate: -50% -50%;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .coin-flip-core {
          height: 100%;
          width: calc(var(--depth) * 2px);
          background: var(--side);
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          transform: rotateY(90deg) rotateX(calc((90 - var(--rx, 0)) * -1deg));
          transform-style: preserve-3d;
        }

        .coin-flip-core--rotated {
          --base: 90;
          transform: rotateY(90deg) rotateX(calc((90 - var(--rx, 0)) * 1deg));
        }

        .coin-flip-core::after,
        .coin-flip-core::before {
          content: '';
          height: 100%;
          width: calc(var(--depth) * 2px);
          background: var(--side);
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
        }

        .coin-flip-core::after {
          transform: rotateX(calc((var(--base, 0) - var(--rx, 0)) * 1deg));
        }
        .coin-flip-core::before {
          transform: rotateX(calc((var(--base, 0) - var(--rx, 0)) * -1deg));
        }

        .coin-flip-face {
          height: 100%;
          width: 100%;
          position: absolute;
          inset: 0;
          border-radius: 50%;
          transform-style: preserve-3d;
          background: var(--face);
          display: grid;
          place-items: center;
          color: var(--detail);
        }

        .coin-flip-face svg {
          width: 65%;
          scale: -1 1;
          translate: -5% 0;
        }

        .coin-flip-face::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--side);
          backface-visibility: hidden;
        }

        .coin-flip-face--front {
          transform: translate3d(0, 0, calc((var(--depth) * 1px) + 0.5px)) rotateY(180deg);
        }
        .coin-flip-face--rear {
          transform: translate3d(0, 0, calc((var(--depth) * -1px) - 0.5px));
        }
      `}</style>

      <div className="coin-flip-container">
        <button ref={buttonRef} className="coin-flip-btn">
          <span className="coin-flip-content">
            <span className="coin-flip-scene">
              <span ref={holeRef} className="coin-flip-hole"></span>
              <div ref={purseRef} className="coin-flip-purse">
                <div ref={coinRef} className="coin-flip-coin">
                  <div className="coin-flip-face coin-flip-face--front">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.24-1.06-2.28-1.92H7.9c.04 1.82 1.38 3.1 3 3.5V20h2.34v-1.7c1.68-.34 2.86-1.44 2.86-3.08 0-1.89-1.31-2.82-3.79-3.38z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="coin-flip-core"></div>
                  <div className="coin-flip-core coin-flip-core--rotated"></div>
                  <div className="coin-flip-face coin-flip-face--rear">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.24-1.06-2.28-1.92H7.9c.04 1.82 1.38 3.1 3 3.5V20h2.34v-1.7c1.68-.34 2.86-1.44 2.86-3.08 0-1.89-1.31-2.82-3.79-3.38z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
            </span>
            <span>{caption || "Bonus Scene!"}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
