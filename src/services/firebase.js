/**
 * Firebase konfiguratsiyasi va servislar
 * ISTEDOD AI - Barcha natijalarni Firebase'ga saqlash
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyDSskjwIvWX5WsesUNctKFeDioOnZiNRpI",
    authDomain: "istedot-ai.firebaseapp.com",
    projectId: "istedot-ai",
    storageBucket: "istedot-ai.firebasestorage.app",
    messagingSenderId: "10141200308",
    appId: "1:10141200308:web:ce35d57bb2ceab43af8ce1",
    measurementId: "G-4GTEH9E4N2"
};


// Firebase ilovasini ishga tushirish
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn('Firebase initialization warning:', error.message);
}

/**
 * Suhbat natijasini Firebase'ga saqlash
 */
export async function saveConversationResult(analysisData, userInfo = {}) {
    if (!db) {
        console.warn('Firebase not initialized, saving to localStorage only');
        return null;
    }

    try {
        const docRef = await addDoc(collection(db, 'results'), {
            type: 'conversation', // suhbat asosida
            userInfo: {
                name: userInfo.name || 'Noma\'lum',
                surname: userInfo.surname || '',
                school: userInfo.school || '',
            },
            analysisData: analysisData,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
        });
        console.log('Suhbat natijasi Firebase\'ga saqlandi:', docRef.id);
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
    if (!db) {
        console.warn('Firebase not initialized, saving to localStorage only');
        return null;
    }

    try {
        const docRef = await addDoc(collection(db, 'results'), {
            type: 'test', // test asosida
            userInfo: {
                name: userInfo.name || '',
                surname: userInfo.surname || '',
                school: userInfo.school || '',
            },
            testAnswers: testAnswers,
            analysisData: analysisData,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
        });
        console.log('Test natijasi Firebase\'ga saqlandi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Firebase saqlash xatosi:', error);
        return null;
    }
}

/**
 * Barcha natijalarni olish (admin uchun)
 */
export async function getAllResults(maxCount = 50) {
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

export { db };
