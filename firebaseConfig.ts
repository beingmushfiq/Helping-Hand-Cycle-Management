// FIX: Refactor to Firebase v8 namespaced API to resolve module import errors.
// Corrected: Use compat imports for Firebase v8 API compatibility.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = firebase.auth();

// Initialize Cloud Firestore and get a reference to the service
export const db = firebase.firestore();

// Enable offline persistence for a more seamless user experience
db.enablePersistence()
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          // This can happen if multiple tabs are open.
          console.warn('Firestore persistence failed: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
          // The browser does not support all features required for persistence.
          console.warn('Firestore persistence is not supported in this browser.');
      }
  });