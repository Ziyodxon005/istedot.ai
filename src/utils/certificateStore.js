const STORAGE_KEY = 'istedod_certificates';

/** Barcha saqlab qo'yilgan sertifikatlarni qaytaradi */
export function getSavedCertificates() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Yangi sertifikatni saqlaydi (dublikatni tekshirmaydi) */
export function saveCertificate(analysisData) {
    try {
        const existing = getSavedCertificates();
        const now = new Date();
        const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newCert = {
            id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            date: dateStr,
            time: timeStr,
            timestamp: now.getTime(),
            summary: analysisData.summary || '',
            hollandPrimary: analysisData.hollandCode?.primary || '',
            topCareer: analysisData.recommendedCareers?.[0]?.name || analysisData.recommendedCareers?.[0] || '',
            data: analysisData,
        };

        // Keep latest 20 certificates max
        const updated = [newCert, ...existing].slice(0, 20);
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
