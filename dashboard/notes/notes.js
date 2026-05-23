// Develop py Mohamed Waled - Protected Smart Notes Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../index.html'; 
        return;
    }

    const currentUserId = user.uid;

    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const noteModalOverlay = document.getElementById('noteModalOverlay');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const notesContainer = document.getElementById('notesContainer');
    const noteSearch = document.getElementById('noteSearch');

    const modalTitle = document.getElementById('modalNoteTitle');
    const modalBody = document.getElementById('modalNoteBody');

    let allNotes = [];
    let editingNoteId = null;

    function openModal(title = "", body = "", id = null) {
        editingNoteId = id;
        modalTitle.value = title;
        modalBody.value = body;
        
        if (id) {
            saveNoteBtn.innerText = "تحديث التعديل";
            deleteNoteBtn.style.display = "inline-block"; 
        } else {
            saveNoteBtn.innerText = "حفظ الملاحظة";
            deleteNoteBtn.style.display = "none"; 
        }
        
        noteModalOverlay.classList.add('active');
        modalBody.focus();
    }

    function closeModal() {
        noteModalOverlay.classList.remove('active');
        modalTitle.value = "";
        modalBody.value = "";
        editingNoteId = null;
    }

    if (openModalBtn) openModalBtn.addEventListener('click', () => openModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (noteModalOverlay) {
        noteModalOverlay.addEventListener('click', (e) => {
            if (e.target === noteModalOverlay) closeModal();
        });
    }

    // جلب البيانات معزولة لايف وترتيب التنازلي (الجديد فوق)
    const notesQuery = query(
        collection(db, "notes"),
        where("userId", "==", currentUserId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(notesQuery, (snapshot) => {
        allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderNotes();
    }, (error) => {
        console.error(error);
    });

    function renderNotes() {
        if (!notesContainer) return;

        const term = noteSearch ? noteSearch.value.trim().toLowerCase() : "";
        const filteredNotes = allNotes.filter(note => 
            (note.title && note.title.toLowerCase().includes(term)) || 
            (note.content && note.content.toLowerCase().includes(term))
        );

        notesContainer.innerHTML = "";

        filteredNotes.forEach(note => {
            const dateStr = note.createdAt && typeof note.createdAt.toDate === 'function' 
                ? note.createdAt.toDate().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) 
                : 'جاري الحفظ...';

            notesContainer.innerHTML += `
                <div class="note-card" data-id="${note.id}">
                    ${note.title ? `<h4 class="note-title">${note.title}</h4>` : ''}
                    <div class="note-content">${note.content}</div>
                    <div class="note-footer">
                        <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                    </div>
                </div>`;
        });
    }

    if (noteSearch) {
        noteSearch.addEventListener('input', renderNotes);
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
            const titleVal = modalTitle.value.trim();
            const bodyVal = modalBody.value.trim();

            if (!bodyVal) {
                Swal.fire({ icon: 'warning', title: 'المحتوى فارغ!', text: 'اكتب تفاصيل الملاحظة أولاً قبل الحفظ.', confirmButtonColor: '#4361ee' });
                return;
            }

            saveNoteBtn.disabled = true;
            try {
                if (editingNoteId) {
                    await updateDoc(doc(db, "notes", editingNoteId), { title: titleVal, content: bodyVal });
                    Swal.fire({ icon: 'success', title: 'تم التحديث بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                } else {
                    await addDoc(collection(db, "notes"), { title: titleVal, content: bodyVal, userId: currentUserId, createdAt: serverTimestamp() });
                    Swal.fire({ icon: 'success', title: 'تم الحفظ بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                }
                closeModal();
            } catch (err) {
                console.error(err);
            } finally {
                saveNoteBtn.disabled = false;
            }
        });
    }

    // [تعديل جوهري وتصليح الحذف]: الحذف الفوري مع تأمين الـ Alert فوق الواجهة مية مية
    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!editingNoteId) return;

            Swal.fire({
                title: 'حذف الملاحظة؟',
                text: 'سيتم حذف محتوى النوتة نهائياً من حسابك!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef233c',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'نعم، احذفها',
                cancelButtonText: 'إلغاء'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const idToDelete = editingNoteId; 
                        closeModal(); // قفل المودال الأول فوراً
                        await deleteDoc(doc(db, "notes", idToDelete));
                        Swal.fire({ icon: 'success', title: 'تم الحذف بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                    } catch (err) {
                        console.error("خطأ أثناء الحذف:", err);
                    }
                }
            });
        });
    }

    // فتح الملاحظة عند الضغط على الكارت
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.note-card');
        if (card && !card.classList.contains('add-note-trigger')) {
            const id = card.getAttribute('data-id');
            const note = allNotes.find(n => n.id === id);
            if (note) {
                openModal(note.title || "", note.content, note.id);
            }
        }
    });
});