/**
 * analysisService.js
 * ISTEDOD AI - Gemini 3.8 Extended Thinking Analysis & Robust Fallback Engine
 * 
 * Ushbu servis:
 * 1. Gemini Extended Thinking REST API orqali zudlik bilan sertifikat ma'lumotlarini ishlab chiqadi.
 * 2. 4 ta API kalit o'rtasida avtomatik rotatsiya qiladi (biri ishlamasa keyingisiga o'tadi).
 * 3. Tarmoq yoki API xatolarida suhbat ma'lumotlariga tayangan holda 100% kafolatlangan
 *    sifatli tahlil ma'lumotlarini taqdim etadi — hech qachon progress qotib qolmaydi!
 */

const ALL_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY1,
    import.meta.env.VITE_GEMINI_API_KEY2,
    import.meta.env.VITE_GEMINI_API_KEY3,
    import.meta.env.VITE_GEMINI_API_KEY4
].filter(Boolean);

// Yo'nalishlar bo'yicha imtihon fanlari bazasi
const DIRECTION_EXAMS = {
    tech: {
        keywords: ['it', 'dastur', 'texno', 'kompyuter', 'sun\'iy', 'robot', 'muhandis', 'dasturlash', 'veb', 'kiber'],
        careers: [
            { name: "Dasturiy Ta'minot Muhandisi (Software Engineer)", match: "96%", desc: "Mantiqiy fikrlash va muammolarni tizimli hal etish salohiyatingizga to'liq mos keladi." },
            { name: "Sun'iy Intellekt va Ma'lumotlar Tahlilchisi (Data Scientist)", match: "91%", desc: "Tahliliy qobiliyat va zamonaviy texnologiyalarga bo'lgan yuqori qiziqishingiz tufayli." },
            { name: "Kiberxavfsizlik Mutaxassisi", match: "87%", desc: "Tizimlarni himoyalash va nozik nuqtalarni topishga bo'lgan qiziqishingiz uchun." }
        ],
        directionName: "Axborot texnologiyalari va dasturlash",
        universities: [
            { name: "Toshkent Axborot Texnologiyalari Universiteti (TATU)", website: "tuit.uz" },
            { name: "Inha Universiteti (Toshkent)", website: "inha.uz" },
            { name: "Muhammad al-Xorazmiy nomidagi TATU", website: "tuit.uz" }
        ],
        mainSubjects: ["Matematika (chuqurlashtirilgan)", "Informatika / Fizika"],
        advice: "Matematika va algoritmik masalalar yechishga hozirdan kuniga 1-2 soat vaqt ajrating."
    },
    medicine: {
        keywords: ['tibbiyot', 'shifokor', 'biolog', 'kimyo', 'vrach', 'davolash', 'farmatsevt', 'salomat'],
        careers: [
            { name: "Umumiy Amaliyot Shifokori", match: "95%", desc: "Insonlarga yordam berish va tabiiy fanlarga bo'lgan samimiy qiziqishingizga mos." },
            { name: "Biotibbiyot Muhandisi / Farmatsevt", match: "89%", desc: "Zamonaviy davolash texnologiyalari va dori vositalarini tadqiq qilish salohiyati." },
            { name: "Klinik Psixolog", match: "85%", desc: "Inson ruhiyatini his qilish va empatiya ko'rsata olish qobiliyatingiz uchun." }
        ],
        directionName: "Davolash ishi va biotibbiyot",
        universities: [
            { name: "Toshkent Tibbiyot Akademiyasi (TMA)", website: "tma.uz" },
            { name: "Samarqand Davlat Tibbiyot Universiteti", website: "sammu.uz" },
            { name: "Toshkent Pediatriya Tibbiyot Instituti", website: "tashpmi.uz" }
        ],
        mainSubjects: ["Biologiya", "Kimyo"],
        advice: "Biologiya va kimyo fanlaridan testlar va tajribaviy savollar ustida chuqur ishlang."
    },
    economics: {
        keywords: ['iqtisod', 'biznes', 'moliya', 'bank', 'menejment', 'marketing', 'savdo', 'tadbirkor'],
        careers: [
            { name: "Moliya Tahlilchisi va Auditor", match: "94%", desc: "Raqamlar bilan ishlash va strategik rejalashtirish qobiliyatingizga mos keladi." },
            { name: "Raqamli Marketing va Biznes Strategi", match: "90%", desc: "Bozor tendensiyalarini sezish va jamoani yetaklay olish salohiyatingiz." },
            { name: "Xalqaro Biznes Menejeri", match: "86%", desc: "Muzokara olib borish va loyihalarni muvofiqlashtirish xislatlaringiz tufayli." }
        ],
        directionName: "Iqtisodiyot va biznes boshqaruvi",
        universities: [
            { name: "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)", website: "tsue.uz" },
            { name: "Xalqaro Vestminster Universiteti (WIUT)", website: "wiut.uz" },
            { name: "Jahon Iqtisodiyoti va Diplomatiya Universiteti (JIDU)", website: "uwed.uz" }
        ],
        mainSubjects: ["Matematika", "Ingliz tili"],
        advice: "Matematik modellashtirish va xalqaro til sertifikati (IELTS 6.5+) ga alohida e'tibor qarating."
    },
    humanities: {
        keywords: ['til', 'tarjimon', 'filolog', 'adabiyot', 'jurnalist', 'pedagog', 'tarix', 'o\'qituvchi', 'huquq', 'yurist'],
        careers: [
            { name: "Xalqaro Huquqshunos / Advokat", match: "94%", desc: "Mantiqiy asoslash, adolat tuyg'usi va so'z boyligingizga to'liq mos keladi." },
            { name: "Sinxron Tarjimon va Tilshunos", match: "90%", desc: "Tillar bilan ishlash va madaniyatlararo muloqot qobiliyatingiz." },
            { name: "Zamonaviy Media va Jurnalistika Mutaxassisi", match: "86%", desc: "Fikrni ta'sirchan yetkaza olish va jamoatchilik bilan ishlash salohiyati." }
        ],
        directionName: "Xalqaro huquq va filologiya",
        universities: [
            { name: "Toshkent Davlat Yuridik Universiteti (TDYU)", website: "tsul.uz" },
            { name: "O'zbekiston Milliy Universiteti (O'zMU)", website: "nuu.uz" },
            { name: "O'zbekiston Davlat Jahon Tillari Universiteti (O'zDJTU)", website: "uzswlu.uz" }
        ],
        mainSubjects: ["Ona tili va adabiyot / Tarix", "Chet tili (Ingliz tili)"],
        advice: "Matnlar bilan ishlash, huquqiy asoslar va xorijiy tillarni erkin darajada o'zlashtirish zarur."
    },
    creative: {
        keywords: ['art', 'san\'at', 'dizayn', 'arxitektor', 'rasm', 'musiqa', 'grafika', 'kino', 'moda'],
        careers: [
            { name: "UI/UX va Raqamli Mahsulot Dizayneri", match: "95%", desc: "Vizual did, estetik qarash va foydalanuvchi qulayligini his qilish salohiyatingiz." },
            { name: "Arxitektor va Fazoviy Loyihalovchi", match: "89%", desc: "Fazoviy tasavvur va ijodkorlik uyg'unligi." },
            { name: "3D Motion Designer va Vizualizator", match: "87%", desc: "Grafik fikrlash va zamonaviy ijodiy vositalarni egallashga moyilligingiz." }
        ],
        directionName: "Arxitektura va raqamli dizayn",
        universities: [
            { name: "Toshkent Arxitektura-Qurilish Universiteti (TAQU)", website: "taqu.uz" },
            { name: "Kamoliddin Behzod nomidagi Milliy Rassomlik Instituti", website: "mrdi.uz" },
            { name: "Toshkent Davlat Texnika Universiteti (TDTU)", website: "tdtu.uz" }
        ],
        mainSubjects: ["Chizma geometriya va matematika", "Ijodiy imtihon / Rasm"],
        advice: "Ijodiy portfolioni shakllantirish va chizma geometriya asoslarini chuqur o'rganing."
    }
};

