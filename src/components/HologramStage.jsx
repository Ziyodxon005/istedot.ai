import React from 'react';
import { motion } from 'framer-motion';
import SphereVisualizer from './SphereVisualizer';
import AudioVisualizer from './AudioVisualizer';

const HologramStage = ({
    volume,
    isLive,
    isVisionEnabled,
    videoRef,
    personaState = 'idle'
}) => {
    const isSpeaking = personaState === 'speaking' || personaState === 'greeting';

    return (
        <motion.div
            className="hologram-container"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Scanning line in vision mode */}
            {isVisionEnabled && <div className="scanning-line" />}

            {/* Sphere center stage */}
            <div className="sphere-stage">
                <SphereVisualizer
                    volume={volume}
                    isActive={isLive}
                    isSpeaking={isSpeaking}
                    size={280}
                />

                {/* Status ring */}
                <motion.div
                    className={`sphere-status-ring ${isLive ? 'live' : ''} ${isSpeaking ? 'speaking' : ''}`}
                    animate={isLive ? {
                        boxShadow: isSpeaking
                            ? ['0 0 20px rgba(0,200,255,0.3)', '0 0 50px rgba(0,200,255,0.6)', '0 0 20px rgba(0,200,255,0.3)']
                            : ['0 0 15px rgba(0,150,255,0.2)', '0 0 30px rgba(0,150,255,0.4)', '0 0 15px rgba(0,150,255,0.2)']
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>

            {/* Name and status */}
            <div className="persona-name-status">
                <h2 className="sphere-name">ISTEDOD AI</h2>
                <p className={`sphere-status-text ${isLive ? 'live' : ''}`}>
                    {isLive
                        ? (isSpeaking
                            ? '✦ JAVOB BERILMOQDA'
                            : (isVisionEnabled ? '✦ KO\'RISH FAOL' : '✦ ESHITILMOQDA'))
                        : 'ULANMOQDA...'}
                </p>
            </div>

            {/* Audio visualizer */}
            <div className="visualizer-base">
                <AudioVisualizer volume={volume} isActive={isLive} />
            </div>

            {/* Vision video preview */}
            <video
                ref={videoRef}
                className="vision-preview"
                style={{ opacity: isVisionEnabled ? 1 : 0, pointerEvents: isVisionEnabled ? 'auto' : 'none' }}
                muted
            />
        </motion.div>
    );
};

export default HologramStage;
