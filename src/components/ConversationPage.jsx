import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HologramStage from './HologramStage';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { PERSONAS } from '../utils/personas';
import { Mic, MicOff, X, Sparkles } from 'lucide-react';
import Particles from './Particles';

const ConversationPage = ({ personaId, onBack, onAnalysisReady }) => {
    const [isEnding, setIsEnding] = useState(false);
    const analysisReceivedRef = React.useRef(false);

    const {
        isLive,
        volume,
        connect,
        disconnect,
        sendText,
        isMicMuted,
        toggleMic,
        personaState,
        analysisData,
        videoRef,
        isVisionEnabled,
        toggleVision,
        turnCount,
        isAISpeaking,
        setEndingState,
    } = useGeminiLive();


    // Show finish button after AI has spoken at least 8 times (enough conversation)
    const showFinishBtn = turnCount >= 8 && !isEnding;

    const persona = PERSONAS[personaId] || PERSONAS['general'];

    useEffect(() => {
        if (persona) {
            connect(null, persona.systemInstruction, persona.voice, false, onAnalysisReady);
        }
        return () => { disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-transition when analysis data is received
    useEffect(() => {
        if (analysisData && onAnalysisReady && !analysisReceivedRef.current) {
            analysisReceivedRef.current = true;

            // Clear any pending timeout so no alerts pop up
            if (analysisReceivedRef._retryInterval) {
                clearTimeout(analysisReceivedRef._retryInterval);
                analysisReceivedRef._retryInterval = null;
            }

            // Instantly transition to AnalysisPage which will handle the 15s wait
            disconnect();
            onAnalysisReady(analysisData);
        }
    }, [analysisData]); // eslint-disable-line


    // Send a finish command to AI so it calls submit_analysis
    const handleFinishConversation = () => {
        if (isEnding) return;
        setIsEnding(true);
        setEndingState(true);

        // 1. Immediately mute mic so AI doesn't hear background noise
        if (!isMicMuted) toggleMic();

        // 2. Strong, clear command to AI (System prompt style to prevent verbal reply)
        const finishPrompt = "TIZIM BUYRUG'I: Suhbat foydalanuvchi tomonidan yakunlandi. Hech qanday so'z bilan javob qaytarmang! Gapirmang! Faqat va faqat 'submit_analysis' funksiyasini barcha ma'lumotlar bilan HOZIROQ chaqiring.";
        sendText(finishPrompt);

        // 3. Faqat bir marta kutamiz, chunki AI tahlilni yozishiga uzoq vaqt ketishi mumkin
        // Qayta-qayta yuborish uni chalg'itadi va boshidan boshlashiga sabab bo'ladi.
        const fallbackTimer = setTimeout(() => {
            if (!analysisReceivedRef.current) {
                // Agar 60 soniyada ham kelmasa, internet sekin bo'lishi mumkin.
                // Biz jarayonni to'xtatmaymiz, faqat foydalanuvchiga xabar beramiz
                console.log("Analysis is taking a long time (60s+). Re-pinging gently.");
                sendText("TIZIM BUYRUG'I: 'submit_analysis' funksiyasini zudlik bilan ishga tushiring! Hech qanday ovozli javob bermang!");
            }
        }, 60000); // 60 soniya kutish

        // Agar tahlil kelib qolsa, taymerni to'xtatish uchun saqlab qo'yamiz
        analysisReceivedRef._retryInterval = fallbackTimer;
    };


    return (
        <motion.div
            className="conversation-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Particles />

            {/* Header */}
            <header className="conversation-header">
                <div className="conv-header-left">
                    <div className={`status-badge ${isLive ? 'live' : 'offline'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">{isLive ? 'JONLI' : 'ULANMOQDA'}</span>
                    </div>
                </div>

                <div className="conversation-title">
                    <span className="conv-brand">ISTEDOD<span style={{ color: '#4db8ff' }}> AI</span></span>
                    <p>Kasbiy Yo'nalish Suhbati</p>
                    {/* Turn progress indicator */}
                    {isLive && (
                        <div className="conv-turn-progress">
                            {Array.from({ length: 8 }, (_, i) => (
                                <span
                                    key={i}
                                    className={`conv-turn-dot ${i < turnCount ? 'done' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="conv-header-right">
                    <motion.button
                        className="btn-back-small"
                        onClick={() => { disconnect(); onBack(); }}
                        whileTap={{ scale: 0.95 }}
                        title="Orqaga"
                    >
                        <X size={16} />
                    </motion.button>
                </div>
            </header>

            {/* Main Stage */}
            <div className="conversation-stage">
                <HologramStage
                    currentPersonaId={personaId}
                    volume={volume}
                    isLive={isLive}
                    isVisionEnabled={isVisionEnabled}
                    videoRef={videoRef}
                    personaName={persona?.name || 'ISTEDOD AI'}
                    personaState={personaState}
                />
            </div>

            {/* Controls */}
            <div className="conversation-controls">
                {/* Mic */}
                <motion.button
                    onClick={toggleMic}
                    className={`mic-indicator ${isMicMuted ? 'muted' : ''}`}
                    title={isMicMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        boxShadow: isLive && !isMicMuted ? '0 0 25px rgba(0, 180, 255, 0.4)' : 'none',
                        borderColor: isMicMuted ? '#ff5555' : (isLive ? '#00c8ff' : 'rgba(77, 184, 255, 0.4)'),
                    }}
                >
                    {isMicMuted
                        ? <MicOff size={26} style={{ color: '#ff5555' }} />
                        : <Mic size={26} style={{ color: isLive ? '#00c8ff' : '#4db8ff' }} />
                    }
                    {isLive && !isMicMuted && <span className="mic-pulse" />}
                </motion.button>

                {/* Finish conversation button — only after enough conversation */}
                <AnimatePresence>
                    {showFinishBtn && (
                        <motion.button
                            onClick={handleFinishConversation}
                            className="btn-finish-conv"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <Sparkles size={18} />
                            <span>Suhbatni yakunlash</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Ending overlay */}
            <AnimatePresence>
                {isEnding && (
                    <motion.div
                        className="ending-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="ending-card"
                            initial={{ opacity: 0, scale: 0.88, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        >
                            <div className="ending-spinner" />
                            <h3>{analysisData ? "Sertifikat tayyorlanmoqda..." : "Psixologik portret tuzilmoqda"}</h3>
                            <p>{analysisData ? "Barcha ma'lumotlar tahlil qilindi, natijani ko'rsatishga tayyorlanyapmiz..." : "Sun'iy intellekt suhbatingizni chuqur tahlil qilmoqda..."}</p>
                            <div className="ending-dots">
                                <span /><span /><span />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ConversationPage;
