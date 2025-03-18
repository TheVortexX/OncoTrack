import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC8DY3N6MNLX_gK1YJ3xEgvH3Bm_zj6JaM",
    authDomain: "onco-track.firebaseapp.com",
    projectId: "onco-track",
    storageBucket: "onco-track.firebasestorage.app",
    messagingSenderId: "542832934430",
    appId: "1:542832934430:web:e5b38d3bc8e0d6c0c6780f",
    measurementId: "G-MBPDWMFYY4"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };