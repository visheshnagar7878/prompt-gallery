// ========================================
// FIREBASE CONFIGURATION & IMPORTS
// ========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
// LOAD IMAGES FROM FIREBASE (WITH REAL-TIME UPDATES)
// ========================================
function loadImagesFromFirebase() {
    const galleryContainer = document.getElementById('galleryContainer');
    
    if (!galleryContainer) {
        console.error('Gallery container not found');
        return;
    }
    
    // Show loading message
    galleryContainer.innerHTML = '<div class="loading-spinner"><p>Loading gallery...</p></div>';
    
    // Setup real-time listener for gallery collection
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    
    // onSnapshot listens for real-time updates
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
        
        // Generate gallery with new data
        generateGallery();
    }, (error) => {
        console.error('Error loading images:', error);
        if (galleryContainer) {
            galleryContainer.innerHTML = '<p style="text-align: center; width: 100%; padding: 40px; color: red;">Error loading gallery. Please refresh.</p>';
        }
    });
}

// ========================================
// GENERATE GALLERY
// ========================================
function generateGallery() {
    const galleryContainer = document.getElementById('galleryContainer');
    
    if (!galleryContainer) return;
    
    // Clear existing content
    galleryContainer.innerHTML = '';
    
    // Show message if no images
    if (images.length === 0) {
        galleryContainer.innerHTML = '<p style="text-align: center; width: 100%; padding: 40px; color: #666;">No images yet. Upload from admin panel!</p>';
        return;
    }
    
    // Create gallery boxes
    images.forEach((item, index) => {
        const box = document.createElement('div');
        box.className = 'box';
        box.style.animationDelay = `${index * 0.1}s`;
        box.onclick = () => openModal(index);
        
        box.innerHTML = `
            <div class="image">
                <img src="${item.src}" alt="AI Generated Image" loading="lazy">
            </div>
            <div class="image-overlay">
                <span>View Details</span>
            </div>
        `;
        
        galleryContainer.appendChild(box);
    });
    
    // Re-apply scroll animations to new boxes
    setTimeout(() => {
        document.querySelectorAll('.box').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            if (window.observer) window.observer.observe(el);
        });
    }, 100);
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function openModal(index) {
    currentIndex = index;
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalPrompt = document.getElementById('modalPrompt');
    
    if (!modal || !modalImg || !modalPrompt) {
        console.error('Modal elements not found');
        return;
    }
    
    modal.classList.add('active');
    modalImg.src = images[index].src;
    modalPrompt.textContent = images[index].prompt;
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeImage(direction) {
    if (images.length === 0) return;
    
    currentIndex += direction;
    
    if (currentIndex >= images.length) {
        currentIndex = 0;
    } else if (currentIndex < 0) {
        currentIndex = images.length - 1;
    }
    
    const modalImg = document.getElementById('modalImage');
    const modalPrompt = document.getElementById('modalPrompt');
    
    if (!modalImg || !modalPrompt) return;
    
    modalImg.style.animation = 'none';
    modalPrompt.style.animation = 'none';
    
    setTimeout(() => {
        modalImg.src = images[currentIndex].src;
        modalPrompt.textContent = images[currentIndex].prompt;
        modalImg.style.animation = 'slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        modalPrompt.style.animation = 'fadeInUp 0.5s ease 0.2s both';
    }, 50);
}

// Make functions globally available for onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.changeImage = changeImage;

// ========================================
// EVENT LISTENERS
// ========================================

// Load gallery when page loads
window.addEventListener('DOMContentLoaded', function() {
    loadImagesFromFirebase();
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('imageModal');
    if (modal && modal.classList.contains('active')) {
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'Escape') closeModal();
    }
});

// Mouse wheel in modal
const modalElement = document.getElementById('imageModal');
if (modalElement) {
    modalElement.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            changeImage(1);
        } else {
            changeImage(-1);
        }
    }, { passive: false });

    // Close on outside click
    modalElement.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// ========================================
// SCROLL ANIMATIONS
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Store observer globally
window.observer = observer;

// Observe about section elements
document.querySelectorAll('.about-card, .about-profile').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 60;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
// ========================================
// THEME TOGGLE FUNCTIONALITY
// ========================================

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    body.classList.add('light-mode');
}

// Toggle theme
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        
        // Save preference
        const theme = body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        
        // Add animation
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
}
