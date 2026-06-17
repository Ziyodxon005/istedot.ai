export class GeminiLiveClient {
    constructor(apiKey, model = "models/gemini-2.5-flash-native-audio-preview-12-2025") {
        this.apiKey = apiKey;
        this.model = model;
        this.ws = null;
        this.onAudioData = null;
        this.onTextData = null;
        this.onOpen = null;
        this.onClose = null;
        this.onError = null;
        this.onTurnComplete = null;
        this.onInterrupted = null;
    }

    connect(systemInstruction, voiceName = 'Aoede') {
        this.voiceName = voiceName;
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("Connected to Gemini Live");
            this.sendSetup(systemInstruction);
            if (this.onOpen) this.onOpen();
        };

        this.ws.onmessage = async (event) => {
            let data = event.data;
            if (data instanceof Blob) {
                data = await data.text();
            }
            try {
                const response = JSON.parse(data);
                this.handleMessage(response);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket Error", error);
            if (this.onError) this.onError(error);
        };

        this.ws.onclose = (event) => {
            console.log("Disconnected", event.code, event.reason);
            if (this.onClose) this.onClose(event);
        };
    }

    sendSetup(systemInstruction) {
        const setupMessage = {
            setup: {
                model: this.model,
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: this.voiceName
                            }
                        }
                    }
                },
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: "submit_analysis",
                                description: "MUHIM: Suhbat TUGAGANDAN SO'NG FAQAT bir marta chaqiriladi. Bu funksiyaga foydalanuvchi bilan bo'lgan suhbat davomida u o'zi aytgan barcha ma'lumotlarga (uning hobbylari, orzu-intilishlari, yoqtiradigan fanlari, qilgan faoliyatlari, xarakteri) 100% asoslanib to'ldirasan. Umumiy, qolipli gaplar ishlatma. Aynan shu odam uchun, aynan shu suhbat asosida aniq va shaxsiy yozasan.",
                                parameters: {
                                    type: "OBJECT",
                                    required: ["summary", "interests", "character", "hollandCode", "gardnerIntelligences", "recommendedCareers", "stepsToAchieve", "universityDirections"],
                                    properties: {
                                        summary: {
                                            type: "STRING",
                                            description: "4-5 jumlali SHAXSIY psixologik xulosa. Suhbatda foydalanuvchi o'zi aytgan aniq voqealarni, his-tuyg'ularni va maqsadlarni eslatib o'tib, uning kuchli tomonlarini va kelajak imkoniyatlarini yozing. Masalan: 'Siz bilan suhbatda siz texnologiyaga qiziqishingizni va insonlarga yordam berishdan quvonchingizni aytdingiz. Bu ikki xislat sizni...' kabi boshlang. QOLIPLI IBORALARDAN (Sizning kuchli analitik fikr va ijodiy potentsialingiz) foydalanmang!"
                                        },
                                        interests: {
                                            type: "ARRAY",
                                            items: { type: "STRING" },
                                            description: "Foydalanuvchi SUHBATDA O'ZI AYTGAN qiziqishlar ro'yxati. Masalan: ['Rasm chizish', 'Dasturlash', 'Futbol']. Taxmin qilmang, faqat suhbatda aytilganlarni yozing."
                                        },
                                        character: {
                                            type: "OBJECT",
                                            description: "Suhbatda namoyon bo'lgan xarakter xususiyatlari",
                                            properties: {
                                                workStyle: {
                                                    type: "STRING",
                                                    description: "Foydalanuvchining ish uslubi: suhbatda u jamoa bilan ishlashni yoqtiradimi yoki yolg'iz? Ijodiy ish qiladimi yoki aniq qoidalarga amal qiladimi? Suhbatdan keltirib chiqaring."
                                                },
                                                mainTraits: {
                                                    type: "ARRAY",
                                                    items: { type: "STRING" },
                                                    description: "Suhbatdan ko'ringan asosiy 3-5 ta xarakter xususiyati. Masalan: ['Ijodkor', 'Empatik', 'Tahlilchi']. Faqat suhbatda ko'ringan xislatlar!"
                                                },
                                                motivation: {
                                                    type: "STRING",
                                                    description: "Foydalanuvchini nima harakatga keltiradi? Suhbatda u nima haqida gapirganda ko'proq jonlandi va hayajonlandi? O'sha narsani yozing."
                                                }
                                            }
                                        },
                                        hollandCode: {
                                            type: "OBJECT",
                                            description: "Holland RIASEC modeli asosida kod",
                                            properties: {
                                                primary: {
                                                    type: "STRING",
                                                    description: "Asosiy Holland kodi harfi: R (Realistik), I (Intellektual), A (Artistik), S (Ijtimoiy), E (Tadbirkorlik) yoki C (Konvensional)"
                                                },
                                                secondary: {
                                                    type: "STRING",
                                                    description: "Ikkinchi Holland kodi harfi"
                                                },
                                                description: {
                                                    type: "STRING",
                                                    description: "Bu Holland kodlari nima uchun aynan shu foydalanuvchiga to'g'ri kelishini suhbatdan olingan aniq misollar bilan tushuntiruvchi 1-2 jumla."
                                                },
                                                scores: {
                                                    type: "STRING",
                                                    description: "R, I, A, S, E, C ballari, masalan: 'R:45, I:80, A:60, S:55, E:40, C:30'"
                                                }
                                            }
                                        },
                                        gardnerIntelligences: {
                                            type: "ARRAY",
                                            description: "Gardner'ning 8 ta intellekt turidan foydalanuvchiga xos bo'lganlari, suhbatdagi javoblarga asoslanib.",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    type: {
                                                        type: "STRING",
                                                        description: "Intellekt turi: Mantiqiy-matematik, Lingvistik, Vizual-fazoviy, Kinestetik, Musiqiy, Intrapersonal, Interpersonal, Naturalistik"
                                                    },
                                                    level: {
                                                        type: "STRING",
                                                        description: "Daraja: yuqori, o'rta, quyi"
                                                    }
                                                }
                                            }
                                        },
                                        recommendedCareers: {
                                            type: "ARRAY",
                                            description: "3-5 ta tavsiya qilingan kasb. Har bir kasb faqat suhbatdagi o'sha kishining javoblariga asoslangan bo'lishi shart.",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    name: { type: "STRING", description: "Kasb nomi o'zbekcha" },
                                                    match: { type: "STRING", description: "Mos kelish darajasi: 'Juda yuqori', 'Yuqori', 'O'rta'" },
                                                    description: {
                                                        type: "STRING",
                                                        description: "Bu kasb NIMA UCHUN aynan shu kishiga mos ekanligini suhbatda u aytgan aniq narsaga bog'lab tushuntiring. Masalan: 'Siz suhbatda odamlarga yordam berishdan quvonch olishingizni aytgandingiz — bu kasb aynan...' kabi."
                                                    }
                                                }
                                            }
                                        },
                                        stepsToAchieve: {
                                            type: "ARRAY",
                                            items: { type: "STRING" },
                                            description: "Kamida 6 ta o'ta aniq va amaliy qadam. 'Yaxshi o'qi' kabi umumiy gaplar QABUL QILINMAYDI. Har bir qadam konkret bo'lsin: 'Matematika bo'yicha haftalik 3 marta olimpiada masalalarini yechish', 'Kodemy.uz yoki Udemy platformasida Python kursi boshlash', 'ToshDU Ochiq eshiklar kuniga borish' kabi."
                                        },
                                        universityDirections: {
                                            type: "ARRAY",
                                            description: "Shu universitetga kirish uchun asosiy fan nomi aniq yoz. Misol uchun TATU (Matematika,Fizika). shu kabi aniq bo'lsin qayta qayta tekshirib yoz har bir universitet va yo'nalish uchun.",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    direction: { type: "STRING", description: "Yo'nalishning to'liq nomi, masalan: 'Kompyuter injiniringi'" },
                                                    code: { type: "STRING", description: "DTM kodi, masalan: 5330200" },
                                                    universities: {
                                                        type: "ARRAY",
                                                        description: "Kamida 3 ta O'zbekiston universiteti",
                                                        items: {
                                                            type: "OBJECT",
                                                            properties: {
                                                                name: { type: "STRING", description: "Universitetning TO'LIQ RASMIY nomi, masalan: Toshkent Axborot Texnologiyalari Universiteti (TATU)" },
                                                                website: { type: "STRING", description: "Sayt manzili, masalan: tuit.uz" },
                                                                phone: { type: "STRING", description: "Telefon raqami (ixtiyoriy)" }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        subjectsAdvice: {
                                            type: "STRING",
                                            description: "Yo'nalish fanlariga (masalan matematika, fizika, tarix, ingliz tili) alohida e'tibor berish kerakligi haqida HAR XIL, O'XSHAMAS, noyob va juda kuchli motivatsion jumla yozing. So'zlar doim o'zgarib tursin (shablon bo'lmasin). O'quvchining o'z oldiga qo'ygan maqsadi va shu fanlar uning kelajak kasbi poydevori ekanligini ta'kidlang. Majburiy shart: matnning biror joyida 💪 emojisi bo'lsin."
                                        }
                                    }
                                }
                            }

                        ]
                    }
                ],
                realtime_input_config: {
                    automatic_activity_detection: {
                        disabled: false,
                        start_of_speech_sensitivity: "START_SENSITIVITY_HIGH",
                        end_of_speech_sensitivity: "END_SENSITIVITY_HIGH",
                        prefix_padding_ms: 10,
                        silence_duration_ms: 300
                    }
                }
            }
        };
        this.ws.send(JSON.stringify(setupMessage));
    }

    sendAudioChunk(base64Audio) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                realtime_input: {
                    media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: base64Audio }]
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendVideoFrame(base64Image) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                realtime_input: {
                    media_chunks: [{ mime_type: "image/jpeg", data: base64Image }]
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendTextMessage(text) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                client_content: {
                    turns: [{ role: "user", parts: [{ text: text }] }],
                    turn_complete: true
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendFunctionResponse(name, response) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                client_content: {
                    turns: [{
                        role: "user",
                        parts: [{
                            functionResponse: {
                                name: name,
                                response: response
                            }
                        }]
                    }],
                    turn_complete: true
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    handleMessage(response) {
        // AI interrupted (user spoke over it)
        if (response.serverContent?.interrupted) {
            console.log('AI interrupted by user');
            if (this.onInterrupted) this.onInterrupted();
            return;
        }

        if (response.serverContent && response.serverContent.modelTurn) {
            const parts = response.serverContent.modelTurn.parts;
            for (const part of parts) {
                // Audio parts
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                    if (this.onAudioData) this.onAudioData(part.inlineData.data);
                }
                // Text parts (just in case)
                if (part.text) {
                    // if (this.onTextData) this.onTextData(part.text);
                }
                // Function calls
                if (part.functionCall && part.functionCall.name === "submit_analysis") {
                    console.log("Analysis function called!", part.functionCall.args);
                    this.sendFunctionResponse("submit_analysis", { status: "OK", message: "Analysis received" });

                    // Pass the arguments as JSON string so the hook can parse it
                    if (this.onTextData) {
                        this.onTextData(JSON.stringify({ analysis_from_function: part.functionCall.args }));
                    }
                }
            }
        }
        if (response.serverContent && response.serverContent.turnComplete) {
            if (this.onTurnComplete) this.onTurnComplete();
        }

        // Gemini Live API can also send function calls via top-level toolCall field
        if (response.toolCall) {
            const calls = response.toolCall.functionCalls || [];
            for (const call of calls) {
                console.log('toolCall received:', call.name, call.args);
                if (call.name === 'submit_analysis') {
                    // Acknowledge the tool call
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        const toolResponse = {
                            clientContent: {
                                turns: [{
                                    role: "user",
                                    parts: [{
                                        functionResponse: {
                                            id: call.id,
                                            name: call.name,
                                            response: { status: "OK" }
                                        }
                                    }]
                                }],
                                turnComplete: true
                            }
                        };
                        this.ws.send(JSON.stringify(toolResponse));
                    }
                    // Dispatch analysis data
                    if (this.onTextData) {
                        this.onTextData(JSON.stringify({ analysis_from_function: call.args }));
                    }
                }
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
