import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SphereVisualizer from './SphereVisualizer';
import { getSavedCertificates } from '../utils/certificateStore';
import { Mic, ClipboardList, BookOpen } from 'lucide-react';

const SplashScreen = ({ onComplete, onViewSaved, onStartTest }) => {
    const [started, setStarted] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    useEffect(() => {
        const certs = getSavedCertificates();
        setSavedCount(certs.length);
    }, []);

    const isFirstLoad = !window.__splashVisited;
    useEffect(() => {
        window.__splashVisited = true;
    }, []);

    const handleStart = () => {
        if (started) return;
        setStarted(true);

        // Pre-warm BOTH AudioContexts synchronously within user gesture
        try {
            const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            window.__prewarmedAudioContext = inputCtx;
            inputCtx.resume().catch(() => { });

            const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            window.__prewarmedPlaybackContext = outputCtx;
            outputCtx.resume().catch(() => { });
        } catch (e) {
            console.warn('AudioContext prewarm failed:', e);
        }

        setTimeout(() => onComplete(), 120);
    };

    return (
        <motion.div
            className="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="splash-grid" />

            <div className="splash-content">
                {/* Sphere */}
                <motion.div
                    initial={isFirstLoad ? { scale: 0.7, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="splash-sphere-wrap"
                >
                    <SphereVisualizer volume={0} isActive={false} isSpeaking={false} size={220} />
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={isFirstLoad ? { opacity: 0, y: 15 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isFirstLoad ? 0.2 : 0, duration: 0.4 }}
                    className="splash-title-block"
                >
                    <h1 className="splash-brand">ISTEDOD<span className="splash-brand-ai"> AI</span></h1>
                    <p className="splash-tagline">Kasbiy Yo'nalish Tizimi</p>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    className="splash-sub"
                    initial={isFirstLoad ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{ delay: isFirstLoad ? 0.3 : 0, duration: 0.35 }}
                >
                    Sun'iy intellekt bilan kelajagingizni birga kashf eting
                </motion.p>

                {/* Info Cards */}
                <motion.div
                    className="splash-info-grid"
                    initial={isFirstLoad ? { opacity: 0, y: 15 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isFirstLoad ? 0.4 : 0, duration: 0.4 }}
                >
                    <div className="splash-info-card">
                        <div className="splash-info-icon">🎙️</div>
                        <h4 className="splash-info-title">Erkin Suhbat</h4>
                        <p className="splash-info-desc">Mikrofon orqali xuddi haqiqiy psixolog bilan gaplashgandek erkin suhbat quring.</p>
                    </div>
                    <div className="splash-info-card">
                        <div className="splash-info-icon">📝</div>
                        <h4 className="splash-info-title">Psixologik Test</h4>
                        <p className="splash-info-desc">10 ta AI tomonidan yaratilgan savollarga javob berib, qobiliyatingizni aniqlang.</p>
                    </div>
                    <div className="splash-info-card">
                        <div className="splash-info-icon">📜</div>
                        <h4 className="splash-info-title">Rasmiy Sertifikat</h4>
                        <p className="splash-info-desc">Suhbat yoki test asosida shaxsiy sertifikatingizni oling va yuklab oling.</p>
                    </div>
                </motion.div>

                {/* MAIN ACTION BUTTONS - 2 ta asosiy tugma */}
                <motion.div
                    className="splash-main-actions"
                    initial={isFirstLoad ? { opacity: 0, y: 15 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isFirstLoad ? 0.45 : 0, duration: 0.35 }}
                >
                    {/* SUHBAT BOSHLASH */}
                    <motion.button
                        className="splash-action-card action-conversation"
                        onClick={handleStart}
                        disabled={started}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <div className="splash-action-icon-wrap">
                            <Mic size={28} />
                        </div>
                        <div className="splash-action-text">
                            <h3>Suhbatni Boshlash</h3>
                            <p>Ovozli AI psixolog bilan gaplashing</p>
                        </div>
                        <div className="splash-action-arrow">→</div>
                        {started && (
                            <div className="splash-action-loading">
                                <span className="splash-btn-dot" />
                                <span className="splash-btn-dot" />
                                <span className="splash-btn-dot" />
                            </div>
                        )}
                    </motion.button>

                    {/* TEST BOSHLASH */}
                    <motion.button
                        className="splash-action-card action-test"
                        onClick={onStartTest}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <div className="splash-action-icon-wrap test-icon">
                            <ClipboardList size={28} />
                        </div>
                        <div className="splash-action-text">
                            <h3>Test Bo'limi</h3>
                            <p>10 ta savol — variantli test</p>
                        </div>
                        <div className="splash-action-arrow">→</div>
                    </motion.button>
                </motion.div>

                {/* SAVED CERTS BUTTON */}
                <motion.div
                    className="splash-buttons-row"
                    initial={isFirstLoad ? { opacity: 0, y: 15 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isFirstLoad ? 0.5 : 0, duration: 0.35 }}
                >
                    <AnimatePresence>
                        {savedCount > 0 && (
                            <motion.button
                                className="splash-saved-btn"
                                onClick={onViewSaved}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.96 }}
                                title="Saqlangan sertifikatlarni ko'rish"
                            >
                                📋 Sertifikatlar
                                <span className="splash-saved-badge">{savedCount}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* FOOTER & DISCLAIMER */}
                <motion.div
                    className="splash-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 1 }}
                >
                    <p className="splash-disclaimer">
                        USHBU SAYT FAQAT MA'LUMOT BERISH UCHUN ISHLAB CHIQILGAN. BARCHA JAVOBLAR SUN'IY INTELLEKT ORQALI TAHLIL QILINIB XULOSA QILINADI BU ANIQ NATIJA EMAS!!!
                    </p>
                    <p className="splash-copyright">
                        TURON O'QUV MARKAZI 2026
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
