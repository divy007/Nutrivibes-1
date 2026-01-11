import * as admin from 'firebase-admin';

// Lazy initialization function
const getFirebaseAdmin = () => {
    if (!admin.apps.length) {
        try {
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

            if (serviceAccountKey) {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } else {
                // Don't throw here, just warn. Throw when trying to use it.
                console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set.');
            }
        } catch (error) {
            console.error('Firebase admin initialization error', error);
        }
    }
    return admin;
};

export const verifyIdToken = async (token: string) => {
    const app = getFirebaseAdmin();
    if (!app.apps.length) {
        throw new Error('Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY.');
    }
    return await app.auth().verifyIdToken(token);
};
