/* ==========================================================================
   AURA MAISON DE BEAUTÉ - MAIN APPLICATION SCRIPT
   ========================================================================== */

// --- PRODUCT DATA CATALOGUE ---
const PRODUCTS = [
    {
        id: 'aura-01',
        name: 'L\'Élixir D\'Or 24K Serum',
        category: 'serum',
        categoryLabel: 'Cellular Elixir',
        price: 240,
        tag: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80',
        alt: 'AURA L\'Élixir D\'Or — luxury gold serum in an amber glass dropper bottle on a marble surface',
        description: 'Bio-available 24K gold particles combined with Swiss Edelweiss stem cells for instant dermal luminosity.'
    },
    {
        id: 'aura-02',
        name: 'Crème Supreme Restorative',
        category: 'cream',
        categoryLabel: 'Velvet Hydra-Cream',
        price: 195,
        tag: 'Award Winner',
        image: './public/images/creme_supreme.png',
        alt: 'AURA Crème Supreme Restorative face cream jar with gold logo lettering on dark marble reflecting surface',
        description: 'Rich peptide complex engineered to restore skin elasticity and reinforce lipid moisture barriers overnight.'
    },
    {
        id: 'aura-03',
        name: 'Alpine Nectar Botanical Essence',
        category: 'cleanser',
        categoryLabel: 'Hydrating Essence',
        price: 110,
        tag: 'New Release',
        image: './public/images/alpine_nectar.png',
        alt: 'AURA Alpine Nectar Botanical Essence luxury glass dropper bottle filled with pale golden-green essence standing amidst alpine botanicals',
        description: 'High-altitude botanical floral water infused with hyaluronic acid for weightless multi-depth hydration.'
    },
    {
        id: 'aura-04',
        name: 'Auric Glow Infusion Concentrate',
        category: 'serum',
        categoryLabel: 'Intensive Concentrate',
        price: 285,
        tag: 'Limited Edition',
        image: './public/images/auric_glow.jpg',
        alt: 'AURA Auric Glow Infusion Concentrate gold-infused cream jar with metal applicator on dark marble',
        description: 'Ultra-concentrated Vitamin C micro-encapsulated in botanical liposomes for intense dark spot correction.'
    },
    {
        id: 'aura-05',
        name: 'Botanical Cleansing Silk Balm',
        category: 'cleanser',
        categoryLabel: 'Purifying Balm',
        price: 95,
        tag: 'Essential',
        image: './public/images/cleansing_balm.png',
        alt: 'AURA Botanical Cleansing Silk Balm tube on linen fabric with decorative twigs',
        description: 'Melts on contact with skin to effortlessly remove impurities while preserving natural moisture lipids.'
    },
    {
        id: 'aura-06',
        name: 'Nocturne Renewal Eye Elixir',
        category: 'cream',
        categoryLabel: 'Eye Contour',
        price: 165,
        tag: 'Customer Favorite',
        image: './public/images/eye_elixir.png',
        alt: 'AURA Nocturne Renewal Eye Elixir squeeze tube reflecting on a dark table surface in front of a window',
        description: 'Targeted eye serum formulated with botanical caffeine and marine collagen to depuff and brighten.'
    }
];

// --- CART STATE (loaded from localStorage) ---
const CART_STORAGE_KEY = 'aura-cart-v1';

const state = {
    activePage: 'home',
    cart: loadCartFromStorage(),
    videoDuration: 0,
    isMobile: window.innerWidth <= 768
};

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch { /* corrupt storage — ignore */ }
    return [];
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch { /* storage full — ignore */ }
}

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

    // Restore cart count on load
    updateCartUI();

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

    // Cart page must render fresh on navigation — updateCartUI() only
    // re-renders it when it's already the active page, so a nav click
    // into the cart otherwise shows stale/empty content.
    if (pageId === 'cart') {
        renderCartPage();
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
        if (diff > duration / 2) diff -= duration;
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

    // 1. Render Featured Products (First 4 — uses the specified Unsplash images)
    if (featuredGrid) {
        const featuredList = PRODUCTS.slice(0, 4);
        featuredGrid.innerHTML = featuredList.map(product => createProductCardHTML(product)).join('');
    }

    // 2. Render Full Products Grid
    if (fullGrid) {
        fullGrid.innerHTML = PRODUCTS.map(product => createProductCardHTML(product)).join('');
        initFilterTabs();
    }

    // Attach Add to Cart Listeners (event delegation — covers both grids)
    attachAddToCartListeners();
}

