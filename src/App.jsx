import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import ConversationPage from './components/ConversationPage';
import AnalysisPage from './components/AnalysisPage';
import CertificatePage from './components/CertificatePage';
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

    return (
        <div className="app">
            <AnimatePresence mode="wait">
                {currentPage === 'splash' && (
                    <SplashScreen
                        key="splash"
                        onComplete={handleSplashComplete}
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
            </AnimatePresence>
        </div>
    );
}

export default App;
