import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveCertificate } from '../utils/certificateStore';

const HOLLAND = {
    R: { name: 'Realistik', color: '#fb923c', bg: '#fb923c18' },
    I: { name: 'Intellektual', color: '#818cf8', bg: '#818cf818' },
    A: { name: 'Artistik', color: '#f472b6', bg: '#f472b618' },
    S: { name: 'Ijtimoiy', color: '#34d399', bg: '#34d39918' },
    E: { name: 'Tadbirkorlik', color: '#fbbf24', bg: '#fbbf2418' },
    C: { name: 'Konvensional', color: '#22d3ee', bg: '#22d3ee18' },
};

const GARDNER_ICONS = {
    'Mantiqiy-Matematik': '🔢',
    'Lingvistik-Verbal': '💬',
    'Vizual-Fazoviy': '🎨',
    'Musiqiy': '🎵',
    'Kinestetik-Tananing': '⚡',
    'Interpersonal': '🤝',
    'Intrapersonal': '🧘',
    'Naturalistik': '🌿',
};

// Mandatory blocks for Uzbekistan university entrance exams
const MANDATORY_SUBJECTS = ["Ona tili va adabiyot", "O'zbekiston tarixi", "Matematika"];

// Direction-specific entrance exam subjects (Uzbekistan DTM)
const DIRECTION_SUBJECTS = {
    'texnologiya': ['Fizika', 'Matematika (chuqur)'],
    'kompyuter': ['Informatika', 'Matematika (chuqur)'],
    'it': ['Informatika', 'Matematika (chuqur)'],
    'dasturlash': ['Informatika', 'Matematika (chuqur)'],
    'sun\'iy': ['Informatika', 'Matematika (chuqur)'],
    'muhandis': ['Fizika', 'Matematika (chuqur)'],
    'elektr': ['Fizika', 'Matematika (chuqur)'],
    'qurilish': ['Fizika', 'Chizma geometriya'],
    'arxitektur': ['Chizma geometriya', 'Rasm'],
    'tibbiyot': ['Biologiya', 'Kimyo'],
    'farmatsevt': ['Kimyo', 'Biologiya'],
    'iqtisod': ['Matematika (chuqur)', 'Ingliz tili'],
    'moliya': ['Matematika (chuqur)', 'Ingliz tili'],
    'huquq': ["O'zbek tili va adabiyot", 'Tarix'],
    'psixolog': ['Tarix', 'Ingliz tili'],
    'psixologiya': ['Tarix', 'Ingliz tili'],
    'pedagog': ["O'zbek tili va adabiyot", 'Tarix'],
    'maktabgacha': ["O'zbek tili va adabiyot", 'Tarix'],
    'til': ['Ingliz tili', "O'zbek tili va adabiyot"],
    'jurnalist': ['Ingliz tili', "O'zbek tili va adabiyot"],
    'ijtimoiy': ['Tarix', 'Ingliz tili'],
    'san\'at': ['Rasm', 'Musiqa'],
    'musiqa': ['Musiqa', "O'zbek tili va adabiyot"],
    'sport': ['Biologiya', 'Jismoniy tarbiya'],
    'menejment': ['Matematika', 'Ingliz tili'],
    'marketing': ['Matematika', 'Ingliz tili'],
    'turizm': ['Geografiya', 'Ingliz tili'],
    'xalqaro': ['Tarix', 'Ingliz tili'],
    'diplomatiya': ['Tarix', 'Ingliz tili'],
};

