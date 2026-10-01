const STORAGE_KEY = 'istedod_certificates';

/** Dublikatlarni tozalash (bir xil summary yoki kasbga ega sertifikatlardan faqat 1 tasini qoldiradi) */
function deduplicateCertificates(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];

    for (const cert of list) {
        if (!cert) continue;
        const summaryKey = (cert.summary || cert.data?.summary || '').trim().slice(0, 80);
        const careerKey = (cert.topCareer || cert.data?.recommendedCareers?.[0]?.name || '').trim();
        const key = summaryKey ? `${careerKey}:::${summaryKey}` : (cert.id || Math.random());

        if (!seen.has(key)) {
            seen.add(key);
            result.push(cert);
        }
    }
    return result;
}

/** Barcha saqlab qo'yilgan sertifikatlarni qaytaradi (avtomatik dublikatlardan tozalangan holda) */
export function getSavedCertificates() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const clean = deduplicateCertificates(parsed);
        // Agar dublikatlar tozalangan bo'lsa, localStorage'ga ham tozalangan nusxasini saqlab qo'yamiz
        if (clean.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
    } catch {
        return [];
    }
}

/** Yangi sertifikatni saqlaydi (dublikatlarni qat'iy tekshiradi va takroriy saqlashdan himoya qiladi) */
export function saveCertificate(analysisData) {
    if (!analysisData) return null;
    try {
        const existing = getSavedCertificates();
        const now = new Date();
        const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const summary = (analysisData.summary || '').trim();
        const topCareer = (analysisData.recommendedCareers?.[0]?.name || analysisData.recommendedCareers?.[0] || '').trim();

        // 1. Dublikatni tekshirish: agar xuddi shu summaryga ega sertifikat bo'lsa, qayta saqlanmasin!
        const duplicate = existing.find(c => {
            const cSummary = (c.summary || c.data?.summary || '').trim();
            if (summary && cSummary && summary.slice(0, 80) === cSummary.slice(0, 80)) return true;
            return false;
        });

        if (duplicate) {
            console.log('Dublikat sertifikat aniqlandi — qayta saqlash bekor qilindi:', duplicate.id);
            return duplicate.id;
        }

        const newCert = {
            id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            date: dateStr,
            time: timeStr,
            timestamp: now.getTime(),
            summary: summary,
            hollandPrimary: analysisData.hollandCode?.primary || '',
            topCareer: topCareer,
            data: analysisData,
        };

        // Keep latest 20 certificates max (clean, no duplicates)
        const updated = deduplicateCertificates([newCert, ...existing]).slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newCert.id;
    } catch (e) {
        console.error('Failed to save certificate:', e);
        return null;
    }
}

/** ID bo'yicha bitta sertifikatni o'chiradi */
export function deleteCertificate(id) {
    try {
        const existing = getSavedCertificates();
        const updated = existing.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to delete certificate:', e);
    }
}
