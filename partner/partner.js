// Develop py Mohamed Waled - Multi-User Isolated Version
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// مراقبة حالة المستخدم لضمان عزل البيانات وحماية الصفحة
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html'; 
        return;
    }

    const currentUserId = user.uid; // الـ ID الفريد للمستخدم الحالي

    // ========================================================
    // 1. عرض البيانات (محمي ومفلتر بحساب المستخدم الحالي فقط)
    // ========================================================
    const partnersQuery = query(
        collection(db, "partners"), 
        where("userId", "==", currentUserId), // فلترة الشركاء التابعين لك فقط
        orderBy("date", "desc")
    );

    onSnapshot(partnersQuery, (snapshot) => {
        const container = document.getElementById('partnersContainer');
        if (!container) return;

        if (snapshot.empty) {
            container.innerHTML = `<div class="empty-state">لا يوجد شركاء مسجلين حالياً..<br>ابدأ بإضافة شريك جديد!</div>`;
            const totalEl = document.getElementById('totalCapitalDisplay');
            if(totalEl) totalEl.innerText = "0";
            return;
        }

        container.innerHTML = "";
        let total = 0;
        snapshot.forEach((docSnap) => {
            const p = { id: docSnap.id, ...docSnap.data() };
            total += p.amount;
            
            // حماية ذكية لمنع الكراش في حالة الـ serverTimestamp جاري الحفظ
            const dateStr = p.date && typeof p.date.toDate === 'function' ? p.date.toDate().toLocaleDateString('ar-EG') : 'جاري التحديث...';
            
            container.innerHTML += `
                <div class="data-card" style="border-right: 4px solid #f39c12;">
                    <div class="card-header"><h4>${p.partnerName}</h4></div>
                    <div class="card-body">
                        <p>رأس المال: <strong style="color:#27ae60; font-size: 14px;">${p.amount.toLocaleString()} ج.م</strong></p>
                        <p style="font-size: 12px; color: #64748b;">تليفون: ${p.partnerPhone || 'غير مسجل'}</p>
                        <p style="font-size: 12px; color: #3b82f6; font-weight: bold;">تاريخ الانضمام: ${dateStr}</p>
                    </div>
                    ${p.notes ? `<div class="card-notes" style="font-size:12px; color:#475569; background:#f8fafc; padding:8px; border-radius:8px; margin-bottom:10px;">${p.notes}</div>` : ''}
                    
                    <div class="card-actions-top" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:5px; margin-bottom: 8px;">
                        <button class="btn-action bg-deposit" data-action="deposit" data-id="${p.id}" data-name="${p.partnerName}" data-amount="${p.amount}">إيداع</button>
                        <button class="btn-action bg-withdraw" data-action="withdraw" data-id="${p.id}" data-name="${p.partnerName}" data-amount="${p.amount}">سحب</button>
                        <button class="btn-action bg-status" data-action="status" data-id="${p.id}" data-name="${p.partnerName}">حالة</button>
                        <button class="btn-action bg-edit" data-action="edit" data-id="${p.id}" data-name="${p.partnerName}" data-phone="${p.partnerPhone || ''}" data-notes="${p.notes || ''}">تعديل</button>
                    </div>
                    <button class="btn-action bg-delete-danger" data-action="delete" data-id="${p.id}" style="width:100%;"><i class="fa-solid fa-trash"></i> حذف الشريك</button>
                </div>`;
        });
        const totalEl = document.getElementById('totalCapitalDisplay');
        if(totalEl) totalEl.innerText = total.toLocaleString();
    });

    // ========================================================
    // 2. معالجة الأحداث (شاملة ومحمية بالـ userId)
    // ========================================================
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-action');
        if (!btn) return;

        const { action, id, name } = btn.dataset;

        if (action === 'deposit' || action === 'withdraw') {
            const { value: amount } = await Swal.fire({ title: `${action === 'deposit' ? 'إيداع' : 'سحب'} مبلغ`, input: 'number', confirmButtonText: 'تأكيد' });
            if (amount) {
                const val = parseFloat(amount);
                const current = parseFloat(btn.dataset.amount);
                const newAmount = action === 'deposit' ? current + val : current - val;
                
                await updateDoc(doc(db, "partners", id), { amount: newAmount });
                
                // حفظ المعاملة وربطها بالـ userId عشان تفضل معزولة ومحمية
                await addDoc(collection(db, "transactions"), { 
                    partnerId: id, 
                    type: action === 'deposit' ? 'إيداع' : 'سحب', 
                    amount: val, 
                    name, 
                    userId: currentUserId, 
                    date: serverTimestamp() 
                });
            }
        } 
        else if (action === 'delete') {
            Swal.fire({ title: 'حذف الشريك؟', text: "لا يمكن التراجع!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء' }).then(async (r) => {
                if (r.isConfirmed) await deleteDoc(doc(db, "partners", id));
            });
        }
        else if (action === 'edit') {
            Swal.fire({
                title: `تعديل بيانات: ${name}`,
                html: `
                    <div style="overflow: hidden; font-family: 'Rubik', sans-serif;">
                        <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                            <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">اسم الشريك</label>
                            <input type="text" id="eName" value="${name}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box; outline: none;">
                        </div>
                        <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                            <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">رقم الهاتف</label>
                            <input type="text" id="ePhone" value="${btn.dataset.phone}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box; outline: none;">
                        </div>
                        <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 5px;">
                            <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">الملاحظات</label>
                            <textarea id="eNotes" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box; min-height: 80px; resize: vertical; outline: none;">${btn.dataset.notes}</textarea>
                        </div>
                    </div>
                    <style>
                        .custom-swal-popup-edit { border-radius: 20px !important; padding: 30px !important; }
                        .custom-swal-title-edit { font-size: 18px !important; font-weight: 700 !important; color: #2b2d42 !important; margin-bottom: 15px !important; }
                        .swal-input-group input:focus, .swal-input-group textarea:focus { border-color: #4361ee !important; background: #f8faff; }
                        .custom-confirm-btn { background-color: #4361ee !important; padding: 12px 30px !important; font-size: 14px !important; font-weight: 600 !important; border-radius: 10px !important; }
                        .custom-cancel-btn { background-color: #94a3b8 !important; padding: 12px 25px !important; font-size: 14px !important; font-weight: 600 !important; border-radius: 10px !important; }
                    </style>
                `,
                showCancelButton: true,
                confirmButtonText: 'حفظ التعديلات',
                cancelButtonText: 'إلغاء',
                reverseButtons: true, 
                customClass: {
                    popup: 'custom-swal-popup-edit',
                    title: 'custom-swal-title-edit',
                    confirmButton: 'custom-confirm-btn',
                    cancelButton: 'custom-cancel-btn'
                },
                preConfirm: async () => {
                    await updateDoc(doc(db, "partners", id), { 
                        partnerName: document.getElementById('eName').value.trim(),
                        partnerPhone: document.getElementById('ePhone').value.trim(),
                        notes: document.getElementById('eNotes').value.trim()
                    });
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({ icon: 'success', title: 'تم التحديث بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                }
            });
        }
        else if (action === 'status') {
            const transactionsQuery = query(
                collection(db, "transactions"), 
                where("partnerId", "==", id), 
                where("userId", "==", currentUserId), 
                orderBy("date", "desc")
            );
            const snap = await getDocs(transactionsQuery);
            let rows = "";
            snap.forEach(d => { 
                const dt = d.data(); 
                const tDate = dt.date && typeof dt.date.toDate === 'function' ? dt.date.toDate().toLocaleDateString('ar-EG') : 'غير محدد';
                rows += `<tr><td style="padding:10px;">${tDate}</td><td style="font-weight:bold; color:${dt.type==='إيداع'?'#059669':'#dc2626'}">${dt.type}</td><td style="font-weight:bold;">${dt.amount.toLocaleString()}</td></tr>`; 
            });
            Swal.fire({ title: `كشف حساب: ${name}`, html: `<table class="statement-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th></tr></thead><tbody>${rows || '<tr><td colspan="3">لا توجد حركات</td></tr>'}</tbody></table>` });
        }
    });

    // ========================================================
    // 3. إضافة شريك جديد (مستقر ومباشر بدون دبلرة أحداث)
    // ========================================================
    const form = document.getElementById('addPartnerForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "partners"), {
                    partnerName: document.getElementById('partnerName').value.trim(),
                    partnerPhone: document.getElementById('partnerPhone').value.trim(),
                    amount: parseFloat(document.getElementById('partnerAmount').value) || 0,
                    notes: document.getElementById('partnerNotes').value.trim(),
                    userId: currentUserId, 
                    date: serverTimestamp() 
                });
                form.reset();
                Swal.fire({ icon: 'success', title: 'تم التسجيل بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } catch (err) {
                console.error("خطأ أثناء إضافة الشريك:", err);
                Swal.fire('خطأ', 'حدثت مشكلة صلاحيات أو اتصال.', 'error');
            }
        };
    }
});