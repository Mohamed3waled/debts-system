// Develop py Mohamed Waled - Installment Plans Module (Real-time Architecture)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ========================================================
// 1. إعدادات الفايربيز
// ========================================================
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

// ========================================================
// مراقبة حالة المستخدم لحماية وعزل بيانات التقسيط بحسابك
// ========================================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const currentUserId = user.uid; // الـ ID الفريد للمستخدم الحالي

    // ربط عناصر الفورم
    const installmentPlanForm = document.getElementById('installmentPlanForm');
    const savePlanBtn = document.getElementById('savePlanBtn');
    const searchInput = document.getElementById('searchInput');
    const installmentsContainer = document.getElementById('installmentsContainer');

    let allPlans = [];

    // دالة الحساب الفورية الآمنة والذكية
    function calculateInstallment() {
        const calcSummary = document.getElementById('installmentCalcSummary');
        const principalInput = document.getElementById('principalAmount');
        const rateInput = document.getElementById('interestRate');
        const monthsInput = document.getElementById('monthsCount');

        if (!calcSummary) return;

        const principal = principalInput ? (parseFloat(principalInput.value) || 0) : 0;
        const rate = rateInput ? (parseFloat(rateInput.value) || 0) : 0;
        const months = monthsInput ? (parseInt(monthsInput.value) || 1) : 1;

        const interestAmount = principal * (rate / 100);
        const totalWithInterest = principal + interestAmount;
        const monthlyInstallment = totalWithInterest / months;

        calcSummary.innerHTML = `
            الإجمالي بعد الفائدة: <strong>${totalWithInterest.toFixed(2)}</strong> جنية | 
            القسط الشهري: <strong>${monthlyInstallment.toFixed(2)}</strong> جنية
        `;
    }

    calculateInstallment();

    // مراقبة المدخلات لحظة بلحظة
    document.addEventListener('input', (e) => {
        if (e.target && ['principalAmount', 'interestRate', 'monthsCount'].includes(e.target.id)) {
            calculateInstallment();
        }
    });

    // ========================================================
    // 3. جلب بيانات الأقساط Real-time بحسابك الحالي فقط
    // ========================================================
    const plansQuery = query(
        collection(db, "installment_plans"),
        where("userId", "==", currentUserId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(plansQuery, (snapshot) => {
        allPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filterAndRender();
    }, (error) => {
        console.error("خطأ في جلب بيانات الأقساط المباشرة:", error);
    });

    // ========================================================
    // 4. إضافة خطة تقسيط جديدة (المدفوع يبدأ بـ 0 تلقائياً)
    // ========================================================
    if (installmentPlanForm) {
        installmentPlanForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            savePlanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
            savePlanBtn.disabled = true;

            const principal = parseFloat(document.getElementById('principalAmount').value) || 0;
            const rate = parseFloat(document.getElementById('interestRate').value) || 0;
            const months = parseInt(document.getElementById('monthsCount').value) || 1;
            const interestAmount = principal * (rate / 100);
            const totalWithInterest = principal + interestAmount;
            const monthlyInstallment = totalWithInterest / months;

            try {
                await addDoc(collection(db, "installment_plans"), {
                    clientName: document.getElementById('clientName').value.trim(),
                    details: document.getElementById('planDetails').value.trim(),
                    principalAmount: principal,
                    interestRate: rate,
                    monthsCount: months,
                    totalRequired: totalWithInterest,
                    monthlyInstallment: monthlyInstallment,
                    paidAmount: 0, // القيمة الابتدائية للمدفوعات صفر
                    userId: currentUserId, 
                    createdAt: serverTimestamp() 
                });

                installmentPlanForm.reset();
                calculateInstallment(); 

                Swal.fire({ position: 'top-end', icon: 'success', title: 'تم تسجيل خطة التقسيط بنجاح', showConfirmButton: false, timer: 1500, toast: true });

            } catch (error) {
                console.error("خطأ أثناء الحفظ:", error);
                Swal.fire('خطأ!', 'حدثت مشكلة أثناء تسجيل الخطة.', 'error');
            } finally {
                savePlanBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ خطة التقسيط';
                savePlanBtn.disabled = false;
            }
        });
    }

    // ========================================================
    // 5. بناء كروت الأقساط ديناميكياً بالأسفل (ضيف فوق واعرض تحت)
    // ========================================================
    function filterAndRender() {
        if (!installmentsContainer) return;

        const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const filteredPlans = allPlans.filter(plan => plan.clientName && plan.clientName.toLowerCase().includes(term));

        installmentsContainer.innerHTML = filteredPlans.length === 0
            ? `<div class="loading-status">لا توجد خطط تقسيط مسجلة حالياً.</div>`
            : "";

        filteredPlans.forEach(plan => {
            const dateStr = plan.createdAt ? new Date(plan.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '-';

            const totalRequired = plan.totalRequired || 0;
            const paidAmount = plan.paidAmount || 0;
            const remainingAmount = totalRequired - paidAmount;

            // شريط حالة المبالغ المسددة والمتبقية
            let paymentStatusHtml = '';
            if (paidAmount > 0 && remainingAmount > 0) {
                paymentStatusHtml = `<div style="background: rgba(46, 204, 113, 0.08); color: #27ae60; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px; border: 1px dashed rgba(46, 204, 113, 0.3);">مدفوع: ${paidAmount.toFixed(2)} ج | المتبقي: ${remainingAmount.toFixed(2)} ج</div>`;
            } else if (remainingAmount <= 0 && totalRequired > 0) {
                paymentStatusHtml = `<div style="background: rgba(67, 97, 238, 0.08); color: #4361ee; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px;"><i class="fa-solid fa-check-circle"></i> سُددت بالكامل 🎉</div>`;
            } else {
                paymentStatusHtml = `<div style="background: rgba(239, 35, 60, 0.05); color: #ef233c; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px;">لم يتم دفع أي أقساط بعد</div>`;
            }

            installmentsContainer.innerHTML += `
                <div class="data-card debt-card" style="border-right-color: #4361ee;">
                    <div class="card-header" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                        <h4 style="margin:0;">${plan.clientName}</h4>
                        <span style="background: rgba(67, 97, 238, 0.1); color: #4361ee; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;"><i class="fa-solid fa-clock"></i> خطة قسط</span>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 8px; border-radius: 8px; font-size: 12px; color: #475569; text-align: center; margin-bottom: 10px; border: 1px solid #e2e8f0;">
                        <strong>السلعة/السبب:</strong> ${plan.details}
                    </div>

                    <div class="card-body" style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
                        <div class="info-item" style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #f1f5f9;">
                            <span class="label" style="font-size: 9px; margin-bottom: 2px;">أصل المبلغ</span>
                            <span class="value" style="font-size: 11px; font-weight: bold; color: #334155;">${plan.principalAmount} ج</span>
                        </div>
                        <div class="info-item" style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #f1f5f9;">
                            <span class="label" style="font-size: 9px; margin-bottom: 2px;">الفائدة</span>
                            <span class="value" style="font-size: 11px; font-weight: bold; color: #e11d48;">${plan.interestRate}%</span>
                        </div>
                        <div class="info-item" style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #f1f5f9;">
                            <span class="label" style="font-size: 9px; margin-bottom: 2px;">الشهور</span>
                            <span class="value" style="font-size: 11px; font-weight: bold; color: #2563eb;">${plan.monthsCount} ش</span>
                        </div>
                    </div>

                    ${paymentStatusHtml}

                    <div style="background: rgba(67, 97, 238, 0.03); padding: 6px; border-radius: 6px; font-size: 11px; text-align: center; margin-bottom: 10px; border: 1px solid #f1f5f9;">
                        إجمالي الحساب بالفوائد: <strong style="color:#4361ee;">${totalRequired.toFixed(2)} ج</strong><br>
                        قيمة القسط الشهري الواحد: <strong style="color:#2563eb;">${plan.monthlyInstallment.toFixed(2)} ج</strong>
                    </div>

                    <div class="card-actions-row" style="margin-top: auto; display: flex; gap: 4px;">
                        <button class="action-status-btn" style="background: #4361ee; color: white;" data-id="${plan.id}">
                            <i class="fa-solid fa-chart-pie"></i> الحالة
                        </button>
                        <button class="action-collect-btn" style="background: #27ae60; color: white;" data-id="${plan.id}" data-name="${plan.clientName}" data-paid="${paidAmount}" data-total="${totalRequired}">
                            <i class="fa-solid fa-hand-holding-dollar"></i> تحصيل
                        </button>
                        <button class="action-edit-btn" data-id="${plan.id}" data-name="${plan.clientName}" data-details="${plan.details}" data-principal="${plan.principalAmount}" data-rate="${plan.interestRate}" data-months="${plan.monthsCount}" data-paid="${paidAmount}">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                        <button class="btn-delete action-delete-btn" data-id="${plan.id}">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </div>

                    <div class="card-footer" style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(0,0,0,0.05); margin-top: 10px; padding-top: 10px; font-size: 11px; color: #94a3b8;">
                        <span>تاريخ الإنشاء: ${dateStr}</span>
                    </div>
                </div>`;
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRender);
    }

    // ========================================================
    // 6. التعامل مع ضغطات الأزرار (الحالة الذكية، التحصيل، التعديل، الحذف)
    // ========================================================
    document.addEventListener('click', async (e) => {
        
        // --- [جديد]: زرار الحالة وتفصيل الشهور ليوم 1 لكل شهر ---
        const statusBtn = e.target.closest('.action-status-btn');
        if (statusBtn) {
            const id = statusBtn.getAttribute('data-id');
            const plan = allPlans.find(p => p.id === id);
            if (!plan) return;

            const baseDate = plan.createdAt ? new Date(plan.createdAt.seconds * 1000) : new Date();
            const totalMonths = plan.monthsCount || 1;
            const monthlyInstallment = plan.monthlyInstallment || 0;
            
            let currentPaidPool = plan.paidAmount || 0;
            let currentMonth = baseDate.getMonth();
            let currentYear = baseDate.getFullYear();

            let htmlList = `<ul style="text-align: right; direction: rtl; list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">`;

            for (let i = 1; i <= totalMonths; i++) {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }

                // تحديد يوم 1 في الشهر الجديد بالظبط
                const dueDate = new Date(currentYear, currentMonth, 1);
                const dateFormatted = dueDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });

                let monthStatus = "";
                let statusColor = "";

                // حسبة ذكية لتوزيع المدفوعات التلقائية ومعرفة حالة كل شهر بالتفصيل
                if (currentPaidPool >= monthlyInstallment) {
                    monthStatus = "سُدد بالكامل ✅";
                    statusColor = "#27ae60";
                    currentPaidPool -= monthlyInstallment;
                } else if (currentPaidPool > 0) {
                    const partialRemaining = monthlyInstallment - currentPaidPool;
                    monthStatus = `مسدد جزئياً (باقي: ${partialRemaining.toFixed(2)} ج) ⚠️`;
                    statusColor = "#f39c12";
                    currentPaidPool = 0;
                } else {
                    monthStatus = "غير مدفوع ❌";
                    statusColor = "#ef233c";
                }

                htmlList += `
                    <li style="padding: 10px; border-bottom: 1px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 12px; background: ${i % 2 === 0 ? '#f8fafc' : '#fff'};">
                        <span><strong>الشهر ${i} (${dateFormatted}):</strong></span>
                        <span style="color: ${statusColor}; font-weight: 700;">${monthStatus}</span>
                    </li>`;
            }
            htmlList += `</ul>`;

            const remainingTotal = (plan.totalRequired - plan.paidAmount);

            Swal.fire({
                title: `جدول خطة قسط: ${plan.clientName}`,
                html: `
                    <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; margin-bottom: 12px; text-align: right; font-size: 13px; line-height: 1.5; font-family:'Rubik';">
                        <strong>السلعة/السبب:</strong> ${plan.details}<br>
                        <strong>قيمة القسط الثابت:</strong> ${monthlyInstallment.toFixed(2)} ج.م<br>
                        <strong>إجمالي ما تم دفعه:</strong> ${plan.paidAmount.toFixed(2)} ج.م<br>
                        <strong>إجمالي المتبقي المطلوب:</strong> <span style="color:${remainingTotal <= 0 ? '#27ae60':'#ef233c'}; font-weight:bold;">${remainingTotal.toFixed(2)} ج.م</span>
                    </div>
                    <div style="text-align: right; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #64748b;"><i class="fa-solid fa-list-check"></i> تفاصيل الشهور (يوم 1 من كل شهر):</div>
                    ${htmlList}
                `,
                confirmButtonText: 'إغلاق الكشف',
                confirmButtonColor: '#4361ee'
            });
        }

        // --- [جديد]: زرار تحصيل دفعة وخصمها من الحساب وسماعها في الحالة فورا ---
        const collectBtn = e.target.closest('.action-collect-btn');
        if (collectBtn) {
            const id = collectBtn.getAttribute('data-id');
            const name = collectBtn.getAttribute('data-name');
            const currentPaid = parseFloat(collectBtn.getAttribute('data-paid')) || 0;
            const totalRequired = parseFloat(collectBtn.getAttribute('data-total')) || 0;

            if (currentPaid >= totalRequired) {
                Swal.fire('حساب مغلق', 'هذا الحساب مسدد بالكامل بالفعل 🎉', 'info');
                return;
            }

            Swal.fire({
                title: `تسجيل تحصيل من: ${name}`,
                input: 'number',
                inputLabel: `اكتب المبلغ المستلم حالياً (المتبقي الكلي: ${(totalRequired - currentPaid).toFixed(2)} ج)`,
                inputPlaceholder: 'مثال: 500',
                showCancelButton: true,
                confirmButtonText: 'تأكيد الخصم والتحصيل',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#27ae60',
                cancelButtonColor: '#94a3b8',
                inputValidator: (value) => {
                    if (!value || parseFloat(value) <= 0) {
                        return 'برجاء كتابة مبلغ تحصيل صحيح أكبر من الصفر!';
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const amountToCollect = parseFloat(result.value);
                        const newPaidTotal = currentPaid + amountToCollect;

                        await updateDoc(doc(db, "installment_plans", id), {
                            paidAmount: newPaidTotal
                        });

                        Swal.fire({ icon: 'success', title: 'تم خصم الدفعة وتحديث جدول الحالة بنجاح 💰🎉', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                    } catch (err) {
                        console.error(err);
                        Swal.fire('خطأ', 'حدثت مشكلة أثناء تسجيل التحصيل', 'error');
                    }
                }
            });
        }

        // --- زرار الحذف ---
        const deleteBtn = e.target.closest('.action-delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            Swal.fire({
                title: 'هل تريد حذف خطة التقسيط؟',
                text: "لن تتمكن من استعادة البيانات بعد الحذف نهائياً!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef233c',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'نعم، احذفها',
                cancelButtonText: 'إلغاء'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteDoc(doc(db, "installment_plans", id));
                    Swal.fire({ icon: 'success', title: 'تم حذف الخطة بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                }
            });
        }

        // --- زرار التعديل المباشر الشامل ---
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const name = editBtn.getAttribute('data-name');
            const details = editBtn.getAttribute('data-details');
            const principal = parseFloat(editBtn.getAttribute('data-principal'));
            const rate = parseFloat(editBtn.getAttribute('data-rate'));
            const months = parseInt(editBtn.getAttribute('data-months'));
            const currentPaid = parseFloat(editBtn.getAttribute('data-paid')) || 0;

            Swal.fire({
                title: `تعديل خطة: ${name}`,
                html: `
                    <div style="overflow: hidden; text-align: right; direction: rtl; font-family:'Rubik';">
                        <div class="swal-input-group" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #64748b; font-weight:600;">اسم العميل</label>
                            <input type="text" id="editPlanName" value="${name}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                        </div>
                        <div class="swal-input-group" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #64748b; font-weight:600;">تفاصيل السلعة</label>
                            <input type="text" id="editPlanDetails" value="${details}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                            <div class="swal-input-group" style="flex:1;">
                                <label style="font-size: 11px; color: #64748b; font-weight:600;">أصل المبلغ</label>
                                <input type="number" id="editPlanPrincipal" value="${principal}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                            </div>
                            <div class="swal-input-group" style="flex:1;">
                                <label style="font-size: 11px; color: #64748b; font-weight:600;">الفائدة (%)</label>
                                <input type="number" id="editPlanRate" value="${rate}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                            </div>
                            <div class="swal-input-group" style="flex:1;">
                                <label style="font-size: 11px; color: #64748b; font-weight:600;">الشهور</label>
                                <input type="number" id="editPlanMonths" value="${months}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                            </div>
                        </div>
                        <div class="swal-input-group">
                            <label style="font-size: 12px; color: #27ae60; font-weight:600;">إجمالي المبلغ المدفوع حتى الآن (ج.م)</label>
                            <input type="number" id="editPlanPaid" value="${currentPaid}" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-family:'Rubik'; box-sizing:border-box;">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'تحديث البيانات',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#4361ee',
                cancelButtonColor: '#94a3b8',
                preConfirm: () => {
                    const p = parseFloat(document.getElementById('editPlanPrincipal').value) || 0;
                    const r = parseFloat(document.getElementById('editPlanRate').value) || 0;
                    const m = parseInt(document.getElementById('editPlanMonths').value) || 1;
                    const paid = parseFloat(document.getElementById('editPlanPaid').value) || 0;
                    
                    const interestAmount = p * (r / 100);
                    const totalRequired = p + interestAmount;
                    const monthlyInstallment = totalRequired / m;

                    return {
                        clientName: document.getElementById('editPlanName').value.trim(),
                        details: document.getElementById('editPlanDetails').value.trim(),
                        principalAmount: p,
                        interestRate: r,
                        monthsCount: m,
                        totalRequired: totalRequired,
                        monthlyInstallment: monthlyInstallment,
                        paidAmount: paid
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await updateDoc(doc(db, "installment_plans", id), result.value);
                        Swal.fire({ icon: 'success', title: 'تم تحديث خطة التقسيط', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                    } catch (err) {
                        console.error(err);
                        Swal.fire('خطأ', 'حدثت مشكلة أثناء تحديث البيانات', 'error');
                    }
                }
            });
        }
    });
});