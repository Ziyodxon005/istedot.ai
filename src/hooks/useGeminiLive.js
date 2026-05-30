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

    const clientRef = useRef(null);
    const audioStreamerRef = useRef(new AudioStreamer());
    const videoRef = useRef(null);
    const visionIntervalRef = useRef(null);
    const visionTimeoutRef = useRef(null);
    const isMicMutedRef = useRef(false);
    const isAISpeakingRef = useRef(false);
    const greetingSentRef = useRef(false);
    const speakingTimeoutRef = useRef(null);
    const isGreetingRef = useRef(false);
    const currentApiKeyRef = useRef(1);
    const pendingReconnectRef = useRef(null);

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

    const connect = useCallback(async (apiKey, systemInstruction, voiceName = 'Kore', isRetry = false) => {
        // Only reset greeting for completely new session (not retries)
        if (!isRetry) greetingSentRef.current = false;
        pendingReconnectRef.current = { systemInstruction, voiceName };

        let activeApiKey = apiKey;
        if (isRetry && currentApiKeyRef.current === 1) {
            const secondKey = import.meta.env.VITE_GEMINI_API_KEY2;
            if (secondKey) {
                currentApiKeyRef.current = 2;
                activeApiKey = secondKey;
            }
        }

        try {
            const hasMicPermission = await requestMicPermission();
            if (!hasMicPermission) {
                alert("Mikrofon ruxsati kerak!");
                return;
            }

            // Fresh AudioStreamer for each new connection
            audioStreamerRef.current.stop();
            audioStreamerRef.current = new AudioStreamer();

            const client = new GeminiLiveClient(activeApiKey);

            client.onAudioData = (base64Audio) => {
                audioStreamerRef.current?.playAudioChunk(base64Audio);
                setIsAISpeaking(true);
                setPersonaState(isGreetingRef.current ? 'greeting' : 'speaking');

                // Block mic while AI is speaking (echo prevention)
                isAISpeakingRef.current = true;

                if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = setTimeout(() => {
                    isAISpeakingRef.current = false;
                    setIsAISpeaking(false);
                    setPersonaState('idle');
                    isGreetingRef.current = false;
                }, 150);
            };

            // When AI finishes turn - immediately unlock mic
            client.onTurnComplete = () => {
                if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
                isAISpeakingRef.current = false;
                setIsAISpeaking(false);
                setPersonaState('idle');
                isGreetingRef.current = false;
            };

            client.onOpen = async () => {
                setIsLive(true);
                try {
                    await audioStreamerRef.current.startRecording((base64Input) => {
                        if (!isMicMutedRef.current && !isAISpeakingRef.current) {
                            client.sendAudioChunk(base64Input);
                        }
                    });

                    if (!greetingSentRef.current) {
                        greetingSentRef.current = true;
                        isGreetingRef.current = true;
                        setTimeout(() => {
                            client.sendTextMessage("Boshlang");
                        }, 500);
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

                const reason = event?.reason?.toLowerCase() || '';
                const isRateLimit = event?.code === 1008 ||
                    reason.includes('rate') || reason.includes('limit') ||
                    reason.includes('quota') || reason.includes('resource_exhausted');

                if (isRateLimit && currentApiKeyRef.current === 1 && pendingReconnectRef.current) {
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    const secondKey = import.meta.env.VITE_GEMINI_API_KEY2;
                    if (secondKey) {
                        setTimeout(() => connect(secondKey, systemInstruction, voiceName, true), 1000);
                    }
                }
            };

            client.connect(systemInstruction, voiceName);
            clientRef.current = client;

        } catch (error) {
            console.error("Connection failed", error);
            setIsLive(false);
        }
    }, [isMicMuted]);

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
            alert("Kamera ruxsati kerak!");
        }
    }, [isLive, stopVision]);

    const toggleVision = useCallback(() => {
        isVisionEnabled ? stopVision() : startVision();
    }, [isVisionEnabled, startVision, stopVision]);

    return {
        isLive, volume, connect, disconnect,
        videoRef, isVisionEnabled, toggleVision,
        isMicMuted, toggleMic,
        permissionError, personaState, isAISpeaking
    };
}
