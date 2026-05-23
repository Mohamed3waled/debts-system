// Develop py Mohamed Waled
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// إعدادات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyBBlh7LZhFNSqdKSuBbgr__OdMbUfmLBn8",
  authDomain: "first-93614.firebaseapp.com",
  projectId: "first-93614",
  storageBucket: "first-93614.firebasestorage.app",
  messagingSenderId: "563421059757",
  appId: "1:563421059757:web:95a6a3465074334c8a0424",
  measurementId: "G-HBCG9E02QV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // التوجيه لصفحة الدخول بعد تسجيل الخروج
        window.location.href = "../index.html";
    } catch (error) {
        console.error("خطأ في تسجيل الخروج: ", error);
    }
});