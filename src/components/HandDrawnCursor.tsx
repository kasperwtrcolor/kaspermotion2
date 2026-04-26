import React, { useEffect, useRef } from 'react';

const HandDrawnCursor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointsRef = useRef<{ x: number; y: number }[]>([]);
    const maxPoints = 50; // Longer trail

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // High DPI support
            const ratio = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * ratio;
            canvas.height = window.innerHeight * ratio;
            ctx.scale(ratio, ratio);
        };

        window.addEventListener('resize', resize);
        resize();

        const handleMouseMove = (e: MouseEvent) => {
            pointsRef.current.push({ x: e.clientX, y: e.clientY });
            if (pointsRef.current.length > maxPoints) {
                pointsRef.current.shift();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        let animationFrame: number;
        const renderCursor = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const points = pointsRef.current;

            if (points.length > 2) {
                // Draw the trail
                for (let i = 1; i < points.length; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#121212';
                    ctx.lineWidth = 1.5;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    
                    // Progressive Opacity
                    ctx.globalAlpha = (i / points.length) * 0.8;
                    
                    const xc = (points[i].x + points[i - 1].x) / 2;
                    const yc = (points[i].y + points[i - 1].y) / 2;
                    
                    ctx.moveTo(points[i-1].x, points[i-1].y);
                    ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
                    ctx.stroke();
                }

                // Draw the "Pencil Tip"
                const lastPoint = points[points.length - 1];
                ctx.globalAlpha = 1;
                ctx.save();
                ctx.translate(lastPoint.x, lastPoint.y);
                
                // Pencil Tip Jitter
                ctx.rotate(Math.sin(Date.now() / 100) * 0.1);
                
                ctx.beginPath();
                ctx.fillStyle = '#121212';
                ctx.fillRect(-1, -8, 2, 8); // Tip stem
                
                // Tip point
                ctx.beginPath();
                ctx.moveTo(-1, 0);
                ctx.lineTo(1, 0);
                ctx.lineTo(0, 2);
                ctx.fill();
                
                ctx.restore();
            }
            animationFrame = requestAnimationFrame(renderCursor);
        };

        renderCursor();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <canvas
            id="cursor-canvas"
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[11000]" 
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};

export default HandDrawnCursor;
