// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAobvE_pCqgywyaNK-SOAf5FhBVZ_4jnQQ",
  authDomain: "centralbanker-11afb.firebaseapp.com",
  projectId: "centralbanker-11afb",
  storageBucket: "centralbanker-11afb.firebasestorage.app",
  messagingSenderId: "183981010065",
  appId: "1:183981010065:web:5969c209dbd157a1e26330",
  measurementId: "G-HY041MJ8DX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
