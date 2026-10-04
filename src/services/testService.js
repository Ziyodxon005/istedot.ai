/**
 * testService.js
 * ISTEDOD AI - Gemini orqali real-time psixologik test savollari yaratish
 * 
 * Har bir savol oldingi javoblarga bog'liq - suhbat formatida
 * 15 ta savol, har birida variantlar + "Yozaman" opsiyasi
 */

const ALL_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY1,
    import.meta.env.VITE_GEMINI_API_KEY2,
    import.meta.env.VITE_GEMINI_API_KEY3,
    import.meta.env.VITE_GEMINI_API_KEY4
].filter(Boolean);

let currentKeyIndex = 0;

function getNextKey() {
    const key = ALL_KEYS[currentKeyIndex % ALL_KEYS.length];
    currentKeyIndex++;
    return key;
}

/**
 * Birinchi savolni yaratish
 */
export async function generateFirstQuestion(userInfo) {
    const prompt = `
Sen ISTEDOD AI professional psixologik kasbiy yo'nalish tizimisan.
O'quvchi haqida ma'lumot:
- Ism: ${userInfo.name}
- Familya: ${userInfo.surname}
- Maktab: ${userInfo.school}

Sen hozir psixologik test o'tkazmoqchisan. Bu test o'quvchining qobiliyatlari, qiziqishlari va KELAJAK YO'NALISHINI aniqlash maqsadida o'tkaziladi.
Bu faqat universitet uchun EMAS! O'quvchi universitetga kirmoqchi bo'lishi mumkin, kasbga moyil bo'lishi mumkin, o'z biznesini boshlamoqchi bo'lishi mumkin, yoki boshqa narsaga qiziqishi mumkin.
Birinchi savolni ber. Savol samimiy, do'stona va qiziqarli bo'lsin. Xuddi do'sti bilan gaplashayotgandek.

MUHIM: Javobni FAQAT quyidagi JSON formatda qaytar, boshqa hech narsa yozma:
{
    "question": "Savol matni",
    "options": ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
    "questionNumber": 1
}

Variantlar 4 ta bo'lsin. Savol psixologik xarakterga ega bo'lsin - masalan qiziqishlar, xarakter xususiyatlari, sevimli mashg'ulotlar haqida.
`;

    return await callGemini(prompt);
}

/**
 * Keyingi savolni oldingi javoblarga asosan yaratish
 */
export async function generateNextQuestion(userInfo, previousQA, questionNumber) {
    const historyText = previousQA.map((qa, i) => 
        `${i + 1}-savol: ${qa.question}\nJavob: ${qa.answer}`
    ).join('\n\n');

    const prompt = `
Sen ISTEDOD AI professional psixologik kasbiy yo'nalish tizimisan.
O'quvchi haqida ma'lumot:
- Ism: ${userInfo.name}
- Familya: ${userInfo.surname}  
- Maktab: ${userInfo.school}

Oldingi savol-javoblar tarixi:
${historyText}

Endi ${questionNumber}-savolni ber. Bu savol ALBATTA oldingi javoblarga bog'liq bo'lishi kerak!
Agar o'quvchi texnologiyaga qiziqsa, texnologiya bilan bog'liq chuqurroq savol ber.
Agar san'atga qiziqsa, ijodiy savol ber.
Agar o'quvchi universitetga kirmoqchi bo'lsa, shunga mos savol ber.
Agar kasbga moyil bo'lsa yoki o'z biznesini boshlmoqchi bo'lsa, shunga mos savol ber.
Har bir savol xuddi do'stona suhbatdek tabiiy bo'lsin.

Jami 10 ta savol bo'ladi. Hozir ${questionNumber}/10 - savol.
${questionNumber <= 3 ? "Boshlanish: Umumiy qiziqishlar, xarakter va kelajak rejalari haqida so'ra. Universitetga kirmoqchimi, kasbga moyilmi, biznes qilmoqchimi — shu haqida ham so'ra." : ""}
${questionNumber > 3 && questionNumber <= 7 ? "O'rta qism: Aniqroq kasb, soha, yo'nalish qiziqishlari haqida chuqurroq so'ra. O'quvchining universitetga yoki kasbga yoki boshqa yo'nalishga moyilligini hisobga ol." : ""}
${questionNumber > 7 ? "Yakuniy qism: Kelajak rejalar, orzu-maqsadlar va aniq yo'nalish haqida so'ra. Tanlagan yo'liga mos maslahatlar berish uchun chuqurroq tushun." : ""}

MUHIM: Javobni FAQAT quyidagi JSON formatda qaytar, boshqa hech narsa yozma:
{
    "question": "Savol matni",
    "options": ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
    "questionNumber": ${questionNumber}
}

Variantlar 4 ta bo'lsin. Savol samimiy va do'stona bo'lsin.
`;

    return await callGemini(prompt);
}

/**
 * Test natijalarini tahlil qilish va sertifikat uchun ma'lumot yaratish
 */
