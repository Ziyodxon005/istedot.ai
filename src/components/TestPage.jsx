import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, School, CheckCircle2, PenLine, ChevronDown } from 'lucide-react';
import { generateFirstQuestion, generateNextQuestion, analyzeTestResults, FALLBACK_QUESTIONS } from '../services/testService';
import { saveTestResult, getSchools } from '../services/firebase';
import istedotLogo from '../assets/logo_istedot.png';

// 3D tilt effekt (sertifikatdagidek)
const handleCardTilt = (e) => {
    const card = e.currentTarget;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transition = 'transform 0.05s ease-out, border-color 0.15s ease, box-shadow 0.15s ease';
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`;
};

const handleCardReset = (e) => {
    const card = e.currentTarget;
    if (!card) return;
    card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease';
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
};

const TestPage = ({ onBack, onAnalysisReady }) => {
    const [phase, setPhase] = useState('info');
    const [userInfo, setUserInfo] = useState({ name: '', surname: '', school: '', grade: '' });
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionHistory, setQuestionHistory] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [customAnswer, setCustomAnswer] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [progress, setProgress] = useState(0);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const questionRef = useRef(null);
    const analysisCalledRef = useRef(false);
    const [schoolsList, setSchoolsList] = useState([]);

    // Maktablar ro'yxatini yuklash
    useEffect(() => {
        getSchools().then(list => setSchoolsList(list)).catch(() => {});
    }, []);

    const TOTAL_QUESTIONS = 10;

    const startTest = async () => {
        if (!userInfo.name.trim() || !userInfo.surname.trim() || !userInfo.school.trim()) return;
        setPhase('testing');
        setIsLoading(true);
        try {
            const q = await generateFirstQuestion(userInfo);
            if (q && q.question) {
                setCurrentQuestion(q);
            } else {
                setCurrentQuestion(FALLBACK_QUESTIONS[0]);
            }
        } catch (err) {
            console.error('First question error:', err);
            setCurrentQuestion(FALLBACK_QUESTIONS[0]);
        }
        setIsLoading(false);
    };

    const submitAnswer = async () => {
        const answer = showCustomInput ? customAnswer.trim() : selectedOption;
        if (!answer) return;

        const newHistory = [...questionHistory, {
            question: currentQuestion.question,
            answer: answer,
            options: currentQuestion.options,
            questionNumber: questionNumber
        }];
        setQuestionHistory(newHistory);

        const nextNum = questionNumber + 1;
        setQuestionNumber(nextNum);
        setSelectedOption(null);
        setCustomAnswer('');
        setShowCustomInput(false);
        setProgress(Math.round((questionNumber / TOTAL_QUESTIONS) * 100));

        if (nextNum > TOTAL_QUESTIONS) {
            setPhase('analyzing');
            analyzeResults(newHistory);
            return;
        }

        setIsLoading(true);
        try {
            const q = await generateNextQuestion(userInfo, newHistory, nextNum);
            if (q && q.question) {
                setCurrentQuestion(q);
            } else {
                const fallback = FALLBACK_QUESTIONS[nextNum - 1] || FALLBACK_QUESTIONS[Math.min(nextNum - 1, FALLBACK_QUESTIONS.length - 1)];
                setCurrentQuestion(fallback);
            }
        } catch (err) {
            const fallback = FALLBACK_QUESTIONS[nextNum - 1] || FALLBACK_QUESTIONS[Math.min(nextNum - 1, FALLBACK_QUESTIONS.length - 1)];
            setCurrentQuestion(fallback);
        }
        setIsLoading(false);

        if (questionRef.current) {
            questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const analyzeResults = async (history) => {
        if (analysisCalledRef.current) return;
        analysisCalledRef.current = true;

        const progressInterval = setInterval(() => {
            setAnalyzeProgress(prev => {
                if (prev >= 95) { clearInterval(progressInterval); return 95; }
                return prev + 2;
            });
        }, 100);

        try {
            const analysisData = await analyzeTestResults(userInfo, history);
            try { await saveTestResult(analysisData, userInfo, history); } catch (fbErr) { console.warn('Firebase save failed:', fbErr); }
            clearInterval(progressInterval);
            setAnalyzeProgress(100);
            setTimeout(() => {
                if (onAnalysisReady) onAnalysisReady({ ...analysisData, _testMode: true, _userInfo: userInfo });
            }, 800);
        } catch (err) {
            clearInterval(progressInterval);
            const { buildFallbackAnalysis } = await import('../services/analysisService.js');
            const fullText = history.map(qa => `${qa.question} ${qa.answer}`).join(' ');
            const fallback = buildFallbackAnalysis(fullText);
            try { await saveTestResult(fallback, userInfo, history); } catch (fbErr) {}
            setAnalyzeProgress(100);
            setTimeout(() => {
                if (onAnalysisReady) onAnalysisReady({ ...fallback, _testMode: true, _userInfo: userInfo });
            }, 800);
        }
    };

    // ==================== INFO PHASE ====================
    if (phase === 'info') {
        return (
            <motion.div className="test-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="test-bg-orbs">
                    <div className="test-orb orb-1" />
                    <div className="test-orb orb-2" />
                    <div className="test-orb orb-3" />
                </div>

                <div className="test-info-container">
                    <motion.button className="test-back-btn" onClick={onBack} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <ArrowLeft size={18} />
                        <span>Orqaga</span>
                    </motion.button>

                    <motion.div
                        className="test-info-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <div className="test-info-header">
                            <div className="test-info-icon-wrap">
                                <img src={istedotLogo} alt="ISTEDOD AI" className="test-logo-img" />
                            </div>
                            <h1 className="test-info-title">Psixologik Test</h1>
                            <p className="test-info-subtitle">Sizning qobiliyatlaringiz va kelajak yo'nalishingizni aniqlaymiz</p>
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
                                    <select
                                        className="test-input test-select"
                                        value={userInfo.school}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, school: e.target.value }))}
                                    >
                                        <option value="">Maktabni tanlang...</option>
                                        {schoolsList.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>
                            <div className="test-input-group">
                                <label><PenLine size={14} /><span>Sinfingiz</span></label>
                                <div className="test-select-wrap">
                                    <select
                                        className="test-input test-select"
                                        value={userInfo.grade}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, grade: e.target.value }))}
                                    >
                                        <option value="">Sinfni tanlang...</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                                            <option key={g} value={`${g}-sinf`}>{g}-sinf</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>

                            <motion.button
                                className="test-start-btn"
                                onClick={startTest}
                                disabled={!userInfo.name.trim() || !userInfo.surname.trim() || !userInfo.school.trim() || !userInfo.grade.trim()}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <img src={istedotLogo} alt="" className="test-btn-logo" />
                                <span>Testni Boshlash</span>
                                <ArrowRight size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ==================== ANALYZING PHASE ====================
    if (phase === 'analyzing') {
        return (
            <motion.div className="test-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="test-bg-orbs">
                    <div className="test-orb orb-1" />
                    <div className="test-orb orb-2" />
                </div>
                <div className="test-analyzing-container">
                    <motion.div
                        className="test-analyzing-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <img src={istedotLogo} alt="ISTEDOD AI" className="test-analyze-logo" />
                        <h2>Natijalar tahlil qilinmoqda...</h2>
                        <p>{userInfo.name}, sizning javoblaringiz AI tomonidan chuqur tahlil qilinmoqda</p>
                        <div className="test-analyze-progress">
                            <div className="test-analyze-bar">
                                <motion.div className="test-analyze-fill" style={{ width: `${analyzeProgress}%` }} />
                            </div>
                            <span>{analyzeProgress}%</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ==================== TESTING PHASE ====================
    return (
        <motion.div className="test-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="test-bg-orbs">
                <div className="test-orb orb-1" />
                <div className="test-orb orb-2" />
                <div className="test-orb orb-3" />
            </div>

            {/* Header */}
            <header className="test-header" ref={questionRef}>
                <motion.button className="test-back-btn small" onClick={onBack} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft size={16} />
                </motion.button>

                <div className="test-header-center">
                    <div className="test-header-logo-row">
                        <img src={istedotLogo} alt="ISTEDOD" className="test-header-logo" />
                        <span className="test-header-brand">ISTEDOD <span className="text-cyan">AI</span></span>
                    </div>
                    <span className="test-header-sub">Psixologik Test</span>
                </div>

                <div className="test-question-counter">
                    <span className="test-q-num">{questionNumber}</span>
                    <span className="test-q-sep">/</span>
                    <span className="test-q-total">{TOTAL_QUESTIONS}</span>
                </div>
            </header>

            {/* Progress bar */}
            <div className="test-progress-wrap">
                <motion.div className="test-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
            </div>

            {/* Question Area */}
            <div className="test-question-area">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            className="test-loading"
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                            <img src={istedotLogo} alt="" className="test-loading-logo" />
                            <div className="test-loading-dots"><span /><span /><span /></div>
                            <p>Savol tayyorlanmoqda...</p>
                        </motion.div>
                    ) : currentQuestion ? (
                        <motion.div
                            key={`q-${questionNumber}`}
                            className="test-question-card"
                            initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)', y: 20 }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, filter: 'blur(16px)', y: -15 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
                        >
                            {/* AI Bubble with logo */}
                            <div className="test-ai-bubble">
                                <div
                                    className="test-ai-avatar"
                                    onMouseMove={handleCardTilt}
                                    onMouseLeave={handleCardReset}
                                >
                                    <img src={istedotLogo} alt="AI" className="test-avatar-logo" />
                                </div>
                                <div
                                    className="test-ai-message"
                                    onMouseMove={handleCardTilt}
                                    onMouseLeave={handleCardReset}
                                >
                                    <p>{currentQuestion.question}</p>
                                </div>
                            </div>

                            {/* Variantlar — 3D hover */}
                            <div className="test-options">
                                {currentQuestion.options?.map((opt, idx) => (
                                    <motion.button
                                        key={idx}
                                        className={`test-option-btn ${selectedOption === opt ? 'selected' : ''}`}
                                        onClick={() => { setSelectedOption(opt); setShowCustomInput(false); setCustomAnswer(''); }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.08 }}
                                        onMouseMove={handleCardTilt}
                                        onMouseLeave={handleCardReset}
                                    >
                                        <span className="test-opt-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="test-opt-text">{opt}</span>
                                        {selectedOption === opt && (
                                            <motion.span className="test-opt-check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <CheckCircle2 size={18} />
                                            </motion.span>
                                        )}
                                    </motion.button>
                                ))}

                                {/* Yozaman */}
                                <motion.button
                                    className={`test-option-btn test-custom-btn ${showCustomInput ? 'selected' : ''}`}
                                    onClick={() => { setShowCustomInput(!showCustomInput); setSelectedOption(null); }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + 4 * 0.08 }}
                                    onMouseMove={handleCardTilt}
                                    onMouseLeave={handleCardReset}
                                >
                                    <span className="test-opt-letter custom"><PenLine size={14} /></span>
                                    <span className="test-opt-text">O'zim yozaman</span>
                                </motion.button>

                                <AnimatePresence>
                                    {showCustomInput && (
                                        <motion.div className="test-custom-input-wrap" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="test-custom-input-row">
                                                <input
                                                    type="text"
                                                    className="test-custom-input"
                                                    placeholder="Javobingizni yozing..."
                                                    value={customAnswer}
                                                    onChange={(e) => setCustomAnswer(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' && customAnswer.trim()) submitAnswer(); }}
                                                    autoFocus
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Next button */}
                            <motion.button
                                className="test-next-btn"
                                onClick={submitAnswer}
                                disabled={!selectedOption && (!showCustomInput || !customAnswer.trim())}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onMouseMove={handleCardTilt}
                                onMouseLeave={handleCardReset}
                            >
                                {questionNumber >= TOTAL_QUESTIONS ? (
                                    <><img src={istedotLogo} alt="" className="test-btn-logo" /><span>Sertifikatni olish</span></>
                                ) : (
                                    <><span>Keyingi savol</span><ArrowRight size={18} /></>
                                )}
                            </motion.button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TestPage;
