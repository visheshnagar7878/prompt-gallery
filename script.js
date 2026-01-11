// ========================================
// FIREBASE CONFIGURATION & IMPORTS
// ========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBeJAFrLVOPXvRVh3uHdwUtayktoY4tZIQ",
    authDomain: "prompt-gallery-5ee9e.firebaseapp.com",
    projectId: "prompt-gallery-5ee9e",
    storageBucket: "prompt-gallery-5ee9e.firebasestorage.app",
    messagingSenderId: "201682624108",
    appId: "1:201682624108:web:513ebfb5c317e939c48249",
    measurementId: "G-RRWMXCENPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========================================
// GLOBAL VARIABLES
// ========================================
let images = [];
let currentIndex = 0;

// ========================================
// UI HELPERS (TOAST, ETC)
// ========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    // Reset status
    toast.className = 'fixed bottom-8 left-8 transform translate-y-0 opacity-100 transition-all duration-300 z-50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3';

    if (type === 'error') {
        toast.classList.add('border-red-500');
    }

    // Hide after 3s
    setTimeout(() => {
        toast.className = 'fixed bottom-8 left-8 transform translate-y-20 opacity-0 transition-all duration-300 z-50';
    }, 3000);
}

window.copyPrompt = async function () {
    const promptText = document.getElementById('modalPrompt').textContent;
    if (!promptText) return;

    try {
        await navigator.clipboard.writeText(promptText);

        const loadText = document.getElementById('copyText');
        const loadIcon = document.getElementById('copyIcon');
        const originalText = loadText.textContent;

        loadText.textContent = 'Copied!';
        loadIcon.textContent = '✓';
        loadIcon.classList.add('text-green-400');

        showToast('Prompt copied to clipboard!');

        setTimeout(() => {
            loadText.textContent = originalText;
            loadIcon.textContent = '📋';
            loadIcon.classList.remove('text-green-400');
        }, 2000);

    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy prompt', 'error');
    }
};

// ========================================
// SKELETON LOADER
// ========================================
function showSkeletonLoader() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';

    // Create 8 skeleton boxes
    for (let i = 0; i < 8; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'w-full h-[400px] rounded-xl skeleton border border-white/5';
        galleryContainer.appendChild(skeleton);
    }
}

// ========================================
// LOAD IMAGES
// ========================================
function loadImagesFromFirebase() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) return;

    showSkeletonLoader();

    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (querySnapshot) => {
        images = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            images.push({
                src: data.imageUrl,
                prompt: data.prompt,
                id: doc.id
            });
        });
        generateGallery();
    }, (error) => {
        console.error('Error:', error);
        galleryContainer.innerHTML = `
            <div class="col-span-full text-center py-20 text-red-400">
                <h3 class="text-xl font-bold mb-2">Unable to load gallery</h3>
                <p class="text-sm">Please check your internet connection.</p>
            </div>
        `;
    });
}

// ========================================
// GENERATE GALLERY
// ========================================
function generateGallery() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';

    if (images.length === 0) {
        galleryContainer.innerHTML = `
            <div class="col-span-full text-center py-20 text-slate-500">
                <p class="text-lg">No images yet. Upload from admin panel!</p>
            </div>
        `;
        return;
    }

    images.forEach((item, index) => {
        const box = document.createElement('div');
        // Professional Card Style
        box.className = 'group relative rounded-xl overflow-hidden cursor-pointer bg-slate-800 border border-white/5 shadow-md card-hover opacity-0 translate-y-8 animate-slide-up';
        box.style.animationFillMode = 'forwards';
        box.style.animationDelay = `${index * 0.1}s`;
        box.onclick = () => openModal(index);

        box.innerHTML = `
            <div class="w-full h-[400px] overflow-hidden bg-slate-900">
                <img src="${item.src}" alt="AI Art" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105">
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span class="inline-block px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full mb-2">View Prompt</span>
                </div>
            </div>
        `;

        galleryContainer.appendChild(box);
    });
}

// ========================================
// MODAL LOGIC
// ========================================
function openModal(index) {
    currentIndex = index;
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalPrompt = document.getElementById('modalPrompt');

    if (!modal || !modalImg) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    modalImg.src = images[index].src;
    modalPrompt.textContent = images[index].prompt;

    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
}

function changeImage(direction) {
    if (images.length === 0) return;

    currentIndex += direction;
    if (currentIndex >= images.length) currentIndex = 0;
    else if (currentIndex < 0) currentIndex = images.length - 1;

    const modalImg = document.getElementById('modalImage');
    const modalPrompt = document.getElementById('modalPrompt');

    // Quick fade out/in
    modalImg.style.opacity = '0.7';

    setTimeout(() => {
        modalImg.src = images[currentIndex].src;
        modalPrompt.textContent = images[currentIndex].prompt;
        modalImg.style.opacity = '1';
    }, 150);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.changeImage = changeImage;

// ========================================
// INIT & EVENTS
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    loadImagesFromFirebase();
});

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('imageModal');
    if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'Escape') closeModal();
    }
});

// Scroll to Top
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.remove('translate-y-20', 'opacity-0');
    } else {
        scrollTopBtn.classList.add('translate-y-20', 'opacity-0');
    }
});
scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const navbar = document.getElementById('navbar');

// Apply saved theme
if (localStorage.getItem('theme') === 'light') {
    enableLightMode();
}

function enableLightMode() {
    body.classList.add('light');
    body.classList.replace('bg-slate-950', 'bg-slate-50');
    body.classList.replace('text-slate-200', 'text-slate-900');


}

function enableDarkMode() {
    body.classList.remove('light');
    body.classList.replace('bg-slate-50', 'bg-slate-950');
    body.classList.replace('text-slate-900', 'text-slate-200');


}

themeToggle?.addEventListener('click', () => {
    if (body.classList.contains('light')) {
        enableDarkMode();
        localStorage.setItem('theme', 'dark');
    } else {
        enableLightMode();
        localStorage.setItem('theme', 'light');
    }
});
