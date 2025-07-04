// Load protobuf.js library dynamically
function loadProtobufJS() {
    return new Promise((resolve, reject) => {
        if (window.protobuf) {
            resolve(window.protobuf);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/protobufjs@7.2.4/dist/light/protobuf.min.js';
        script.onload = () => resolve(window.protobuf);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Embedded pipecat schema (instead of loading from separate file)
const PIPECAT_SCHEMA = {
    "options": {
        "syntax": "proto3"
    },
    "nested": {
        "pipecat": {
            "nested": {
                "TextFrame": {
                    "fields": {
                        "id": {
                            "type": "uint64",
                            "id": 1
                        },
                        "name": {
                            "type": "string",
                            "id": 2
                        },
                        "text": {
                            "type": "string",
                            "id": 3
                        }
                    }
                },
                "AudioRawFrame": {
                    "fields": {
                        "id": {
                            "type": "uint64",
                            "id": 1
                        },
                        "name": {
                            "type": "string",
                            "id": 2
                        },
                        "audio": {
                            "type": "bytes",
                            "id": 3
                        },
                        "sampleRate": {
                            "type": "uint32",
                            "id": 4
                        },
                        "numChannels": {
                            "type": "uint32",
                            "id": 5
                        }
                    }
                },
                "TranscriptionFrame": {
                    "fields": {
                        "id": {
                            "type": "uint64",
                            "id": 1
                        },
                        "name": {
                            "type": "string",
                            "id": 2
                        },
                        "text": {
                            "type": "string",
                            "id": 3
                        },
                        "userId": {
                            "type": "string",
                            "id": 4
                        },
                        "timestamp": {
                            "type": "string",
                            "id": 5
                        }
                    }
                },
                "Frame": {
                    "oneofs": {
                        "frame": {
                            "oneof": [
                                "text",
                                "audio",
                                "transcription"
                            ]
                        }
                    },
                    "fields": {
                        "text": {
                            "type": "TextFrame",
                            "id": 1
                        },
                        "audio": {
                            "type": "AudioRawFrame",
                            "id": 2
                        },
                        "transcription": {
                            "type": "TranscriptionFrame",
                            "id": 3
                        }
                    }
                }
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const widgetContainer = document.getElementById('ema-chat-widget-container');
    const chatIcon = document.getElementById('ema-chat-icon');
    const chatWindow = document.getElementById('ema-chat-window');
    const closeBtn = document.getElementById('ema-close-btn');
    const startBtn = document.getElementById('ema-start-btn');
    const statusText = document.getElementById('ema-status-text');

    let websocket = null;
    let isConnected = false;

    // --- Audio Processing State ---
    let audioContext = null;
    let scriptProcessor = null;
    let mediaStream = null;
    let mediaStreamSource = null;
    let isCapturingAudio = false;

    // --- Protobuf Schema State ---
    let protobuf = null;
    let frameType = null;
    let audioRawFrameType = null;
    async function initializeProtobufSchema() {
        try {
            statusText.innerText = 'Loading protobuf...';
            protobuf = await loadProtobufJS();

            const root = protobuf.Root.fromJSON(PIPECAT_SCHEMA);
            audioRawFrameType = root.lookupType('pipecat.AudioRawFrame');
            frameType = root.lookupType('pipecat.Frame');

            console.log('Protobuf schema initialized successfully');
            statusText.innerText = 'Ready. Click start to talk.';
        } catch (error) {
            console.error('Failed to initialize protobuf schema:', error);
            statusText.innerText = 'Failed to load protobuf schema.';
        }
    }

    // UI Toggling
    chatIcon.addEventListener('click', () => {
        chatWindow.style.display = 'flex';
        chatIcon.style.display = 'none';
    });

    closeBtn.addEventListener('click', async () => {
        chatWindow.style.display = 'none';
        chatIcon.style.display = 'block';
        if (websocket) {
            await stopAudioCapture();
            websocket.close();
        }
    });

    startBtn.addEventListener('click', async () => {
        if (isConnected) {
            if (websocket) {
                await stopAudioCapture();
                websocket.close();
            }
        } else {
            console.log('Connecting...');
            console.log(widgetContainer.dataset.apiUrl);
            connect();
        }
    });

    function connect() {
        const apiUrl = widgetContainer.dataset.apiUrl;
        const emaIdentifier = "shopify_assistant";
        const version = "v1";
        const language = "en";

        const url = new URL(apiUrl);
        url.searchParams.append('emaIdentifier', emaIdentifier);
        url.searchParams.append('version', version);
        url.searchParams.append('language', language);

        statusText.innerText = 'Connecting...';
        websocket = new WebSocket(url.toString());

        websocket.onopen = async () => {
            console.log('WebSocket connected');
            isConnected = true;
            startBtn.innerText = 'Stop';
            statusText.innerText = 'Connected. Speak now!';

            // Initialize protobuf schema
            await initializeProtobufSchema();

            // Start streaming microphone audio
            await startAudioCapture();
        };

        websocket.onmessage = (event) => {
            // This part remains mostly the same, but you might want to handle audio responses from the server
            try {
                const message = JSON.parse(event.data);
                console.log('Received message:', message);
                switch (message.type) {
                    case 'bot-transcription':
                        statusText.innerText = `Bot: ${message.data.text}`;
                        break;
                    case 'bot-started-speaking':
                        statusText.innerText = 'Assistant is speaking...';
                        break;
                    case 'bot-stopped-speaking':
                        statusText.innerText = 'Connected. Speak now!';
                        break;
                    case 'error':
                        statusText.innerText = `Error: ${message.data.message}`;
                        break;
                }
            } catch (error) {
                console.log('Received non-JSON message, probably audio.');
                // Here you would handle incoming audio from the bot to play it
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            statusText.innerText = 'Connection error.';
            stopAudioCapture();
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            isConnected = false;
            websocket = null;
            startBtn.innerText = 'Start';
            statusText.innerText = 'Disconnected. Click start to talk.';
            // Audio capture is now stopped before websocket.close() is called,
            // so we don't need to call it here.
        };
    }

    // --- Audio Capture Functions (updated to match MainServerProvider) ---

    function convertFloat32ToS16PCM(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    async function startAudioCapture() {
        if (isCapturingAudio) {
            await stopAudioCapture();
        }
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioCtx({ sampleRate: 16000 });

            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
            scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);

            scriptProcessor.onaudioprocess = (event) => {
                if (!websocket || websocket.readyState !== WebSocket.OPEN || !isCapturingAudio) {
                    return;
                }
                try {
                    const pcmS16 = convertFloat32ToS16PCM(event.inputBuffer.getChannelData(0));

                    // Create protobuf frame like MainServerProvider
                    if (frameType) {
                        const frame = frameType.create({
                            audio: {
                                audio: Array.from(new Uint8Array(pcmS16.buffer)),
                                sampleRate: audioContext?.sampleRate || 16000,
                                numChannels: 1
                            }
                        });

                        if (frame && frameType) {
                            const encodedFrame = frameType.encode(frame).finish();
                            websocket.send(new Uint8Array(encodedFrame));
                        }
                    } else {
                        // Fallback to raw PCM if protobuf not available
                        websocket.send(pcmS16.buffer);
                    }
                } catch (e) {
                    console.error('Error processing audio frame:', e);
                }
            };

            mediaStreamSource.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            isCapturingAudio = true;
            return true;
        } catch (e) {
            console.error('Failed to start audio capture:', e);
            statusText.innerText = "Could not access microphone.";
            await stopAudioCapture();
            return false;
        }
    }

    async function stopAudioCapture() {
        isCapturingAudio = false;

        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor.onaudioprocess = null;
            scriptProcessor = null;
        }
        if (mediaStreamSource) {
            mediaStreamSource.disconnect();
            mediaStreamSource = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (audioContext && audioContext.state !== 'closed') {
            await audioContext.close();
            audioContext = null;
        }
        return true;
    }
}); 