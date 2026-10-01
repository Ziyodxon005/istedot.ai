import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSavedCertificates, deleteCertificate } from '../utils/certificateStore';
import istedotLogo from '../assets/logo_istedot.png';
import { Award, Eye, Trash2, Calendar, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react';

const SavedCertificatesPage = ({ onBack, onViewCert }) => {
    const [certs, setCerts] = useState(() => getSavedCertificates());
    const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm

    const handleDelete = (id) => {
        deleteCertificate(id);
        setCerts(getSavedCertificates());
        setConfirmDelete(null);
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
        const xPercent = Math.round((x / rect.width) * 100);
        const yPercent = Math.round((y / rect.height) * 100);

        card.style.transition = 'transform 0.05s ease-out, border-color 0.15s ease, box-shadow 0.15s ease';
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
        card.style.setProperty('--glare-x', `${xPercent}%`);
        card.style.setProperty('--glare-y', `${yPercent}%`);
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
            {/* Background elements */}
            <div className="saved-certs-bg" />
            <div className="saved-certs-ambient orb-1" />
            <div className="saved-certs-ambient orb-2" />

            {/* Header */}
            <div className="saved-certs-header">
                <motion.button
                    className="saved-certs-back"
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={16} />
                    <span>Bosh menyu</span>
                </motion.button>

                <div className="saved-certs-header-title-box">
                    <div className="saved-certs-header-row">
                        <div className="saved-certs-mini-logo">
                            <img src={istedotLogo} alt="ISTEDOD AI" />
                        </div>
                        <h1 className="saved-certs-title">Saqlangan Sertifikatlar</h1>
                    </div>
                    <div className="saved-certs-count-badge">
                        <CheckCircle2 size={13} className="text-cyan" />
                        <span>{certs.length} ta tahlil natijasi</span>
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {certs.length === 0 && (
                <div className="saved-certs-empty">
                    <div className="saved-certs-empty-icon">
                        <Award size={48} className="text-cyan" />
                    </div>
                    <h3>Hali sertifikat saqlanmagan</h3>
                    <p>Sun'iy intellekt bilan suhbatni yakunlaganingizda, sertifikatingiz avtomatik tarzda shu yerda saqlanadi.</p>
                    <motion.button
                        className="saved-certs-empty-btn"
                        onClick={onBack}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ✦ Suhbatni boshlash
                    </motion.button>
                </div>
            )}

            {/* 3D Grid of Certificate Cards */}
            <div className="saved-certs-grid">
                {certs.map((cert, i) => {
                    const topCareer = cert.topCareer || cert.data?.recommendedCareers?.[0]?.name || cert.data?.recommendedCareers?.[0] || "Kasbiy yo'nalish";
                    const matchPercent = cert.data?.recommendedCareers?.[0]?.match || "95%";
                    const uniDir = cert.data?.universityDirections?.[0]?.direction || cert.data?.universityDirections?.[0]?.universities?.[0]?.name || "Oliy ta'lim yo'nalishi";

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
                            {/* Card Top */}
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
                                    <span className="saved-cert-match-tag">
                                        {matchPercent}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="saved-cert-card-body">
                                <h3 className="saved-cert-career-title">{topCareer}</h3>

                                <p className="saved-cert-card-summary">
                                    {cert.summary || "Suhbat davomida shaxsiy qobiliyatlaringiz, qiziqishlaringiz va kuchli tomonlaringiz tahlil qilindi."}
                                </p>

                                <div className="saved-cert-uni-row">
                                    <GraduationCap size={15} className="saved-cert-uni-icon" />
                                    <span className="saved-cert-uni-text" title={uniDir}>
                                        {uniDir}
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="saved-cert-card-actions">
                                <motion.button
                                    className="saved-cert-btn-view"
                                    onClick={() => onViewCert(cert.data)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    title="Sertifikatni to'liq ko'rish va yuklab olish"
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
                            <p className="saved-certs-modal-desc">Ushbu sertifikat natijalari brauzer xotirasidan o'chiriladi. Ishonchingiz komilmi?</p>
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
