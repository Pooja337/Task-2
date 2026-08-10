/* ==========================================================================
   AURA MAISON DE BEAUTÉ - MAIN APPLICATION SCRIPT
   ========================================================================== */

// --- PRODUCT DATA CATALOGUE ---
const PRODUCTS = [
    {
        id: 'aura-01',
        name: 'L’Élixir D’Or 24K Serum',
        category: 'serum',
        categoryLabel: 'Cellular Elixir',
        price: 240,
        tag: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
        description: 'Bio-available 24K gold particles combined with Swiss Edelweiss stem cells for instant dermal luminosity.'
    },
    {
        id: 'aura-02',
        name: 'Crème Supreme Restorative',
        category: 'cream',
        categoryLabel: 'Velvet Hydra-Cream',
        price: 195,
        tag: 'Award Winner',
        image: 'https://images.unsplash.com/photo-1608248597263-00079996576f?auto=format&fit=crop&w=800&q=80',
        description: 'Rich peptide complex engineered to restore skin elasticity and reinforce lipid moisture barriers overnight.'
    },
    {
        id: 'aura-03',
        name: 'Alpine Nectar Botanical Essence',
        category: 'cleanser',
        categoryLabel: 'Hydrating Essence',
        price: 110,
        tag: 'New Release',
        image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
        description: 'High-altitude botanical floral water infused with hyaluronic acid for weightless multi-depth hydration.'
    },
    {
        id: 'aura-04',
        name: 'Auric Glow Infusion Concentrate',
        category: 'serum',
        categoryLabel: 'Intensive Concentrate',
        price: 285,
        tag: 'Limited Edition',
        image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
        description: 'Ultra-concentrated Vitamin C micro-encapsulated in botanical liposomes for intense dark spot correction.'
    },
    {
        id: 'aura-05',
        name: 'Botanical Cleansing Silk Balm',
        category: 'cleanser',
        categoryLabel: 'Purifying Balm',
        price: 95,
        tag: 'Essential',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
        description: 'Melts on contact with skin to effortlessly remove impurities while preserving natural moisture lipids.'
    },
    {
        id: 'aura-06',
        name: 'Nocturne Renewal Eye Elixir',
        category: 'cream',
        categoryLabel: 'Eye Contour',
        price: 165,
        tag: 'Customer Favorite',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
        description: 'Targeted eye serum formulated with botanical caffeine and marine collagen to depuff and brighten.'
    }
];

// --- APP STATE ---
const state = {
    activePage: 'home',
    cart: [],
    videoDuration: 0,
    isMobile: window.innerWidth <= 768
};

// --- DOM ELEMENTS ---
let navbar, heroVideo, heroVideoContainer, heroContent;

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM Elements
    navbar = document.getElementById('navbar');
    heroVideo = document.getElementById('heroVideo');
    heroVideoContainer = document.getElementById('heroVideoContainer');
    heroContent = document.getElementById('heroContent');

    // Initialize Components
    initNavigation();
    initHeroLoopVideo();
    renderProducts();
    initContactForm();
    initCartModal();

    // Check Window Resize for Mobile State
    window.addEventListener('resize', () => {
        state.isMobile = window.innerWidth <= 768;
    });
});

/* --------------------------------------------------------------------------
   1. NAVIGATION & SPA ROUTING
   -------------------------------------------------------------------------- */
function initNavigation() {
    const navLinks = document.querySelectorAll('[data-page]');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    // Handle Page Switching
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetPage = link.getAttribute('data-page');
            if (targetPage) {
                e.preventDefault();
                switchPage(targetPage);

                // Close mobile menu if open
                if (navMenu.classList.contains('mobile-open')) {
                    navMenu.classList.remove('mobile-open');
                }
            }
        });
    });

    // Mobile Toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('mobile-open');
        });
    }

    // Handle Navbar Solidify on Scroll
    window.addEventListener('scroll', handleNavbarScroll);
}