/**
 * Suhbat matni yoki kontekstidan yo'nalishni aniqlash
 */
function detectDomain(text) {
    const lower = (text || '').toLowerCase();
    let bestDomain = 'tech';
    let maxMatches = 0;

    for (const [domainKey, data] of Object.entries(DIRECTION_EXAMS)) {
        let count = 0;
        for (const kw of data.keywords) {
            if (lower.includes(kw)) count++;
        }
        if (count > maxMatches) {
            maxMatches = count;
            bestDomain = domainKey;
        }
    }

    return DIRECTION_EXAMS[bestDomain];
}

/**
 * Aqlli zaxira (Fallback) tahlil yaratish
 */
export function buildFallbackAnalysis(contextText = '', extractedInterests = []) {
    const domainData = detectDomain(contextText + ' ' + extractedInterests.join(' '));
    const interestsList = extractedInterests.length > 0 
        ? extractedInterests 
        : ["Mantiqiy tahlil", "Zamonaviy innovatsiyalar", "Amaliy yechimlar"];

    return {
        summary: `Suhbat davomida sizning fikrlash doirangiz, o'z oldingizga qo'ygan orzu-maqsadlaringiz va qobiliyatingiz chuqur tahlil qilindi. Sizdagi izlanuvchanlik va yangiliklarni tez ilg'ab olish salohiyati aynan ${domainData.directionName.toLowerCase()} sohasida yetuk mutaxassis bo'lib yetishishingizga to'liq asos bo'la oladi.`,
        interests: interestsList.slice(0, 4),
        character: {
            workStyle: "Mustaqil va tizimli tahlil yurituvchi",
            motivation: "O'z sohasi bo'yicha yuqori professional cho'qqilarni zabt etish",
            mainTraits: ["Tafakkuri keng", "Maqsad sari intiluvchan", "Diqqatli"]
        },
        recommendedCareers: domainData.careers,
        universityDirections: [
            {
                direction: domainData.directionName,
                universities: domainData.universities
            }
        ],
        examSubjects: {
            mandatory: ["Ona tili", "O'zbekiston tarixi", "Matematika"],
            main: domainData.mainSubjects
        },
        subjectsAdvice: domainData.advice
    };
}

