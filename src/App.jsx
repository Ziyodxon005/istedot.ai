import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import ConversationPage from './components/ConversationPage';
import AnalysisPage from './components/AnalysisPage';
import CertificatePage from './components/CertificatePage';
import SavedCertificatesPage from './components/SavedCertificatesPage';
import { saveCertificate } from './utils/certificateStore';
import './App.css';

const AUTO_PERSONA_ID = 'general';

function App() {
    // Sahifa yangilanganda (refresh) oxirgi sertifikatni yo'qotmaslik uchun sessionStorage'dan tiklaymiz
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

    const handleAnalysisReady = useCallback((data) => {
        if (!data) return;
        setAnalysisData(data);
        // Zudlik bilan saqlash - foydalanuvchi sahifani yangilasa ham sertifikat yo'qolmaydi!
        try {
            sessionStorage.setItem('current_active_cert', JSON.stringify(data));
            saveCertificate(data);
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
        setCurrentPage('splash');
    }, []);

    const handleBack = useCallback(() => {
        try {
            sessionStorage.removeItem('current_active_cert');
        } catch (e) { }
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
                        key="splash"
                        onComplete={handleSplashComplete}
                        onViewSaved={handleViewSaved}
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
