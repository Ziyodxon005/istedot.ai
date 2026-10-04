import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
import { verifyAdminLogin } from '../services/firebase';
import istedotLogo from '../assets/logo_istedot.png';

const handleCardTilt = (e) => {
    const card = e.currentTarget;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
};

const handleCardReset = (e) => {
    e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
};

const AdminLoginPage = ({ onBack, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!password.trim()) { setError('Parolni kiriting'); return; }
        setIsLoading(true);
        setError('');
        try {
            const result = await verifyAdminLogin(password.trim());
            if (result) {
                onLoginSuccess(result);
            } else {
                setError('Noto\'g\'ri parol. Qayta urinib ko\'ring.');
            }
        } catch (err) {
            setError('Xatolik yuz berdi. Qayta urinib ko\'ring.');
        }
        setIsLoading(false);
    };

    return (
        <motion.div
            className="admin-login-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Animated Orbs */}
            <div className="admin-orbs">
                <div className="admin-orb admin-orb-1" />
                <div className="admin-orb admin-orb-2" />
                <div className="admin-orb admin-orb-3" />
            </div>

            <div className="admin-login-container">
                <motion.button
                    className="admin-back-btn"
                    onClick={onBack}
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <ArrowLeft size={16} />
                    <span>Bosh sahifaga</span>
                </motion.button>

                <motion.div
                    className="admin-login-card"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 22 }}
                    onMouseMove={handleCardTilt}
                    onMouseLeave={handleCardReset}
                >
                    {/* Glass shine */}
                    <div className="admin-card-shine" />

                    <div className="admin-login-header">
                        <motion.div
                            className="admin-shield-wrap"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 250 }}
                        >
                            <div className="admin-shield-glow" />
                            <Shield size={26} />
                        </motion.div>

                        <motion.img
                            src={istedotLogo}
                            alt="ISTEDOD AI"
                            className="admin-login-logo"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        />

                        <motion.h1
                            className="admin-login-title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Admin <span className="text-gradient">Panel</span>
                        </motion.h1>

                        <motion.p
                            className="admin-login-subtitle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            ISTEDOD AI boshqaruv tizimiga kirish
                        </motion.p>
                    </div>

                    <motion.div
                        className="admin-login-form"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                    >
                        <div className="admin-input-group">
                            <label>
                                <Lock size={13} />
                                <span>Maxfiy parol</span>
                            </label>
                            <div className="admin-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="admin-premium-input"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    autoFocus
                                    autoComplete="off"
                                />
                                <button className="admin-eye-btn" onClick={() => setShowPassword(!showPassword)} type="button">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div className="admin-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                                <span>⚠️ {error}</span>
                            </motion.div>
                        )}

                        <motion.button
                            className="admin-login-btn"
                            onClick={handleLogin}
                            disabled={!password.trim() || isLoading}
                            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(77,184,255,0.3)' }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? (
                                <><div className="admin-btn-spinner" /><span>Tekshirilmoqda...</span></>
                            ) : (
                                <><Sparkles size={17} /><span>Kirish</span></>
                            )}
                        </motion.button>
                    </motion.div>

                    <motion.p
                        className="admin-login-hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 0.9 }}
                    >
                        🔒 Super Admin yoki Maktab direktori paroli
                    </motion.p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminLoginPage;
