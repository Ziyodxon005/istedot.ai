import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import ConversationPage from './components/ConversationPage';
import AnalysisPage from './components/AnalysisPage';
import CertificatePage from './components/CertificatePage';
import SavedCertificatesPage from './components/SavedCertificatesPage';
import './App.css';

const AUTO_PERSONA_ID = 'general';

function App() {
    const [currentPage, setCurrentPage] = useState('splash');
    const [analysisData, setAnalysisData] = useState(null);

    const handleSplashComplete = () => {
        setCurrentPage('conversation');
    };

    const handleAnalysisReady = useCallback((data) => {
        setAnalysisData(data);
        setCurrentPage('analyzing');
    }, []);

    const handleAnalysisComplete = () => {
        setCurrentPage('certificate');
    };

    const handleRestart = () => {
        setAnalysisData(null);
        setCurrentPage('splash');
    };

    const handleBack = () => {
        setCurrentPage('splash');
    };

    const handleViewSaved = () => {
        setCurrentPage('saved');
    };

    const handleViewSavedCert = (certData) => {
        setAnalysisData(certData);
        setCurrentPage('viewing_saved_cert');
    };

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
