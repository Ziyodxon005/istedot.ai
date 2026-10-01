import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveCertificate, getSavedCertificates } from '../utils/certificateStore';
import istedotLogo from '../assets/logo_istedot.png';
import { Sparkles, GraduationCap, BookOpen, User, Briefcase, Award, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';

// Yo'nalishlar bo'yicha imtihon fanlari
const DIRECTION_SUBJECTS = {
    'texnologiya': ['Matematika (chuqur)', 'Fizika / Informatika'],
    'kompyuter': ['Matematika (chuqur)', 'Informatika'],
    'it': ['Matematika (chuqur)', 'Informatika'],
    'dasturlash': ['Matematika (chuqur)', 'Informatika'],
    'sun\'iy': ['Matematika (chuqur)', 'Informatika'],
    'muhandis': ['Matematika (chuqur)', 'Fizika'],
    'elektr': ['Matematika (chuqur)', 'Fizika'],
    'qurilish': ['Matematika (chuqur)', 'Fizika'],
    'arxitektur': ['Chizma geometriya', 'Rasm'],
    'tibbiyot': ['Biologiya', 'Kimyo'],
    'farmatsevt': ['Kimyo', 'Biologiya'],
    'iqtisod': ['Matematika (chuqur)', 'Chet tili (Ingliz tili)'],
    'moliya': ['Matematika (chuqur)', 'Chet tili (Ingliz tili)'],
    'huquq': ['Tarix', 'Ona tili va adabiyot'],
    'psixolog': ['Tarix', 'Chet tili'],
    'pedagog': ['Ona tili va adabiyot', 'Tarix'],
    'til': ['Chet tili (Ingliz tili)', 'Ona tili va adabiyot'],
    'jurnalist': ['Ona tili va adabiyot', 'Chet tili'],
    'san\'at': ['Ijodiy imtihon (Rasm)', 'San\'at tarixi'],
    'menejment': ['Matematika', 'Chet tili'],
    'marketing': ['Matematika', 'Chet tili'],
};

const MANDATORY_SUBJECTS = ["Ona tili", "O'zbekiston tarixi", "Matematika"];

// O'zbekiston oliy o'quv yurtlari va ularning 100% haqiqiy rasmiy saytlari bazasi
const UZBEK_UNIVERSITIES_DB = [
    { keywords: ['tatu', 'tuit', 'axborot texnologiya', 'muhammad al-xorazmiy', 'xorazmiy'], name: 'TATU', url: 'https://tuit.uz', display: 'tuit.uz' },
    { keywords: ['inha', 'inxa'], name: 'Inha Universiteti (Toshkent)', url: 'https://inha.uz', display: 'inha.uz' },
    { keywords: ['amity'], name: 'Amity Universiteti (Toshkent)', url: 'https://amity.uz', display: 'amity.uz' },
    { keywords: ['vestminster', 'wiut', 'westminster'], name: 'WIUT (Vestminster)', url: 'https://wiut.uz', display: 'wiut.uz' },
    { keywords: ['milliy', 'o\'zmu', 'ozmu', 'mirzo ulug\'bek', 'nuu'], name: "O'zbekiston Milliy Universiteti (O'zMU)", url: 'https://nuu.uz', display: 'nuu.uz' },
    { keywords: ['tdiu', 'tsue', 'iqtisodiyot', 'narxoz'], name: 'Toshkent Davlat Iqtisodiyot Universiteti (TDIU)', url: 'https://tsue.uz', display: 'tsue.uz' },
    { keywords: ['diplomatiya', 'jidu', 'uwed'], name: 'Jahon Iqtisodiyoti va Diplomatiya Universiteti (JIDU)', url: 'https://uwed.uz', display: 'uwed.uz' },
    { keywords: ['yuridik', 'tdyu', 'tsul', 'huquq'], name: 'Toshkent Davlat Yuridik Universiteti (TDYU)', url: 'https://tsul.uz', display: 'tsul.uz' },
    { keywords: ['tma', 'tibbiyot akademiyasi', 'tashkent medical'], name: 'Toshkent Tibbiyot Akademiyasi (TMA)', url: 'https://tma.uz', display: 'tma.uz' },
    { keywords: ['sammu', 'samdtu', 'samarqand tibbiyot', 'sammi'], name: 'Samarqand Davlat Tibbiyot Universiteti', url: 'https://sammu.uz', display: 'sammu.uz' },
    { keywords: ['tashpmi', 'pediatriya', 'sampi'], name: 'Toshkent Pediatriya Tibbiyot Instituti', url: 'https://tashpmi.uz', display: 'tashpmi.uz' },
    { keywords: ['taqu', 'arxitektura', 'qurilish'], name: 'Toshkent Arxitektura-Qurilish Universiteti (TAQU)', url: 'https://taqu.uz', display: 'taqu.uz' },
    { keywords: ['tdtu', 'beruniy', 'politexnika', 'texnika'], name: 'Toshkent Davlat Texnika Universiteti (TDTU)', url: 'https://tdtu.uz', display: 'tdtu.uz' },
    { keywords: ['jahon tillari', 'o\'zdjtu', 'ozdjtu', 'uzswlu'], name: "O'zbekiston Davlat Jahon Tillari Universiteti", url: 'https://uzswlu.uz', display: 'uzswlu.uz' },
    { keywords: ['yangi o\'zbekiston', 'newuu', 'new uzbekistan'], name: 'Yangi O\'zbekiston Universiteti', url: 'https://newuu.uz', display: 'newuu.uz' },
    { keywords: ['it park', 'itpu'], name: 'IT Park University', url: 'https://itpu.uz', display: 'itpu.uz' },
    { keywords: ['turin', 'polito'], name: 'Turin Politexnika Universiteti', url: 'https://polito.uz', display: 'polito.uz' },
    { keywords: ['central asian', 'akfa', 'cauniver'], name: 'Central Asian University', url: 'https://centralasian.uz', display: 'centralasian.uz' },
    { keywords: ['webster'], name: 'Webster Universiteti (Toshkent)', url: 'https://webster.uz', display: 'webster.uz' },
    { keywords: ['ajou'], name: 'Ajou Universiteti (Toshkent)', url: 'https://ajou.uz', display: 'ajou.uz' },
    { keywords: ['singapur', 'mdis'], name: 'MDIST (Singapur Menejment Instituti)', url: 'https://mdis.uz', display: 'mdis.uz' },
    { keywords: ['nizomiy', 'tdpu', 'pedagogika'], name: 'Nizomiy nomidagi TDPU', url: 'https://nizami.uz', display: 'nizami.uz' },
    { keywords: ['tkti', 'kimyo-texnologiya'], name: 'Toshkent Kimyo-Texnologiya Instituti (TKTI)', url: 'https://tkti.uz', display: 'tkti.uz' },
    { keywords: ['farmatsevtika', 'pharmi'], name: 'Toshkent Farmatsevtika Instituti', url: 'https://pharmi.uz', display: 'pharmi.uz' },
    { keywords: ['stomatologiya', 'tsdi'], name: 'Toshkent Davlat Stomatologiya Instituti', url: 'https://tsdi.uz', display: 'tsdi.uz' },
    { keywords: ['samdu', 'samarqand davlat'], name: 'Samarqand Davlat Universiteti (SamDU)', url: 'https://samdu.uz', display: 'samdu.uz' },
    { keywords: ['buxdu', 'buxoro davlat'], name: 'Buxoro Davlat Universiteti (BuxDU)', url: 'https://buxdu.uz', display: 'buxdu.uz' },
    { keywords: ['adu', 'andijon davlat'], name: 'Andijon Davlat Universiteti (ADU)', url: 'https://adu.uz', display: 'adu.uz' },
    { keywords: ['fardu', 'farg\'ona davlat', 'fdu'], name: 'Farg\'ona Davlat Universiteti (FarDU)', url: 'https://fdu.uz', display: 'fdu.uz' },
    { keywords: ['namdu', 'namangan davlat'], name: 'Namangan Davlat Universiteti (NamDU)', url: 'https://namdu.uz', display: 'namdu.uz' },
    { keywords: ['karsu', 'qoraqalpoq', 'berdaq'], name: 'Qoraqalpoq Davlat Universiteti (QDU)', url: 'https://karsu.uz', display: 'karsu.uz' },
    { keywords: ['sharqshunoslik', 'tsos', 'tashdshu'], name: 'Toshkent Davlat Sharqshunoslik Universiteti', url: 'https://tsos.uz', display: 'tsos.uz' },
    { keywords: ['jurnalistika', 'jmau'], name: 'O\'zbekiston Jurnalistika Universiteti (JMAU)', url: 'https://jmau.uz', display: 'jmau.uz' },
    { keywords: ['agrar', 'tdau'], name: 'Toshkent Davlat Agrar Universiteti (TDAU)', url: 'https://tdau.uz', display: 'tdau.uz' }
];

// Universitet nomi yoki ob'ektidan 100% aniq va ishlaydigan rasmiy sayt havolasini olish
function resolveUniversityInfo(u) {
    const rawName = typeof u === 'object' && u ? (u.name || '') : String(u || '');
    let rawSite = typeof u === 'object' && u ? u.website : null;
    const combined = `${rawName} ${rawSite || ''}`.toLowerCase();

    // 1. Birinchi navbatda tekshirilgan O'zbekiston rasmiy OTMlar bazasidan qidirish (prioritet #1)
    for (const item of UZBEK_UNIVERSITIES_DB) {
        if (item.keywords.some(k => combined.includes(k))) {
            return {
                name: rawName || item.name,
                url: item.url,
                displayUrl: item.display
            };
        }
    }

    // 2. Agar bazada bo'lmasa, AI taqdim etgan domen mavjud bo'lsa uni tozalash
    if (rawSite && typeof rawSite === 'string' && rawSite.trim()) {
        let clean = rawSite.trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/\/+$/, '');

        // AI keng tarqalgan xato qiladigan domenlarni to'g'rilash
        if (clean.includes('tatu.uz')) clean = 'tuit.uz';
        if (clean.includes('westminster.uz')) clean = 'wiut.uz';
        if (clean.includes('inha.edu.uz')) clean = 'inha.uz';
        if (clean.includes('amity.edu.uz')) clean = 'amity.uz';
        if (clean.includes('tsul.edu.uz')) clean = 'tsul.uz';
        if (clean.includes('nuu.edu.uz')) clean = 'nuu.uz';
        if (clean.includes('tma.edu.uz')) clean = 'tma.uz';

        return {
            name: rawName,
            url: `https://${clean}`,
            displayUrl: clean
        };
    }

    // 3. Zaxira: rasmiy sayt qidiruvi
    return {
        name: rawName,
        url: `https://www.google.com/search?q=${encodeURIComponent(rawName + " rasmiy sayti")}`,
        displayUrl: 'rasmiy sayti'
    };
}

