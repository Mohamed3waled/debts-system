// Develop py Mohamed Waled
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');       
const passwordInput = document.getElementById('password'); 
const loginBtn = document.getElementById('loginBtn');

// ========================================================
// 1. إنشاء رابط "نسيت كلمة المرور؟" بتنسيق شيك ومسافات مظبوطة
// ========================================================
const forgotPassDiv = document.createElement('div');
forgotPassDiv.style.width = '100%';
forgotPassDiv.style.display = 'block';
forgotPassDiv.style.textAlign = 'right'; // محاذاة صريحة لليمين
forgotPassDiv.style.direction = 'rtl';    // يدعم التنسيق العربي

// الهوامش الجديدة لضبط المسافات ومنع التداخل
forgotPassDiv.style.marginTop = '15px';    // مسافة مريحة تحت حقل الباسورد
forgotPassDiv.style.marginBottom = '25px'; // مسافة مريحة فوق زرار الدخول
forgotPassDiv.style.paddingLeft = '5px';   // ترحيل بسيط جداً عشان يتماشى مع حافة الحقل

const forgotPassLink = document.createElement('a');
forgotPassLink.href = '#';
forgotPassLink.innerText = 'نسيت كلمة المرور؟';
forgotPassLink.style.fontSize = '13px';
forgotPassLink.style.color = '#4361ee'; 
forgotPassLink.style.textDecoration = 'none';
forgotPassLink.style.fontWeight = '500';
forgotPassLink.style.fontFamily = "'Rubik', sans-serif";
forgotPassLink.style.transition = 'color 0.3s, transform 0.2s';
forgotPassLink.style.display = 'inline-block'; 

// تأثيرات الـ Hover الاحترافية عند مرور الماوس
forgotPassLink.addEventListener('mouseover', () => {
    forgotPassLink.style.color = '#3a0ca3';
    forgotPassLink.style.transform = 'translateY(-1px)';
});
forgotPassLink.addEventListener('mouseout', () => {
    forgotPassLink.style.color = '#4361ee';
    forgotPassLink.style.transform = 'translateY(0)';
});

forgotPassDiv.appendChild(forgotPassLink);

// إدخال الرابط في مكانه المظبوط تماماً قبل زرار الدخول
loginForm.insertBefore(forgotPassDiv, loginBtn);

