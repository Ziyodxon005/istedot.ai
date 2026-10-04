import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSavedCertificates, deleteCertificate } from '../utils/certificateStore';
import istedotLogo from '../assets/logo_istedot.png';
import { Award, Eye, Trash2, Calendar, GraduationCap, ArrowLeft, CheckCircle2, User, Search, Lock } from 'lucide-react';

const SavedCertificatesPage = ({ onBack, onViewCert }) => {
    const [allCerts] = useState(() => getSavedCertificates());
    const [certs, setCerts] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [verifyName, setVerifyName] = useState('');
    const [verifySurname, setVerifySurname] = useState('');
    const [verifyError, setVerifyError] = useState('');

    // Ism-familya bo'yicha sertifikatlarni filtrlash
    const handleVerify = () => {
        const name = verifyName.trim().toLowerCase();
        const surname = verifySurname.trim().toLowerCase();

        if (!name || !surname) {
            setVerifyError('Iltimos, ism va familyangizni kiriting');
            return;
        }

        // Sertifikatlarni filtrlash — faqat shu foydalanuvchiniki
        const filtered = allCerts.filter(cert => {
            const data = cert.data || {};
            // Test mode — _userInfo mavjud
            if (data._userInfo) {
                const certName = (data._userInfo.name || '').trim().toLowerCase();
                const certSurname = (data._userInfo.surname || '').trim().toLowerCase();
                return certName === name && certSurname === surname;
            }
            // Suhbat mode — summary ichida ismni qidirish
            const summary = (data.summary || '').toLowerCase();
            const certSummary = (cert.summary || '').toLowerCase();
            return summary.includes(name) || certSummary.includes(name);
        });

        if (filtered.length === 0) {
            setVerifyError(`"${verifyName} ${verifySurname}" nomida sertifikat topilmadi`);
            return;
        }

        setCerts(filtered);
        setIsVerified(true);
        setVerifyError('');
    };

    const handleDelete = (id) => {
        deleteCertificate(id);
        const remaining = certs.filter(c => c.id !== id);
        setCerts(remaining);
        setConfirmDelete(null);
        if (remaining.length === 0) {
            setIsVerified(false);
        }
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

        card.style.transition = 'transform 0.05s ease-out, border-color 0.15s ease, box-shadow 0.15s ease';
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleCardReset = (e) => {
        const card = e.currentTarget;
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease, border-color 0.5s ease';
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
                        <h2 className="verify-title">Sertifikatlaringizni ko'rish</h2>
                        <p className="verify-subtitle">
                            Faqat o'zingizning sertifikatlaringizni ko'rish uchun ism va familyangizni kiriting
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
                                disabled={!verifyName.trim() || !verifySurname.trim()}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <Search size={18} />
                                <span>Sertifikatlarni topish</span>
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
                        {certs.map((cert, i) => {
                            const topCareer = cert.topCareer || cert.data?.recommendedCareers?.[0]?.name || cert.data?.recommendedCareers?.[0] || "Kasbiy yo'nalish";
                            const matchPercent = cert.data?.recommendedCareers?.[0]?.match || "95%";
                            const uniDir = cert.data?.universityDirections?.[0]?.direction || cert.data?.universityDirections?.[0]?.universities?.[0]?.name || "Yo'nalish";
                            const isTestBased = cert.data?._testMode === true;
                            const certTypeLabel = isTestBased ? '📝 Test asosida' : '🎙️ Suhbat asosida';

                            return (
                                <motion.div
                                    key={cert.id}
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
                                                <Calendar size={12} />
                                                {cert.date}
                                            </span>
                                        </div>
                                        <div className="saved-cert-card-top-right">
                                            <span className={`saved-cert-type-badge ${isTestBased ? 'type-test' : 'type-conv'}`}>
                                                {certTypeLabel}
                                            </span>
                                            <span className="saved-cert-match-tag">
                                                {matchPercent}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="saved-cert-card-body">
                                        <h3 className="saved-cert-career-title">{topCareer}</h3>
                                        <p className="saved-cert-card-summary">
                                            {cert.summary || "Shaxsiy qobiliyatlaringiz tahlil qilindi."}
                                        </p>
                                        <div className="saved-cert-uni-row">
                                            <GraduationCap size={15} className="saved-cert-uni-icon" />
                                            <span className="saved-cert-uni-text" title={uniDir}>
                                                {uniDir}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="saved-cert-card-actions">
                                        <motion.button
                                            className="saved-cert-btn-view"
                                            onClick={() => onViewCert(cert.data)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            title="Sertifikatni to'liq ko'rish"
                                        >
                                            <Eye size={15} />
                                            <span>Ko'rish va Yuklab olish</span>
                                        </motion.button>
                                        <motion.button
                                            className="saved-cert-btn-del"
                                            onClick={() => setConfirmDelete(cert.id)}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            title="O'chirish"
                                        >
                                            <Trash2 size={16} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Confirm delete modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        className="saved-certs-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setConfirmDelete(null)}
                    >
                        <motion.div
                            className="saved-certs-modal"
                            initial={{ scale: 0.88, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.88, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="saved-certs-modal-title">🗑 Sertifikatni o'chirish</p>
                            <p className="saved-certs-modal-desc">Ushbu sertifikat natijalari o'chiriladi. Ishonchingiz komilmi?</p>
                            <div className="saved-certs-modal-btns">
                                <button className="saved-cert-modal-cancel" onClick={() => setConfirmDelete(null)}>
                                    Bekor qilish
                                </button>
                                <button className="saved-cert-modal-confirm" onClick={() => handleDelete(confirmDelete)}>
                                    Ha, o'chirilsin
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SavedCertificatesPage;