function switchPage(pageId) {
    const pages = document.querySelectorAll('.page-view');
    const links = document.querySelectorAll('.nav-link');

    pages.forEach(page => {
        page.classList.remove('active');
    });

    const activePage = document.getElementById(`page-${pageId}`);
    if (activePage) {
        activePage.classList.add('active');
        state.activePage = pageId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Nav Active State
    links.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Handle Navbar opacity based on page
    handleNavbarScroll();
}

function handleNavbarScroll() {
    if (window.scrollY > 50 || state.activePage !== 'home') {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

/* --------------------------------------------------------------------------
   2. HERO SCROLL-DRIVEN INFINITE LOOPING VIDEO TIMELINE
   -------------------------------------------------------------------------- */
function initHeroLoopVideo() {
    if (!heroVideo) return;

    const heroSection = document.getElementById('hero');

    // Setup: muted, paused, no autoplay — scroll owns the timeline
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    heroVideo.loop = false;
    heroVideo.autoplay = false;
    heroVideo.pause();
    heroVideo.currentTime = 0;

    // ---- State ----
    // virtualPos accumulates raw scroll delta (in px) continuously.
    // We convert it to a wrapped 0..duration time on each frame.
    // Using delta instead of scrollY makes backward scrolling work:
    //   scrollY can never go negative, but delta can keep decrementing.
    let lastScrollY = window.scrollY;
    let virtualPos = 0;          // accumulated scroll delta in pixels
    let targetTime = 0;          // desired video.currentTime (0..duration)
    let displayTime = 0;         // what we last wrote to video.currentTime
    let rafId = null;
    let needsRender = false;

    // How many pixels of scroll = one full pass through the video
    const PX_PER_CYCLE = 500;

    // ---- Metadata ----
    function onMeta() {
        state.videoDuration = heroVideo.duration;
    }
    if (heroVideo.readyState >= 1) {
        onMeta();
    } else {
        heroVideo.addEventListener('loadedmetadata', onMeta, { once: true });
    }

    // ---- rAF render loop: only writes currentTime when needed ----
    function renderLoop() {
        rafId = requestAnimationFrame(renderLoop);

        const duration = heroVideo.duration;
        if (!duration || duration <= 0) return;

        // Smooth lerp toward targetTime with wrap-aware shortest path
        let diff = targetTime - displayTime;

        // Wrap diff to the shorter arc
        if (diff > duration / 2)  diff -= duration;
        if (diff < -duration / 2) diff += duration;

        if (Math.abs(diff) < 0.001) return; // nothing to do

        // Lerp step (0.15 = smooth; increase for snappier response)
        displayTime += diff * 0.15;

        // Keep displayTime within [0, duration)
        displayTime = ((displayTime % duration) + duration) % duration;

        // Avoid thrashing the decoder with tiny changes
        if (Math.abs(heroVideo.currentTime - displayTime) > 0.015) {
            heroVideo.currentTime = displayTime;
        }
    }
    rafId = requestAnimationFrame(renderLoop);

    // ---- Scroll handler: accumulate delta, compute wrapped targetTime ----
    window.addEventListener('scroll', () => {
        if (state.activePage !== 'home') return;

        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;
        virtualPos += delta;

        const duration = heroVideo.duration;
        if (!duration || duration <= 0) return;

        // Map virtualPos to [0..1) with infinite wrapping in both directions
        const rawProgress = virtualPos / PX_PER_CYCLE;
        const wrappedProgress = ((rawProgress % 1) + 1) % 1;
        targetTime = wrappedProgress * duration;

        // Hero text fade-out on scroll
        if (heroContent && heroSection) {
            const heroHeight = heroSection.offsetHeight || window.innerHeight;
            const fadeOpacity = Math.max(1 - (scrollY / (heroHeight * 0.7)), 0);
            heroContent.style.opacity = fadeOpacity;
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   3. PRODUCT RENDERING & FILTERING
   -------------------------------------------------------------------------- */
function renderProducts() {
    const featuredGrid = document.getElementById('featuredProductGrid');
    const fullGrid = document.getElementById('fullProductGrid');

    // 1. Render Featured Products (First 4)
    if (featuredGrid) {
        const featuredList = PRODUCTS.slice(0, 4);
        featuredGrid.innerHTML = featuredList.map(product => createProductCardHTML(product)).join('');
    }

    // 2. Render Full Products Grid
    if (fullGrid) {
        fullGrid.innerHTML = PRODUCTS.map(product => createProductCardHTML(product)).join('');
        initFilterTabs();
    }

    // Attach Add to Cart Listeners
    attachAddToCartListeners();
}

function createProductCardHTML(product) {
    return `
        <div class="product-card" data-category="${product.category}">
            <div class="product-img-wrap">
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.categoryLabel}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price}.00</div>
                <button class="btn-add-cart" data-id="${product.id}">Add To Cart</button>
            </div>
        </div>
    `;
}

function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');
            const cards = document.querySelectorAll('#fullProductGrid .product-card');

            cards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function attachAddToCartListeners() {
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-add-cart')) {
            const productId = e.target.getAttribute('data-id');
            const product = PRODUCTS.find(p => p.id === productId);
            if (product) {
                addToCart(product);
            }
        }
    });
}

/* --------------------------------------------------------------------------
   4. SHOPPING CART FUNCTIONALITY & MODAL
   -------------------------------------------------------------------------- */
function initCartModal() {
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn && cartModal) {
        cartBtn.addEventListener('click', () => cartModal.classList.add('active'));
        closeCart.addEventListener('click', () => cartModal.classList.remove('active'));
        cartOverlay.addEventListener('click', () => cartModal.classList.remove('active'));
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                showToast('Your shopping cart is empty');
            } else {
                showToast('Thank you! Redirecting to secure luxury checkout...');
                state.cart = [];
                updateCartUI();
                setTimeout(() => cartModal.classList.remove('active'), 1500);
            }
        });
    }
}

function addToCart(product) {
    state.cart.push(product);
    updateCartUI();
    showToast(`Added ${product.name} to cart`);
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotal = document.getElementById('cartSubtotal');

    if (cartCount) cartCount.textContent = state.cart.length;

    if (cartItemsList) {
        if (state.cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
        } else {
            cartItemsList.innerHTML = state.cart.map((item, index) => `
                <div class="cart-item-row">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price}.00</div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
                </div>
            `).join('');
        }
    }

    if (cartSubtotal) {
        const total = state.cart.reduce((sum, item) => sum + item.price, 0);
        cartSubtotal.textContent = `$${total}.00`;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}

/* --------------------------------------------------------------------------
   5. CONTACT FORM VALIDATION
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    const successAlert = document.getElementById('contactSuccess');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;

        const nameInput = document.getElementById('contactName');
        const emailInput = document.getElementById('contactEmail');
        const messageInput = document.getElementById('contactMessage');

        // Name Validation
        if (!nameInput.value.trim()) {
            nameInput.closest('.form-group').classList.add('error');
            isValid = false;
        } else {
            nameInput.closest('.form-group').classList.remove('error');
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            emailInput.closest('.form-group').classList.add('error');
            isValid = false;
        } else {
            emailInput.closest('.form-group').classList.remove('error');
        }

        // Message Validation
        if (!messageInput.value.trim()) {
            messageInput.closest('.form-group').classList.add('error');
            isValid = false;
        } else {
            messageInput.closest('.form-group').classList.remove('error');
        }

        if (isValid) {
            form.style.display = 'none';
            if (successAlert) {
                successAlert.classList.remove('hidden');
            }
        }
    });
}
