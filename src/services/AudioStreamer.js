export class AudioStreamer {
    constructor() {
        this.audioContext = null;
        this.playbackContext = null;
        this.mediaStream = null;
        this.workletNode = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.inputSampleRate = 16000;
        this.outputSampleRate = 24000;
        this.audioQueue = [];
        this.scheduledTime = 0;
        this.analyser = null;
        this.onVolumeChange = null;
        this.isPaused = false;
        this.onDataCallback = null;
        this.activeSources = []; // Track all active audio sources
        this.lastAudioTime = 0; // Track when last audio was received
    }

    async initialize() {
        // Reuse the AudioContext pre-warmed during user gesture on splash screen
        if (window.__prewarmedAudioContext && window.__prewarmedAudioContext.state !== 'closed') {
            this.audioContext = window.__prewarmedAudioContext;
            window.__prewarmedAudioContext = null; // consume it
            console.log('AudioStreamer.initialize(): Reusing pre-warmed AudioContext, state:', this.audioContext.state);
        } else {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.inputSampleRate,
            });
            console.log('AudioStreamer.initialize(): Created fresh AudioContext');
        }
        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        // Reuse pre-warmed playback context, or create fresh
        if (window.__prewarmedPlaybackContext && window.__prewarmedPlaybackContext.state !== 'closed') {
            this.playbackContext = window.__prewarmedPlaybackContext;
            window.__prewarmedPlaybackContext = null;
            console.log('AudioStreamer.initialize(): Reusing pre-warmed PlaybackContext');
        } else {
            this.playbackContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.outputSampleRate,
            });
        }
        if (this.playbackContext.state === 'suspended') {
            await this.playbackContext.resume();
        }
        console.log('AudioStreamer.initialize(): AudioContext ready, state:', this.audioContext.state);
    }

    async startRecording(onDataAvailable) {
        console.log('AudioStreamer.startRecording(): Starting...');
        if (!this.audioContext) await this.initialize();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        if (this.playbackContext && this.playbackContext.state === 'suspended') await this.playbackContext.resume();

        this.onDataCallback = onDataAvailable;
        this.isPaused = false;

        try {
            console.log('AudioStreamer.startRecording(): Requesting mic...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.inputSampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            console.log('AudioStreamer.startRecording(): Got mediaStream with', this.mediaStream.getTracks().length, 'tracks');

            if (!this.audioContext) {
                this.mediaStream.getTracks().forEach(t => t.stop());
                return;
            }

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Use ScriptProcessor — works everywhere, no blob URL required
            const bufferSize = 2048;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            this.scriptProcessor.onaudioprocess = (event) => {
                if (this.isPaused || !this.onDataCallback) return;
                const float32Array = event.inputBuffer.getChannelData(0);
                const int16Array = this.convertFloat32ToInt16(float32Array);
                this.onDataCallback(
                    btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer)))
                );
            };

            source.connect(this.scriptProcessor);
            source.connect(this.analyser);

            // Connect to a SILENT gain node — keeps the audio graph alive
            // but prevents mic audio from reaching the speakers (no echo)
            this.silentGain = this.audioContext.createGain();
            this.silentGain.gain.value = 0;
            this.scriptProcessor.connect(this.silentGain);
            this.silentGain.connect(this.audioContext.destination);

            console.log('AudioStreamer.startRecording(): Recording started successfully');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    pauseRecording() {
        console.log('AudioStreamer: PAUSING microphone (disabling tracks)');
        this.isPaused = true;

        // Just disable tracks, don't stop them
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                console.log('AudioStreamer: Disabling track', track.label);
                track.enabled = false;
            });
        }

        console.log('AudioStreamer: Microphone PAUSED');
    }

    resumeRecording() {
        console.log('AudioStreamer: RESUMING microphone (enabling tracks)');
        this.isPaused = false;

        // Just enable tracks
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                console.log('AudioStreamer: Enabling track', track.label);
                track.enabled = true;
            });
        }

        console.log('AudioStreamer: Microphone RESUMED');
    }

    // Clear all queued and playing audio (for interruption)
    clearAudioQueue() {
        console.log('AudioStreamer: Clearing audio queue');
        // Stop all active sources
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source may have already ended
            }
        });
        this.activeSources = [];
        this.audioQueue = [];
        this.scheduledTime = this.playbackContext ? this.playbackContext.currentTime : 0;
    }

    playAudioChunk(base64Audio) {
        const ctx = this.playbackContext || this.audioContext;
        if (!ctx) return;

        const currentTime = Date.now();
        this.lastAudioTime = currentTime;

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768; // Convert Int16 to Float32
        }

        const buffer = ctx.createBuffer(1, float32Array.length, this.outputSampleRate);
        buffer.copyToChannel(float32Array, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Track this source
        this.activeSources.push(source);
        source.onended = () => {
            const idx = this.activeSources.indexOf(source);
            if (idx > -1) this.activeSources.splice(idx, 1);
        };

        // Play through separate output context — completely isolated from mic
        source.connect(ctx.destination);

        // Simple scheduling to play sequentially
        const audioCurrentTime = ctx.currentTime;
        if (this.scheduledTime < audioCurrentTime) {
            this.scheduledTime = audioCurrentTime;
        }

        source.start(this.scheduledTime);
        this.scheduledTime += buffer.duration;
    }

    stop() {
        console.log('AudioStreamer.stop(): Stopping all audio...');

        // Stop all microphone tracks
        if (this.mediaStream) {
            const tracks = this.mediaStream.getTracks();
            console.log('AudioStreamer.stop(): Stopping', tracks.length, 'tracks');
            tracks.forEach((track) => {
                console.log('AudioStreamer.stop(): Stopping track:', track.label, track.readyState);
                track.stop();
            });
            this.mediaStream = null;
        }

        // Disconnect script processor
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null;
            this.scriptProcessor = null;
        }

        // Clean up silent gain node
        if (this.silentGain) {
            this.silentGain.disconnect();
            this.silentGain = null;
        }

        // Also clean up legacy worklet node if any
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }


        // Close input audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Close output/playback audio context
        if (this.playbackContext) {
            this.playbackContext.close();
            this.playbackContext = null;
        }


        // Clear active sources
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        this.activeSources = [];

        this.isPaused = false;
        this.onDataCallback = null;
        console.log('AudioStreamer.stop(): All audio stopped');
    }

    convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    getVolume() {
        if (!this.analyser || this.isPaused) return 0;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / dataArray.length / 255; // Normalized 0-1
    }
}

