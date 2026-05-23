// Develop py Mohamed Waled - Registration Module (Redirect to Login)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('regEmail');
const passwordInput = document.getElementById('regPassword');
const registerBtn = document.getElementById('registerBtn');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value;

        if (passVal.length < 6) {
            Swal.fire('تنبيه', 'يجب أن تكون كلمة المرور 6 أحرف أو أرقام على الأقل.', 'warning');
            return;
        }

        registerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
        registerBtn.disabled = true;

        try {
            // إنشاء الحساب بنجاح في فايربيز
            await createUserWithEmailAndPassword(auth, emailVal, passVal);

            Swal.fire({
                icon: 'success',
                title: 'تم إنشاء الحساب بنجاح! ',
                text: 'جاري توجيهك لصفحة تسجيل الدخول ...',
                showConfirmButton: false,
                timer: 2500
            });

            // التعديل الجوهري: التحويل لصفحة تسجيل الدخول الأساسية بدلاً من الداشبورد أوتوماتيك
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2500);

        } catch (error) {
            console.error("خطأ إنشاء الحساب:", error);
            registerBtn.innerHTML = 'إنشاء الحساب والتشغيل';
            registerBtn.disabled = false;

            let errorText = "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً.";
            if (error.code === 'auth/email-already-in-use') {
                errorText = "هذا البريد الإلكتروني مسجل بالفعل في النظام!";
            } else if (error.code === 'auth/invalid-email') {
                errorText = "صيغة البريد الإلكتروني غير صحيحة.";
            }

            Swal.fire('فشل الإنشاء', errorText, 'error');
        }
    });
}