import React, { useEffect, useRef } from 'react';

/**
 * 3D Holographic Quantum Core Visualizer
 * Real 3D volumetric sphere with:
 * - 3D Gyroscopic Orbital Rings with z-buffer depth occlusion (front/back half drawing)
 * - 3D orbiting energy particle field
 * - Moving specular light highlights and fresnel rim glow
 * - Dynamic audio-reactivity when speaking/listening
 * - Beautiful idle animation on splash screen
 */
const SphereVisualizer = ({ volume = 0, isActive = false, isSpeaking = false, size = 300 }) => {
    const canvasRef = useRef(null);
    const frameRef = useRef(null);
    const timeRef = useRef(0);

    // 3D Particles cloud
    const particlesRef = useRef(
        Array.from({ length: 42 }, (_, i) => ({
            theta: Math.random() * Math.PI * 2,
            phi: Math.acos(2 * Math.random() - 1),
            radiusMult: 1.15 + Math.random() * 0.45,
            speed: (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.012),
            size: 1.5 + Math.random() * 2.5,
            colorType: i % 3, // 0: cyan, 1: blue, 2: purple
        }))
    );

    // 3D Gyroscope orbital rings
    const ringsConfig = [
        { tiltX: 1.15, tiltY: 0.35, speed: 0.8, color: 'cyan', radiusMult: 1.32 },
        { tiltX: -0.95, tiltY: -0.45, speed: -0.65, color: 'blue', radiusMult: 1.48 },
        { tiltX: 0.45, tiltY: 1.25, speed: 0.5, color: 'purple', radiusMult: 1.62 },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const baseR = size * 0.28;
        const particles = particlesRef.current;

        const draw = () => {
            timeRef.current += 0.018;
            const t = timeRef.current;
            const vol = Math.min(volume, 1);

            ctx.clearRect(0, 0, size, size);

            // Audio & state breathing
            const breathe = 1 + Math.sin(t * 1.5) * 0.035;
            const pulse = isSpeaking ? 1 + vol * 0.25 : (isActive ? 1 + vol * 0.12 : 1);
            const r = baseR * breathe * pulse;

            // ── 1. ATMOSPHERIC DEEP 3D BACK GLOW ──────────────────
            const glowR = r * (isActive ? (isSpeaking ? 2.4 : 2.1) : 1.95);
            const backGlow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, glowR);
            if (isSpeaking) {
                backGlow.addColorStop(0, `rgba(168, 85, 247, ${0.28 + vol * 0.25})`);
                backGlow.addColorStop(0.5, `rgba(59, 130, 246, ${0.14 + vol * 0.15})`);
                backGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                backGlow.addColorStop(0, `rgba(0, 240, 255, ${isActive ? 0.22 + vol * 0.15 : 0.18})`);
                backGlow.addColorStop(0.5, `rgba(37, 99, 235, ${isActive ? 0.12 : 0.09})`);
                backGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = backGlow;
            ctx.fillRect(0, 0, size, size);

            // ── 2. 3D ORBITAL RINGS: HELPER PROJECTION ─────────────
            const calculateRingPoints = (ring, ringRadius, angleOffset) => {
                const points = [];
                const segments = 64;
                const cosX = Math.cos(ring.tiltX);
                const sinX = Math.sin(ring.tiltX);
                const cosY = Math.cos(ring.tiltY + angleOffset);
                const sinY = Math.sin(ring.tiltY + angleOffset);

                for (let i = 0; i <= segments; i++) {
                    const u = (i / segments) * Math.PI * 2;
                    const lx = Math.cos(u) * ringRadius;
                    const ly = Math.sin(u) * ringRadius;
                    const lz = 0;

                    const x1 = lx;
                    const y1 = ly * cosX - lz * sinX;
                    const z1 = ly * sinX + lz * cosX;

                    const x2 = x1 * cosY + z1 * sinY;
                    const y2 = y1;
                    const z2 = -x1 * sinY + z1 * cosY;

                    const fov = 400;
                    const scale = fov / (fov + z2);
                    points.push({
                        x: cx + x2 * scale,
                        y: cy + y2 * scale,
                        z: z2,
                        u: u
                    });
                }
                return points;
            };

            const ringData = ringsConfig.map((ring, idx) => {
                const ringRadius = r * ring.radiusMult * (1 + Math.sin(t * 1.2 + idx) * 0.02);
                const angleOffset = t * ring.speed;
                const points = calculateRingPoints(ring, ringRadius, angleOffset);
                return { ring, points, color: ring.color };
            });

            // ── 3. DRAW BACK HALF OF 3D RINGS (Z < 0: BEHIND SPHERE) ──
            ringData.forEach(({ points, color }) => {
                ctx.save();
                ctx.lineWidth = 1.6;
                const strokeColor = color === 'cyan' ? 'rgba(0, 240, 255, 0.35)' :
                    color === 'blue' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(168, 85, 247, 0.3)';
                ctx.strokeStyle = strokeColor;
                ctx.shadowBlur = 6;
                ctx.shadowColor = strokeColor;

                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    if (p1.z < 0 || p2.z < 0) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            });

            // ── 4. DRAW BACK 3D PARTICLES (Z < 0) ─────────────────
            particles.forEach((p) => {
                p.theta += p.speed;
                const pr = r * p.radiusMult;
                const px = pr * Math.sin(p.phi) * Math.cos(p.theta);
                const py = pr * Math.sin(p.phi) * Math.sin(p.theta);
                const pz = pr * Math.cos(p.phi);

                const rotY = t * 0.4;
                const rx = px * Math.cos(rotY) + pz * Math.sin(rotY);
                const ry = py;
                const rz = -px * Math.sin(rotY) + pz * Math.cos(rotY);

                if (rz < 0) {
                    const fov = 400;
                    const scale = fov / (fov + rz);
                    const screenX = cx + rx * scale;
                    const screenY = cy + ry * scale;
                    const pSize = Math.max(0.8, p.size * scale * 0.85);

                    ctx.save();
                    ctx.fillStyle = p.colorType === 0 ? 'rgba(0, 240, 255, 0.35)' :
                        p.colorType === 1 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(192, 132, 252, 0.3)';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

            // ── 5. THE 3D VOLUMETRIC SPHERE CORE ──────────────────
            const lightOffsetAngle = t * 0.6;
            const lightDist = r * 0.35;
            const lx = cx - Math.cos(lightOffsetAngle) * lightDist;
            const ly = cy - Math.sin(lightOffsetAngle) * lightDist * 0.6 - r * 0.15;

            const sphereGrad = ctx.createRadialGradient(
                lx, ly, r * 0.05,
                cx + r * 0.15, cy + r * 0.15, r * 1.05
            );

            if (isSpeaking) {
                sphereGrad.addColorStop(0, '#ffffff');
                sphereGrad.addColorStop(0.12, '#f3e8ff');
                sphereGrad.addColorStop(0.35, '#c084fc');
                sphereGrad.addColorStop(0.65, '#7c3aed');
                sphereGrad.addColorStop(0.88, '#3b0764');
                sphereGrad.addColorStop(1, '#0f051d');
            } else if (isActive) {
                sphereGrad.addColorStop(0, '#ffffff');
                sphereGrad.addColorStop(0.12, '#e0f2fe');
                sphereGrad.addColorStop(0.35, '#38bdf8');
                sphereGrad.addColorStop(0.65, '#0284c7');
                sphereGrad.addColorStop(0.88, '#082f49');
                sphereGrad.addColorStop(1, '#020617');
            } else {
                sphereGrad.addColorStop(0, '#ffffff');
                sphereGrad.addColorStop(0.15, '#cffafe');
                sphereGrad.addColorStop(0.42, '#06b6d4');
                sphereGrad.addColorStop(0.72, '#0369a1');
                sphereGrad.addColorStop(0.9, '#082f49');
                sphereGrad.addColorStop(1, '#030816');
            }

            ctx.save();
            ctx.shadowBlur = isActive ? (isSpeaking ? 35 + vol * 20 : 25) : 20;
            ctx.shadowColor = isSpeaking ? 'rgba(192, 132, 252, 0.8)' : 'rgba(0, 240, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = sphereGrad;
            ctx.fill();
            ctx.restore();

            // ── 6. 3D FRESNEL RIM (EDGE) GLOW ─────────────────────
            ctx.save();
            const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
            const rimColor = isSpeaking ? 'rgba(192, 132, 252, 0.85)' : 'rgba(0, 240, 255, 0.85)';
            rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            rimGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
            rimGrad.addColorStop(1, rimColor);

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = rimGrad;
            ctx.fill();
            ctx.restore();

            // ── 7. 3D GLASS SPECULAR CRESCENT ─────────────────────
            ctx.save();
            const specGrad = ctx.createRadialGradient(
                lx, ly, 0,
                lx, ly, r * 0.65
            );
            specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
            specGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.25)');
            specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.ellipse(lx, ly, r * 0.45, r * 0.28, Math.PI / 4, 0, Math.PI * 2);
            ctx.fillStyle = specGrad;
            ctx.fill();
            ctx.restore();

            // ── 8. DRAW FRONT HALF OF 3D RINGS (Z >= 0: IN FRONT) ──
            ringData.forEach(({ points, color }) => {
                ctx.save();
                ctx.lineWidth = 2.4;
                const strokeColor = color === 'cyan' ? '#00f0ff' :
                    color === 'blue' ? '#38bdf8' : '#c084fc';
                ctx.strokeStyle = strokeColor;
                ctx.shadowBlur = 12;
                ctx.shadowColor = strokeColor;

                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    if (p1.z >= 0 || p2.z >= 0) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Orbiting energy bead along the ring
                const beadIndex = Math.floor(((t * 0.8) % 1) * (points.length - 1));
                const bead = points[beadIndex];
                if (bead && bead.z >= -10) {
                    ctx.beginPath();
                    ctx.arc(bead.x, bead.y, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowBlur = 16;
                    ctx.shadowColor = '#ffffff';
                    ctx.fill();
                }
                ctx.restore();
            });

            // ── 9. DRAW FRONT 3D PARTICLES (Z >= 0) ────────────────
            particles.forEach((p) => {
                const pr = r * p.radiusMult;
                const px = pr * Math.sin(p.phi) * Math.cos(p.theta);
                const py = pr * Math.sin(p.phi) * Math.sin(p.theta);
                const pz = pr * Math.cos(p.phi);

                const rotY = t * 0.4;
                const rx = px * Math.cos(rotY) + pz * Math.sin(rotY);
                const ry = py;
                const rz = -px * Math.sin(rotY) + pz * Math.cos(rotY);

                if (rz >= 0) {
                    const fov = 400;
                    const scale = fov / (fov + rz);
                    const screenX = cx + rx * scale;
                    const screenY = cy + ry * scale;
                    const pSize = Math.max(1.2, p.size * scale * 1.1);

                    ctx.save();
                    const pColor = p.colorType === 0 ? '#00f0ff' :
                        p.colorType === 1 ? '#38bdf8' : '#e879f9';
                    ctx.fillStyle = pColor;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = pColor;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

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
