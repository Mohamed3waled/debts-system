// Develop py Mohamed Waled - Protected, Smart & Fully Automated Version
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
// مراقبة حالة المستخدم لعزل وحماية داتا المديونيات بحسابك
// ========================================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const currentUserId = user.uid; // الـ ID الفريد للمستخدم الحالي

    // ربط عناصر الـ HTML
    const addDebtForm = document.getElementById('addDebtForm');
    const debtsContainer = document.getElementById('debtsContainer');
    const searchInput = document.getElementById('searchInput');
    const dueDateInput = document.getElementById('dueDate');
    const dynamicDueDateDisplay = document.getElementById('dynamicDueDateDisplay');
    const debtTypeInput = document.getElementById('debtType');

    // ربط عناصر المجموعات للتحكم بالإخفاء والإظهار فورا
    const phoneGroup = document.getElementById('phoneGroup');
    const reasonGroup = document.getElementById('reasonGroup');
    const dueDateGroup = document.getElementById('dueDateGroup');
    const notesRow = document.getElementById('notesRow');

    let allDebts = [];

    // دالة التحكم في الحقول المعروضة بناء على اختيار (ليا أو عليا)
    function handleDebtTypeToggle() {
        if (debtTypeInput && debtTypeInput.value === 'alia') {
            if (phoneGroup) phoneGroup.style.display = 'none';
            if (reasonGroup) reasonGroup.style.display = 'block'; // إظهار السبب لـ عليا
            if (dueDateGroup) dueDateGroup.style.display = 'none';
            if (notesRow) notesRow.style.display = 'block'; // إظهار الملاحظة لـ عليا
            if (dynamicDueDateDisplay) dynamicDueDateDisplay.style.display = 'none';
        } else {
            if (phoneGroup) phoneGroup.style.display = 'block';
            if (reasonGroup) reasonGroup.style.display = 'block';
            if (dueDateGroup) dueDateGroup.style.display = 'block';
            if (notesRow) notesRow.style.display = 'block';
            if (dynamicDueDateDisplay) dynamicDueDateDisplay.style.display = 'block';
        }
    }

    if (debtTypeInput) {
        debtTypeInput.addEventListener('change', handleDebtTypeToggle);
    }

    // دالة تحديث عرض التاريخ لـ حسابات (ليّـا)
    function updateDateDisplay() {
        if (!dynamicDueDateDisplay || (debtTypeInput && debtTypeInput.value === 'alia')) return;

        const todayObj = new Date();
        const todayFormatted = todayObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });

        if (dueDateInput && dueDateInput.value) {
            const dateObj = new Date(dueDateInput.value);
            const formattedDue = dateObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });
            
            dynamicDueDateDisplay.innerHTML = `
                <span style="color: #27ae60;"><i class="fa-solid fa-calendar-day"></i> تسجيل المديونية بتاريخ اليوم : ${todayFormatted}</span> 
                <span style="color: #ef233c; font-weight: bold; margin-right: 5px;">| تاريخ الاستحقاق: ${formattedDue}</span>
            `;
        } else {
            dynamicDueDateDisplay.innerHTML = `
                <span style="color: #27ae60;"><i class="fa-solid fa-calendar-day"></i> تسجيل المديونية بتاريخ اليوم : ${todayFormatted}</span> 
                <span style="color: #ef233c; font-weight: bold; margin-right: 5px;">| تاريخ الاستحقاق: لم يحدد</span>
            `;
        }
    }

    updateDateDisplay();

    if (dueDateInput) {
        dueDateInput.oninput = function() {
            updateDateDisplay();
        };
    }

    // ========================================================
    // 3. جلب البيانات Real-time (مفلترة بحسابك الحالي فقط)
    // ========================================================
    const debtsQuery = query(
        collection(db, "debts"),
        where("userId", "==", currentUserId),
        orderBy("date", "desc")
    );

    onSnapshot(debtsQuery, (snapshot) => {
        allDebts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filterAndRender();
    }, (error) => {
        console.error("خطأ في جلب البيانات المباشرة:", error);
    });

    // ========================================================
    // 4. إضافة مديونية جديدة 
    // ========================================================
    if (addDebtForm) {
        addDebtForm.onsubmit = async (e) => {
            e.preventDefault();

            const currentType = debtTypeInput ? debtTypeInput.value : "lia";
            const nameInput = document.getElementById('clientName').value.trim();
            const amountInput = parseFloat(document.getElementById('debtAmount').value);
            
            // قراءة ذكية ونظيفة للحقول والاختياريات
            const phoneInput = currentType === 'lia' ? (document.getElementById('clientPhone') ? document.getElementById('clientPhone').value.trim() : "") : "";
            const reasonInput = document.getElementById('debtReason') ? document.getElementById('debtReason').value.trim() : "";
            const notesInput = document.getElementById('debtNotes') ? document.getElementById('debtNotes').value.trim() : "";
            const dueDateVal = currentType === 'lia' ? (document.getElementById('dueDate') ? document.getElementById('dueDate').value : "") : "";

            const submitBtn = addDebtForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
            submitBtn.disabled = true;

            try {
                await addDoc(collection(db, "debts"), {
                    clientName: nameInput,
                    amount: amountInput,
                    paidAmount: 0,
                    clientPhone: phoneInput,
                    reason: reasonInput,
                    notes: notesInput, // حفظ الملاحظة بالسيرفر
                    dueDate: dueDateVal,
                    debtType: currentType, // 'lia' أو 'alia'
                    userId: currentUserId,
                    date: serverTimestamp()
                });

                addDebtForm.reset();
                handleDebtTypeToggle(); 
                updateDateDisplay(); 

                Swal.fire({ position: 'top-end', icon: 'success', title: 'تم الحفظ في النظام بنجاح', showConfirmButton: false, timer: 1500, toast: true });

            } catch (error) {
                console.error("خطأ أثناء الإضافة:", error);
                Swal.fire('خطأ!', 'حدثت مشكلة أثناء حفظ البيانات.', 'error');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        };
    }

    // ========================================================
    // 5. بناء كروت العرض المقسمة (المستحق ليا والمستحق عليا)
    // ========================================================
    function filterAndRender() {
        if (!debtsContainer) return;

        const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const filteredDebts = allDebts.filter(debt => debt.clientName && debt.clientName.toLowerCase().includes(term));

        const debtsLia = filteredDebts.filter(d => !d.debtType || d.debtType === 'lia');
        const debtsAlia = filteredDebts.filter(d => d.debtType === 'alia');

        let finalHtml = "";

        // ---- القسم الأول: مديونيات لك (ليّـا) ----
        finalHtml += `<h3 style="grid-column: 1 / -1; width: 100%; color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 5px; margin-top: 10px; font-weight:700;"><i class="fa-solid fa-arrow-down-long"></i> مديونيات لك (ليّـا)</h3>`;
        
        if (debtsLia.length === 0) {
            finalHtml += `<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 15px; font-size: 13px;">لا توجد مديونيات مسجلة لك.</div>`;
        } else {
            debtsLia.forEach(debt => {
                const recordDate = debt.date ? new Date(debt.date.seconds * 1000).toLocaleDateString('ar-EG') : '-';
                let dueDateFormatted = debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' }) : '';
                
                const originalAmount = debt.amount || 0;
                const paidAmount = debt.paidAmount || 0;
                const remainingAmount = originalAmount - paidAmount;

                const todayStr = new Date().toLocaleDateString('en-CA');
                let isOverdue = debt.dueDate && todayStr >= debt.dueDate && remainingAmount > 0;
                let overdueBadge = isOverdue ? `<span class="overdue-blink" style="background: #ef233c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-triangle-exclamation"></i> مستحق</span>` : '';

                let paidInfoHtml = '';
                if (paidAmount > 0 && remainingAmount > 0) {
                    paidInfoHtml = `<div style="background: rgba(46, 204, 113, 0.08); color: #27ae60; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px; border: 1px dashed rgba(46, 204, 113, 0.3);">دفع: ${paidAmount} ج | الباقي: ${remainingAmount} ج</div>`;
                } else if (remainingAmount <= 0 && originalAmount > 0) {
                    paidInfoHtml = `<div style="background: rgba(67, 97, 238, 0.08); color: #4361ee; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px;"><i class="fa-solid fa-check-circle"></i> سُددت بالكامل</div>`;
                }

                let reasonHtml = debt.reason ? `<div class="info-item" style="grid-column: 1 / -1; flex-direction: row; justify-content: center; gap: 5px; margin-top: 2px;"><span class="label" style="margin:0; font-size: 11px;">السبب:</span><span class="value" style="font-size: 12px; color: #475569;">${debt.reason}</span></div>` : '';
                let notesHtml = debt.notes ? `<div class="info-item" style="grid-column: 1 / -1; flex-direction: row; justify-content: center; gap: 5px; margin-top: 2px;"><span class="label" style="margin:0; font-size: 11px;">ملاحظة:</span><span class="value" style="font-size: 12px; color: #64748b; font-style: italic;">${debt.notes}</span></div>` : '';

                let actionsHtml = "";
                if (debt.clientPhone) {
                    actionsHtml += `<button class="btn-whatsapp action-whatsapp-btn" data-id="${debt.id}" data-name="${debt.clientName}" data-phone="${debt.clientPhone}" data-remain="${remainingAmount}"><i class="fa-brands fa-whatsapp"></i> تسوية</button>`;
                    if (isOverdue) actionsHtml += `<button class="action-remind-btn" data-name="${debt.clientName}" data-phone="${debt.clientPhone}" data-amount="${remainingAmount}"><i class="fa-solid fa-bell"></i> تذكير</button>`;
                } else {
                    actionsHtml += `<span style="font-size: 11px; color: #94a3b8; background: #f1f3f5; padding: 5px 8px; border-radius: 8px; display:flex; align-items:center; justify-content:center; flex:1;"><i class="fa-solid fa-phone-slash"></i> بدون رقم</span>`;
                }

                actionsHtml += `
                    <button class="action-edit-btn" data-id="${debt.id}" data-name="${debt.clientName}" data-amount="${originalAmount}" data-paid="${paidAmount}" data-phone="${debt.clientPhone || ''}" data-reason="${debt.reason || ''}" data-notes="${debt.notes || ''}" data-due="${debt.dueDate || ''}" data-type="lia"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
                    <button class="btn-delete action-delete-btn" data-id="${debt.id}"><i class="fa-solid fa-trash"></i> حذف</button>
                `;

                finalHtml += `
                    <div class="data-card debt-card" style="${isOverdue ? 'border-right-color: #ef233c;' : ''}">
                        <div class="card-header" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                            <h4 style="margin:0;">${debt.clientName}</h4>
                            ${overdueBadge}
                        </div>
                        <div class="card-body" style="margin-bottom: 8px; gap: 10px;">
                            <div class="info-item"><span class="label" style="font-size: 10px; margin-bottom: 2px;">أصل المبلغ</span><span class="value money-highlight money-red">${originalAmount} ج.م</span></div>
                            <div class="info-item"><span class="label" style="font-size: 10px; margin-bottom: 2px;">التليفون</span><span class="value" dir="ltr" style="font-size: 13px;">${debt.clientPhone || '-'}</span></div>
                            ${reasonHtml}
                            ${notesHtml}
                        </div>
                        ${paidInfoHtml}
                        <div class="card-actions-row" style="margin-top: auto; display: flex; gap: 5px;">${actionsHtml}</div>
                        <div class="card-footer" style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(0,0,0,0.05); margin-top: 10px; padding-top: 10px;">
                            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">سُجل: ${recordDate}</span>
                            ${dueDateFormatted ? `<span style="color: #64748b; font-weight: 700; font-size: 11px;">الاستحقاق: ${dueDateFormatted}</span>` : '<span></span>'}
                        </div>
                    </div>`;
            });
        }

        // ---- القسم الثاني: ديون عليك (عليّـا) ----
        finalHtml += `<h3 style="grid-column: 1 / -1; width: 100%; color: #ef233c; border-bottom: 2px solid #ef233c; padding-bottom: 5px; margin-top: 35px; font-weight:700;"><i class="fa-solid fa-arrow-up-long"></i> ديون عليك (المستحق عليّـا)</h3>`;
        
        if (debtsAlia.length === 0) {
            finalHtml += `<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 15px; font-size: 13px;">ممتاز! لا توجد ديون مسجلة عليك للآخرين.</div>`;
        } else {
            debtsAlia.forEach(debt => {
                const recordDate = debt.date ? new Date(debt.date.seconds * 1000).toLocaleDateString('ar-EG') : '-';
                
                const originalAmount = debt.amount || 0;
                const paidAmount = debt.paidAmount || 0;
                const remainingAmount = originalAmount - paidAmount;

                let paidInfoHtml = '';
                if (paidAmount > 0 && remainingAmount > 0) {
                    paidInfoHtml = `<div style="background: rgba(239, 35, 60, 0.05); color: #ef233c; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px; border: 1px dashed rgba(239, 35, 60, 0.3);">سددت منها: ${paidAmount} ج | الباقي عليك: ${remainingAmount} ج</div>`;
                } else if (remainingAmount <= 0 && originalAmount > 0) {
                    paidInfoHtml = `<div style="background: rgba(46, 204, 113, 0.08); color: #27ae60; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 10px;"><i class="fa-solid fa-check-circle"></i> قمت بسداده بالكامل 👍</div>`;
                }

                // عرض السبب والملاحظة لـ عليا في كرت مستقل ومنظم
                let reasonHtml = debt.reason ? `<div class="info-item" style="grid-column: 1 / -1; flex-direction: row; justify-content: center; gap: 5px; margin-top: 2px;"><span class="label" style="margin:0; font-size: 11px;">السبب:</span><span class="value" style="font-size: 12px; color: #475569;">${debt.reason}</span></div>` : '';
                let notesHtml = debt.notes ? `<div class="info-item" style="grid-column: 1 / -1; flex-direction: row; justify-content: center; gap: 5px; margin-top: 2px;"><span class="label" style="margin:0; font-size: 11px;">ملاحظة:</span><span class="value" style="font-size: 12px; color: #64748b; font-style: italic;">${debt.notes}</span></div>` : '';

                finalHtml += `
                    <div class="data-card debt-card" style="border-right-color: #ef233c; background: linear-gradient(135deg, #ffffff 70%, #fff5f5 100%);">
                        <div class="card-header" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                            <h4 style="margin:0;">${debt.clientName}</h4>
                            <span style="background: #ef233c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;"><i class="fa-solid fa-hand-holding-dollar"></i> دين عليك</span>
                        </div>
                        <div class="card-body" style="margin-bottom: 8px; gap: 8px; display:flex; flex-direction:column;">
                            <div class="info-item" style="text-align:center; width:100%;">
                                <span class="label" style="font-size: 11px; margin-bottom: 2px; color:#64748b;">أصل مبلغ الدين</span>
                                <span class="value" style="font-size: 16px; font-weight:bold; color: #ef233c;">${originalAmount} ج.م</span>
                            </div>
                            ${reasonHtml}
                            ${notesHtml}
                        </div>
                        ${paidInfoHtml}
                        <div class="card-actions-row" style="margin-top: auto; display: flex; gap: 5px;">
                            <button class="action-edit-btn" data-id="${debt.id}" data-name="${debt.clientName}" data-amount="${originalAmount}" data-paid="${paidAmount}" data-reason="${debt.reason || ''}" data-notes="${debt.notes || ''}" data-type="alia" style="flex:1;"><i class="fa-solid fa-pen-to-square"></i> تعديل / خصم</button>
                            <button class="btn-delete action-delete-btn" data-id="${debt.id}"><i class="fa-solid fa-trash"></i> حذف</button>
                        </div>
                        <div class="card-footer" style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(0,0,0,0.05); margin-top: 10px; padding-top: 10px;">
                            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">تاريخ الدين: ${recordDate}</span>
                            <span style="font-size: 11px; color: #ef233c; font-weight: 700;">يجب سداده</span>
                        </div>
                    </div>`;
            });
        }

        debtsContainer.innerHTML = finalHtml;
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRender);
    }

    // ========================================================
    // 6. التعامل مع ضغطات الأزرار (التسوية، التعديل الشامل، الحذف)
    // ========================================================
    document.addEventListener('click', async (e) => {
        
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const name = editBtn.getAttribute('data-name');
            const originalAmount = parseFloat(editBtn.getAttribute('data-amount'));
            const currentPaid = parseFloat(editBtn.getAttribute('data-paid')) || 0;
            const dataType = editBtn.getAttribute('data-type') || 'lia';

            if (dataType === 'alia') {
                const reason = editBtn.getAttribute('data-reason') || '';
                const notes = editBtn.getAttribute('data-notes') || '';
                
                // ---- نافذة تعديل مخصصة وخفيفة لحسابات (عليا) مع حقول السبب والملاحظة ----
                Swal.fire({
                    title: `تعديل دين عليك لـ: ${name}`,
                    html: `
                        <div style="overflow: hidden;">
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">اسم الدائن / الجهة</label>
                                <input type="text" id="editName" value="${name}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">السبب</label>
                                <input type="text" id="editReason" value="${reason}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">ملاحظة</label>
                                <input type="text" id="editNotes" value="${notes}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div style="display: flex; gap: 15px; text-align: right; direction: rtl;">
                                <div class="swal-input-group" style="flex: 1; margin-bottom: 0;">
                                    <label style="display: block; font-size: 13px; color: #ef233c; margin-bottom: 5px; font-weight: 600;">أصل المديونية عليا (ج.م)</label>
                                    <input type="number" id="editOriginal" value="${originalAmount}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                                </div>
                                <div class="swal-input-group" style="flex: 1; margin-bottom: 0;">
                                    <label style="display: block; font-size: 13px; color: #27ae60; margin-bottom: 5px; font-weight: 600;">ما قمت بسداده (ج.م)</label>
                                    <input type="number" id="editPaid" value="${currentPaid}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                                </div>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'حفظ التعديلات',
                    cancelButtonText: 'إلغاء',
                    confirmButtonColor: '#4361ee',
                    cancelButtonColor: '#94a3b8',
                    preConfirm: () => {
                        return {
                            clientName: document.getElementById('editName').value.trim(),
                            amount: parseFloat(document.getElementById('editOriginal').value) || 0,
                            paidAmount: parseFloat(document.getElementById('editPaid').value) || 0,
                            reason: document.getElementById('editReason').value.trim(),
                            notes: document.getElementById('editNotes').value.trim(),
                            debtType: 'alia'
                        }
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const updatedData = result.value;
                            if (updatedData.paidAmount >= updatedData.amount && updatedData.amount > 0) {
                                await deleteDoc(doc(db, "debts", id));
                                Swal.fire({ icon: 'success', title: 'تم تسديد الدين بالكامل وحذف الحساب بنجاح 🎉', confirmButtonColor: '#4361ee' });
                            } else {
                                await updateDoc(doc(db, "debts", id), updatedData);
                                Swal.fire({ icon: 'success', title: 'تم تحديث البيانات بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                            }
                        } catch (err) {
                            console.error(err);
                            Swal.fire('خطأ', 'حدثت مشكلة أثناء المعالجة', 'error');
                        }
                    }
                });

            } else {
                // ---- نافذة التعديل التقليدية لحسابات (ليا) الشاملة للملاحظات أيضا ----
                const phone = editBtn.getAttribute('data-phone');
                const reason = editBtn.getAttribute('data-reason');
                const notes = editBtn.getAttribute('data-notes') || '';
                const dueDate = editBtn.getAttribute('data-due');

                Swal.fire({
                    title: `تعديل بيانات: ${name}`,
                    html: `
                        <div style="overflow: hidden;">
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">اسم العميل</label>
                                <input type="text" id="editName" value="${name}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">رقم التليفون</label>
                                <input type="text" id="editPhone" value="${phone}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">السبب</label>
                                <input type="text" id="editReason" value="${reason}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">ملاحظة</label>
                                <input type="text" id="editNotes" value="${notes}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <div class="swal-input-group" style="text-align: right; direction: rtl; margin-bottom: 15px;">
                                <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 5px; font-weight: 600;">تاريخ الاستحقاق</label>
                                <input type="date" id="editDue" value="${dueDate}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                            </div>
                            <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #cbd5e1;">
                            <div style="display: flex; gap: 15px; text-align: right; direction: rtl;">
                                <div class="swal-input-group" style="flex: 1; margin-bottom: 0;">
                                    <label style="display: block; font-size: 13px; color: #ef233c; margin-bottom: 5px; font-weight: 600;">أصل المديونية (ج.م)</label>
                                    <input type="number" id="editOriginal" value="${originalAmount}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                                </div>
                                <div class="swal-input-group" style="flex: 1; margin-bottom: 0;">
                                    <label style="display: block; font-size: 13px; color: #27ae60; margin-bottom: 5px; font-weight: 600;">ما تم دفعه (ج.م)</label>
                                    <input type="number" id="editPaid" value="${currentPaid}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: 'Rubik'; font-size: 14px; box-sizing: border-box;">
                                </div>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'حفظ التعديلات',
                    cancelButtonText: 'إلغاء',
                    confirmButtonColor: '#4361ee',
                    cancelButtonColor: '#94a3b8',
                    preConfirm: () => {
                        return {
                            clientName: document.getElementById('editName').value.trim(),
                            clientPhone: document.getElementById('editPhone').value.trim(),
                            reason: document.getElementById('editReason').value.trim(),
                            notes: document.getElementById('editNotes').value.trim(),
                            dueDate: document.getElementById('editDue').value,
                            amount: parseFloat(document.getElementById('editOriginal').value) || 0,
                            paidAmount: parseFloat(document.getElementById('editPaid').value) || 0,
                            debtType: 'lia'
                        }
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const updatedData = result.value;
                            if (updatedData.paidAmount >= updatedData.amount && updatedData.amount > 0) {
                                if (updatedData.clientPhone) {
                                    let formattedPhone = updatedData.clientPhone.replace(/\D/g, '');
                                    if (formattedPhone.startsWith('01') && formattedPhone.length === 11) formattedPhone = '2' + formattedPhone;
                                    await deleteDoc(doc(db, "debts", id));
                                    Swal.fire({ icon: 'success', title: 'تم السداد وحذف الحساب! 🎉', text: 'توجيه للواتساب لشكر العميل..', showConfirmButton: false, timer: 2000 });
                                    setTimeout(() => {
                                        const msg = encodeURIComponent(`السلام عليكم أ. ${updatedData.clientName}،\nتم تسجيل دفعتكم الأخيرة وتصفية الحساب بالكامل 🤝\nشكراً لالتزامكم ونتمنى لكم التوفيق دايماً 💐🎉`);
                                        window.open(`whatsapp://send?phone=${formattedPhone}&text=${msg}`, '_self');
                                    }, 2000);
                                } else {
                                    await deleteDoc(doc(db, "debts", id));
                                    Swal.fire({ icon: 'success', title: 'تم تصفية المديونية بنجاح 🎉', confirmButtonColor: '#4361ee' });
                                }
                            } else {
                                await updateDoc(doc(db, "debts", id), updatedData);
                                Swal.fire({ icon: 'success', title: 'تم التحديث بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                });
            }
        }

        // --- زرار التذكير للعملاء ---
        const remindBtn = e.target.closest('.action-remind-btn');
        if (remindBtn) {
            const name = remindBtn.getAttribute('data-name');
            const amount = remindBtn.getAttribute('data-amount');
            let phone = remindBtn.getAttribute('data-phone').replace(/\D/g, '');
            if (phone.startsWith('01') && phone.length === 11) phone = '2' + phone;
            const msg = encodeURIComponent(`السلام عليكم أ. ${name}، نذكركم بحلول موعد سداد المديونية المستحقة وقيمتها المتبقية (${amount} ج.م). برجاء السداد وشكراً لكم.`);
            window.open(`whatsapp://send?phone=${phone}&text=${msg}`, '_self');
        }

        // --- زرار الحذف الشامل ---
        const deleteBtn = e.target.closest('.action-delete-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            Swal.fire({ title: 'متأكد من الحذف؟', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef233c', confirmButtonText: 'احذف', cancelButtonText: 'إلغاء' }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteDoc(doc(db, "debts", id));
                    Swal.fire({ icon: 'success', title: 'تم الحذف', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                }
            });
        }

        // --- زرار الواتساب (التسوية ليّا) ---
        const whatsappBtn = e.target.closest('.action-whatsapp-btn');
        if (whatsappBtn) {
            const id = whatsappBtn.getAttribute('data-id');
            const name = whatsappBtn.getAttribute('data-name');
            let phone = whatsappBtn.getAttribute('data-phone').replace(/\D/g, '');
            if (phone.startsWith('01') && phone.length === 11) phone = '2' + phone;
            
            Swal.fire({ title: 'تصفية الحساب نهائياً؟', text: `سيتم إغلاق حساب أ. ${name} فوراً وحذفه.`, icon: 'question', showCancelButton: true, confirmButtonColor: '#25D366', confirmButtonText: 'تصفية وإرسال شكر' }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteDoc(doc(db, "debts", id));
                    const msg = encodeURIComponent(`السلام عليكم أ. ${name}،\nتمت تصفية الحساب وتسديد المديونية بالكامل 🤝\nسعدنا جداً بالتعامل معاكم💐🎉`);
                    window.open(`whatsapp://send?phone=${phone}&text=${msg}`, '_self');
                }
            });
        }
    });
});