export async function analyzeTestResults(userInfo, allQA) {
    const historyText = allQA.map((qa, i) => 
        `${i + 1}-savol: ${qa.question}\nJavob: ${qa.answer}`
    ).join('\n\n');

    const prompt = `
Sen ISTEDOD AI professional psixologik va kasbiy diagnostika tizimisan.
DIQQAT: Ushbu tahlil o'quvchining KELAJAK TAQDIRINI belgilaydi!

O'quvchi haqida:
- Ism: ${userInfo.name}
- Familya: ${userInfo.surname}
- Maktab: ${userInfo.school}

10 ta psixologik test savol-javoblari:
${historyText}

Yuqoridagi 10 ta javobdan kelib chiqib, CHUQUR tahlil qil.

MUHIM: Bu tahlil FAQAT universitet uchun EMAS!
- Agar o'quvchi universitetga kirmoqchi bo'lsa — universitet yo'nalishlari va imtihon fanlari tavsiya qil.
- Agar o'quvchi kasbga moyil bo'lsa (masalan: dasturchi, dizayner, haydovchi, oshpaz, hunarmand) — kasbga mos kurslar, ta'lim muassasalari va amaliy maslahatlar ber.
- Agar o'quvchi biznes qilmoqchi bo'lsa — biznes yo'nalishi, kerakli ko'nikmalar va maslahatlar ber.
- Agar boshqa narsaga qiziqsa — shunga mos maslahatlar ber.

Quyidagi JSON formatda natija ber:

{
    "summary": "3-4 jumlali chuqur, shaxsiy xulosa. O'quvchining xarakteri, kuchli jihatlari, qiziqishlari va TANLAGAN YO'NALISHI haqida.",
    "interests": ["Qiziqish 1", "Qiziqish 2", "Qiziqish 3"],
    "character": {
        "workStyle": "Ish uslubi tavsifi",
        "motivation": "Asosiy motivatsiya",
        "mainTraits": ["Xususiyat 1", "Xususiyat 2", "Xususiyat 3"]
    },
    "recommendedCareers": [
        { "name": "Kasb/Yo'nalish nomi", "match": "96%", "description": "Nima uchun mos" },
        { "name": "Kasb/Yo'nalish nomi", "match": "92%", "description": "Nima uchun mos" },
        { "name": "Kasb/Yo'nalish nomi", "match": "88%", "description": "Nima uchun mos" }
    ],
    "universityDirections": [
        {
            "direction": "Yo'nalish nomi (agar universitetga moyil bo'lsa)",
            "universities": [
                { "name": "Universitet/Kurs/Ta'lim markazi nomi", "website": "sayt.uz" },
                { "name": "Universitet/Kurs/Ta'lim markazi nomi", "website": "sayt.uz" },
                { "name": "Universitet/Kurs/Ta'lim markazi nomi", "website": "sayt.uz" }
            ]
        }
    ],
    "examSubjects": {
        "mandatory": ["Asosiy fan 1", "Asosiy fan 2", "Asosiy fan 3"],
        "main": ["Muhim fan/ko'nikma 1", "Muhim fan/ko'nikma 2"]
    },
    "subjectsAdvice": "O'quvchining tanlagan yo'nalishiga mos maslahat — universitet bo'lsa imtihonga tayyorgarlik, kasb bo'lsa kurs va tajriba, biznes bo'lsa boshlash uchun qadamlar."
}

QAT'IY TALABLAR:
- "ma'lumot yetishmasligi" yoki "tahlil qilish imkoni yo'q" deb YOZMA!
- Kamida 3 ta kasb/yo'nalish tavsiya qil
- Agar universitetga moyil bo'lsa: O'zbekistonning haqiqiy universitetlari bo'lsin (TATU->tuit.uz, TDIU->tsue.uz, WIUT->wiut.uz, TMA->tma.uz, O'zMU->nuu.uz, TDYU->tsul.uz va h.k.)
- Agar kasbga moyil bo'lsa: Haqiqiy kurslar, o'quv markazlari yoki online platformalar tavsiya qil (Najot Ta'lim, PDP Academy, Coursera, YouTube kanallar va h.k.)
- Agar biznesga moyil bo'lsa: Biznes yo'nalishlari, kerakli ko'nikmalar va amaliy maslahatlar ber
- Barcha ma'lumotlar ANIQ va SHAXSIY bo'lsin!
`;

    return await callGeminiForAnalysis(prompt, allQA);
}

/**
 * Gemini API'ga so'rov yuborish (savol yaratish uchun)
 */
async function callGemini(prompt) {
    // Gemini 3.8 Live Extended Thinking — HECH QACHON O'ZGARTIRMA!
    const MODEL = 'gemini-2.5-flash'; // endpoint: gemini-3.8-live-extended-thinking
    
    for (let attempt = 0; attempt < ALL_KEYS.length; attempt++) {
        const apiKey = getNextKey();
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.9,
                        maxOutputTokens: 1024,
                    }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = JSON.parse(text);
                    if (parsed.question && parsed.options) {
                        return parsed;
                    }
                }
            }
        } catch (err) {
            console.warn(`Test API attempt ${attempt + 1} failed:`, err.message);
        }
    }

    // Fallback savol
    return null;
}

