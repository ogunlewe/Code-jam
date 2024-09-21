// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI3SlvYw_V8WI-GlTycdxlcuJqla4u-Q0",
  authDomain: "my-first-firebase-projec-125c6.firebaseapp.com",
  projectId: "my-first-firebase-projec-125c6",
  storageBucket: "my-first-firebase-projec-125c6.appspot.com",
  messagingSenderId: "499288857370",
  appId: "1:499288857370:web:0de0003dc033ccd927eaa3",
  measurementId: "G-FBE9BC4PDY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);