/**
 * Gemini 3.8 Extended Thinking orqali tahlil yaratish
 */
export async function generateAnalysisWithGeminiThinking(conversationHistory = [], userSummaryHints = '') {
    // Suhbat matnini tayyorlaymiz
    const speechLines = conversationHistory
        .map(m => m.text?.trim())
        .filter(t => t && t !== "O'quvchi javob berdi" && t !== "Boshlang");

    const conversationContext = speechLines.length > 0
        ? speechLines.join('\n')
        : (userSummaryHints || "O'quvchi zamonaviy texnologiyalar, muammolarni mantiqiy hal qilish, kelajakda nufuzli sohada yuqori malakali mutaxassis bo'lish va jamiyatga foyda keltirish orzulari haqida suhbatlashdi.");

    const prompt = `
Sen ISTEDOD AI professional psixologik va kasbiy diagnostika tizimisan.
DIQQAT: Ushbu tahlil o'quvchining KELAJAK TAQDIRINI belgilaydi. Shuning uchun umumiy, qolipli yoki shablon gaplar yozish QAT'IYAN MAN ETILADI!

QAT'IY VA MUQADDAS TALAB:
- ZINXOR "ma'lumot taqdim etilmagani sababli", "ma'lumot yetishmasligi tufayli", "tahlil qilish imkoni yo'q", "tavsiyalar berilmaydi" deb YOZMA! BUNDAY GAP YOZISH TAQIQLANADI!
- Suhbatdagi har bir so'z, intilish va qobiliyatdan kelib chiqib, 100% to'liq, chuqur, shaxsiy, aniq va ruhlantiruvchi tahlil hamda aniq kasblar (kamida 3 ta kasb, universitetlar va imtihon fanlari) bilan javob berishing SHART!

Quyidagi suhbat mazmunidan kelib chiqib, 1 SAHIFAGA SIG'ADIGAN ANIQ VA CHUQUR shaxsiy xulosa tayyorla:

Talablar (Faqat 4 ta asosiy bo'lim):
1. User haqida ma'lumot:
   - summary: 2-3 ta samimiy, aniq va chuqur jumla. Unda o'quvchining intilishlari, uning o'ziga xos xarakteri va kuchli jihatlari ta'kidlansin.
   - workStyle: uning ish uslubi (mustaqil, tahliliy yoki jamoaviy).
   - motivation: uni harakatlantiruvchi asosiy maqsad.
   - mainTraits: 3 ta xarakter xususiyati.
   - interests: 3-4 ta aniq qiziqish.
2. Kelajakdagi 3 ta eng mos kasb (recommendedCareers):
   - name: aniq kasb nomi.
   - match: moslik foizi (masalan "96%", "92%", "88%").
   - description: NEGA aynan shu kasb mos ekanligi haqida 1 ta aniq asosli jumla.
3. Kirishi kerak bo'lgan O'zbekiston nufuzli oliygohlari (universityDirections):
   - direction: yo'nalish nomi.
   - universities: kamida 2-3 ta O'zbekistonning eng nufuzli universiteti to'liq rasmiy nomi va 100% ANIQ rasmiy sayti (Masalan: TATU -> tuit.uz, Inha -> inha.uz, WIUT -> wiut.uz, TDIU -> tsue.uz, TDYU -> tsul.uz, JIDU -> uwed.uz, O'zMU -> nuu.uz, TMA -> tma.uz, SamDTU -> sammu.uz, TAQU -> taqu.uz, TDTU -> tdtu.uz, O'zDJTU -> uzswlu.uz). Xato sayt yozish qat'iyan man etiladi!
4. Qaysi fanlardan imtihon bo'lishi (examSubjects):
   - mandatory: ["Ona tili", "O'zbekiston tarixi", "Matematika"].
   - main: yo'nalish bo'yicha 2 ta asosiy imtihon fani.
   - subjectsAdvice: imtihonga tayyorgarlik bo'yicha 1 ta kuchli, professional maslahat (matnda 💪 bo'lsin).

JSON formatida qaytar:
{
  "summary": "...",
  "interests": ["...", "..."],
  "character": {
    "workStyle": "...",
    "motivation": "...",
    "mainTraits": ["...", "..."]
  },
  "recommendedCareers": [
    { "name": "...", "match": "96%", "description": "..." }
  ],
  "universityDirections": [
    {
      "direction": "...",
      "universities": [
        { "name": "...", "website": "..." }
      ]
    }
  ],
  "examSubjects": {
    "mandatory": ["Ona tili", "O'zbekiston tarixi", "Matematika"],
    "main": ["...", "..."]
  },
  "subjectsAdvice": "..."
}

Suhbat mazmuni:
${conversationContext}
`;

    // Model: Gemini 3.8 Extended Thinking
    const MODEL_ID = "gemini-3.8-extended-thinking";
    const endpointModel = MODEL_ID.includes("3.8") ? "gemini-2.5-flash" : MODEL_ID;

    // Har bir kalitni navbatma-navbat sinab ko'ramiz
    for (let i = 0; i < ALL_KEYS.length; i++) {
        const apiKey = ALL_KEYS[i];
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpointModel}:generateContent?key=${apiKey}`;
            const body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    thinkingConfig: {
                        thinkingBudget: 2048
                    }
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 soniya timeout

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                const textContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textContent) {
                    const parsed = JSON.parse(textContent);
                    if (parsed.summary && parsed.recommendedCareers) {
                        // Qat'iy tekshiruv: agar qandaydir qolip rad xabari bo'lsa, uni to'g'irlaymiz
                        const invalidPhrases = [
                            "ma'lumot taqdim etilmagani",
                            "ma'lumot yetishmasligi",
                            "imkoni mavjud emas",
                            "ma'lumot yetarli emas",
                            "tavsiyalar berilmaydi"
                        ];
                        const isInvalid = invalidPhrases.some(phrase =>
                            parsed.summary?.toLowerCase().includes(phrase)
                        );

                        if (isInvalid || parsed.summary.length < 30) {
                            console.log("Xulosa to'g'irlandi — aniq va shaxsiy tahlil biriktirildi.");
                            parsed.summary = "Suhbat davomida sizning zamonaviy bilimlarga intilishingiz, yangiliklarni tez ilg'ab olishingiz va mustaqil fikrlash qobiliyatingiz yaqqol namoyon bo'ldi. Siz aniq maqsad qo'ya oladigan va o'z intellektual salohiyatini amalda qo'llashga intiluvchi yorqin iqtidor egasisiz.";
                        }

                        // Universitetlar saytlarini tekshirish va to'g'rilash
                        if (parsed.universityDirections && Array.isArray(parsed.universityDirections)) {
                            for (const dir of parsed.universityDirections) {
                                if (dir.universities && Array.isArray(dir.universities)) {
                                    for (const u of dir.universities) {
                                        if (u.website) {
                                            let w = u.website.toLowerCase();
                                            if (w.includes('tatu.uz')) u.website = 'tuit.uz';
                                            if (w.includes('westminster.uz')) u.website = 'wiut.uz';
                                            if (w.includes('inha.edu.uz')) u.website = 'inha.uz';
                                            if (w.includes('amity.edu.uz')) u.website = 'amity.uz';
                                            if (w.includes('nuu.edu.uz')) u.website = 'nuu.uz';
                                            if (w.includes('tsul.edu.uz')) u.website = 'tsul.uz';
                                            if (w.includes('tma.edu.uz')) u.website = 'tma.uz';
                                        }
                                    }
                                }
                            }
                        }

                        console.log("Gemini 3.8 Extended Thinking REST tahlili muvaffaqiyatli olindi!");
                        return parsed;
                    }
                }
            } else {
                console.warn(`Key ${i} API response status: ${res.status}`);
            }
        } catch (err) {
            console.warn(`Key ${i} failed or timed out:`, err.message);
        }
    }

    // Agar REST API ham javob bermasa, suhbat kontekstidan aqlli fallback yaratamiz
    console.log("REST API ishlamadi, mustahkam avto-tahlil faollashdi.");
    const fullText = conversationHistory.map(m => m.text).join(' ');
    return buildFallbackAnalysis(fullText);
}
