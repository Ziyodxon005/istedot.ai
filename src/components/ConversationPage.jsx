import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HologramStage from './HologramStage';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { PERSONAS } from '../utils/personas';
import { Mic, MicOff, X, Sparkles, User, School, PenLine, ChevronDown, ArrowRight } from 'lucide-react';
import Particles from './Particles';
import { getSchools } from '../services/firebase';
import istedotLogo from '../assets/logo_istedot.png';

const ConversationPage = ({ personaId, onBack, onAnalysisReady }) => {
    const [phase, setPhase] = useState('info'); // 'info' | 'conversation'
    const [userInfo, setUserInfo] = useState({ name: '', surname: '', school: '', grade: '' });
    const [schoolsList, setSchoolsList] = useState([]);
    const [isEnding, setIsEnding] = useState(false);
    const analysisReceivedRef = React.useRef(false);

    // Maktablar ro'yxatini yuklash
    useEffect(() => {
        getSchools().then(list => setSchoolsList(list)).catch(() => {});
    }, []);

    const {
        isLive,
        isReconnecting,
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
        stopAudio,
        triggerAnalysis,
        isReadyToFinish,
    } = useGeminiLive();

    const showFinishBtn = (isReadyToFinish || turnCount >= 7) && !isEnding;
    const persona = PERSONAS[personaId] || PERSONAS['general'];

    const startConversation = () => {
        setPhase('conversation');
        if (persona) {
            connect(null, persona.systemInstruction, persona.voice, false, (data) => {
                if (onAnalysisReady) {
                    onAnalysisReady({ ...data, _userInfo: userInfo });
                }
            });
        }
    };

    useEffect(() => {
        return () => { disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-transition when analysis data is received
    useEffect(() => {
        if (analysisData && onAnalysisReady && !analysisReceivedRef.current) {
            analysisReceivedRef.current = true;
            if (analysisReceivedRef._retryInterval) {
                clearTimeout(analysisReceivedRef._retryInterval);
                analysisReceivedRef._retryInterval = null;
            }
            disconnect();
            onAnalysisReady({ ...analysisData, _userInfo: userInfo });
        }
    }, [analysisData]); // eslint-disable-line

    const handleFinishConversation = () => {
        if (isEnding) return;
        setIsEnding(true);
        setEndingState(true);
        triggerAnalysis();
    };

    // ==================== INFO PHASE ====================
    if (phase === 'info') {
        return (
            <motion.div className="test-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="test-bg-orbs">
                    <div className="test-orb orb-1" />
                    <div className="test-orb orb-2" />
                    <div className="test-orb orb-3" />
                </div>

                <div className="test-info-container">
                    <motion.button className="test-back-btn" onClick={onBack} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        ← Orqaga
                    </motion.button>

                    <motion.div
                        className="test-info-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    >
                        <div className="test-info-header">
                            <div className="test-info-icon-wrap">
                                <img src={istedotLogo} alt="ISTEDOD AI" className="test-logo-img" />
                            </div>
                            <h1 className="test-info-title">Suhbat Testi</h1>
                            <p className="test-info-subtitle">AI bilan jonli suhbat orqali qobiliyatlaringizni aniqlaymiz</p>
                        </div>

                        <div className="test-form">
                            <div className="test-input-group">
                                <label><User size={14} /><span>Ismingiz</span></label>
                                <input type="text" placeholder="Masalan: Ali" value={userInfo.name} onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))} className="test-input" autoFocus />
                            </div>
                            <div className="test-input-group">
                                <label><User size={14} /><span>Familiyangiz</span></label>
                                <input type="text" placeholder="Masalan: Valiyev" value={userInfo.surname} onChange={(e) => setUserInfo(prev => ({ ...prev, surname: e.target.value }))} className="test-input" />
                            </div>
                            <div className="test-input-group">
                                <label><School size={14} /><span>Maktabingiz</span></label>
                                <div className="test-select-wrap">
                                    <select className="test-input test-select" value={userInfo.school} onChange={(e) => setUserInfo(prev => ({ ...prev, school: e.target.value }))}>
                                        <option value="">Maktabni tanlang...</option>
                                        {schoolsList.map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>
                            <div className="test-input-group">
                                <label><PenLine size={14} /><span>Sinfingiz</span></label>
                                <div className="test-select-wrap">
                                    <select className="test-input test-select" value={userInfo.grade} onChange={(e) => setUserInfo(prev => ({ ...prev, grade: e.target.value }))}>
                                        <option value="">Sinfni tanlang...</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11].map(g => (<option key={g} value={`${g}-sinf`}>{g}-sinf</option>))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>

                            <motion.button
                                className="test-start-btn"
                                onClick={startConversation}
                                disabled={!userInfo.name.trim() || !userInfo.surname.trim() || !userInfo.school.trim() || !userInfo.grade.trim()}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <Mic size={18} />
                                <span>Suhbatni Boshlash</span>
                                <ArrowRight size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ==================== CONVERSATION PHASE ====================
    return (
        <motion.div
            className="conversation-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <Particles />

            <header className="conversation-header">
                <div className="conv-header-left">
                    <div className={`status-badge ${isReconnecting ? 'reconnecting' : isLive ? 'live' : 'offline'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">
                            {isReconnecting ? 'QAYTA ULANMOQDA' : isLive ? 'JONLI' : 'ULANMOQDA'}
                        </span>
                    </div>
                </div>

                <div className="conversation-title">
                    <span className="conv-brand">ISTEDOD<span style={{ color: '#4db8ff' }}> AI</span></span>
                    <p>Kasbiy Yo'nalish Suhbati</p>
                    {isLive && (
                        <div className="conv-turn-progress">
                            {Array.from({ length: 8 }, (_, i) => (
                                <span key={i} className={`conv-turn-dot ${i < turnCount ? 'done' : ''}`} />
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

            <div className="conversation-controls">
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

                <AnimatePresence>
                    {showFinishBtn && (
                        <motion.button
                            onClick={handleFinishConversation}
                            className="btn-finish-conv ready-3d-glow"
                            initial={{ opacity: 0, y: 14, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Tahlil tayyor: Rasmiy sertifikatni olish"
                        >
                            <span className="btn-finish-sparkle">✦</span>
                            <span>Sertifikatni olish</span>
                            <Sparkles size={16} className="btn-finish-icon" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isEnding && (
                    <motion.div className="ending-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="ending-card" initial={{ opacity: 0, scale: 0.88, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}>
                            <div className="ending-spinner" />
                            <h3>{analysisData ? "Sertifikat tayyorlanmoqda..." : "Psixologik portret tuzilmoqda"}</h3>
                            <p>{analysisData ? "Barcha ma'lumotlar tahlil qilindi, natijani ko'rsatishga tayyorlanyapmiz..." : "Sun'iy intellekt suhbatingizni chuqur tahlil qilmoqda..."}</p>
                            <div className="ending-dots"><span /><span /><span /></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ConversationPage;
