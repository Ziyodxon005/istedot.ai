import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSavedCertificates, deleteCertificate } from '../utils/certificateStore';
import CertificatePage from './CertificatePage';

const HOLLAND = {
    R: { name: 'Realistik', color: '#fb923c' },
    I: { name: 'Intellektual', color: '#818cf8' },
    A: { name: 'Artistik', color: '#f472b6' },
    S: { name: 'Ijtimoiy', color: '#34d399' },
    E: { name: 'Tadbirkorlik', color: '#fbbf24' },
    C: { name: 'Konvensional', color: '#22d3ee' },
};

const SavedCertificatesPage = ({ onBack, onViewCert }) => {
    const [certs, setCerts] = useState(() => getSavedCertificates());
    const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm

    const handleDelete = (id) => {
        deleteCertificate(id);
        setCerts(getSavedCertificates());
        setConfirmDelete(null);
    };

    return (
        <motion.div
            className="saved-certs-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background */}
            <div className="saved-certs-bg" />

            {/* Header */}
            <div className="saved-certs-header">
                <motion.button
                    className="saved-certs-back"
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    ← Orqaga
                </motion.button>
                <div>
                    <h1 className="saved-certs-title">📋 Sertifikatlar</h1>
                    <p className="saved-certs-count">{certs.length} ta sertifikat saqlangan</p>
                </div>
            </div>

            {/* Empty state */}
            {certs.length === 0 && (
                <div className="saved-certs-empty">
                    <div className="saved-certs-empty-icon">📭</div>
                    <p>Hali sertifikat saqlanmagan</p>
                    <span>Suhbatni yakunlasangiz, sertifikat avtomatik saqlanadi</span>
                </div>
            )}

            {/* Cert List */}
            <div className="saved-certs-list">
                {certs.map((cert, i) => {
                    const hMeta = HOLLAND[cert.hollandPrimary];
                    return (
                        <motion.div
                            key={cert.id}
                            className="saved-cert-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            layout
                        >
                            {/* Left: badge */}
                            <div className="saved-cert-badge">
                                <span
                                    className="saved-cert-badge-letter"
                                    style={{ color: hMeta?.color || '#4db8ff' }}
                                >
                                    {cert.hollandPrimary || '?'}
                                </span>
                                <span
                                    className="saved-cert-badge-dot"
                                    style={{ background: hMeta?.color || '#4db8ff' }}
                                />
                            </div>

                            {/* Middle: info */}
                            <div className="saved-cert-info">
                                <div className="saved-cert-meta">
                                    <span className="saved-cert-date">📅 {cert.date} · {cert.time}</span>
                                    {cert.topCareer && (
                                        <span className="saved-cert-career">💼 {cert.topCareer}</span>
                                    )}
                                </div>
                                <p className="saved-cert-summary">
                                    {cert.summary?.slice(0, 120)}{cert.summary?.length > 120 ? '...' : ''}
                                </p>
                            </div>

                            {/* Right: actions */}
                            <div className="saved-cert-actions">
                                <motion.button
                                    className="saved-cert-btn view"
                                    onClick={() => onViewCert(cert.data)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    title="Ko'rish va yuklab olish"
                                >
                                    👁 Ko'rish
                                </motion.button>
                                <motion.button
                                    className="saved-cert-btn delete"
                                    onClick={() => setConfirmDelete(cert.id)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    title="O'chirish"
                                >
                                    🗑
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
                            <p className="saved-certs-modal-desc">Bu sertifikat brauzer keshidan o'chiriladi. Ishonchingiz komilmi?</p>
                            <div className="saved-certs-modal-btns">
                                <button className="saved-cert-modal-cancel" onClick={() => setConfirmDelete(null)}>
                                    Bekor
                                </button>
                                <button className="saved-cert-modal-confirm" onClick={() => handleDelete(confirmDelete)}>
                                    O'chirish
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
