import { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveClient } from '../services/GeminiLiveClient';
import { AudioStreamer } from '../services/AudioStreamer';
import { generateAnalysisWithGeminiThinking, buildFallbackAnalysis } from '../services/analysisService';

export function useGeminiLive() {
    const [isLive, setIsLive] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [volume, setVolume] = useState(0);
    const [isVisionEnabled, setIsVisionEnabled] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [personaState, setPersonaState] = useState('idle');
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [turnCount, setTurnCount] = useState(0);
    const [isReadyToFinish, setIsReadyToFinish] = useState(false);

    const clientRef = useRef(null);
    const audioStreamerRef = useRef(new AudioStreamer());
    const speechRecRef = useRef(null);
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
    const conversationHistoryRef = useRef([]);
    const fallbackTimerRef = useRef(null);
    const analysisSentRef = useRef(false);

    // Guaranteed single dispatch of analysis data
    const dispatchAnalysis = useCallback((data) => {
        if (!data || analysisSentRef.current) return;
        analysisSentRef.current = true;
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
        console.log('Dispatching final analysis data (once):', data);
        setAnalysisData(data);
        if (onAnalysisReadyRef.current) {
            onAnalysisReadyRef.current(data);
        }
    }, []);

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
                dispatchAnalysis(parsed);
                return true;
            } catch (e) {
                console.error('Failed to parse analysis JSON:', e);
                return false;
            }
        }
        return false;
    }, [dispatchAnalysis]);

    const connect = useCallback(async (initialApiKey, systemInstruction, voiceName = 'Fenrir', isRetry = false, onAnalysisReady = null) => {
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
                        dispatchAnalysis(data.analysis_from_function);
                        return;
                    }
                } catch (e) {
                    // Not a function call payload, maybe text
                    textBufferRef.current += text;
                    tryParseAnalysis(textBufferRef.current);
                }
            };

            // AI signals that it has collected enough answers to finish
            client.onAnalysisReadySignal = (args) => {
                console.log('AI signaled that answers are sufficient!', args);
                setIsReadyToFinish(true);
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
                        if (newCount >= 7) setIsReadyToFinish(true);
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
                userSpokeRef.current = true;
                if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                    speakingTimeoutRef.current = null;
                }
            };

            client.onOpen = async () => {
                setIsLive(true);
                setIsReconnecting(false);

                // Start local SpeechRecognition in background to capture real dialogue text
                const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRec && !speechRecRef.current) {
                    try {
                        const rec = new SpeechRec();
                        rec.continuous = true;
                        rec.interimResults = false;
                        rec.lang = 'uz-UZ';
                        rec.onresult = (e) => {
                            for (let i = e.resultIndex; i < e.results.length; ++i) {
                                if (e.results[i].isFinal) {
                                    const txt = e.results[i][0].transcript?.trim();
                                    if (txt) {
                                        console.log('🎤 Foydalanuvchi nutqi aniqlandi:', txt);
                                        conversationHistoryRef.current.push({ role: 'user', text: txt });
                                    }
                                }
                            }
                        };
                        rec.onerror = (e) => console.log('SpeechRec info:', e.error);
                        rec.onend = () => {
                            if (!isEndingRef.current && speechRecRef.current) {
                                try { rec.start(); } catch (err) { }
                            }
                        };
                        speechRecRef.current = rec;
                        rec.start();
                    } catch (err) {
                        console.log('SpeechRec init note:', err);
                    }
                }

                try {
                    await audioStreamerRef.current.startRecording((base64Input) => {
                        if (!isMicMutedRef.current) {
                            client.sendAudioChunk(base64Input);
                            // Mark that user is actively speaking (real Q&A)
                            if (!isAISpeakingRef.current) {
                                userSpokeRef.current = true;
                                if (conversationHistoryRef.current.length === 0 || conversationHistoryRef.current[conversationHistoryRef.current.length - 1].role !== 'user') {
                                    conversationHistoryRef.current.push({ role: 'user', text: "O'quvchi javob berdi" });
                                }
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
                        // Reconnection scenario - Restore context so conversation NEVER starts over
                        setTimeout(() => {
                            if (isEndingRef.current) {
                                // We were waiting for the analysis JSON when the connection dropped!
                                const msg = "TIZIM BUYRUG'I: Suhbat yakunlangan edi. ZUDLIK BILAN, hech qanday ovozli gaplarsiz, 'submit_analysis' funksiyasini barcha ma'lumotlar bilan chaqiring. Gapirmang!";
                                client.sendTextMessage(msg);
                            } else {
                                const turns = turnCountRef.current;
                                const recentContext = conversationHistoryRef.current.slice(-3).map(c => c.text).join(', ');
                                const msg = `DIQQAT TIZIM: Tarmoq uzilishi sababli qayta ulandingiz. Suhbat BOSHIDAN BOSHLANMASIN! Biz kasbiy yo'nalish bo'yicha suhbatlashayotgan edik va hozirgacha ${turns} ta savol-javob o'tkazdik. Kontekst: ${recentContext || 'kasb tanlash'}. Foydalanuvchiga faqat: "Aloqa tiklandi, davom etamiz" deb, to'xtagan joyimizdan navbatdagi savolingizni bering! Hech qanday salomlashish yoki boshidan boshlash bo'lmasin!`;
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
                    setIsReconnecting(true);
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    console.log(`Rate limit hit on key index ${currentKeyIndexRef.current} — switching to next API key`);
                    setTimeout(() => connect(null, systemInstruction, voiceName, true), 1000);
                } else if (!isIntentional) {
                    // Covers: 1011 timeout, 1006 abnormal close, network errors, any unexpected close
                    setIsReconnecting(true);
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    if (isTimeout) {
                        console.log('Session timeout (1011) — auto-reconnecting silently...');
                    } else {
                        console.log(`Unexpected close (code ${code}) — auto-reconnecting...`);
                    }
                    greetingSentRef.current = true; // Continue, don't restart greeting
                    isConnectingRef.current = false;
                    setTimeout(() => connect(null, systemInstruction, voiceName, false), 1200);
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

        if (speechRecRef.current) {
            try { speechRecRef.current.stop(); } catch (e) { }
            speechRecRef.current = null;
        }

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

    // Immediately stop all AI audio playback
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

    const triggerAnalysis = useCallback(async () => {
        isEndingRef.current = true;
        stopAudio();
        if (!isMicMutedRef.current) {
            isMicMutedRef.current = true;
            setIsMicMuted(true);
            audioStreamerRef.current?.pauseRecording();
        }

        // 1. WebSocket ga buyruq yuboramiz
        const finishPrompt = "TIZIM BUYRUG'I: Suhbat foydalanuvchi tomonidan yakunlandi. Hech qanday ovozli gaplarsiz, 'submit_analysis' funksiyasini barcha ma'lumotlar bilan HOZIROQ chaqiring.";
        if (clientRef.current && isLive) {
            clientRef.current.sendTextMessage(finishPrompt);
        }

        // 2. Qat'iy zaxira taymeri: Gemini Live'ga shoshilmasdan chuqur fikrlash va tahlil tuzish uchun to'liq vaqt (14 soniya) beriladi
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = setTimeout(async () => {
            if (analysisSentRef.current) return;
            console.log("Live tahlil kutish vaqti bo'yicha zaxira: Gemini 3.8 Extended Thinking tahlili generatsiya qilinmoqda...");
            try {
                const generated = await generateAnalysisWithGeminiThinking(conversationHistoryRef.current);
                if (generated) {
                    dispatchAnalysis(generated);
                } else {
                    const fallback = buildFallbackAnalysis(conversationHistoryRef.current.map(m => m.text).join(' '));
                    dispatchAnalysis(fallback);
                }
            } catch (err) {
                console.error("Analysis generation error:", err);
                const fallback = buildFallbackAnalysis(conversationHistoryRef.current.map(m => m.text).join(' '));
                dispatchAnalysis(fallback);
            }
        }, 14000);
    }, [isLive, stopAudio, dispatchAnalysis]);

    return {
        isLive, isReconnecting, volume, connect, disconnect, sendText, stopAudio, triggerAnalysis,
        videoRef, isVisionEnabled, toggleVision,
        isMicMuted, toggleMic,
        permissionError, personaState, isAISpeaking,
        analysisData, turnCount, isReadyToFinish,
        setEndingState: (state) => { isEndingRef.current = state; }
    };
}
