/**
 * Firebase konfiguratsiyasi va servislar
 * ISTEDOD AI - Barcha natijalarni Firebase'ga saqlash
 * Admin tizimi: Super Admin + School Admin (Direktor)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, deleteDoc, updateDoc, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDSskjwIvWX5WsesUNctKFeDioOnZiNRpI",
    authDomain: "istedot-ai.firebaseapp.com",
    projectId: "istedot-ai",
    storageBucket: "istedot-ai.firebasestorage.app",
    messagingSenderId: "10141200308",
    appId: "1:10141200308:web:ce35d57bb2ceab43af8ce1",
    measurementId: "G-4GTEH9E4N2"
};

// Super Admin paroli (faqat bitta)
export const SUPER_ADMIN_PASSWORD = 'istedod2026super';

let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn('Firebase initialization warning:', error.message);
}

// ===================== NATIJALAR =====================

/**
 * Suhbat natijasini Firebase'ga saqlash
 */
export async function saveConversationResult(analysisData, userInfo = null) {
    if (!db) return null;
    try {
        // userInfo ni analysisData._userInfo dan yoki alohida parametrdan olish
        const info = userInfo || analysisData?._userInfo || {};
        const docRef = await addDoc(collection(db, 'results'), {
            type: 'conversation',
            userInfo: {
                name: info.name || 'Noma\'lum',
                surname: info.surname || '',
                school: info.school || '',
                grade: info.grade || '',
            },
            analysisData: analysisData,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Firebase saqlash xatosi:', error);
        return null;
    }
}

/**
 * Test natijasini Firebase'ga saqlash
 */
export async function saveTestResult(analysisData, userInfo, testAnswers = []) {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'results'), {
            type: 'test',
            userInfo: {
                name: userInfo.name || '',
                surname: userInfo.surname || '',
                school: userInfo.school || '',
                grade: userInfo.grade || '',
            },
            testAnswers: testAnswers,
            analysisData: analysisData,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Firebase saqlash xatosi:', error);
        return null;
    }
}

/**
 * Barcha natijalarni olish (super admin uchun)
 */
export async function getAllResults(maxCount = 500) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'results'),
            orderBy('timestamp', 'desc'),
            limit(maxCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Firebase o\'qish xatosi:', error);
        return [];
    }
}

/**
 * Maktab bo'yicha natijalarni olish (admin uchun)
 */
export async function getResultsBySchool(schoolName, maxCount = 500) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'results'),
            orderBy('timestamp', 'desc'),
            limit(maxCount)
        );
        const snapshot = await getDocs(q);
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter by school name (case insensitive)
        return all.filter(r => {
            const school = (r.userInfo?.school || '').toLowerCase().trim();
            return school === schoolName.toLowerCase().trim();
        });
    } catch (error) {
        console.error('Maktab natijalari xatosi:', error);
        return [];
    }
}

// ===================== MAKTABLAR =====================

/**
 * Yangi maktab qo'shish (Super Admin)
 */
export async function addSchool(schoolData) {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'schools'), {
            name: schoolData.name,
            directorName: schoolData.directorName,
            directorSurname: schoolData.directorSurname,
            password: schoolData.password,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Maktab qo\'shish xatosi:', error);
        return null;
    }
}

/**
 * Barcha maktablarni olish
 */
export async function getSchools() {
    if (!db) return [];
    try {
        const q = query(collection(db, 'schools'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Maktablar olish xatosi:', error);
        return [];
    }
}

/**
 * Maktab o'chirish (Super Admin)
 */
export async function deleteSchool(schoolId) {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'schools', schoolId));
        return true;
    } catch (error) {
        console.error('Maktab o\'chirish xatosi:', error);
        return false;
    }
}

/**
 * Maktab tahrirlash (Super Admin)
 */
export async function updateSchool(schoolId, data) {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'schools', schoolId), {
            name: data.name,
            directorName: data.directorName,
            directorSurname: data.directorSurname,
            password: data.password,
        });
        return true;
    } catch (error) {
        console.error('Maktab tahrirlash xatosi:', error);
        return false;
    }
}

/**
 * Admin login tekshirish — parolni maktab parol bilan solishtrish
 * Returns: { role: 'super' | 'admin', school: schoolData } yoki null
 */
export async function verifyAdminLogin(password) {
    // Super admin
    if (password === SUPER_ADMIN_PASSWORD) {
        return { role: 'super', school: null };
    }

    // Maktab adminlari (direktorlar) orasidan qidirish
    const schools = await getSchools();
    const matched = schools.find(s => s.password === password);
    if (matched) {
        return { role: 'admin', school: matched };
    }

    return null;
}

// ═══════ SERTIFIKAT QR CODE UCHUN ═══════
export async function saveCertToFirebase(certData, certId) {
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'certificates', certId), {
            data: certData,
            createdAt: Date.now()
        });
        return certId;
    } catch (err) {
        console.error('Cert save error:', err);
        return null;
    }
}

export async function getCertFromFirebase(certId) {
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'certificates', certId));
        if (snap.exists()) return snap.data().data;
        return null;
    } catch (err) {
        console.error('Cert get error:', err);
        return null;
    }
}

export { db };