// Full university name lookup
const UNI_FULL_NAMES = {
    'TATU': "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    'TDTU': "Toshkent Davlat Texnika Universiteti (TDTU)",
    'TDPU': "Toshkent Davlat Pedagogika Universiteti (TDPU)",
    'NamDU': "Namangan Davlat Universiteti (NamDU)",
    'SamDU': "Samarqand Davlat Universiteti (SamDU)",
    'ToshDTU': "Toshkent Davlat Texnika Universiteti (ToshDTU)",
    'TDSHU': "Toshkent Davlat Sharqshunoslik Universiteti (TDSHU)",
    'MDU': "Muhammad al-Xorazmiy nomidagi Toshkent Axborot Texnologiyalari Universiteti",
    'TDYI': "Toshkent Davlat Yuridik Instituti (TDYI)",
    'TDI': "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)",
    'TDIU': "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)",
    'TMA': "Toshkent Tibbiyot Akademiyasi (TMA)",
    'TTI': "Toshkent Tibbiyot Instituti (TTI)",
    'AKFA': "AKFA Universiteti",
    'Webster': "Webster University Toshkent",
    'INHA': "INHA Universiteti Toshkentda",
    'InEU': "Innovation University (InEU)",
    'Kimyo': "O'zbekiston Kimyo va Biologiya Universiteti",
    'BSU': "Buxoro Davlat Universiteti (BSU)",
    'QarDU': "Qarshi Davlat Universiteti (QarDU)",
    'NamMQI': "Namangan Muhandislik-Qurilish Instituti (NamMQI)",
    'FarDU': "Farg'ona Davlat Universiteti (FarDU)",
    'AndDU': "Andijon Davlat Universiteti (AndDU)",
};

function expandUniName(rawName) {
    if (!rawName) return rawName;
    // Check if short abbreviation matches our lookup
    const trimmed = rawName.trim();
    if (UNI_FULL_NAMES[trimmed]) return UNI_FULL_NAMES[trimmed];
    // Try to find abbreviation within the name
    for (const [abbr, full] of Object.entries(UNI_FULL_NAMES)) {
        if (trimmed === abbr || trimmed.startsWith(abbr + ' ') || trimmed.startsWith(abbr + ' —')) {
            return full;
        }
    }
    return trimmed; // Return as-is if not found
}

function getSubjectsForDirection(directionName) {
    const lower = (directionName || '').toLowerCase();
    for (const [key, subs] of Object.entries(DIRECTION_SUBJECTS)) {
        if (lower.includes(key)) return subs;
    }
    return ['Ingliz tili', "O'zbek tili va adabiyot"];
}