function createProductCardHTML(product) {
    const cartItem = state.cart.find(i => i.id === product.id);

    let actionHTML = '';
    if (cartItem) {
        actionHTML = `
            <div class="card-qty-stepper" data-id="${product.id}">
                <button class="card-qty-btn card-qty-minus" data-id="${product.id}" aria-label="Decrease">−</button>
                <span class="card-qty-val">${cartItem.qty}</span>
                <button class="card-qty-btn card-qty-plus" data-id="${product.id}" aria-label="Increase">+</button>
            </div>`;
    } else {
        actionHTML = `<button class="btn-add-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart">Add To Cart</button>`;
    }

    return `
        <div class="product-card" data-category="${product.category}" data-id="${product.id}">
            <div class="product-img-wrap">
                <img src="${product.image}" alt="${product.alt}" class="product-img" loading="lazy" width="480" height="600">
                ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
                <div class="card-action-overlay">${actionHTML}</div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.categoryLabel}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price}.00</div>
                <div class="card-action-mobile">${actionHTML}</div>
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
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Single delegated listener — safe to call once (won't double-bind)
let cartListenerAttached = false;
function attachAddToCartListeners() {
    if (cartListenerAttached) return;
    cartListenerAttached = true;

    document.addEventListener('click', (e) => {
        // Handle Add to Cart button click
        const btn = e.target.closest('.btn-add-cart');
        if (btn) {
            const productId = btn.getAttribute('data-id');
            const product = PRODUCTS.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                btn.textContent = '✓ Added';
                btn.classList.add('added');
                setTimeout(() => {
                    renderProducts(); // Refresh card to show stepper instead
                }, 1000);
            }
            return;
        }

        // Handle card stepper plus button click
        const cardPlus = e.target.closest('.card-qty-plus');
        if (cardPlus) {
            const id = cardPlus.getAttribute('data-id');
            updateQuantity(id, 1);
            renderProducts();
            return;
        }

        // Handle card stepper minus button click
        const cardMinus = e.target.closest('.card-qty-minus');
        if (cardMinus) {
            const id = cardMinus.getAttribute('data-id');
            updateQuantity(id, -1);
            renderProducts();
            return;
        }

        // Handle Product Image click to add to cart
        const imgWrap = e.target.closest('.product-img-wrap');
        if (imgWrap) {
            // Only add if not already in cart (so click doesn't trigger when clicking stepper controls)
            if (e.target.closest('.card-qty-stepper')) return;

            const card = imgWrap.closest('.product-card');
            if (card) {
                const productId = card.getAttribute('data-id');
                const product = PRODUCTS.find(p => p.id === productId);
                if (product) {
                    const alreadyInCart = state.cart.some(i => i.id === product.id);
                    if (!alreadyInCart) {
                        addToCart(product);
                        card.style.transform = 'scale(0.97)';
                        setTimeout(() => {
                            card.style.transform = '';
                            renderProducts();
                        }, 800);
                    }
                }
            }
        }
    });
}

/* --------------------------------------------------------------------------
   4. SHOPPING CART — STATE, PERSISTENCE & MODAL
   -------------------------------------------------------------------------- */
function initCartModal() {
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn && cartModal) {
        cartBtn.addEventListener('click', () => {
            // Navigate to cart page instead of drawer on desktop,
            // but open drawer on mobile for better UX
            if (window.innerWidth <= 768) {
                cartModal.classList.add('active');
            } else {
                switchPage('cart');
            }
        });

        closeCart.addEventListener('click', () => cartModal.classList.remove('active'));
        cartOverlay.addEventListener('click', () => cartModal.classList.remove('active'));
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (state.cart.length === 0) {
                showToast('Your selection is empty — add a ritual first.');
            } else {
                showToast('Thank you. Redirecting to secure checkout...');
                setTimeout(() => {
                    state.cart = [];
                    saveCartToStorage();
                    updateCartUI();
                    cartModal.classList.remove('active');
                }, 1500);
            }
        });
    }

    // Cart page checkout button
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'cartPageCheckoutBtn') {
            if (state.cart.length === 0) {
                showToast('Your selection is empty — add a ritual first.');
            } else {
                showToast('Thank you. Redirecting to secure checkout...');
                setTimeout(() => {
                    state.cart = [];
                    saveCartToStorage();
                    updateCartUI();
                    renderCartPage();
                }, 1500);
            }
        }

        // Cart page remove buttons
        if (e.target && e.target.classList.contains('cart-page-remove-btn')) {
            const id = e.target.getAttribute('data-id');
            removeFromCart(id);
            renderCartPage();
        }

        // Cart page quantity buttons
        if (e.target && e.target.classList.contains('cart-qty-btn')) {
            const id = e.target.getAttribute('data-id');
            const delta = parseInt(e.target.getAttribute('data-delta'), 10);
            updateQuantity(id, delta);
            renderCartPage();
        }
    });
}

/* -- Cart CRUD -- */
function addToCart(product) {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        state.cart.push({ ...product, qty: 1 });
    }
    saveCartToStorage();
    updateCartUI();
    showToast(`${product.name} added to your selection.`);
}

function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCartToStorage();
    updateCartUI();
}

function updateQuantity(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    if (item.qty < 1) {
        removeFromCart(id);
        return;
    }
    saveCartToStorage();
    updateCartUI();
}

function calculateSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
}

function updateCartUI() {
    const cartBtn = document.getElementById('cartBtn');
    const cartCount = document.getElementById('cartCount');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const cartItemsContainer = document.getElementById('cartItemsContainer');

    const totalCount = state.cart.reduce((s, i) => s + (i.qty || 1), 0);
    if (cartCount) {
        cartCount.textContent = totalCount;
        cartCount.style.display = totalCount > 0 ? 'flex' : 'none';

        // Quick subtle pop animation on the number itself
        cartCount.classList.remove('cart-pop');
        void cartCount.offsetWidth; // trigger reflow
        cartCount.classList.add('cart-pop');
    }

    if (cartBtn) {
        // Briefly bounce or pulse the cart button
        cartBtn.classList.remove('cart-bounce');
        void cartBtn.offsetWidth; // trigger reflow
        cartBtn.classList.add('cart-bounce');
    }

    // Shipping threshold calculations ($150 target)
    const subtotal = calculateSubtotal();
    const shippingMsg = document.getElementById('shippingMsg');
    const shippingProgressFill = document.getElementById('shippingProgressFill');
    if (shippingMsg && shippingProgressFill) {
        const threshold = 150;
        if (subtotal >= threshold) {
            shippingMsg.textContent = "Congratulations! You've unlocked free shipping!";
            shippingProgressFill.style.width = '100%';
        } else {
            const difference = threshold - subtotal;
            shippingMsg.textContent = `You're $${difference.toFixed(2)} away from free shipping!`;
            shippingProgressFill.style.width = `${Math.min((subtotal / threshold) * 100, 100)}%`;
        }
    }

    if (cartItemsList) {
        if (state.cart.length === 0) {
            if (cartEmptyState) cartEmptyState.classList.add('active');
            if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        } else {
            if (cartEmptyState) cartEmptyState.classList.remove('active');
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = state.cart.map(item => `
                    <div class="cart-item-row" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.alt || item.name}" class="cart-item-img" loading="lazy">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-price">$${(item.price * (item.qty || 1)).toFixed(2)}</div>
                            <div class="cart-item-qty-row">
                                <button class="cart-qty-btn cart-qty-minus" data-id="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
                                <span class="cart-item-qty-val">${item.qty || 1}</span>
                                <button class="cart-qty-btn cart-qty-plus" data-id="${item.id}" data-delta="1" aria-label="Increase quantity">+</button>
                            </div>
                            <button class="cart-item-remove" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    if (cartSubtotal) {
        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    }

    // Refresh cart page if visible
    const cartPage = document.getElementById('page-cart');
    if (cartPage && cartPage.classList.contains('active')) {
        renderCartPage();
    }
}

/* --------------------------------------------------------------------------
   5. CART PAGE (page-cart) — full dedicated page rendering
   -------------------------------------------------------------------------- */
function renderCartPage() {
    const cartPageBody = document.getElementById('cartPageBody');
    if (!cartPageBody) return;

    console.log('renderCartPage: state.cart =', state.cart);

    const subtotal = calculateSubtotal();
    const totalCount = state.cart.reduce((s, i) => s + (i.qty || 1), 0);

    if (state.cart.length === 0) {
        cartPageBody.innerHTML = `
            <div class="cart-page-empty">
                <div class="cart-page-empty-icon" aria-hidden="true">
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 01-8 0"></path>
                    </svg>
                </div>
                <h2 class="cart-page-empty-headline">Your collection is empty.</h2>
                <p class="cart-page-empty-sub">Add a ritual from the collection to begin your AURA journey.</p>
                <a href="#product" class="btn btn-gold" data-page="product">Explore the Collection</a>
            </div>
        `;
        // Re-bind nav link inside rendered HTML
        const link = cartPageBody.querySelector('[data-page]');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage('product');
            });
        }
        return;
    }

    cartPageBody.innerHTML = `
        <div class="cart-page-layout">
            <section class="cart-page-items" aria-label="Cart items">
                <div class="cart-page-items-header">
                    <span>Product</span>
                    <span>Quantity</span>
                    <span>Total</span>
                </div>
                ${state.cart.map(item => `
                    <article class="cart-page-item">
                        <div class="cart-page-item-product">
                            <div class="cart-page-item-img-wrap">
                                <img src="${item.image}" alt="${item.alt || item.name}" class="cart-page-item-img" loading="lazy">
                            </div>
                            <div class="cart-page-item-meta">
                                <div class="cart-page-item-category">${item.categoryLabel}</div>
                                <div class="cart-page-item-name">${item.name}</div>
                                <div class="cart-page-item-unit-price">$${item.price}.00 each</div>
                                <button class="cart-page-remove-btn" data-id="${item.id}" aria-label="Remove ${item.name}">Remove</button>
                            </div>
                        </div>
                        <div class="cart-page-item-qty">
                            <div class="cart-page-qty-control">
                                <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Decrease">−</button>
                                <span class="cart-page-qty-val">${item.qty || 1}</span>
                                <button class="cart-qty-btn" data-id="${item.id}" data-delta="1" aria-label="Increase">+</button>
                            </div>
                        </div>
                        <div class="cart-page-item-total">$${(item.price * (item.qty || 1)).toFixed(2)}</div>
                    </article>
                `).join('')}
            </section>

            <aside class="cart-page-summary">
                <h2 class="cart-page-summary-title">Order Summary</h2>
                <div class="cart-page-summary-rows">
                    ${state.cart.map(item => `
                        <div class="cart-page-summary-row">
                            <span class="cart-page-summary-label">${item.name} <span class="cart-page-summary-qty">×${item.qty || 1}</span></span>
                            <span class="cart-page-summary-val">$${(item.price * (item.qty || 1)).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-page-summary-divider"></div>
                <div class="cart-page-summary-total-row">
                    <span>Subtotal</span>
                    <span class="cart-page-summary-total-val">$${subtotal.toFixed(2)}</span>
                </div>
                <p class="cart-page-summary-note">Complimentary luxury sample suite included. Dispatched within 48 hours in signature amber packaging.</p>
                <button class="btn btn-gold btn-full" id="cartPageCheckoutBtn">Proceed to Checkout</button>
                <a href="#home" class="cart-page-continue-link" data-page="home">← Continue Shopping</a>
            </aside>
        </div>
    `;

    // Re-bind nav links inside rendered HTML
    cartPageBody.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.getAttribute('data-page'));
        });
    });
}

/* --------------------------------------------------------------------------
   6. TOAST NOTIFICATION (Premium slide-in thumbnail toast)
   -------------------------------------------------------------------------- */
let toastTimeout = null;
function showToast(message, product = null) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    if (product) {
        toast.innerHTML = `
            <div class="toast-content">
                <img class="toast-thumb" src="${product.image}" alt="${product.name}">
                <div class="toast-text-wrap">
                    <span class="toast-name">${product.name}</span>
                    <span class="toast-status">Added to bag ✓</span>
                </div>
            </div>
        `;
    } else {
        toast.innerHTML = `<span class="toast-plain-text">${message}</span>`;
    }

    toast.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 2500);
}

/* --------------------------------------------------------------------------
   7. CONTACT FORM VALIDATION
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
