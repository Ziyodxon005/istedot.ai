import { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveClient } from '../services/GeminiLiveClient';
import { AudioStreamer } from '../services/AudioStreamer';

export function useGeminiLive() {
    const [isLive, setIsLive] = useState(false);
    const [volume, setVolume] = useState(0);
    const [isVisionEnabled, setIsVisionEnabled] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [personaState, setPersonaState] = useState('idle');
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [turnCount, setTurnCount] = useState(0);

    const clientRef = useRef(null);
    const audioStreamerRef = useRef(new AudioStreamer());
    const videoRef = useRef(null);
    const visionIntervalRef = useRef(null);
    const visionTimeoutRef = useRef(null);
    const isMicMutedRef = useRef(false);
    const isAISpeakingRef = useRef(false);
    const isConnectingRef = useRef(false);
    const greetingSentRef = useRef(false);
    const turnCountRef = useRef(0);
    const isEndingRef = useRef(false); // Track if we are waiting for the final analysis
    const userSpokeRef = useRef(false);  // tracks real Q&A exchanges
    const speakingTimeoutRef = useRef(null);
    const isGreetingRef = useRef(false);
    const currentKeyIndexRef = useRef(0);
    const pendingReconnectRef = useRef(null);
    const textBufferRef = useRef('');
    const onAnalysisReadyRef = useRef(null);

    useEffect(() => {
        let interval;
        if (isLive && !isMicMuted) {
            interval = setInterval(() => {
                const vol = audioStreamerRef.current?.getVolume() ?? 0;
                setVolume(vol);
            }, 50);
        } else {
            setVolume(0);
        }
        return () => clearInterval(interval);
    }, [isLive, isMicMuted]);

    const requestMicPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionError(null);
            return true;
        } catch (error) {
            console.error("Mic permission denied", error);
            setPermissionError('mic');
            return false;
        }
    }, []);

    // Parse analysis JSON from accumulated text
    const tryParseAnalysis = useCallback((text) => {
        const startMarker = '[ANALYSIS_DATA]';
        const endMarker = '[/ANALYSIS_DATA]';
        const startIdx = text.indexOf(startMarker);
        const endIdx = text.indexOf(endMarker);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonStr = text.slice(startIdx + startMarker.length, endIdx).trim();
            try {
                const parsed = JSON.parse(jsonStr);
                console.log('Analysis data parsed successfully!', parsed);
                setAnalysisData(parsed);
                if (onAnalysisReadyRef.current) {
                    onAnalysisReadyRef.current(parsed);
                }
                return true;
            } catch (e) {
                console.error('Failed to parse analysis JSON:', e);
                return false;
            }
        }
        return false;
    }, []);

    const connect = useCallback(async (initialApiKey, systemInstruction, voiceName = 'Aoede', isRetry = false, onAnalysisReady = null) => {
        // Prevent double-connect (React StrictMode or rapid calls)
        if (isConnectingRef.current && !isRetry) {
            console.log('connect() skipped — already connecting');
            return;
        }
        isConnectingRef.current = true;

        if (!isRetry) greetingSentRef.current = false;
        if (onAnalysisReady) onAnalysisReadyRef.current = onAnalysisReady;
        pendingReconnectRef.current = { systemInstruction, voiceName };
        textBufferRef.current = '';

        const ALL_KEYS = [
            import.meta.env.VITE_GEMINI_API_KEY1,
            import.meta.env.VITE_GEMINI_API_KEY2,
            import.meta.env.VITE_GEMINI_API_KEY3,
            import.meta.env.VITE_GEMINI_API_KEY4
        ].filter(Boolean); // Only keep the ones that are defined

        if (isRetry) {
            currentKeyIndexRef.current = (currentKeyIndexRef.current + 1) % ALL_KEYS.length;
        }
        const activeApiKey = ALL_KEYS[currentKeyIndexRef.current];


        try {
            const hasMicPermission = await requestMicPermission();
            if (!hasMicPermission) {
                alert("Mikrofon ruxsati kerak!");
                return;
            }

            audioStreamerRef.current.stop();
            audioStreamerRef.current = new AudioStreamer();

            const client = new GeminiLiveClient(activeApiKey);

            client.onAudioData = (base64Audio) => {
                if (isEndingRef.current) return; // Ignore any incoming audio once the conversation is ending
                audioStreamerRef.current?.playAudioChunk(base64Audio);
                setIsAISpeaking(true);
                setPersonaState(isGreetingRef.current ? 'greeting' : 'speaking');
                isAISpeakingRef.current = true;

                if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = setTimeout(() => {
                    isAISpeakingRef.current = false;
                    setIsAISpeaking(false);
                    setPersonaState('idle');
                    isGreetingRef.current = false;
                }, 1200);
            };

            // Capture text responses or function calls for analysis
            client.onTextData = (text) => {
                try {
                    const data = JSON.parse(text);
                    if (data && data.analysis_from_function) {
                        console.log('Analysis data received via function!', data.analysis_from_function);
                        setAnalysisData(data.analysis_from_function);
                        if (onAnalysisReadyRef.current) {
                            onAnalysisReadyRef.current(data.analysis_from_function);
                        }
                        return;
                    }
                } catch (e) {
                    // Not a function call payload, maybe text
                    textBufferRef.current += text;
                    tryParseAnalysis(textBufferRef.current);
                }
            };

            client.onTurnComplete = () => {
                if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
                isAISpeakingRef.current = false;
                setIsAISpeaking(false);
                setPersonaState('idle');
                isGreetingRef.current = false;
                // Only count as a real exchange if user actually spoke
                if (userSpokeRef.current) {
                    userSpokeRef.current = false;
                    setTurnCount(prev => {
                        const newCount = prev + 1;
                        turnCountRef.current = newCount;
                        return newCount;
                    });
                }
            };

            // Gemini server signals that AI was interrupted by user speech
            client.onInterrupted = () => {
                console.log('⚡ AI interrupted by user — clearing audio queue');
                audioStreamerRef.current?.clearAudioQueue();
                isAISpeakingRef.current = false;
                setIsAISpeaking(false);
                setPersonaState('idle');
                if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                    speakingTimeoutRef.current = null;
                }
            };

            client.onOpen = async () => {
                setIsLive(true);
                try {
                    await audioStreamerRef.current.startRecording((base64Input) => {
                        if (!isMicMutedRef.current) {
                            client.sendAudioChunk(base64Input);
                            // Mark that user is actively speaking (real Q&A)
                            if (!isAISpeakingRef.current) {
                                userSpokeRef.current = true;
                            }
                        }
                    });

                    if (!greetingSentRef.current) {
                        greetingSentRef.current = true;
                        isGreetingRef.current = true;
                        // Small delay to ensure setup message is processed first
                        setTimeout(() => {
                            client.sendTextMessage("Boshlang");
                        }, 300);
                    } else {
                        // Reconnection scenario
                        setTimeout(() => {
                            if (isEndingRef.current) {
                                // We were just waiting for the analysis JSON when the connection dropped!
                                const msg = "TIZIM BUYRUG'I: Suhbat yakunlangan edi, ammo tarmoq uzilishi sababli sizning oxirgi xulosangiz yetib kelmadi. ZUDLIK BILAN, hech qanday ovozli gaplarsiz, 'submit_analysis' funksiyasini chaqiring yoka barcha JSON ma'lumotlarni [ANALYSIS_DATA] va [/ANALYSIS_DATA] teglari orasida matn sifatida yuboring. Gapirmang!";
                                client.sendTextMessage(msg);
                            } else {
                                const turns = turnCountRef.current;
                                let msg = "Texnik sabablarga ko'ra aloqa uzilib qoldi. Biz kasb tanlash bo'yicha suhbatlashayotgan edik.";
                                if (turns >= 5) {
                                    msg += ` Diqqat: Biz hozirgacha suhbatda ${turns} ta savol-javob qildik. Suhbat deyarli yakuniga yetgan. ZINXOR boshidan boshlamang! To'g'ridan-to'g'ri foydalanuvchiga 'Aloqa uzilib qoldi, uzr. Xo'sh, oxirgi gaplashgan mavzumizdan kelib chiqib, sizga oxirgi savolimni bersam...' deb yakunlovchi maxsus savolingizni bering va tezroq [ANALYSIS_DATA] orqali tahlilni yakunlashga harakat qiling.`;
                                } else {
                                    msg += ` Iltimos, suhbatni qolgan joyidan davom ettiring va foydalanuvchiga 'Aloqa biroz uzilib qoldi, uzr. Xo'sh, oxirgi marta nima haqida gaplashayotgan edik?' deb murojaat qiling. Boshidan salomlashmang.`;
                                }
                                client.sendTextMessage(msg);
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error("Mic recording error", error);
                    setPermissionError('mic');
                    alert("Mikrofon ishlamayapti!");
                }
            };

            client.onClose = (event) => {
                console.log('WebSocket closed:', event?.code, event?.reason);
                setIsLive(false);
                audioStreamerRef.current?.stop();
                stopVision();

                // If intentionally ending (disconnect() called manually) OR we are waiting for analysis, do NOT reconnect
                if (!pendingReconnectRef.current || isEndingRef.current) {
                    console.log('Intentional disconnect or waiting for analysis — no reconnect.');
                    return;
                }

                const code = event?.code;
                const reason = (event?.reason || '').toLowerCase();

                const isRateLimit = code === 1008 ||
                    reason.includes('rate') || reason.includes('limit') ||
                    reason.includes('quota') || reason.includes('resource_exhausted');

                // 1011 = Gemini deadline/timeout
                const isTimeout = code === 1011 ||
                    reason.includes('deadline') || reason.includes('expired');

                // 1000 = normal close (intentional), 1001 = going away (page nav)
                const isIntentional = code === 1000 || code === 1001;

                if (isRateLimit) {
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    console.log(`Rate limit hit on key index ${currentKeyIndexRef.current} — switching to next API key`);
                    setTimeout(() => connect(null, systemInstruction, voiceName, true), 1000);
                } else if (!isIntentional) {
                    // Covers: 1011 timeout, 1006 abnormal close, network errors, any unexpected close
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    if (isTimeout) {
                        console.log('Session timeout (1011) — auto-reconnecting silently...');
                    } else {
                        console.log(`Unexpected close (code ${code}) — auto-reconnecting...`);
                    }
                    greetingSentRef.current = true; // Continue, don't restart greeting
                    isConnectingRef.current = false;
                    setTimeout(() => connect(null, systemInstruction, voiceName, false), 1500);
                }
            };

            client.connect(systemInstruction, voiceName);
            clientRef.current = client;
            isConnectingRef.current = false;

        } catch (error) {
            console.error("Connection failed", error);
            setIsLive(false);
            isConnectingRef.current = false;
        }
    }, [isMicMuted, tryParseAnalysis]);

    const stopVision = useCallback(() => {
        setIsVisionEnabled(false);
        if (visionIntervalRef.current) { clearInterval(visionIntervalRef.current); visionIntervalRef.current = null; }
        if (visionTimeoutRef.current) { clearTimeout(visionTimeoutRef.current); visionTimeoutRef.current = null; }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        // Signal onClose NOT to reconnect by clearing pendingReconnect FIRST
        pendingReconnectRef.current = null;

        audioStreamerRef.current?.stop();
        stopVision();

        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
        }

        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }

        setIsLive(false);
        setIsMicMuted(false);
        isMicMutedRef.current = false;
        setPersonaState('idle');
        setIsAISpeaking(false);
        isGreetingRef.current = false;
        isConnectingRef.current = false;
    }, [stopVision]);

    const toggleMic = useCallback(() => {
        if (!isMicMutedRef.current) {
            isMicMutedRef.current = true;
            setIsMicMuted(true);
            audioStreamerRef.current?.pauseRecording();
        } else {
            isMicMutedRef.current = false;
            setIsMicMuted(false);
            audioStreamerRef.current?.resumeRecording();
        }
    }, []);

    const startVision = useCallback(async () => {
        if (!videoRef.current || !clientRef.current || !isLive) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            setIsVisionEnabled(true);
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            visionIntervalRef.current = setInterval(() => {
                const video = videoRef.current;
                if (!video?.videoWidth) return;
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, 480 / video.videoWidth);
                canvas.width = video.videoWidth * scale;
                canvas.height = video.videoHeight * scale;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                clientRef.current?.sendVideoFrame(base64);
            }, 1500);

            visionTimeoutRef.current = setTimeout(() => stopVision(), 10000);
        } catch (err) {
            console.error("Camera error", err);
            setPermissionError('camera');
        }
    }, [isLive, stopVision]);

    const toggleVision = useCallback(() => {
        isVisionEnabled ? stopVision() : startVision();
    }, [isVisionEnabled, startVision, stopVision]);

    const sendText = useCallback((text) => {
        if (clientRef.current) {
            clientRef.current.sendTextMessage(text);
        }
    }, []);

    // Immediately stop all AI audio playback (for finish button)
    const stopAudio = useCallback(() => {
        audioStreamerRef.current?.clearAudioQueue();
        isAISpeakingRef.current = false;
        setIsAISpeaking(false);
        setPersonaState('idle');
        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
        }
    }, []);

    return {
        isLive, volume, connect, disconnect, sendText, stopAudio,
        videoRef, isVisionEnabled, toggleVision,
        isMicMuted, toggleMic,
        permissionError, personaState, isAISpeaking,
        analysisData, turnCount,
        setEndingState: (state) => { isEndingRef.current = state; }
    };
}