const CertificatePage = ({ analysisData, onRestart, skipAutoSave = false, customBackBtn = null }) => {
    const certRef = useRef(null);
    const savedRef = useRef(false);

    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    if (!analysisData) return null;

    // Auto-save to localStorage once on first render
    useEffect(() => {
        if (!skipAutoSave && !savedRef.current && analysisData) {
            savedRef.current = true;
            saveCertificate(analysisData);
        }
    }, [analysisData, skipAutoSave]);

    // 🔍 DEBUG: Uncomment this to inspect what AI actually sent
    console.table({
        summary: analysisData.summary?.slice(0, 100),
        interests: JSON.stringify(analysisData.interests),
        workStyle: analysisData.character?.workStyle,
        motivation: analysisData.character?.motivation,
        hollandPrimary: analysisData.hollandCode?.primary,
        careers: JSON.stringify((analysisData.recommendedCareers || []).map(c => c.name)),
        steps: JSON.stringify((analysisData.stepsToAchieve || []).slice(0, 2)),
    });

    const {
        interests = [],
        character = {},
        hollandCode = {},
        gardnerIntelligences = [],
        recommendedCareers = [],
        stepsToAchieve = [],
        universityDirections = [],
        summary = '',
        subjectsAdvice = ''
    } = analysisData;

    const primaryH = HOLLAND[hollandCode.primary] || { name: hollandCode.primary, color: '#4db8ff', bg: '#4db8ff18' };
    const secondaryH = HOLLAND[hollandCode.secondary] || { name: hollandCode.secondary, color: '#818cf8', bg: '#818cf818' };

    const handleDownload = async () => {
        const el = certRef.current;
        if (!el) return;
        const btns = document.querySelectorAll('.cert-action-btn');
        btns.forEach(b => b.style.display = 'none');
        
        const originalMaxWidth = el.style.maxWidth;
        const originalWidth = el.style.width;
        const originalMargin = el.style.margin;
        const originalTransform = el.style.transform;

        try {
            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            const RENDER_PX_WIDTH = 1000; 
            el.style.maxWidth = 'none';
            el.style.width = RENDER_PX_WIDTH + 'px';
            el.style.margin = '0';
            el.style.transform = 'none';

            const canvas = await html2canvas(el, {
                scale: 2, // HiDPI quality
                useCORS: true,
                backgroundColor: '#050b18',
                scrollX: 0,
                scrollY: 0,
                windowWidth: RENDER_PX_WIDTH,
                logging: false,
            });

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // ─── Calculate how many A4 pages are needed ───────────────────────
            // pdfImgWidth = full A4 width in mm
            // pdfImgHeight = the proportional height of the canvas in mm
            const pdfImgWidth = A4_WIDTH_MM;
            const pdfImgHeight = (imgHeight / imgWidth) * pdfImgWidth;

            const totalPages = Math.ceil(pdfImgHeight / A4_HEIGHT_MM);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // ─── Slice canvas into A4-height chunks and add each as a page ────
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage();

                // How many canvas pixels correspond to one A4 page height?
                const pageHeightPx = Math.round((A4_HEIGHT_MM / pdfImgWidth) * imgWidth);
                const srcY = page * pageHeightPx;
                const srcH = Math.min(pageHeightPx, imgHeight - srcY);

                // Create a slice canvas for this page
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = imgWidth;
                pageCanvas.height = pageHeightPx; // Always full page height (blank at end if needed)
                const ctx = pageCanvas.getContext('2d');
                ctx.fillStyle = '#050b18';
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH);

                const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
                // Rendered page height in mm (for last page may be less)
                const renderedPageHeightMM = (srcH / imgWidth) * pdfImgWidth;
                pdf.addImage(pageImgData, 'JPEG', 0, 0, A4_WIDTH_MM, renderedPageHeightMM);
            }

            pdf.save(`ISTEDOD-AI-Sertifikat-${dateStr.replace(/\//g, '-')}.pdf`);
        } catch (e) {
            console.error("PDF generation failed:", e);
            alert("PDF yuklanmadi, sababi xato bor: " + e.message + ". Iltimos shu xatoni yuboring.");
        }
        finally { 
            el.style.maxWidth = originalMaxWidth;
            el.style.width = originalWidth;
            el.style.margin = originalMargin;
            el.style.transform = originalTransform;
            btns.forEach(b => b.style.display = ''); 
        }
    };

    return (
        <motion.div
            className="cert-page-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Floating Action Buttons */}
            <div className="cert-floating-actions">
                {customBackBtn ? customBackBtn : (
                    <motion.button className="cert-action-btn cert-action-restart" onClick={onRestart}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        ↩ Qayta boshlash
                    </motion.button>
                )}
                <motion.button className="cert-action-btn cert-action-download" onClick={handleDownload}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    ⬇ PDF yuklab olish
                </motion.button>
            </div>

            {/* ══════════════════════════════════════ CERTIFICATE ══ */}
            <div className="cert-doc" ref={certRef}>

                {/* ── HEADER ──────────────────────────────────────── */}
                <div className="cert-doc-header">
                    <div className="cert-doc-brand">
                        <div className="cert-doc-logo"><span>I</span></div>
                        <div>
                            <h1 className="cert-doc-title">ISTEDOD AI</h1>
                            <p className="cert-doc-subtitle">
                                Ma'lumotlar sun'iy intellekt orqali savol-javob tahlili asosida to'plangan · {dateStr}
                            </p>
                        </div>
                    </div>
                    <div className="cert-badge-ring">
                        <svg viewBox="0 0 60 60" width="60" height="60" className="cert-badge-svg">
                            <circle cx="30" cy="30" r="27" fill="none" stroke="#4db8ff" strokeWidth="1.5" strokeDasharray="4 2" />
                            <text x="50%" y="55%" textAnchor="middle" fill="#4db8ff" fontSize="10"
                                fontFamily="Outfit,sans-serif" fontWeight="700">✓</text>
                        </svg>
                        <span>Tasdiqlandi</span>
                    </div>
                </div>

                <div className="cert-doc-divider" />

                {/* ── SUMMARY (FULL WIDTH) ────────────────────────── */}
                <div className="cert-summary-block" style={{ marginBottom: '32px' }}>
                    <p className="cert-hero-label">Psixologik Tahlil Sertifikati</p>
                    <p className="cert-hero-summary">{summary}</p>
                </div>

                {/* ── HERO GRID ───────────────────────────────────── */}
                <div className="cert-hero">
                    {/* Left: Meta cards */}
                    <div className="cert-hero-left" style={{ flex: 1 }}>
                        {/* Meta info — styled mini cards */}
                        <div className="cert-meta-grid">
                            {character?.workStyle && (
                                <div className="cert-meta-card">
                                    <span className="cert-meta-icon">🎯</span>
                                    <div>
                                        <p className="cert-meta-label">Ish uslubi</p>
                                        <p className="cert-meta-value">{character.workStyle}</p>
                                    </div>
                                </div>
                            )}
                            {character?.motivation && (
                                <div className="cert-meta-card">
                                    <span className="cert-meta-icon">💡</span>
                                    <div>
                                        <p className="cert-meta-label">Asosiy motivatsiya</p>
                                        <p className="cert-meta-value">{character.motivation}</p>
                                    </div>
                                </div>
                            )}
                            {interests.length > 0 && (
                                <div className="cert-meta-card cert-meta-card--wide">
                                    <span className="cert-meta-icon">⭐</span>
                                    <div>
                                        <p className="cert-meta-label">Qiziqishlar</p>
                                        <div className="cert-meta-tags">
                                            {interests.map((int, i) => (
                                                <span key={i} className="cert-interest-tag">{int}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {character?.mainTraits?.length > 0 && (
                                <div className="cert-meta-card cert-meta-card--wide">
                                    <span className="cert-meta-icon">🧩</span>
                                    <div>
                                        <p className="cert-meta-label">Shaxsiy xususiyatlar</p>
                                        <div className="cert-meta-tags">
                                            {character.mainTraits.map((t, i) => (
                                                <span key={i} className="cert-trait-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Holland Code card */}
                    <div className="cert-hero-right">
                        <div className="cert-holland-card">
                            <p className="cert-holland-card-title">Holland Kodi</p>
                            <div className="cert-holland-pills-col">
                                <div className="cert-code-pill-v2" style={{ background: primaryH.bg, borderColor: primaryH.color }}>
                                    <span className="cert-code-letter-v2" style={{ color: primaryH.color }}>{hollandCode.primary}</span>
                                    <div>
                                        <p className="cert-code-name-v2" style={{ color: primaryH.color }}>{primaryH.name}</p>
                                        <p className="cert-code-tag-v2">Asosiy tip</p>
                                    </div>
                                </div>
                                {hollandCode.secondary && (
                                    <div className="cert-code-pill-v2" style={{ background: secondaryH.bg, borderColor: secondaryH.color }}>
                                        <span className="cert-code-letter-v2" style={{ color: secondaryH.color }}>{hollandCode.secondary}</span>
                                        <div>
                                            <p className="cert-code-name-v2" style={{ color: secondaryH.color }}>{secondaryH.name}</p>
                                            <p className="cert-code-tag-v2">Ikkinchi tip</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {hollandCode.description && (
                                <p className="cert-holland-desc">{hollandCode.description}</p>
                            )}
                            {hollandCode.scores && (
                                <p className="cert-holland-scores">{hollandCode.scores}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── GRID ROW 1 ──────────────────────────────────── */}
                <div className="cert-grid-2">

                    {/* Holland bars */}
                    <div className="cert-panel">
                        <div className="cert-panel-head">
                            <span className="cert-panel-icon">⬡</span>
                            <h3>Holland RIASEC Profili - Kasbiy shaxsiyat tahlili</h3>
                        </div>
                        <div className="cert-holland-bars">
                            {Object.entries(HOLLAND).map(([key, meta]) => {
                                let scoreVal = 50;
                                if (hollandCode.scores) {
                                    const m = hollandCode.scores.match(new RegExp(key + ':(\\d+)'));
                                    if (m) scoreVal = parseInt(m[1]);
                                }
                                const isPrimary = key === hollandCode.primary;
                                const isSecondary = key === hollandCode.secondary;
                                return (
                                    <div key={key} className="cert-hbar-row">
                                        <span className="cert-hbar-key" style={{ color: meta.color }}>{key}</span>
                                        <span className="cert-hbar-name">{meta.name}</span>
                                        <div className="cert-hbar-track">
                                            <motion.div
                                                className="cert-hbar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${scoreVal}%` }}
                                                transition={{ duration: 0.9, delay: 0.2 }}
                                                style={{ background: meta.color, opacity: isPrimary || isSecondary ? 1 : 0.4 }}
                                            />
                                        </div>
                                        <span className="cert-hbar-val">{scoreVal}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Gardner */}
                    <div className="cert-panel">
                        <div className="cert-panel-head">
                            <span className="cert-panel-icon">🧠</span>
                            <h3>Gardner Ko'p Intellekt Profili - Yashirin qobilyatlar</h3>
                        </div>
                        <div className="cert-gardner-grid">
                            {gardnerIntelligences.map((g, i) => {
                                const icon = GARDNER_ICONS[g.type] || '✦';
                                const lvl = parseInt(g.level) || 50;
                                return (
                                    <div key={i} className="cert-gardner-item">
                                        <div className="cert-gardner-top">
                                            <span className="cert-gardner-icon">{icon}</span>
                                            <span className="cert-gardner-name">{g.type}</span>
                                            <span className="cert-gardner-pct">{lvl}%</span>
                                        </div>
                                        <div className="cert-gardner-bar">
                                            <motion.div
                                                className="cert-gardner-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${lvl}%` }}
                                                transition={{ duration: 0.7, delay: i * 0.07 + 0.3 }}
                                                style={{ background: `hsl(${190 + i * 25}, 75%, 58%)` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── CAREERS ─────────────────────────────────────── */}
                <div className="cert-panel cert-panel-full">
                    <div className="cert-panel-head">
                        <span className="cert-panel-icon">💼</span>
                        <h3>Tavsiya Etilgan Kasblar</h3>
                    </div>
                    <div className="cert-careers-row">
                        {recommendedCareers.map((c, i) => {
                            const isObj = typeof c === 'object';
                            const name = isObj ? c.name : c;
                            const desc = isObj ? c.description : '';
                            
                            // Deterministic match percentage
                            let match = 90 - (i * 3);
                            if (isObj && typeof c.match === 'string') {
                                const text = c.match.toLowerCase();
                                if (text.includes('juda yuqori')) match = 96 - i * 2;
                                else if (text.includes('yuqori')) match = 88 - i * 2;
                                else if (text.includes("o'rta") || text.includes('orta')) match = 75 - i * 2;
                                else match = parseInt(c.match) || match;
                            } else if (isObj && typeof c.match === 'number') {
                                match = c.match;
                            }

                            return (
                                <div key={i} className={`cert-career-card ${i === 0 ? 'top' : ''}`}>
                                    <div className="cert-career-card-header">
                                        <span className="cert-career-medal">{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</span>
                                        <div className="cert-career-ring-wrap">
                                            <svg className="cert-ring-svg" viewBox="0 0 52 52" width="52" height="52">
                                                <circle cx="26" cy="26" r="22" fill="none" stroke="#0a1628" strokeWidth="4" />
                                                <motion.circle
                                                    cx="26" cy="26" r="22"
                                                    fill="none"
                                                    stroke={i === 0 ? '#4db8ff' : i === 1 ? '#818cf8' : '#34d399'}
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                                                    animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - match / 100) }}
                                                    transition={{ duration: 1.2, delay: i * 0.2 + 0.3 }}
                                                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                                />
                                                <text x="50%" y="55%" textAnchor="middle" fill="white"
                                                    fontSize="10" fontFamily="Outfit,sans-serif" fontWeight="700">{match}%</text>
                                            </svg>
                                            <span className="cert-career-ring-label">Moslik</span>
                                        </div>
                                    </div>
                                    <h4 className="cert-career-card-name">{name}</h4>
                                    {desc && <p className="cert-career-card-desc">{desc}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── ROADMAP ─────────────────────────────────────── */}
                {stepsToAchieve.length > 0 && (
                    <div className="cert-panel cert-panel-full">
                        <div className="cert-panel-head">
                            <span className="cert-panel-icon">🗺️</span>
                            <h3>Maqsadga Erishish Yo'l Xaritasi</h3>
                        </div>
                        <div className="cert-roadmap">
                            {stepsToAchieve.map((step, i) => {
                                // Clean up "1. " prefix if AI already added it
                                const cleanStep = step.replace(/^\d+\.\s*/, '');
                                return (
                                    <motion.div
                                        key={i}
                                        className="cert-roadmap-step"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 + 0.3 }}
                                    >
                                        <div className="cert-roadmap-num">{i + 1}</div>
                                        <p className="cert-roadmap-text">{cleanStep}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── UNIVERSITIES ────────────────────────────────── */}
                {universityDirections.length > 0 && (
                    <div className="cert-panel cert-panel-full">
                        <div className="cert-panel-head">
                            <span className="cert-panel-icon">🎓</span>
                            <h3>Tavsiya Etilgan Universitetlar va Yo'nalishlar</h3>
                        </div>
                        <div className="cert-unis-grid">
                            {universityDirections.map((dir, di) => {
                                const unis = dir.universities || [];
                                const dirSubjects = getSubjectsForDirection(dir.direction);
                                return (
                                    <div key={di} className="cert-uni-dir">
                                        <div className="cert-uni-dir-head">
                                            {dir.code && <span className="cert-uni-code">{dir.code}</span>}
                                            <h4>{dir.direction}</h4>
                                        </div>
                                        <ul className="cert-uni-list">
                                            {unis.map((u, ui) => {
                                                const isObj = typeof u === 'object';
                                                const name = isObj ? u.name : u;
                                                const phone = isObj ? u.phone : null;
                                                const website = isObj ? u.website : null;
                                                const cleanSite = website ? website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
                                                return (
                                                    <li key={ui} className="cert-uni-item">
                                                        <div className="cert-uni-item-main">
                                                            <span className="cert-uni-dot" />
                                                            <div className="cert-uni-item-info">
                                                                <span className="cert-uni-name-text">{expandUniName(name)}</span>
                                                                <div className="cert-uni-links">
                                                                    {phone && (
                                                                        <span className="cert-uni-link-item">📞 {phone}</span>
                                                                    )}
                                                                    {cleanSite && (
                                                                        <a href={`https://${cleanSite}`} target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="cert-uni-link-item cert-uni-site">
                                                                            🌐 {cleanSite}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {/* Entrance exam info */}
                                        <div className="cert-exam-block">
                                            <p className="cert-exam-title">📋 Kirish imtihonlari:</p>
                                            <div className="cert-exam-subjects">
                                                <div className="cert-exam-group">
                                                    <span className="cert-exam-group-label">Majburiy blok:</span>
                                                    <div className="cert-exam-chips">
                                                        {MANDATORY_SUBJECTS.map((s, si) => (
                                                            <span key={si} className="cert-exam-chip mandatory">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="cert-exam-group">
                                                    <span className="cert-exam-group-label">Yo'nalish fanlari:</span>
                                                    <div className="cert-exam-chips">
                                                        {dirSubjects.map((s, si) => (
                                                            <span key={si} className="cert-exam-chip direction">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="cert-exam-tip">💪 Ana shu fanlarga e'tibor qarating — sizning kelajakdagi kasbingiz aynan shu bilimlar ustida quriladi. Omad!</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {subjectsAdvice && (
                            <div className="cert-subjects-advice" style={{
                                marginTop: '20px',
                                padding: '16px',
                                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                                borderLeft: '4px solid #34d399',
                                borderRadius: '8px',
                                color: '#e2e8f0',
                                fontSize: '15px',
                                lineHeight: '1.6'
                            }}>
                                {subjectsAdvice}
                            </div>
                        )}
                    </div>
                )}


                {/* ── FOOTER ──────────────────────────────────────── */}
                <div className="cert-doc-footer">
                    <p>ISTEDOD AI — Sun'iy Intellekt Asosida Kasbiy Yo'nalish Tizimi</p>
                    <p>Ushbu sertifikat sun'iy intellekt tomonidan savol-javob tahlili orqali avtomatik yaratilgan · istedod.ai</p>
                </div>
            </div>
        </motion.div>
    );
};

export default CertificatePage;