// ========================================================
// 2. بوب أب استعادة كلمة المرور (التصميم الاحترافي الشيك)
// ========================================================
forgotPassLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const currentEmail = emailInput.value.trim(); // سحب الإيميل لو مكتوب جاهز للراحة

    Swal.fire({
        title: '🔑 استعادة كلمة المرور',
        html: `
            <div style="text-align: right; direction: rtl; font-family: 'Rubik', sans-serif; margin-top: 10px;">
                <p style="font-size: 14px; color: #64748b; margin-bottom: 20px; line-height: 1.6;">
                    أدخل البريد الإلكتروني المسجل في النظام، وسنقوم بإرسال رابط آمن لإعادة تعيين كلمة المرور الخاصة بك فوراً.
                </p>
                <div style="position: relative;">
                    <input type="email" id="swalResetEmail" placeholder="admin@example.com" value="${currentEmail}"
                        style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'Rubik', sans-serif; outline: none; box-sizing: border-box; transition: all 0.3s ease;">
                </div>
                <div id="swalEmailError" style="color: #ef233c; font-size: 12px; display: none; margin-top: 8px; font-weight: 500;">
                    ⚠️ يرجى إدخال بريد إلكتروني صحيح ومسجل.
                </div>
            </div>
            
            <style>
                #swalResetEmail:focus {
                    border-color: #4361ee !important;
                    background: #f8faff;
                    box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.15) !important;
                }
                .custom-swal-popup {
                    border-radius: 24px !important;
                    padding: 35px 30px !important;
                    font-family: 'Rubik', sans-serif !important;
                }
                .custom-swal-title {
                    font-size: 20px !important;
                    color: #2b2d42 !important;
                    font-weight: 700 !important;
                    padding-top: 10px !important;
                }
                .custom-swal-confirm {
                    background: linear-gradient(90deg, #4361ee, #3a0ca3) !important;
                    padding: 12px 28px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 5px 15px rgba(67, 97, 238, 0.2) !important;
                    border: none !important;
                }
                .custom-swal-cancel {
                    background: #f1f5f9 !important;
                    color: #64748b !important;
                    padding: 12px 24px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border-radius: 12px !important;
                    border: none !important;
                }
            </style>
        `,
        showCancelButton: true,
        confirmButtonText: 'إرسال رابط التعيين',
        cancelButtonText: 'إلغاء',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            confirmButton: 'custom-swal-confirm',
            cancelButton: 'custom-swal-cancel'
        },
        reverseButtons: true,
        preConfirm: () => {
            // التحقق من صحة الإيميل داخل البوب أب قبل الإرسال
            const email = document.getElementById('swalResetEmail').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email || !emailRegex.test(email)) {
                document.getElementById('swalEmailError').style.display = 'block';
                document.getElementById('swalResetEmail').style.borderColor = '#ef233c';
                return false; // يمنع إغلاق البوب أب
            }
            return email; // يمرر الإيميل سليم للخطوة التالية
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            const resetEmail = result.value;
            
            // بوب أب الانتظار الدائرية الاحترافية
            Swal.fire({
                title: 'جاري إرسال الرابط...',
                allowOutsideClick: false,
                customClass: { popup: 'custom-swal-popup' },
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                await sendPasswordResetEmail(auth, resetEmail);
                Swal.fire({
                    icon: 'success',
                    title: 'تم الإرسال بنجاح! 🎉',
                    text: 'تفقد علبة الوارد (Inbox) أو مجلد الـ Spam في بريدك الإلكتروني لتحديث كلمة المرور.',
                    confirmButtonColor: '#27ae60',
                    customClass: { popup: 'custom-swal-popup' }
                });
            } catch (error) {
                console.error("خطأ استعادة الباسورد:", error);
                let errorText = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';
                if (error.code === 'auth/user-not-found') {
                    errorText = 'هذا البريد الإلكتروني غير مسجل بالنظام مطلقاً!';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'فشل الإرسال',
                    text: errorText,
                    confirmButtonColor: '#ef233c',
                    customClass: { popup: 'custom-swal-popup' }
                });
            }
        }
    });
});

// ========================================================
// 3. معالجة تسجيل الدخول المحسنة للحفظ التلقائي في المتصفح
// ========================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;

    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
    loginBtn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, emailVal, passVal);
        
        loginBtn.innerHTML = 'تم الدخول بنجاح!';
        loginBtn.style.background = "linear-gradient(90deg, #2ecc71, #27ae60)"; 
        
        // تأخير النقل لـ 1.2 ثانية عشان ندي فرصة كاملة للمتصفح يلقط البيانات ويظهر بوب أب الحفظ
        setTimeout(() => {
            window.location.href = 'dashboard/dashboard.html'; 
        }, 1200);

    } catch (error) {
        console.error("خطأ في تسجيل الدخول:", error.message);
        loginBtn.innerHTML = 'دخول';
        loginBtn.disabled = false;
        showErrorState(); 
    }
});

function showErrorState() {
    emailInput.classList.add('input-error');
    passwordInput.classList.add('input-error');

    let errorMsg = document.getElementById('errorMessage');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'errorMessage';
        errorMsg.className = 'error-msg-text active';
        errorMsg.innerHTML = `
            <svg focusable="false" width="16" height="16" viewBox="0 0 24 24" style="fill: #d93025; vertical-align: middle; margin-left: 4px;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span>البريد الإلكتروني أو كلمة المرور غير صحيحة.</span>
        `;
        loginForm.insertBefore(errorMsg, forgotPassDiv);
    } else {
        errorMsg.classList.add('active');
    }

    emailInput.classList.add('shake');
    passwordInput.classList.add('shake');

    setTimeout(() => {
        emailInput.classList.remove('shake');
        passwordInput.classList.remove('shake');
    }, 400); 
}

function removeErrorState() {
    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
        errorMsg.classList.remove('active');
    }
}

emailInput.addEventListener('input', removeErrorState);
passwordInput.addEventListener('input', removeErrorState);