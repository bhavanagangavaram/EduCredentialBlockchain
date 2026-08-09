import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDT1NoL22GMaAv-Xr9nByYlpOYb-FxK8Oc",
    authDomain: "myvotingapp-7803e.firebaseapp.com",
    projectId: "myvotingapp-7803e",
    storageBucket: "myvotingapp-7803e.firebasestorage.app",
    messagingSenderId: "1042650566684",
    appId: "1:1042650566684:web:26944c2626776557c24fd9",
    measurementId: "G-RJ6EBCNLHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
