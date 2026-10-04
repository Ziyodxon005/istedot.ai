import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllResults, getSchools } from '../services/firebase';
import istedotLogo from '../assets/logo_istedot.png';
import { Award, Eye, Calendar, GraduationCap, ArrowLeft, CheckCircle2, User, Search, Lock, School, PenLine, ChevronDown } from 'lucide-react';

const SavedCertificatesPage = ({ onBack, onViewCert }) => {
    const [certs, setCerts] = useState([]);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [verifyName, setVerifyName] = useState('');
    const [verifySurname, setVerifySurname] = useState('');
    const [verifySchool, setVerifySchool] = useState('');
    const [verifyGrade, setVerifyGrade] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [schoolsList, setSchoolsList] = useState([]);

    useEffect(() => {
        getSchools().then(list => setSchoolsList(list)).catch(() => {});
    }, []);

    // Firebase'dan qidirish
    const handleVerify = async () => {
        const name = verifyName.trim().toLowerCase();
        const surname = verifySurname.trim().toLowerCase();

        if (!name || !surname) {
            setVerifyError('Iltimos, ism va familyangizni kiriting');
            return;
        }

        setIsLoading(true);
        setVerifyError('');

        try {
            const allResults = await getAllResults(1000);
            
            if (!allResults || allResults.length === 0) {
                setVerifyError('Hech qanday natija topilmadi');
                setIsLoading(false);
                return;
            }

            const filtered = allResults.filter(r => {
                const rName = (r.userInfo?.name || '').trim().toLowerCase();
                const rSurname = (r.userInfo?.surname || '').trim().toLowerCase();
                
                // Ism mosligini tekshirish (includes ham qo'llab-quvvatlanadi)
                const nameMatch = (rName === name || rName.includes(name)) && (rSurname === surname || rSurname.includes(surname));
                if (!nameMatch) return false;

                // Maktab filtri
                if (verifySchool) {
                    const rSchool = (r.userInfo?.school || '').trim().toLowerCase();
                    if (rSchool !== verifySchool.toLowerCase().trim()) return false;
                }
                // Sinf filtri
                if (verifyGrade) {
                    const rGrade = (r.userInfo?.grade || r.grade || '').trim();
                    if (rGrade !== verifyGrade) return false;
                }
                // analysisData mavjudligini tekshirish
                return !!r.analysisData;
            });

            if (filtered.length === 0) {
                setVerifyError(`"${verifyName} ${verifySurname}" nomida sertifikat topilmadi`);
                setIsLoading(false);
                return;
            }

            setCerts(filtered);
            setIsVerified(true);
        } catch (err) {
            setVerifyError('Xatolik yuz berdi, qayta urinib ko\'ring');
            console.error('Search error:', err);
        }
        setIsLoading(false);
    };

    const handleCardTilt = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transition = 'transform 0.05s ease-out';
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleCardReset = (e) => {
        const card = e.currentTarget;
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
    };

    return (
        <motion.div
            className="saved-certs-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="saved-certs-bg" />
            <div className="saved-certs-ambient orb-1" />
            <div className="saved-certs-ambient orb-2" />

            {/* Header */}
            <div className="saved-certs-header">
                <motion.button
                    className="saved-certs-back"
                    onClick={isVerified ? () => setIsVerified(false) : onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={16} />
                    <span>{isVerified ? 'Orqaga' : 'Bosh menyu'}</span>
                </motion.button>

                <div className="saved-certs-header-title-box">
                    <div className="saved-certs-header-row">
                        <div className="saved-certs-mini-logo">
                            <img src={istedotLogo} alt="ISTEDOD AI" />
                        </div>
                        <h1 className="saved-certs-title">
                            {isVerified ? `${verifyName} ${verifySurname}` : 'Sertifikatlarni Ko\'rish'}
                        </h1>
                    </div>
                    {isVerified && (
                        <div className="saved-certs-count-badge">
                            <CheckCircle2 size={13} className="text-cyan" />
                            <span>{certs.length} ta tahlil natijasi</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ============= VERIFY PHASE ============= */}
            {!isVerified && (
                <div className="saved-certs-verify-container">
                    <motion.div
                        className="saved-certs-verify-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <div className="verify-icon-wrap">
                            <Lock size={28} className="verify-lock-icon" />
                        </div>
                        <h2 className="verify-title" style={{ fontSize: '1.1rem' }}>Sertifikatlaringizni ko'rish</h2>
                        <p className="verify-subtitle" style={{ fontSize: '0.75rem' }}>
                            Ma'lumotlaringizni kiriting va sertifikatlaringizni toping
                        </p>

                        <div className="verify-form">
                            <div className="verify-input-group">
                                <label><User size={14} /><span>Ismingiz</span></label>
                                <input
                                    type="text"
                                    className="test-input"
                                    placeholder="Masalan: Ali"
                                    value={verifyName}
                                    onChange={(e) => { setVerifyName(e.target.value); setVerifyError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    autoFocus
                                />
                            </div>
                            <div className="verify-input-group">
                                <label><User size={14} /><span>Familyangiz</span></label>
                                <input
                                    type="text"
                                    className="test-input"
                                    placeholder="Masalan: Valiyev"
                                    value={verifySurname}
                                    onChange={(e) => { setVerifySurname(e.target.value); setVerifyError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                />
                            </div>
                            <div className="verify-input-group">
                                <label><School size={14} /><span>Maktabingiz</span></label>
                                <div className="test-select-wrap">
                                    <select className="test-input test-select" value={verifySchool} onChange={(e) => setVerifySchool(e.target.value)}>
                                        <option value="">Barcha maktablar</option>
                                        {schoolsList.map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>
                            <div className="verify-input-group">
                                <label><PenLine size={14} /><span>Sinfingiz</span></label>
                                <div className="test-select-wrap">
                                    <select className="test-input test-select" value={verifyGrade} onChange={(e) => setVerifyGrade(e.target.value)}>
                                        <option value="">Barcha sinflar</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11].map(g => (<option key={g} value={`${g}-sinf`}>{g}-sinf</option>))}
                                    </select>
                                    <ChevronDown size={16} className="test-select-arrow" />
                                </div>
                            </div>

                            {verifyError && (
                                <motion.p
                                    className="verify-error"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {verifyError}
                                </motion.p>
                            )}

                            <motion.button
                                className="verify-submit-btn"
                                onClick={handleVerify}
                                disabled={!verifyName.trim() || !verifySurname.trim() || isLoading}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                {isLoading ? (
                                    <><span className="verify-spinner" /><span>Qidirilmoqda...</span></>
                                ) : (
                                    <><Search size={18} /><span>Sertifikatlarni topish</span></>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ============= CERTIFICATES LIST ============= */}
            {isVerified && (
                <>
                    {certs.length === 0 && (
                        <div className="saved-certs-empty">
                            <div className="saved-certs-empty-icon">
                                <Award size={48} className="text-cyan" />
                            </div>
                            <h3>Sertifikat topilmadi</h3>
                            <p>Ushbu ism bilan hali sertifikat yaratilmagan.</p>
                            <motion.button
                                className="saved-certs-empty-btn"
                                onClick={onBack}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ✦ Testni boshlash
                            </motion.button>
                        </div>
                    )}

                    <div className="saved-certs-grid">
                        {certs.map((r, i) => {
                            const topCareer = r.analysisData?.recommendedCareers?.[0]?.name || r.analysisData?.recommendedCareers?.[0] || "Kasbiy yo'nalish";
                            const matchPercent = r.analysisData?.recommendedCareers?.[0]?.match || "95%";
                            const uniDir = r.analysisData?.universityDirections?.[0]?.direction || "Yo'nalish";
                            const isTestBased = r.type === 'test';
                            const certTypeLabel = isTestBased ? '📝 Test' : '🎙️ Suhbat';
                            const dateStr = new Date(r.timestamp).toLocaleDateString('uz');

                            return (
                                <motion.div
                                    key={r.id || i}
                                    className="saved-cert-3d-card"
                                    initial={{ opacity: 0, y: 25 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08, duration: 0.4 }}
                                    onMouseMove={handleCardTilt}
                                    onMouseLeave={handleCardReset}
                                    layout
                                >
                                    <div className="saved-cert-card-top">
                                        <div className="saved-cert-card-top-left">
                                            <div className="saved-cert-card-logo">
                                                <img src={istedotLogo} alt="ISTEDOD AI" />
                                            </div>
                                            <span className="saved-cert-date-chip">
                                                <Calendar size={11} />
                                                {dateStr}
                                            </span>
                                        </div>
                                        <div className="saved-cert-card-top-right">
                                            <span className={`saved-cert-type-badge ${isTestBased ? 'type-test' : 'type-conv'}`}>
                                                {certTypeLabel}
                                            </span>
                                            <span className="saved-cert-match-tag" style={{ fontSize: '0.65rem' }}>
                                                {matchPercent}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="saved-cert-card-body">
                                        <h3 className="saved-cert-career-title" style={{ fontSize: '0.85rem' }}>{topCareer}</h3>
                                        <p className="saved-cert-card-summary" style={{ fontSize: '0.68rem' }}>
                                            {(r.analysisData?.summary || "Shaxsiy qobiliyatlaringiz tahlil qilindi.").slice(0, 100)}...
                                        </p>
                                        <div className="saved-cert-uni-row">
                                            <GraduationCap size={13} className="saved-cert-uni-icon" />
                                            <span className="saved-cert-uni-text" style={{ fontSize: '0.68rem' }} title={uniDir}>
                                                {uniDir}
                                            </span>
                                        </div>
                                        {r.userInfo?.grade && (
                                            <div className="saved-cert-uni-row" style={{ marginTop: '4px' }}>
                                                <PenLine size={13} className="saved-cert-uni-icon" />
                                                <span className="saved-cert-uni-text" style={{ fontSize: '0.68rem' }}>
                                                    {r.userInfo.school} / {r.userInfo.grade}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="saved-cert-card-actions">
                                        <motion.button
                                            className="saved-cert-btn-view"
                                            onClick={() => onViewCert({ ...r.analysisData, _userInfo: r.userInfo, _testMode: r.type === 'test' })}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            title="Sertifikatni to'liq ko'rish"
                                        >
                                            <Eye size={14} />
                                            <span style={{ fontSize: '0.72rem' }}>Ko'rish va Yuklab olish</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default SavedCertificatesPage;
