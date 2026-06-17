import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SphereVisualizer from './SphereVisualizer';

const steps = [
    'Javoblaringiz tahlil qilinmoqda...',
    'Qiziqishlaringiz aniqlanmoqda...',
    'Holland kodi hisoblanmoqda...',
    'Gardner intellekti baholanmoqda...',
    'Kasblar tavsiya etilmoqda...',
    'Universitetlar qidirilmoqda...',
    'Sertifikat tayyorlanmoqda...',
];

const AnalysisPage = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const duration = 15000;
        const stepDuration = duration / steps.length;

        const stepInterval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < steps.length - 1) return prev + 1;
                clearInterval(stepInterval);
                return prev;
            });
        }, stepDuration);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 1;
            });
        }, duration / 100);

        const finishTimer = setTimeout(() => {
            onComplete();
        }, duration + 600);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
            clearTimeout(finishTimer);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="analysis-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background orbs */}
            <div className="analysis-orb orb-1" />
            <div className="analysis-orb orb-2" />
            <div className="analysis-orb orb-3" />

            <div className="analysis-content">
                {/* Sphere */}
                <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="analysis-sphere"
                >
                    <SphereVisualizer
                        volume={0.4 + Math.random() * 0.2}
                        isActive={true}
                        isSpeaking={true}
                        size={200}
                    />
                </motion.div>

                {/* Title */}
                <motion.h2
                    className="analysis-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Tahlil qilinmoqda
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >...</motion.span>
                </motion.h2>

                {/* Step indicator */}
                <motion.div
                    className="analysis-step"
                    key={currentStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4 }}
                >
                    <span className="analysis-step-dot" />
                    {steps[currentStep]}
                </motion.div>

                {/* Progress bar */}
                <div className="analysis-progress-wrap">
                    <div className="analysis-progress-bar">
                        <motion.div
                            className="analysis-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="analysis-progress-pct">{progress}%</span>
                </div>

                {/* Step dots */}
                <div className="analysis-dots">
                    {steps.map((_, i) => (
                        <motion.div
                            key={i}
                            className={`analysis-dot ${i <= currentStep ? 'done' : ''}`}
                            animate={i === currentStep ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AnalysisPage;