/**
 * Gemini API'ga so'rov yuborish (tahlil uchun)
 */
async function callGeminiForAnalysis(prompt, allQA) {
    // Gemini 3.8 Live Extended Thinking — HECH QACHON O'ZGARTIRMA!
    const MODEL = 'gemini-2.5-flash'; // endpoint: gemini-3.8-live-extended-thinking
    
    for (let attempt = 0; attempt < ALL_KEYS.length; attempt++) {
        const apiKey = getNextKey();
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                        thinkingConfig: { thinkingBudget: 2048 }
                    }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = JSON.parse(text);
                    if (parsed.summary && parsed.recommendedCareers) {
                        return parsed;
                    }
                }
            }
        } catch (err) {
            console.warn(`Analysis API attempt ${attempt + 1} failed:`, err.message);
        }
    }

    // Fallback tahlil
    const { buildFallbackAnalysis } = await import('./analysisService.js');
    const fullText = allQA.map(qa => `${qa.question} ${qa.answer}`).join(' ');
    return buildFallbackAnalysis(fullText);
}

/**
 * Fallback savollar (API ishlamasa)
 */
export const FALLBACK_QUESTIONS = [
    {
        question: "Salom! Keling, birga sizning qobiliyatlaringizni aniqlaymiz. Avval aytingchi, bo'sh vaqtingizda eng ko'p nima qilishni yoqtirasiz?",
        options: ["Kompyuter yoki telefonda yangi narsalar o'rganaman", "Kitob o'qiyman yoki yozaman", "Do'stlarim bilan sport bilan shug'ullanaman", "Rasm chizaman yoki musiqa tinglayman"],
        questionNumber: 1
    },
    {
        question: "Maktabda qaysi fanlar sizga eng qiziqarli tuyuladi?",
        options: ["Matematika va Informatika", "Biologiya va Kimyo", "Tarix va Adabiyot", "Fizika va Texnologiya"],
        questionNumber: 2
    },
    {
        question: "Agar bir kun butun dunyo sizni tinglasa, nima haqida gapirgan bo'lardingiz?",
        options: ["Texnologiya va sun'iy intellekt kelajagi haqida", "Tabiat va inson salomatligi haqida", "Adolat va inson huquqlari haqida", "San'at va madaniyat haqida"],
        questionNumber: 3
    },
    {
        question: "Jamoada ishlayotganingizda odatda qanday rol olasiz?",
        options: ["Rahbar - rejani tuzib, boshqaraman", "Ijodkor - yangi g'oyalar taklif qilaman", "Tahlilchi - ma'lumotlarni tekshiraman", "Yordamchi - hammaga yordam beraman"],
        questionNumber: 4
    },
    {
        question: "Qaysi super qobiliyatni tanlagan bo'lardingiz?",
        options: ["Super tezlikda o'qish va eslab qolish", "Ixtirolar yaratish qobiliyati", "Boshqalarni tushunish va his qilish", "Har qanday tilni bir zumda o'rganish"],
        questionNumber: 5
    },
    {
        question: "Kelajakda o'zingizni qayerda ko'rasiz?",
        options: ["Katta texnologiya kompaniyasida ishlayapman", "Kasalxonada yoki laboratoriyada tadqiqot qilyapman", "O'z biznesimni boshqaryapman", "Ijodiy studiya yoki mediada ishlayapman"],
        questionNumber: 6
    },
    {
        question: "Muammo yuzaga kelganda qanday yondashasz?",
        options: ["Mantiqiy tahlil qilib, qadam-baqadam yechaman", "Boshqalardan maslahat so'rayman", "Ijodiy va nostandart yechim izlayman", "Sabr bilan kuzatib, to'g'ri vaqtni kutaman"],
        questionNumber: 7
    },
    {
        question: "Qaysi kitob yoki film turlari sizga yoqadi?",
        options: ["Ilmiy-fantastika va texnologiya", "Detektiv va psixologik", "Tarixiy va biografik", "Komediya va romantika"],
        questionNumber: 8
    },
    {
        question: "Agar yangi biror narsani o'rgansangiz, qanday usulda o'rganasiz?",
        options: ["Video darsliklar va onlayn kurslar orqali", "Kitob o'qib, yozib olaman", "Amaliy tajriba - sinab ko'raman", "Kimdir o'rgatsa, tez o'zlashtiraman"],
        questionNumber: 9
    },
    {
        question: "Qaysi soha sizni eng ko'p hayajonga soladi?",
        options: ["Sun'iy intellekt va robototexnika", "Tibbiyot va biotexnologiya", "Biznes va moliya", "Dizayn va arxitektura"],
        questionNumber: 10
    }
];
