import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import ConversationPage from './components/ConversationPage';
import TestPage from './components/TestPage';
import AnalysisPage from './components/AnalysisPage';
import CertificatePage from './components/CertificatePage';
import SavedCertificatesPage from './components/SavedCertificatesPage';
import { saveCertificate } from './utils/certificateStore';
import { saveConversationResult } from './services/firebase';
import './App.css';

const AUTO_PERSONA_ID = 'general';

function App() {
    const [splashKey, setSplashKey] = useState(0);

    const [currentPage, setCurrentPage] = useState(() => {
        try {
            const activeRaw = sessionStorage.getItem('current_active_cert');
            if (activeRaw) {
                const parsed = JSON.parse(activeRaw);
                if (parsed && (parsed.summary || parsed.recommendedCareers)) {
                    return 'certificate';
                }
            }
        } catch (e) { }
        return 'splash';
    });

    const [analysisData, setAnalysisData] = useState(() => {
        try {
            const activeRaw = sessionStorage.getItem('current_active_cert');
            if (activeRaw) {
                return JSON.parse(activeRaw);
            }
        } catch (e) { }
        return null;
    });

    const handleSplashComplete = useCallback(() => {
        setCurrentPage('conversation');
    }, []);

    const handleStartTest = useCallback(() => {
        setCurrentPage('test');
    }, []);

    const handleAnalysisReady = useCallback((data) => {
        if (!data) return;
        setAnalysisData(data);
        try {
            sessionStorage.setItem('current_active_cert', JSON.stringify(data));
            saveCertificate(data);
            if (!data._testMode) {
                saveConversationResult(data).catch(err => console.warn('Firebase save error:', err));
            }
        } catch (e) {
            console.error('Certificate save error:', e);
        }
        setCurrentPage((prev) => {
            if (prev === 'certificate' || prev === 'viewing_saved_cert' || prev === 'analyzing') {
                return prev;
            }
            return 'analyzing';
        });
    }, []);

    const handleAnalysisComplete = useCallback(() => {
        setCurrentPage('certificate');
    }, []);

    const handleRestart = useCallback(() => {
        try {
            sessionStorage.removeItem('current_active_cert');
        } catch (e) { }
        setAnalysisData(null);
        setSplashKey(k => k + 1);
        setCurrentPage('splash');
    }, []);

    const handleBack = useCallback(() => {
        try {
            sessionStorage.removeItem('current_active_cert');
        } catch (e) { }
        setSplashKey(k => k + 1);
        setCurrentPage('splash');
    }, []);

    const handleViewSaved = useCallback(() => {
        setCurrentPage('saved');
    }, []);

    const handleViewSavedCert = useCallback((certData) => {
        setAnalysisData(certData);
        try {
            sessionStorage.setItem('current_active_cert', JSON.stringify(certData));
        } catch (e) { }
        setCurrentPage('viewing_saved_cert');
    }, []);

    return (
        <div className="app">
            <AnimatePresence mode="wait">
                {currentPage === 'splash' && (
                    <SplashScreen
                        key={`splash-${splashKey}`}
                        onComplete={handleSplashComplete}
                        onViewSaved={handleViewSaved}
                        onStartTest={handleStartTest}
                    />
                )}
                {currentPage === 'conversation' && (
                    <ConversationPage
                        key="conversation"
                        personaId={AUTO_PERSONA_ID}
                        onBack={handleBack}
                        onAnalysisReady={handleAnalysisReady}
                    />
                )}
                {currentPage === 'test' && (
                    <TestPage
                        key="test"
                        onBack={handleBack}
                        onAnalysisReady={handleAnalysisReady}
                    />
                )}
                {currentPage === 'analyzing' && (
                    <AnalysisPage
                        key="analyzing"
                        onComplete={handleAnalysisComplete}
                    />
                )}
                {currentPage === 'certificate' && (
                    <CertificatePage
                        key="certificate"
                        analysisData={analysisData}
                        onRestart={handleRestart}
                    />
                )}
                {currentPage === 'saved' && (
                    <SavedCertificatesPage
                        key="saved"
                        onBack={handleRestart}
                        onViewCert={handleViewSavedCert}
                    />
                )}
                {currentPage === 'viewing_saved_cert' && (
                    <CertificatePage
                        key="viewing_saved_cert"
                        analysisData={analysisData}
                        onRestart={handleRestart}
                        customBackBtn={
                            <button
                                className="cert-action-btn cert-action-restart"
                                onClick={() => setCurrentPage('saved')}
                                style={{ transform: 'scale(1)', transition: 'transform 0.1s' }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                ← Ro'yxatga qaytish
                            </button>
                        }
                        skipAutoSave
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
