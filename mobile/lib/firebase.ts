import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebase-config';

let app;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
