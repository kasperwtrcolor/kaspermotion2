import React, { useEffect, useRef } from 'react';

const HandDrawnCursor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointsRef = useRef<{ x: number; y: number }[]>([]);
    const maxPoints = 25;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const points = pointsRef.current;

            if (points.length > 2) {
                ctx.beginPath();
                ctx.strokeStyle = '#121212';
                ctx.lineWidth = 1.5;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';

                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    const xc = (points[i].x + points[i - 1].x) / 2;
                    const yc = (points[i].y + points[i - 1].y) / 2;
                    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
                    
                    // Fading effect
                    ctx.globalAlpha = i / points.length;
                    
                    // Add subtle jitter for "hand-drawn" feel
                    if (i === points.length - 1) {
                        ctx.save();
                        ctx.translate(points[i].x, points[i].y);
                        ctx.beginPath();
                        ctx.fillStyle = '#121212';
                        // Pencil tip
                        ctx.rotate(0.2);
                        ctx.fillRect(-1, -8, 2, 8);
                        ctx.restore();
                    }
                }
                ctx.stroke();
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
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[10000]"
        />
    );
};

export default HandDrawnCursor;
