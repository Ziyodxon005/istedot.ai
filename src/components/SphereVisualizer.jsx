import React, { useEffect, useRef } from 'react';

/**
 * PsychOrb — psixologiya saytiga mos vizualizer
 * Yumshoq nafas oluvchi sfera, miyani eslatuvchi to'lqin halqalari,
 * iliq gradient ranglar va tinchlantiruvchi pulsatsiya
 */
const SphereVisualizer = ({ volume = 0, isActive = false, isSpeaking = false, size = 300 }) => {
    const canvasRef = useRef(null);
    const frameRef = useRef(null);
    const timeRef = useRef(0);

    // Brainwave-style rings (stable across renders)
    const ringsRef = useRef(
        Array.from({ length: 5 }, (_, i) => ({
            phase: (i / 5) * Math.PI * 2,
            baseR: 1.1 + i * 0.18,
            amplitude: 0.012 + i * 0.004,
            speed: 0.4 + i * 0.15,
            alpha: 0.18 - i * 0.025,
        }))
    );

    // Floating mind-particles
    const dotsRef = useRef(
        Array.from({ length: 18 }, (_, i) => ({
            angle: (i / 18) * Math.PI * 2 + Math.random() * 0.5,
            speed: (Math.random() > 0.5 ? 1 : -1) * (0.004 + Math.random() * 0.006),
            dist: 0.78 + Math.random() * 0.32,
            size: 1.5 + Math.random() * 2.5,
            phase: Math.random() * Math.PI * 2,
        }))
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const baseR = size * 0.285;

        const rings = ringsRef.current;
        const dots = dotsRef.current;

        const draw = () => {
            timeRef.current += 0.014;
            const t = timeRef.current;
            const vol = Math.min(volume, 1);

            ctx.clearRect(0, 0, size, size);

            // ── AMBIENT GLOW (very soft) ─────────────────────────
            const ambientAlpha = isActive ? (isSpeaking ? 0.12 + vol * 0.06 : 0.07) : 0.03;
            const glow = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, baseR * 2.6);
            if (isSpeaking) {
                // Warm violet-rose when speaking
                glow.addColorStop(0, `rgba(160,100,255,${ambientAlpha})`);
                glow.addColorStop(0.6, `rgba(100,80,200,${ambientAlpha * 0.4})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
                // Calm teal-blue when listening
                glow.addColorStop(0, `rgba(72,180,200,${ambientAlpha})`);
                glow.addColorStop(0.6, `rgba(60,130,180,${ambientAlpha * 0.3})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
            }
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, size, size);

            // ── BRAINWAVE RINGS ──────────────────────────────────
            if (isActive) {
                rings.forEach((ring, ri) => {
                    const waveR = baseR * ring.baseR
                        + Math.sin(t * ring.speed + ring.phase) * baseR * ring.amplitude * (1 + vol * 2);
                    const alpha = ring.alpha * (isSpeaking ? 1 + vol * 1.2 : 0.6);

                    ctx.save();
                    ctx.setLineDash([]);
                    // Gradient stroke for each ring
                    const strokeColor = isSpeaking
                        ? `rgba(${170 + ri * 12}, ${110 + ri * 8}, 255, ${alpha})`
                        : `rgba(${60 + ri * 10}, ${170 + ri * 8}, ${200 + ri * 5}, ${alpha})`;

                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 1.5 - ri * 0.2;
                    ctx.shadowBlur = isSpeaking ? 10 : 5;
                    ctx.shadowColor = isSpeaking
                        ? `rgba(160,100,255,${alpha * 0.8})`
                        : `rgba(72,180,200,${alpha * 0.8})`;

                    ctx.beginPath();
                    ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                });
            }

            // ── CORE SPHERE ──────────────────────────────────────
            const breathe = 1 + Math.sin(t * 1.4) * 0.022; // gentle breath
            const pulse = isSpeaking ? 1 + vol * 0.22 : 1;
            const r = baseR * breathe * pulse;

            // Sphere gradient — psychological warm tones
            const sphereGrad = ctx.createRadialGradient(
                cx - r * 0.3, cy - r * 0.3, r * 0.04,
                cx + r * 0.1, cy + r * 0.1, r * 1.05
            );

            if (isSpeaking && isActive) {
                // Warm violet–indigo when AI is speaking (voice=mind)
                sphereGrad.addColorStop(0,   'rgba(255,255,255,0.92)');
                sphereGrad.addColorStop(0.12, 'rgba(220,190,255,0.9)');
                sphereGrad.addColorStop(0.45, 'rgba(150,100,240,0.85)');
                sphereGrad.addColorStop(0.78, 'rgba(80,40,170,0.92)');
                sphereGrad.addColorStop(1,   'rgba(25,10,70,1)');
            } else if (isActive) {
                // Cool teal–blue when listening (calm, open)
                sphereGrad.addColorStop(0,   'rgba(240,252,255,0.9)');
                sphereGrad.addColorStop(0.2,  'rgba(160,230,240,0.85)');
                sphereGrad.addColorStop(0.55, 'rgba(60,165,210,0.88)');
                sphereGrad.addColorStop(0.85, 'rgba(20,80,140,0.95)');
                sphereGrad.addColorStop(1,   'rgba(5,20,55,1)');
            } else {
                // Muted indigo when idle
                sphereGrad.addColorStop(0,   'rgba(200,210,230,0.75)');
                sphereGrad.addColorStop(0.5,  'rgba(90,110,160,0.6)');
                sphereGrad.addColorStop(1,   'rgba(15,25,60,0.85)');
            }

            ctx.shadowBlur = isActive ? (isSpeaking ? 28 + vol * 18 : 14) : 7;
            ctx.shadowColor = isSpeaking
                ? `rgba(160,100,255,${0.45 + vol * 0.25})`
                : 'rgba(60,160,210,0.3)';

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = sphereGrad;
            ctx.fill();

            // ── GLASS HIGHLIGHT ──────────────────────────────────
            ctx.shadowBlur = 0;
            const glass = ctx.createRadialGradient(
                cx - r * 0.3, cy - r * 0.38, 0,
                cx - r * 0.05, cy - r * 0.05, r * 0.7
            );
            glass.addColorStop(0,   'rgba(255,255,255,0.52)');
            glass.addColorStop(0.45,'rgba(255,255,255,0.1)');
            glass.addColorStop(1,   'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = glass;
            ctx.fill();

            // ── MIND PARTICLES ───────────────────────────────────
            if (isActive) {
                dots.forEach(dot => {
                    dot.angle += dot.speed * (1 + vol * 1.5);
                    const distR = r * dot.dist * (1 + Math.sin(t * 0.8 + dot.phase) * 0.06);
                    const px = cx + Math.cos(dot.angle) * distR;
                    const py = cy + Math.sin(dot.angle) * distR * 0.45;

                    // Only show if "above" (y < cy) for depth effect
                    const depthAlpha = (cy - py) / (r * 0.5);
                    const dotAlpha = Math.max(0, Math.min(0.85, depthAlpha)) * (isSpeaking ? 0.9 : 0.45);

                    if (dotAlpha < 0.01) return;

                    const dotColor = isSpeaking
                        ? `rgba(200,160,255,${dotAlpha})`
                        : `rgba(130,210,230,${dotAlpha})`;

                    ctx.shadowBlur = 5;
                    ctx.shadowColor = dotColor;
                    ctx.fillStyle = dotColor;
                    ctx.beginPath();
                    ctx.arc(px, py, dot.size * (isSpeaking ? 1 + vol * 0.5 : 0.75), 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // ── HEARTBEAT LINE (when speaking) ───────────────────
            if (isSpeaking && isActive) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.clip();

                const lineY = cy + Math.sin(t * 3) * r * 0.55;
                const lineGrad = ctx.createLinearGradient(cx - r, lineY - 1, cx + r, lineY - 1);
                lineGrad.addColorStop(0,    'rgba(200,160,255,0)');
                lineGrad.addColorStop(0.25, `rgba(200,160,255,${0.2 + vol * 0.2})`);
                lineGrad.addColorStop(0.5,  `rgba(220,180,255,${0.35 + vol * 0.25})`);
                lineGrad.addColorStop(0.75, `rgba(200,160,255,${0.2 + vol * 0.2})`);
                lineGrad.addColorStop(1,    'rgba(200,160,255,0)');

                ctx.strokeStyle = lineGrad;
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(180,130,255,0.6)';
                ctx.beginPath();
                ctx.moveTo(cx - r, lineY);
                ctx.lineTo(cx + r, lineY);
                ctx.stroke();
                ctx.restore();
            }

            frameRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [volume, isActive, isSpeaking, size]);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block', margin: '0 auto' }}
        />
    );
};

export default SphereVisualizer;
