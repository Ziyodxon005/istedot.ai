import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ volume, isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let phase = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height / 2;
            const amplitude = isActive ? 12 + volume * 35 : 4;
            const frequency = 0.022;

            // Primary wave — blue
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(77, 184, 255, 0)');
            gradient.addColorStop(0.5, `rgba(77, 184, 255, ${isActive ? 0.85 : 0.25})`);
            gradient.addColorStop(1, 'rgba(77, 184, 255, 0)');

            ctx.beginPath();
            ctx.moveTo(0, centerY);
            for (let x = 0; x < canvas.width; x++) {
                const y = centerY + Math.sin((x * frequency) + phase) * amplitude * Math.sin((x / canvas.width) * Math.PI);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = gradient;
            ctx.lineWidth = isActive ? 2 + volume * 2.5 : 1;
            ctx.shadowBlur = isActive ? 12 + volume * 18 : 4;
            ctx.shadowColor = '#4db8ff';
            ctx.stroke();

            // Secondary wave — cyan offset
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            for (let x = 0; x < canvas.width; x++) {
                const y = centerY + Math.sin((x * frequency * 1.6) + phase + 1.2) * amplitude * 0.55 * Math.sin((x / canvas.width) * Math.PI);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 229, 255, ${isActive ? 0.4 : 0.08})`;
            ctx.lineWidth = 1;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
            ctx.stroke();

            // Third wave — purple
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            for (let x = 0; x < canvas.width; x++) {
                const y = centerY + Math.sin((x * frequency * 0.8) + phase * 0.7 + 2.5) * amplitude * 0.35 * Math.sin((x / canvas.width) * Math.PI);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(123, 95, 255, ${isActive ? 0.3 : 0.05})`;
            ctx.lineWidth = 1;
            ctx.shadowColor = '#7b5fff';
            ctx.shadowBlur = 6;
            ctx.stroke();

            ctx.shadowBlur = 0;
            phase += 0.05;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [volume, isActive]);

    return (
        <canvas
            ref={canvasRef}
            width={320}
            height={50}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default AudioVisualizer;
