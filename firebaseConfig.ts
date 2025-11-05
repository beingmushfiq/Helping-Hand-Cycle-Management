import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#available-libraries
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBkpgth5nS4QIIcudpaYjG2K9-c4PHaWM4",
  authDomain: "helping-hand-trust-cycle.firebaseapp.com",
  projectId: "helping-hand-trust-cycle",
  storageBucket: "helping-hand-trust-cycle.firebasestorage.app",
  messagingSenderId: "885968059771",
  appId: "1:885968059771:web:5eea577f1d902b1fdb91de",
  measurementId: "G-HTR2VWKK5M"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