function getSubjectsForDirection(directionName) {
    const lower = (directionName || '').toLowerCase();
    for (const [key, subs] of Object.entries(DIRECTION_SUBJECTS)) {
        if (lower.includes(key)) return subs;
    }
    return ['Matematika', 'Ingliz tili'];
}

const CertificatePage = ({ analysisData, onRestart, skipAutoSave = false, customBackBtn = null }) => {
    const certRef = useRef(null);
    const savedRef = useRef(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const certNumber = `IST-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Agar prop sifatida tahlil berilmagan bo'lsa (masalan refresh paytida), sessionStorage yoki saqlanganlardan olamiz
    const data = analysisData || (() => {
        try {
            const raw = sessionStorage.getItem('current_active_cert');
            if (raw) return JSON.parse(raw);
            const saved = getSavedCertificates();
            if (saved && saved.length > 0) return saved[0].data || saved[0];
        } catch (e) { }
        return null;
    })();

    // Auto-save to localStorage once on first render
    useEffect(() => {
        if (!skipAutoSave && !savedRef.current && data) {
            savedRef.current = true;
            try {
                saveCertificate(data);
            } catch (err) {
                console.error("Certificate save failed:", err);
            }
        }
    }, [data, skipAutoSave]);

    if (!data) {
        return (
            <div className="cert-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
                <p style={{ color: '#fff', fontSize: '18px' }}>Sertifikat ma'lumotlari yuklanmoqda...</p>
                <button className="cert-action-btn cert-action-restart" onClick={onRestart}>
                    <ArrowLeft size={16} />
                    <span>Bosh menyuga qaytish</span>
                </button>
            </div>
        );
    }

    // 100% Xavfsiz ma'lumotlarni normallashtirish (hech qanday xatoda qotib qolmaydi)
    const summary = typeof data.summary === 'string' ? data.summary : '';

    const rawInterests = data.interests;
    const interests = Array.isArray(rawInterests)
        ? rawInterests.map(item => typeof item === 'object' ? (item.name || JSON.stringify(item)) : String(item || '')).filter(Boolean)
        : (typeof rawInterests === 'string' ? rawInterests.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);

    const rawChar = data.character || {};
    const character = {
        workStyle: typeof rawChar.workStyle === 'string' ? rawChar.workStyle : (Array.isArray(rawChar.workStyle) ? rawChar.workStyle.join(', ') : ''),
        motivation: typeof rawChar.motivation === 'string' ? rawChar.motivation : '',
        mainTraits: Array.isArray(rawChar.mainTraits) ? rawChar.mainTraits.map(String) : []
    };

    const rawCareers = data.recommendedCareers;
    let recommendedCareers = [];
    if (Array.isArray(rawCareers)) {
        recommendedCareers = rawCareers.map((c, idx) => {
            if (typeof c === 'object' && c !== null) {
                return {
                    name: typeof c.name === 'string' ? c.name : String(c.name || 'Kasbiy yo\'nalish'),
                    match: typeof c.match === 'string' ? c.match : `${96 - idx * 4}%`,
                    description: typeof c.description === 'string' ? c.description : ''
                };
            }
            return {
                name: String(c || 'Kasbiy yo\'nalish'),
                match: `${96 - idx * 4}%`,
                description: ''
            };
        });
    }
    if (recommendedCareers.length === 0) {
        recommendedCareers = [
            { name: "Axborot Texnologiyalari va Dasturlash", match: "96%", description: "Mantiqiy fikrlash va muammolarga yechim topish salohiyatingiz uchun." },
            { name: "Tizimli Tahlilchi va Muhandis", match: "92%", description: "Mustaqil va tizimli fikrlash qobiliyatingiz." },
            { name: "Zamonaviy Innovatsion Loyihalar Menejeri", match: "88%", description: "Yangi tendensiyalarni tez ilg'ab olish salohiyati." }
        ];
    }

    const rawUnis = data.universityDirections;
    const universityDirections = Array.isArray(rawUnis) ? rawUnis : [];

    const primaryDirection = universityDirections?.[0]?.direction || recommendedCareers?.[0]?.name || '';

    let mainExams = [];
    if (Array.isArray(data.examSubjects?.main)) {
        mainExams = data.examSubjects.main.map(String);
    } else if (typeof data.examSubjects?.main === 'string') {
        mainExams = data.examSubjects.main.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    } else {
        mainExams = getSubjectsForDirection(primaryDirection);
    }

    let mandatoryExams = [];
    if (Array.isArray(data.examSubjects?.mandatory)) {
        mandatoryExams = data.examSubjects.mandatory.map(String);
    } else if (typeof data.examSubjects?.mandatory === 'string') {
        mandatoryExams = data.examSubjects.mandatory.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    } else {
        mandatoryExams = MANDATORY_SUBJECTS;
    }

    const subjectsAdvice = typeof data.subjectsAdvice === 'string' ? data.subjectsAdvice : '';

    // Tez va tabiiy 3D tilt interaktivligi (har bir card uchun)
    const handleCardTilt = (e) => {
        const card = e.currentTarget;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Burilish burchagi (-10deg dan +10deg gacha)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        const xPercent = Math.round((x / rect.width) * 100);
        const yPercent = Math.round((y / rect.height) * 100);

        // Tezkor va silliq reaksiya (kursordan orqada qolmaydi)
        card.style.transition = 'transform 0.05s ease-out, border-color 0.15s ease, box-shadow 0.15s ease';
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.025, 1.025, 1.025)`;
        card.style.setProperty('--glare-x', `${xPercent}%`);
        card.style.setProperty('--glare-y', `${yPercent}%`);
    };

    const handleCardReset = (e) => {
        const card = e.currentTarget;
        if (!card) return;
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease, border-color 0.5s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
    };

    // PDF yuklab olish - QAT'IY 1 SAHIFA (Single Page A4)
    const handleDownload = async () => {
        if (isDownloading) return;
        const el = certRef.current;
        if (!el) return;

        setIsDownloading(true);
        const btns = document.querySelectorAll('.cert-action-btn');
        btns.forEach(b => b.style.opacity = '0');

        const originalWidth = el.style.width;
        const originalMaxWidth = el.style.maxWidth;
        const originalTransform = el.style.transform;

        try {
            // A4 single page render: 210mm x 297mm
            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            const RENDER_WIDTH_PX = 960;

            el.style.width = `${RENDER_WIDTH_PX}px`;
            el.style.maxWidth = 'none';
            el.style.transform = 'none';
            el.classList.add('pdf-render-mode');

            // 3x Ultra-sharp scale for crystal clear typography and crisp borders
            const canvas = await html2canvas(el, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#060d1f',
                scrollX: 0,
                scrollY: 0,
                logging: false,
                windowWidth: RENDER_WIDTH_PX
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Lossless PNG for razor-sharp text and graphics
            const imgData = canvas.toDataURL('image/png');

            // Qat'iy 1 sahifa qilib kiritish
            pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'SLOW');
            pdf.save(`ISTEDOD-AI-Sertifikat-${dateStr.replace(/\./g, '-')}.pdf`);
        } catch (e) {
            console.error("PDF generation failed:", e);
            alert("PDF generatsiya qilishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        } finally {
            el.classList.remove('pdf-render-mode');
            el.style.width = originalWidth;
            el.style.maxWidth = originalMaxWidth;
            el.style.transform = originalTransform;
            btns.forEach(b => b.style.opacity = '1');
            setIsDownloading(false);
        }
    };

    return (
        <motion.div
            className="cert-page-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {/* Yuqori boshqaruv tugmalari */}
            <div className="cert-floating-actions">
                {customBackBtn ? customBackBtn : (
                    <motion.button
                        className="cert-action-btn cert-action-restart"
                        onClick={onRestart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft size={16} />
                        <span>Bosh menyu</span>
                    </motion.button>
                )}
                <motion.button
                    className="cert-action-btn cert-action-download"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Download size={16} />
                    <span>{isDownloading ? "Yuklanmoqda..." : "PDF yuklab olish (1 list)"}</span>
                </motion.button>
            </div>

            {/* ════════════════════════════════════════════════════════════
                1 LIST SERTIFIKAT (A4 SINGLE SHEET — FLAT CONTAINER, 3D CARDS)
                Faqat 4 ta asosiy bo'lim:
                1. User haqida ma'lumot
                2. Kelajak kasb moyilliklari
                3. O'qishga kirish kerak bo'lgan universitetlar
                4. Qaysi fanlardan imtihon bo'lishi
            ════════════════════════════════════════════════════════════ */}
            <div
                className="cert-doc cert-single-page-glass"
                ref={certRef}
            >
                {/* 3D Glass Nur va Geometrik Bezaklar */}
                <div className="cert-glass-ambient orb-cyan" />
                <div className="cert-glass-ambient orb-purple" />
                <div className="cert-glass-border-glow" />

                {/* ── HEADER: Rasmiy Brend va Tasdiq ── */}
                <header className="cert-3d-header">
                    <div className="cert-3d-brand">
                        <div className="cert-3d-logo-badge">
                            <img src={istedotLogo} alt="ISTEDOD AI" className="cert-3d-logo-img" />
                        </div>
                        <div className="cert-3d-brand-text">
                            <div className="cert-3d-title-row">
                                <h1 className="cert-3d-main-title">ISTEDOD AI</h1>
                            </div>
                            <p className="cert-3d-subtitle">
                                Kasbiy Yo'nalish va Shaxsiy Qobiliyatlar Bo'yicha Rasmiy Sertifikat
                            </p>
                        </div>
                    </div>

                    <div
                        className="cert-3d-stamp-box cert-3d-glass-card"
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <div className="cert-3d-stamp-circle">
                            <CheckCircle2 size={18} className="cert-3d-stamp-icon" />
                            <span className="cert-3d-stamp-text">TASDIQLANDI</span>
                        </div>
                        <div className="cert-3d-meta-info">
                            <span className="cert-3d-meta-date">Sana: {dateStr}</span>
                            <span className="cert-3d-meta-id">{certNumber}</span>
                        </div>
                    </div>
                </header>

                <div className="cert-3d-divider" />

                {/* ── 1-BO'LIM: USER HAQIDA MA'LUMOT (Qisqacha Shaxsiy Portret) ── */}
                <section className="cert-3d-section cert-3d-user-section">
                    <div className="cert-3d-section-title">
                        <User size={18} className="cert-3d-sec-icon text-cyan" />
                        <h2>Foydalanuvchi Portreti va Qobiliyatlari</h2>
                    </div>

                    <div
                        className="cert-3d-glass-card cert-3d-user-card"
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <p className="cert-3d-user-summary">
                            {summary || "Suhbat davomida sizning qiziqishlaringiz, mustaqil fikrlashingiz va o'z oldingizga aniq maqsadlar qo'ya olish salohiyatingiz aniqlandi."}
                        </p>

                        <div className="cert-3d-user-details-row">
                            {character?.workStyle && (
                                <div className="cert-3d-badge-item">
                                    <span className="cert-3d-badge-label">Ish uslubi:</span>
                                    <span className="cert-3d-badge-val">{character.workStyle}</span>
                                </div>
                            )}
                            {character?.motivation && (
                                <div className="cert-3d-badge-item">
                                    <span className="cert-3d-badge-label">Asosiy kuch:</span>
                                    <span className="cert-3d-badge-val">{character.motivation}</span>
                                </div>
                            )}
                            {interests && interests.length > 0 && (
                                <div className="cert-3d-badge-item cert-3d-interests-badge">
                                    <span className="cert-3d-badge-label">Qiziqishlar:</span>
                                    <div className="cert-3d-mini-tags">
                                        {interests.slice(0, 3).map((item, idx) => (
                                            <span key={idx} className="cert-3d-chip">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── 2-BO'LIM: KELAJAK KASB MOYILLIKLARI (Tavsiya etilgan kasblar) ── */}
                <section className="cert-3d-section cert-3d-careers-section">
                    <div className="cert-3d-section-title">
                        <Briefcase size={18} className="cert-3d-sec-icon text-blue" />
                        <h2>Kelajak Kasb Moyilliklari (Tavsiya etilgan sohalar)</h2>
                    </div>

                    <div className="cert-3d-careers-grid">
                        {recommendedCareers.slice(0, 3).map((career, idx) => {
                            const name = typeof career === 'object' ? career.name : career;
                            const desc = typeof career === 'object' ? career.description : '';
                            const matchStr = typeof career === 'object' && career.match ? career.match : `${95 - idx * 4}%`;
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

                            return (
                                <div
                                    key={idx}
                                    className={`cert-3d-glass-card cert-3d-career-card ${idx === 0 ? 'primary-match' : ''}`}
                                    onMouseMove={handleCardTilt}
                                    onMouseLeave={handleCardReset}
                                >
                                    <div className="cert-3d-career-top">
                                        <span className="cert-3d-career-medal">{medal}</span>
                                        <div className="cert-3d-match-pill">
                                            <span>Moslik: {matchStr}</span>
                                        </div>
                                    </div>
                                    <h3 className="cert-3d-career-name">{name}</h3>
                                    {desc && <p className="cert-3d-career-desc">{desc}</p>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── 3-BO'LIM VA 4-BO'LIM: 2 USTUNLI YONDASHUV (A4 1 LISTGA TO'LIQ SIG'DIRISH) ── */}
                <div className="cert-3d-columns-row">
                    {/* 3-BO'LIM: UNIVERSITETLAR */}
                    <section className="cert-3d-section cert-3d-col">
                        <div className="cert-3d-section-title">
                            <GraduationCap size={18} className="cert-3d-sec-icon text-purple" />
                            <h2>Tavsiya Etilgan Universitetlar</h2>
                        </div>

                        <div
                            className="cert-3d-glass-card cert-3d-unis-card"
                            onMouseMove={handleCardTilt}
                            onMouseLeave={handleCardReset}
                        >
                            {primaryDirection && (
                                <div className="cert-3d-uni-direction-header">
                                    <span className="cert-3d-dir-tag">Yo'nalish:</span>
                                    <span className="cert-3d-dir-name">{primaryDirection}</span>
                                </div>
                            )}

                            <div className="cert-3d-unis-list">
                                {(() => {
                                    // Barcha universitetlarni to'plash (maksimal 3 ta)
                                    let unis = [];
                                    if (universityDirections && universityDirections.length > 0) {
                                        for (const dir of universityDirections) {
                                            if (dir.universities && Array.isArray(dir.universities)) {
                                                unis.push(...dir.universities);
                                            }
                                        }
                                    }
                                    if (unis.length === 0) {
                                        unis = [
                                            { name: "Toshkent Axborot Texnologiyalari Universiteti (TATU)", website: "tuit.uz" },
                                            { name: "O'zbekiston Milliy Universiteti (O'zMU)", website: "nuu.uz" },
                                            { name: "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)", website: "tsue.uz" }
                                        ];
                                    }

                                    return unis.slice(0, 3).map((u, i) => {
                                        const uniInfo = resolveUniversityInfo(u);

                                        return (
                                            <div
                                                key={i}
                                                className="cert-3d-glass-card cert-3d-uni-item clickable"
                                                onClick={() => window.open(uniInfo.url, '_blank', 'noopener,noreferrer')}
                                                onMouseMove={handleCardTilt}
                                                onMouseLeave={handleCardReset}
                                                title={`${uniInfo.name} rasmiy saytini ochish: ${uniInfo.url}`}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="cert-3d-uni-dot" />
                                                <div className="cert-3d-uni-details">
                                                    <span className="cert-3d-uni-name">{uniInfo.name}</span>
                                                    <a
                                                        href={uniInfo.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="cert-3d-uni-link clickable"
                                                        title={`${uniInfo.name} rasmiy saytini ochish`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(uniInfo.url, '_blank', 'noopener,noreferrer');
                                                        }}
                                                    >
                                                        <span>🌐 {uniInfo.displayUrl}</span>
                                                        <span className="cert-link-arrow">↗</span>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </section>

                    {/* 4-BO'LIM: QAYSI FANLARDAN IMTIHON BO'LISHI */}
                    <section className="cert-3d-section cert-3d-col">
                        <div className="cert-3d-section-title">
                            <BookOpen size={18} className="cert-3d-sec-icon text-cyan" />
                            <h2>Kirish Imtihon Fanlari</h2>
                        </div>

                        <div
                            className="cert-3d-glass-card cert-3d-exams-card"
                            onMouseMove={handleCardTilt}
                            onMouseLeave={handleCardReset}
                        >
                            {/* Mutaxassislik (Asosiy) Fanlar */}
                            <div className="cert-3d-exam-group">
                                <span className="cert-3d-exam-label">Asosiy mutaxassislik fanlari:</span>
                                <div className="cert-3d-exam-chips-row">
                                    {mainExams.map((subj, idx) => (
                                        <span key={idx} className="cert-3d-exam-chip main-chip">
                                            {subj}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Majburiy Blok */}
                            <div className="cert-3d-exam-group" style={{ marginTop: '10px' }}>
                                <span className="cert-3d-exam-label">Majburiy 3 ta fan:</span>
                                <div className="cert-3d-exam-chips-row">
                                    {mandatoryExams.map((subj, idx) => (
                                        <span key={idx} className="cert-3d-exam-chip mandatory-chip">
                                            {subj}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Motivatsion / Fan maslahati */}
                            <div className="cert-3d-exam-advice">
                                <span>💡 {subjectsAdvice || "Asosiy mutaxassislik fanlaridan chuqurlashtirilgan test va amaliy masalalarni yechishga kunlik vaqt ajrating."}</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── FOOTER: Tasdiq va QR Shtamp ── */}
                <footer className="cert-3d-footer">
                    <div className="cert-3d-footer-info">
                        <span className="cert-3d-ft-brand">ISTEDOD AI — Professional Kasbga Yo'naltirish Platformasi</span>
                        <p className="cert-3d-ft-note">
                            Ushbu sertifikat savol-javob muloqoti asosida sun'iy intellekt tomonidan tahlil qilindi.
                        </p>
                    </div>

                    <div
                        className="cert-3d-footer-stamp cert-3d-glass-card"
                        onMouseMove={handleCardTilt}
                        onMouseLeave={handleCardReset}
                    >
                        <div className="cert-3d-qr-placeholder">
                            <div className="cert-3d-qr-inner">
                                <Award size={20} className="text-cyan" />
                                <span>VALID</span>
                            </div>
                        </div>
                        <div className="cert-3d-sign-box">
                            <span className="cert-3d-sign-line">Istedod AI</span>
                            <span className="cert-3d-sign-title">Avtomatlashtirilgan Tizim</span>
                        </div>
                    </div>
                </footer>
            </div>
        </motion.div>
    );
};

export default CertificatePage;
