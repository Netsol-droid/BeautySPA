// Add this function at the global level, before the DataManager class
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    }
}

// Add at the top of the file, before DataManager class
class AuthenticationManager {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    initializeAuth() {
        const savedSession = sessionStorage.getItem('beautyspa_session');
        if (savedSession) {
            this.currentUser = JSON.parse(savedSession);
            this.showContentBasedOnRole();
        } else {
            this.showLoginSection();
        }
    }

    login(username, password, role) {
        // Admin credentials
        if (role === 'admin' && username === 'admin' && password === 'BeautySPA2025') {
            const session = {
                username: username,
                role: role,
                loginTime: Date.now()
            };
            this.currentUser = session;
            sessionStorage.setItem('beautyspa_session', JSON.stringify(session));
            this.showContentBasedOnRole();
            return { success: true, message: 'Login exitoso' };
        }
        
        // User role - any credentials allowed
        if (role === 'user') {
            const session = {
                username: username,
                role: role,
                loginTime: Date.now()
            };
            this.currentUser = session;
            sessionStorage.setItem('beautyspa_session', JSON.stringify(session));
            this.showContentBasedOnRole();
            return { success: true, message: 'Login exitoso' };
        }
        
        return { success: false, message: 'Credenciales incorrectas' };
    }

    // New helper to allow quick user access without role selection in the form
    loginAsUser() {
        const username = 'usuario';
        const session = {
            username: username,
            role: 'user',
            loginTime: Date.now()
        };
        this.currentUser = session;
        sessionStorage.setItem('beautyspa_session', JSON.stringify(session));
        this.showContentBasedOnRole();
        // After switching to user view, navigate to the main landing section
        if (typeof scrollToSection === 'function') scrollToSection('inicio');
        // feedback
        const feedback = document.createElement('div');
        feedback.textContent = 'Accedido como usuario';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1600);
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('beautyspa_session');
        this.showLoginSection();
    }

    showLoginSection() {
        document.getElementById('login').style.display = 'block';
        document.getElementById('inicio').style.display = 'none';
        document.querySelector('.services').style.display = 'none';
        document.querySelector('.zones').style.display = 'none';
        document.querySelector('.products').style.display = 'none';
        document.querySelector('.booking').style.display = 'none';
        document.querySelector('.contact').style.display = 'none';
        document.querySelector('.footer').style.display = 'none';
        
        // Hide admin button
        document.querySelector('.admin-btn').style.display = 'none';
    }

    showContentBasedOnRole() {
        document.getElementById('login').style.display = 'none';
        document.getElementById('inicio').style.display = 'block';
        document.querySelector('.services').style.display = 'block';
        document.querySelector('.zones').style.display = 'block';
        document.querySelector('.products').style.display = 'block';
        document.querySelector('.booking').style.display = 'block';
        document.querySelector('.contact').style.display = 'block';
        document.querySelector('.footer').style.display = 'block';
        
        if (this.currentUser.role === 'admin') {
            // Show admin button
            document.querySelector('.admin-btn').style.display = 'block';
            this.enableAdminFeatures();
        } else {
            // Hide admin button
            document.querySelector('.admin-btn').style.display = 'none';
            this.disableAdminFeatures();
        }
        
        this.addSessionInfo();
    }

    enableAdminFeatures() {
        // Habilitar todas las funciones para administradores
        document.querySelectorAll('.service-card, .product-card, .zone-card li').forEach(element => {
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';
            element.onclick = null; // Remover cualquier restricción previa
        });
    }

    disableAdminFeatures() {
        // Los usuarios regulares pueden comprar productos y reservar citas
        // No se restringen las funciones de compra
        this.enableUserFeatures();
    }

    enableUserFeatures() {
        // Habilitar clic en servicios para reservar citas
        document.querySelectorAll('.service-card').forEach(element => {
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';
            element.onclick = null; // Remover el bloqueo de click
        });
        
        // Habilitar clic en productos para agregar al carrito
        document.querySelectorAll('.product-card').forEach(element => {
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';
            element.onclick = null; // Remover el bloqueo de click
        });
        
        // Habilitar clic en zonas para navegar
        document.querySelectorAll('.zone-card li').forEach(element => {
            element.style.pointerEvents = 'auto';
            element.style.opacity = '1';
            element.onclick = null; // Remover el bloqueo de click
        });
        
        // Asegurar que el carrito esté disponible
        const cartWidget = document.querySelector('.cart-widget');
        if (cartWidget) {
            cartWidget.style.display = 'block';
        }
    }

    addSessionInfo() {
        // Remove existing session info
        const existingInfo = document.querySelector('.session-info');
        if (existingInfo) existingInfo.remove();
        
        // Add session info
        const sessionInfo = document.createElement('div');
        sessionInfo.className = 'session-info';
        // Show friendly labels: regular users appear as "Cliente (Cliente)"
        const displayName = (this.currentUser.role === 'user') ? 'Cliente' : (this.currentUser.username || 'Usuario');
        const displayRole = (this.currentUser.role === 'user') ? 'Cliente' : (this.currentUser.role || '');
        sessionInfo.innerHTML = `
            <strong>Usuario:</strong> ${displayName} (${displayRole}) 
            <button class="logout-btn" onclick="authManager.logout()">Cerrar Sesión</button>
        `;
        document.body.appendChild(sessionInfo);
    }

    showAdminModal() {
        if (this.currentUser && this.currentUser.role === 'admin') {
            document.getElementById('adminModal').style.display = 'block';
        } else {
            alert('No tienes permisos de administrador');
        }
    }
}

// Initialize authentication manager
const authManager = new AuthenticationManager();

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            // Form only handles admin login (role removed from UI)
            const result = authManager.login(username, password, 'admin');
            
            if (result.success) {
                // Clear form fields after successful login
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                
                alert(result.message);
            } else {
                alert('Error: ' + result.message);
            }
        });
    }
});

// Update admin modal functions to use auth manager
window.showAdminModal = function() {
    authManager.showAdminModal();
};

// Update the original showAdminModal function
function showAdminModal() {
    authManager.showAdminModal();
}

// Add CSS for session feedback
const authStyle = document.createElement('style');
authStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(authStyle);

// Update the original module click handlers to respect user role
let originalHandleModuleClick;

// --- Begin security utilities ---
async function generateSessionKey() {
    // Generate ephemeral AES-GCM key for this session (kept in-memory only)
    if (window.__beautyspa_session_key) return window.__beautyspa_session_key;
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    window.__beautyspa_session_key = key;
    return key;
}

function ensureHTTPS() {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('BeautySPA: Se recomienda servir la aplicación por HTTPS para proteger datos sensibles.');
        // Visual non-blocking warning for user/admin
        const warn = document.createElement('div');
        warn.textContent = 'Advertencia: La conexión no es segura (HTTPS recomendado) - Protege datos sensibles en producción.';
        warn.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#ffc107;color:#111;padding:0.6rem 1rem;border-radius:8px;z-index:4000;font-size:12px;';
        document.body.appendChild(warn);
        setTimeout(()=>warn.remove(), 8000);
    }
}

function generateCSRFToken() {
    const token = crypto.getRandomValues(new Uint8Array(32));
    const b64 = btoa(String.fromCharCode(...token));
    sessionStorage.setItem('beautyspa_csrf', b64);
    return b64;
}

function getCSRFToken() {
    return sessionStorage.getItem('beautyspa_csrf') || generateCSRFToken();
}

async function encryptSensitiveData(plainObj) {
    const key = await generateSessionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(plainObj));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    // store iv + cipher in base64
    const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipher), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
}

async function decryptSensitiveData(b64) {
    try {
        const key = await generateSessionKey();
        const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const iv = combined.slice(0,12);
        const cipher = combined.slice(12);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(plainBuf));
    } catch (e) {
        console.error('Decrypt error', e);
        return null;
    }
}

// Replace static FIREBASE_CONFIG with a loadable config and helper to save it
let FIREBASE_CONFIG = null;
function loadFirebaseConfigFromStorage() {
    try {
        const cfg = localStorage.getItem('beautyspa_firebase_config');
        return cfg ? JSON.parse(cfg) : null;
    } catch (e) { console.warn('Firebase config parse error', e); return null; }
}
function saveFirebaseConfigToStorage(cfg) {
    try {
        localStorage.setItem('beautyspa_firebase_config', JSON.stringify(cfg));
        FIREBASE_CONFIG = cfg;
        initFirebase(); // attempt re-init immediately
        return true;
    } catch (e) { console.error('Failed to save Firebase config', e); return false; }
}
FIREBASE_CONFIG = loadFirebaseConfigFromStorage() || {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
    messagingSenderId: "REPLACE_WITH_SENDER_ID",
    appId: "REPLACE_WITH_APP_ID"
};

// Expose admin helper to let administrator paste real Firebase config via UI and persist it
function applyFirebaseConfigFromInputs() {
    const get = id => document.getElementById(id)?.value || '';
    const cfg = {
        apiKey: get('fb_apiKey'),
        authDomain: get('fb_authDomain'),
        projectId: get('fb_projectId'),
        storageBucket: get('fb_storageBucket'),
        messagingSenderId: get('fb_messagingSenderId'),
        appId: get('fb_appId')
    };
    // basic validation
    if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
        alert('Por favor completa al menos apiKey, projectId y appId para habilitar la base de datos en línea.');
        return;
    }
    if (saveFirebaseConfigToStorage(cfg)) {
        alert('Configuración de Firebase guardada. Intentando inicializar la conexión en la nube...');
        // initialize now (initFirebase called inside save)
        setTimeout(()=> {
            // push current app data and bookings/sales to cloud once initialized
            if (firestoreDB) {
                // push current app data and bookings/sales to cloud
                firestoreSetDoc('app', 'data', dataManager.data || {});
                try { firestoreSetDoc('app', 'bookings', { list: JSON.parse(localStorage.getItem('beautyspa_bookings')||'[]') }); } catch(e){}
                try { firestoreSetDoc('app', 'sales', { list: JSON.parse(localStorage.getItem('beautyspa_sales_history')||'[]') }); } catch(e){}
                alert('Sincronización inicial con Firestore en la nube completada (si la configuración es válida).');
            } else {
                alert('No se pudo inicializar Firestore. Verifica las credenciales y la conexión.');
            }
        }, 1200);
    }
}

// Replace the autofillFirebasePlaceholders function with a safe helper that only opens the Firebase Console and warns admin
function autofillFirebasePlaceholders() {
    alert('La función de auto-llenado de credenciales ha sido desactivada por seguridad. Abre la Consola de Firebase para obtener las credenciales reales.');
    openFirebaseConsole();
}

// New helper to open Firebase Console and show concise instructions
function openFirebaseConsole() {
    // Open Firebase console in a new tab
    window.open('https://console.firebase.google.com/', '_blank', 'noopener');
    // Show short steps to follow
    const steps = [
        '1) Accede a https://console.firebase.google.com/ y crea un proyecto o selecciona uno existente.',
        '2) Ve a Configuración del proyecto → Tus apps → Añadir app web (</>) y copia las credenciales (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).',
        '3) Pega esas credenciales en el formulario de "Configuración General" en el panel Admin y haz clic en "Guardar y Conectar Firebase".'
    ].join('\n\n');
    alert('Guía rápida para obtener credenciales de Firebase:\n\n' + steps);
}

// New helper: opens Firebase console / docs page that directly explains how to obtain the web app credentials
function openFirebaseCredentialsLink() {
    // Open Firebase "Add web app" docs + console to help copy credentials quickly
    const docsUrl = 'https://firebase.google.com/docs/web/setup';
    const consoleUrl = 'https://console.firebase.google.com/';
    // Open docs in one tab and console in another to simplify copying
    window.open(docsUrl, '_blank', 'noopener');
    window.open(consoleUrl, '_blank', 'noopener');
    // Provide a short on-screen step summary to guide the admin
    const steps = [
        '1) En la Consola de Firebase crea o selecciona un proyecto.',
        '2) Ve a Configuración del proyecto → Tus apps → Añadir app web (</>) y registra una app web.',
        '3) Copia las credenciales mostradas (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).',
        '4) Pega esas credenciales en los campos de "Configuración General" y haz clic en "Guardar y Conectar Firebase".'
    ].join('\n\n');
    alert('Se han abierto la guía y la Consola de Firebase en nuevas pestañas.\n\nPasos resumidos:\n\n' + steps);
}

// Insert Firebase initialization and helpers (placed near top of file, after security utilities)
FIREBASE_CONFIG = null;

let firestoreDB = null;
async function initFirebase() {
    try {
        if (!window.firebase) {
            console.warn('Firebase SDK not loaded.');
            return;
        }
        if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) {
            console.info('Firebase config not provided yet.');
            return;
        }
        // If already initialized with same project, reuse
        if (firebase.apps && firebase.apps.length && firebase.apps[0].options && firebase.apps[0].options.projectId === FIREBASE_CONFIG.projectId) {
            firestoreDB = firebase.firestore();
            console.info('Firebase already initialized.');
            return;
        }
        // Initialize fresh
        firebase.initializeApp(FIREBASE_CONFIG);
        firestoreDB = firebase.firestore();
        console.info('Firebase initialized with provided configuration.');
    } catch (e) {
        console.error('Firebase init error', e);
        firestoreDB = null;
    }
}

// Helper: attempt to read collection doc, fallback to localStorage
async function firestoreGetDoc(collection, docId) {
    if (!firestoreDB) return null;
    try {
        const snap = await firestoreDB.collection(collection).doc(docId).get();
        return snap.exists ? snap.data() : null;
    } catch (e) {
        console.warn('Firestore read failed', e);
        return null;
    }
}

async function firestoreSetDoc(collection, docId, data) {
    if (!firestoreDB) return false;
    try {
        await firestoreDB.collection(collection).doc(docId).set(data, { merge: true });
        return true;
    } catch (e) {
        console.warn('Firestore write failed', e);
        return false;
    }
}
// --- End security utilities ---

// Data Management
class DataManager {
    constructor() {
        this.data = null;
        this.loadData();
    }

    async loadData() {
        // Try cloud first
        await initFirebase();
        if (firestoreDB) {
            const remote = await firestoreGetDoc('app', 'data');
            if (remote) {
                this.data = remote;
                return this.data;
            }
        }
        const saved = localStorage.getItem('beautyspa_data');
        this.data = saved ? JSON.parse(saved) : this.getDefaultData();
        return this.data;
    }

    async saveData() {
        localStorage.setItem('beautyspa_data', JSON.stringify(this.data));
        if (firestoreDB) {
            await firestoreSetDoc('app', 'data', this.data);
        }
    }

    getDefaultData() {
        return {
            services: [
                { id: 1, name: 'Corte de Cabello', price: 5000, duration: '45 min', category: 'unisex' },
                { id: 2, name: 'Masaje Relajante', price: 15000, duration: '60 min', category: 'unisex' },
                { id: 3, name: 'Manicura', price: 8000, duration: '30 min', category: 'female' },
                { id: 4, name: 'Barba', price: 3000, duration: '30 min', category: 'male' }
            ],
            products: [
                { id: 1, name: 'Shampoo Premium', price: 12000, category: 'capilar', stock: 50 },
                { id: 2, name: 'Crema Hidratante', price: 8000, category: 'piel', stock: 30 },
                { id: 3, name: 'Kit de manicura / pedicura', price: 20000, category: 'higiene', stock: 70 }
            ],
            contact: {
                phone: '+240 222 123456',
                email: 'info@beautyspa.com',
                address: 'Malabo, Guinea Ecuatorial'
            },
            general: {
                currency: 'XAF',
                businessHours: 'Lunes a Sábado: 8:00 - 20:00'
            }
        };
    }

    updateData(section, data) {
        this.data[section] = data;
        this.saveData();
    }

    getData(section) {
        // If data hasn't finished loading yet, initialize with defaults to avoid null access
        if (!this.data) {
            this.data = this.getDefaultData();
        }
        // Provide safe fallbacks for critical sections to avoid null dereferences
        if (this.data && this.data[section]) return this.data[section];
        const defaults = this.getDefaultData();
        return defaults[section] || null;
    }
}

// Cart Management System
class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.updateCartUI();
    }

    loadCart() {
        const saved = localStorage.getItem('beautyspa_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('beautyspa_cart', JSON.stringify(this.cart));
        this.updateCartUI();
    }

    addProduct(product) {
        const products = dataManager.getData('products');
        const productInStock = products.find(p => p.id === product.id);
        
        if (!productInStock || productInStock.stock <= 0) {
            const feedback = document.createElement('div');
            feedback.textContent = 'Producto sin stock disponible';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #dc3545;
                color: white;
                padding: 1rem 2rem;
                border-radius: 25px;
                z-index: 3000;
                animation: fadeInOut 2s ease;
            `;
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
            return;
        }
        
        const existingItem = this.cart.find(item => item.id === product.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const availableStock = productInStock.stock;
        
        if (currentQuantity >= availableStock) {
            const feedback = document.createElement('div');
            feedback.textContent = `Stock insuficiente. Solo hay ${availableStock} unidades disponibles`;
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ffc107;
                color: #212529;
                padding: 1rem 2rem;
                border-radius: 25px;
                z-index: 3000;
                animation: fadeInOut 2s ease;
            `;
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
            return;
        }
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        this.saveCart();
    }

    removeProduct(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }
        if (cartTotal) {
            cartTotal.textContent = formatCurrency(this.getTotal());
        }
    }
}

// Initialize data manager
const dataManager = new DataManager();

// Initialize cart manager
let cartManager; // will be created after data finishes loading in DOMContentLoaded

// UI Functions
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Load and display services
function loadServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    const services = dataManager.getData('services');
    
    servicesGrid.innerHTML = services.map(service => {
        const imageKey = `service_${service.id}_image`;
        const storedImage = localStorage.getItem(imageKey);
        const imageSrc = storedImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0zNSA0MEw1MCA1NUw2NSA0MEg1MFYzNUg2NVY0MEw2MCA0NUw1NSAzNUg2NVY0MEw2MCA0NUw1MCA1NUwzNSA0MFoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+';
        
        return `
            <div class="service-card" onclick="selectService(event, ${service.id})" style="cursor: pointer; transition: all 0.3s ease;">
                <div class="service-icon" style="background-image: url('${imageSrc}'); background-size: cover; background-position: center; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 1rem; transition: transform 0.3s ease;"></div>
                <h3>${service.name}</h3>
                <p>Duración: ${service.duration}</p>
                <p class="service-price">${formatCurrency(service.price)}</p>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--primary-color); font-weight: 500;">
                    💅 Haz clic para reservar este servicio
                </div>
            </div>
        `;
    }).join('');
}

// Load zones
function loadZones() {
    const maleServices = document.getElementById('maleServices');
    const femaleServices = document.getElementById('femaleServices');
    const services = dataManager.getData('services');
    
    const maleServicesList = services.filter(s => s.category === 'male' || s.category === 'unisex');
    const femaleServicesList = services.filter(s => s.category === 'female' || s.category === 'unisex');
    
    maleServices.innerHTML = maleServicesList.map(service => 
        `<li onclick="selectService(event, ${service.id})" style="cursor: pointer; padding: 0.5rem; border-radius: 5px; transition: all 0.3s ease;">
            ${service.name} - ${formatCurrency(service.price)}
            <div style="font-size: 0.7rem; color: var(--primary-color); margin-top: 2px;">Click para reservar</div>
        </li>`
    ).join('');
    
    femaleServices.innerHTML = femaleServicesList.map(service => 
        `<li onclick="selectService(event, ${service.id})" style="cursor: pointer; padding: 0.5rem; border-radius: 5px; transition: all 0.3s ease;">
            ${service.name} - ${formatCurrency(service.price)}
            <div style="font-size: 0.7rem; color: var(--primary-color); margin-top: 2px;">Click para reservar</div>
        </li>`
    ).join('');
}

// Load products
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const products = dataManager.getData('products');
    
    // Check if productsGrid exists before trying to access it
    if (!productsGrid) {
        return;
    }
    
    productsGrid.innerHTML = products.map(product => {
        const imageKey = `product_${product.id}_image`;
        const storedImage = localStorage.getItem(imageKey);
        const imageSrc = storedImage || `product-${product.id}.png`;
        const stockStatus = product.stock <= 10 ? 'low-stock' : product.stock <= 20 ? 'medium-stock' : 'high-stock';
        
        return `
            <div class="product-card ${stockStatus}" onclick="selectProduct(event, ${product.id})" style="cursor: pointer; position: relative; overflow: hidden;">
                <div class="product-image" style="background-image: url('${imageSrc}'); background-size: cover; background-position: center; height: 200px;"></div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">${formatCurrency(product.price)}</p>
                    <p class="product-stock ${stockStatus}">
                        📦 Stock: ${product.stock} unidades disponibles
                    </p>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--primary-color); font-weight: 500;">
                        🛍️ Haz clic para agregar al carrito
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Check for stock alerts only if alertsContainer exists
    const alertsContainer = document.getElementById('stockAlerts');
    if (alertsContainer) {
        checkStockAlerts();
    }
}

// Load contact info
function loadContactInfo() {
    const contactInfo = document.getElementById('contactInfo');
    const contact = dataManager.getData('contact');
    
    contactInfo.innerHTML = `
        <div class="contact-item" style="cursor: pointer; transition: all 0.3s ease;" onclick="copyToClipboard('${contact.phone}')">
            <strong>Teléfono:</strong> ${contact.phone} 📞
            <div style="font-size: 0.8rem; color: var(--primary-color); margin-top: 2px;">Click para copiar</div>
        </div>
        <div class="contact-item" style="cursor: pointer; transition: all 0.3s ease;" onclick="copyToClipboard('${contact.email}')">
            <strong>Email:</strong> ${contact.email} ✉️
            <div style="font-size: 0.8rem; color: var(--primary-color); margin-top: 2px;">Click para copiar</div>
        </div>
        <div class="contact-item" style="cursor: pointer; transition: all 0.3s ease;" onclick="copyToClipboard('${contact.address}')">
            <strong>Dirección:</strong> ${contact.address} 📍
            <div style="font-size: 0.8rem; color: var(--primary-color); margin-top: 2px;">Click para copiar</div>
        </div>
        <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-light);">
            💡 Haz clic en cualquier contacto para copiarlo al portapapeles
        </div>
    `;
}

// Load booking services
function loadBookingServices() {
    const serviceSelect = document.getElementById('service');
    const services = dataManager.getData('services');
    
    serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>' +
        services.map(service => 
            `<option value="${service.id}">${service.name} - ${formatCurrency(service.price)}</option>`
        ).join('');
}

// Generate time slots
function generateTimeSlots() {
    const timeSelect = document.getElementById('time');
    const slots = [];
    
    for (let hour = 8; hour <= 19; hour++) {
        for (let minute of ['00', '30']) {
            if (hour === 19 && minute === '30') continue;
            const time = `${hour.toString().padStart(2, '0')}:${minute}`;
            slots.push(time);
        }
    }
    
    timeSelect.innerHTML = '<option value="">Selecciona una hora</option>' +
        slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
    
    // Add validation when date changes
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            validateDateAndTime(this.value);
        });
    }
    
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.addEventListener('change', function() {
            const date = document.getElementById('date').value;
            validateDateAndTime(date);
        });
    }
}

// Format currency
function formatCurrency(amount) {
    // Safe currency formatting: use stored config if available, otherwise fallback to XAF
    const general = dataManager.getData('general') || { currency: 'XAF' };
    const currency = general.currency || 'XAF';
    try {
        return new Intl.NumberFormat('es-GQ', { style: 'currency', currency }).format(amount);
    } catch (e) {
        // Fallback simple formatting
        return `${amount} ${currency}`;
    }
}

// Admin modal functions
function showAdminModal() {
    authManager.showAdminModal();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function showConfigSection(section) {
    const configSection = document.getElementById('configSection');
    let content = '';
    
    switch(section) {
        case 'services':
            content = createServicesConfig();
            break;
        case 'products':
            content = createProductsConfig();
            break;
        case 'contact':
            content = createContactConfig();
            break;
        case 'general':
            content = createGeneralConfig();
            break;
        case 'appointments':
            content = createAppointmentsHistory();
            break;
        case 'sales':
            content = createSalesHistory();
            break;
    }
    
    configSection.innerHTML = content;
    
    // Add click-to-edit functionality
    setTimeout(() => {
        const inputs = configSection.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('click', function() {
                if (typeof this.select === 'function') {
                    this.select();
                } else if (this.tagName.toLowerCase() === 'input') {
                    this.focus();
                    this.setSelectionRange(0, this.value.length);
                }
            });
        });
    }, 100);
}

// Create configuration forms
function createServicesConfig() {
    const services = dataManager.getData('services');
    return `
        <h3>Gestionar Servicios</h3>
        <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-light);">
            💡 Haz clic en "Seleccionar archivo" para subir una imagen de servicio
        </div>
        <div class="config-form">
            ${services.map(service => {
                const imageKey = `service_${service.id}_image`;
                const storedImage = localStorage.getItem(imageKey);
                const previewSrc = storedImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xMiAxMkwxNiAxNlYyMFYxNkgyMFYxNkwxNiAxMlYxMkEyIDIgMCAwIDEgMTYgMTZIMTJWMTJIMTZWMTJIMTJaIiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPg==';
                
                return `
                    <div class="service-item">
                        <input type="text" value="${service.name}" placeholder="Nombre del servicio" data-field="name" data-id="${service.id}" title="Nombre del servicio">
                        <input type="number" value="${service.price}" placeholder="Precio" data-field="price" data-id="${service.id}" title="Precio en ${dataManager.getData('general').currency}">
                        <input type="text" value="${service.duration}" placeholder="Duración" data-field="duration" data-id="${service.id}" title="Duración del servicio">
                        <select data-field="category" data-id="${service.id}" title="Categoría del servicio">
                            <option value="unisex" ${service.category === 'unisex' ? 'selected' : ''}>Unisex</option>
                            <option value="male" ${service.category === 'male' ? 'selected' : ''}>Masculino</option>
                            <option value="female" ${service.category === 'female' ? 'selected' : ''}>Femenino</option>
                        </select>
                        <div class="image-preview-container">
                            <input type="file" accept="image/*" data-field="image" data-id="${service.id}" onchange="handleImageUpload(this, 'service', ${service.id})" title="Seleccionar imagen del servicio">
                            ${storedImage ? 
                                `<img src="${storedImage}" alt="${service.name}" class="image-preview">` : 
                                `<div class="image-preview-placeholder">📷</div>`
                            }
                            <div class="image-upload-feedback">Subiendo...</div>
                        </div>
                        <button onclick="deleteService(${service.id})" title="Eliminar servicio">🗑️</button>
                    </div>
                `;
            }).join('')}
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button onclick="addService()" style="flex: 1;">+ Agregar Servicio</button>
                <button onclick="saveServices()" style="flex: 1; background: var(--primary-color); color: white;">💾 Guardar Cambios</button>
            </div>
        </div>
    `;
}

function createProductsConfig() {
    const products = dataManager.getData('products');
    return `
        <h3>Gestionar Productos y Stock</h3>
        <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-light);">
            🛍️ Haz clic en "Seleccionar archivo" para subir una imagen de producto
        </div>
        <div class="config-form">
            ${products.map(product => {
                const imageKey = `product_${product.id}_image`;
                const storedImage = localStorage.getItem(imageKey);
                const previewSrc = storedImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xMiAxMkwxNiAxNlYyMFYxNkgyMFYxNkwxNiAxMlYxMkEyIDIgMCAwIDEgMTYgMTZIMTJWMTJIMTZWMTJIMTJaIiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPg==';
                const stockStatus = product.stock <= 10 ? 'low-stock' : product.stock <= 20 ? 'medium-stock' : 'high-stock';
                
                return `
                    <div class="product-item ${stockStatus}">
                        <input type="text" value="${product.name}" placeholder="Nombre del producto" data-field="name" data-id="${product.id}" title="Nombre del producto">
                        <input type="number" value="${product.price}" placeholder="Precio" data-field="price" data-id="${product.id}" title="Precio en ${dataManager.getData('general').currency}">
                        <input type="text" value="${product.category}" placeholder="Categoría" data-field="category" data-id="${product.id}" title="Categoría del producto">
                        <div class="stock-control">
                            <label>Stock:</label>
                            <div class="stock-input-group">
                                <input type="number" value="${product.stock}" data-field="stock" data-id="${product.id}" title="Stock disponible" min="0">
                                <button onclick="updateStock(${product.id}, -1)" class="stock-btn decrease" title="Reducir stock">-</button>
                                <button onclick="updateStock(${product.id}, 1)" class="stock-btn increase" title="Aumentar stock">+</button>
                            </div>
                            <span class="stock-indicator ${stockStatus}" title="${getStockMessage(product.stock)}">
                                ${product.stock}
                            </span>
                        </div>
                        <div class="image-preview-container">
                            <input type="file" accept="image/*" data-field="image" data-id="${product.id}" onchange="handleImageUpload(this, 'product', ${product.id})" title="Seleccionar imagen del producto">
                            ${storedImage ? 
                                `<img src="${storedImage}" alt="${product.name}" class="image-preview">` : 
                                `<div class="image-preview-placeholder">📷</div>`
                            }
                            <div class="image-upload-feedback">Subiendo...</div>
                        </div>
                        <button onclick="deleteProduct(${product.id})" title="Eliminar producto">🗑️</button>
                    </div>
                `;
            }).join('')}
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button onclick="addProduct()" style="flex: 1;">+ Agregar Producto</button>
                <button onclick="saveProducts()" style="flex: 1; background: var(--primary-color); color: white;">💾 Guardar Cambios</button>
            </div>
            <div class="stock-alerts" id="stockAlerts"></div>
        </div>
    `;
}

function createContactConfig() {
    const contact = dataManager.getData('contact');
    return `
        <h3>Configurar Contacto</h3>
        <div class="config-form">
            <input type="text" id="phone" value="${contact.phone}" placeholder="Teléfono">
            <input type="email" id="email" value="${contact.email}" placeholder="Email">
            <input type="text" id="address" value="${contact.address}" placeholder="Dirección">
            <button onclick="saveContact()">Guardar Contacto</button>
        </div>
    `;
}

function createGeneralConfig() {
    const general = dataManager.getData('general');
    const currentLogo = localStorage.getItem('business_logo') || '';
    const fbCfg = loadFirebaseConfigFromStorage() || {};
    
    return `
        <h3>Configuración General</h3>
        <div class="config-form">
            <label>Logotipo del Negocio</label>
            <input type="file" id="businessLogo" accept="image/*" onchange="handleLogoUpload(this)">
            <div style="margin: 1rem 0; text-align: center;">
                ${currentLogo ? 
                    `<img src="${currentLogo}" alt="Logo actual" style="max-width: 100px; max-height: 100px; border-radius: 50%; border: 2px solid var(--primary-color);">` : 
                    '<div style="width: 100px; height: 100px; background: var(--primary-color); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 2rem;">B</div>'
                }
            </div>
            <label>Moneda</label>
            <select id="currency">
                <option value="XAF" ${general.currency === 'XAF' ? 'selected' : ''}>Franco CFA (XAF)</option>
            </select>
            <label>Horario de Atención</label>
            <input type="text" id="businessHours" value="${general.businessHours}" placeholder="Horario de atención">
            <h4>Configuración de Base de Datos en la Nube (Firebase)</h4>
            <div style="font-size:0.9rem;color:var(--text-light);">Introduce las credenciales de Firebase para que la aplicación sincronice datos en la nube y persista entre dispositivos.</div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-direction:column;">
                <input id="fb_apiKey" placeholder="apiKey" value="${fbCfg.apiKey||''}">
                <input id="fb_authDomain" placeholder="authDomain" value="${fbCfg.authDomain||''}">
                <input id="fb_projectId" placeholder="projectId" value="${fbCfg.projectId||''}">
                <input id="fb_storageBucket" placeholder="storageBucket" value="${fbCfg.storageBucket||''}">
                <input id="fb_messagingSenderId" placeholder="messagingSenderId" value="${fbCfg.messagingSenderId||''}">
                <input id="fb_appId" placeholder="appId" value="${fbCfg.appId||''}">
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.6rem;flex-wrap:wrap;">
                <button onclick="saveGeneral()">Guardar Configuración Local</button>
                <button onclick="applyFirebaseConfigFromInputs()" style="background:var(--primary-color);color:#fff;">Guardar y Conectar Firebase</button>
                <button onclick="openFirebaseConsole()" style="background:#6c757d;color:#fff;">Abrir Consola de Firebase</button>
                <button onclick="validateFirebaseConnection()" style="background:#17a2b8;color:#fff;">Validar conexión Firebase</button>
                <button onclick="openFirebaseCredentialsLink()" style="background:#ffc107;color:#2c1810;border:1px solid rgba(0,0,0,0.06);">
                    Obtener credenciales (Guía rápida)
                </button>
            </div>
            <div id="firebaseValidationResult" style="margin-top:0.8rem;color:var(--text-light);font-size:0.95rem;"></div>
        </div>
    `;
}

function createAppointmentsHistory() {
    return `
        <h3>Historial de Citas</h3>
        <div class="appointments-history">
            <div class="appointments-section">
                <h4>Citas No Confirmadas ⏳</h4>
                <div id="unconfirmedAppointments" class="appointments-list">
                    ${renderAppointmentsByStatus('unconfirmed')}
                </div>
            </div>
            <div class="appointments-section">
                <h4>Citas Confirmadas - A la espera 📋</h4>
                <div id="waitingAppointments" class="appointments-list">
                    ${renderAppointmentsByStatus('waiting')}
                </div>
            </div>
            <div class="appointments-section">
                <h4>Citas Ejecutadas ✅</h4>
                <div id="completedAppointments" class="appointments-list">
                    ${renderAppointmentsByStatus('completed')}
                </div>
            </div>
        </div>
        <style>
            .appointments-history { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
            .appointments-section { background: var(--bg-light); padding: 1.5rem; border-radius: 10px; }
            .appointments-list { max-height: 300px; overflow-y: auto; }
            .appointment-item { background: white; margin: 0.5rem 0; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .appointment-item:hover { transform: translateY(-2px); transition: var(--transition); }
            .btn-confirm { background: #28a745; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.8rem; margin-right: 0.3rem; }
            .btn-complete { background: #007bff; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.8rem; margin-right: 0.3rem; }
            .btn-pdf { background: #dc3545; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.8rem; margin-right: 0.3rem; }
            .btn-delete { background: #6c757d; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.8rem; }
            .btn-view { background: #17a2b8; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 15px; cursor: pointer; font-size: 0.8rem; margin-right: 0.3rem; }
        </style>
    `;
}

function renderAppointmentsByStatus(status) {
    // If Firestore available, attempt to fetch remote bookings (non-blocking override)
    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    if (firestoreDB) {
        firestoreGetDoc('app', 'bookings').then(remote => {
            if (remote && Array.isArray(remote.list)) {
                // sync local copy silently
                localStorage.setItem('beautyspa_bookings', JSON.stringify(remote.list));
            }
        });
    }
    const filtered = bookings.filter(b => b.status === status);
    
    if (filtered.length === 0) {
        const statusText = {
            'unconfirmed': 'sin confirmar',
            'waiting': 'confirmadas a la espera',
            'completed': 'ejecutadas'
        };
        return `<p style="text-align: center; color: var(--text-light); margin: 2rem 0;">No hay citas ${statusText[status]}</p>`;
    }
    
    return filtered.map(apt => {
        const buttons = [];
        
        if (status === 'unconfirmed') {
            buttons.push(`<button onclick="confirmAppointment(${apt.id}, event)" class="btn-confirm">Confirmar</button>`);
            buttons.push(`<button onclick="deleteAppointment(${apt.id}, event)" class="btn-delete">Eliminar</button>`);
        } else if (status === 'waiting') {
            buttons.push(`<button onclick="completeAppointment(${apt.id}, event)" class="btn-complete">Marcar como ejecutada</button>`);
            buttons.push(`<button onclick="deleteAppointment(${apt.id}, event)" class="btn-delete">Eliminar</button>`);
        } else if (status === 'completed') {
            buttons.push(`<button onclick="viewInvoice(${apt.id})" class="btn-view">Ver Factura</button>`);
            buttons.push(`<button onclick="printInvoice(${apt.id})" class="btn-pdf">Imprimir</button>`);
            buttons.push(`<button onclick="deleteAppointment(${apt.id}, event)" class="btn-delete">Eliminar</button>`);
            // If appointment is completed but not paid and an email exists, add reminder button
            if (!apt.paid && apt.email) {
                buttons.push(`<button onclick="sendPaymentReminder(${apt.id})" class="btn-confirm" style="background:#ffc107;color:#212529;">Recordatorio de Pago</button>`);
            }
        }
        
        // Payment status display for executed appointments
        const paymentStatusHTML = (apt.status === 'completed') 
            ? `<p style="margin:6px 0; font-weight:600;">${apt.paid ? 'Pagado: ' : 'Pendiente de pago: '} ${formatCurrency(apt.paidAmount || 0)}</p>`
            : '';
        
        return `
            <div class="appointment-item">
                <strong>${apt.name}</strong><br>
                📱 ${apt.phone}<br>
                💅 ${getServiceName(apt.service)}<br>
                📅 ${apt.date} ⏰ ${apt.time}<br>
                ${paymentStatusHTML}
                <small style="color: var(--text-light);">Reservado el: ${new Date(apt.id).toLocaleString()}</small><br>
                ${buttons.join('')}
            </div>
        `;
    }).join('');
}

function getServiceName(serviceId) {
    const services = dataManager.getData('services');
    const service = services.find(s => s.id == serviceId);
    return service ? service.name : 'Servicio no encontrado';
}

// Info modal functions
function showInfoModal() {
    const infoContent = document.getElementById('infoContent');
    infoContent.innerHTML = `
        <h3>¿Qué es BeautySPA?</h3>
        <p>BeautySPA es una aplicación web ligera para gestionar de forma local o sincronizada (opcional con Firebase) los servicios, productos, citas y ventas de un centro de belleza. Permite operar sin servidor (datos en localStorage) y opcionalmente conectarse a Firestore para sincronizar entre dispositivos.</p>

        <h3>¿Para qué sirve?</h3>
        <ul>
            <li>Administrar el catálogo de servicios y productos, incluyendo imágenes y stock.</li>
            <li>Permitir a clientes reservar citas y a la administración confirmarlas y generar facturas.</li>
            <li>Registrar ventas con control de stock y generar facturas de venta en PDF.</li>
            <li>Sincronizar datos con Firebase si el administrador pega credenciales válidas en el panel.</li>
        </ul>

        <h3>¿Cómo se utiliza?</h3>
        <ol>
            <li><strong>Clientes:</strong> Usan "Acceder como cliente" en el menú para navegar la web, agregar productos al carrito y reservar citas sin necesidad de credenciales.</li>
            <li><strong>Reservar cita:</strong> Haz clic en un servicio (o selecciónalo desde las zonas) para autocompletar el formulario de reserva y luego elige fecha y hora dentro del horario de atención.</li>
            <li><strong>Carrito y ventas:</strong> Añade productos al carrito y finaliza la compra con pago en efectivo; el sistema actualizará el stock y generará la factura.</li>
            <li><strong>Administrador:</strong> Inicia sesión con las credenciales de administrador en la pantalla de login para editar servicios, productos, contact y ajustes generales; desde allí también puedes pegar y validar la configuración de Firebase para sincronizar la aplicación.</li>
            <li><strong>Imágenes:</strong> El administrador puede subir el logotipo, imágenes de productos/servicios y cambiar la imagen principal (hero) desde el panel de administración.</li>
        </ol>

        <h3>Requisitos y seguridad</h3>
        <p>La app está diseñada para funcionar offline con almacenamiento local; si se habilita Firebase, las credenciales deben obtenerse desde la Consola de Firebase. Los datos sensibles de pago no se almacenan en texto claro: la app encripta información sensible en memoria antes de persistirla.</p>

        <h3>Desarrollador</h3>
        <p>
            <strong>Nombre:</strong> Tarciano ENZEMA NCHAMA<br>
            <strong>Formación académica:</strong> Finalista universario de la UNGE<br>
            <strong>Facultad:</strong> Ciencias Económicas, gestión y administración<br>
            <strong>Departamento:</strong> Informática de gestión empresarial<br>
            <strong>Contacto:</strong> enzemajr@gmail.com<br>
            <strong>Prácticas externas:</strong> FÉNIX G.E<br>
            <strong>Fecha de desarrollo:</strong> 25 de septiembre del 2025
        </p>
    `;
    document.getElementById('infoModal').style.display = 'block';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Form handling
document.getElementById('bookingForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Inform customer that payments are accepted only in cash for services
    alert('Nota: En BeautySPA solo se aceptan pagos en efectivo para servicios y productos. Por favor, prepara el pago en efectivo al momento de tu cita o entrega.');
    
    const formData = new FormData(e.target);
    const booking = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('emailBooking').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        status: 'unconfirmed' // New bookings default to unconfirmed
    };
    
    // Validate business hours before saving
    if (!isWithinBusinessHours(booking.date, booking.time)) {
        alert('La hora seleccionada está fuera del horario de atención. El horario es: ' + dataManager.getData('general').businessHours);
        return;
    }
    
    // Save booking (in real app, this would go to a server)
    let bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    bookings.push({...booking, id: Date.now()});
    localStorage.setItem('beautyspa_bookings', JSON.stringify(bookings));
    persistBookingsToCloud();
    
    alert('Cita reservada con éxito. Te contactaremos para confirmar.');
    e.target.reset();
});

// Add new function to confirm appointments
function confirmAppointment(appointmentId, event) {
    event.stopPropagation();
    
    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    const appointmentIndex = bookings.findIndex(b => b.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        // Cambiar estado a 'waiting' (confirmada a la espera)
        bookings[appointmentIndex].status = 'waiting';
        bookings[appointmentIndex].confirmedAt = Date.now();
        localStorage.setItem('beautyspa_bookings', JSON.stringify(bookings));
        persistBookingsToCloud();
        
        // Enviar confirmación por email automáticamente mediante mailto:
        const apt = bookings[appointmentIndex];
        if (apt.email) {
            const subject = encodeURIComponent(`Confirmación de cita - BeautySPA (${apt.date} ${apt.time})`);
            const d = new Date(apt.date);
            const formattedDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
            const bodyText =
`Hola, ${apt.name}

Tu cita ha sido confirmada para el servicio de ${getServiceName(apt.service)}, el ${formattedDate} a las ${apt.time}.

Gracias por confiar en BeautySPA, te esperamos!!!
`;
            const body = encodeURIComponent(bodyText);

            // Create a temporary anchor and click it to avoid popup blockers
            const mailtoHref = `mailto:${encodeURIComponent(apt.email)}?subject=${subject}&body=${body}`;
            const a = document.createElement('a');
            a.href = mailtoHref;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
        
        // Refresh the appointments view
        showConfigSection('appointments');
        
        // Show success message
        const feedback = document.createElement('div');
        feedback.textContent = '¡Cita confirmada! Ahora está en lista de espera para ejecución.';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Add new function to delete appointments
function deleteAppointment(appointmentId, event) {
    event.stopPropagation(); // Prevent event bubbling
    
    if (confirm('¿Estás seguro de eliminar esta cita?')) {
        const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
        const filtered = bookings.filter(b => b.id !== appointmentId);
        localStorage.setItem('beautyspa_bookings', JSON.stringify(filtered));
        persistBookingsToCloud();
        
        // Refresh the appointments view
        showConfigSection('appointments');
        
        // Show success message
        const feedback = document.createElement('div');
        feedback.textContent = '¡Cita eliminada con éxito!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Add new function to complete appointments
function completeAppointment(appointmentId, event) {
    event.stopPropagation();
    
    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    const appointmentIndex = bookings.findIndex(b => b.id === appointmentId);
    
    if (appointmentIndex === -1) return;
    
    const appointment = bookings[appointmentIndex];
    
    // Verify that the appointment cannot be completed before the scheduled date and time
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    
    if (now < appointmentDateTime) {
        alert('No se puede completar la cita antes de la fecha y hora programadas.\n\nFecha y hora de la cita: ' + 
              appointmentDateTime.toLocaleString() + '\nFecha y hora actual: ' + now.toLocaleString());
        return;
    }
    
    // Prompt to record payment status/amount when completing the appointment
    const paymentInput = prompt('Si el cliente ya ha pagado, introduce el monto pagado (solo números). Deja vacío o 0 si está pendiente:','');
    let paidAmount = 0;
    if (paymentInput !== null && paymentInput.trim() !== '') {
        const parsed = parseFloat(paymentInput.toString().replace(/,/g, '.'));
        if (!isNaN(parsed) && parsed > 0) {
            paidAmount = parsed;
        }
    }
    
    // Change status to 'completed' and generate invoice
    bookings[appointmentIndex].status = 'completed';
    bookings[appointmentIndex].completedAt = Date.now();
    bookings[appointmentIndex].invoiceNumber = `INV-${Date.now()}`;
    // store payment info on appointment: paidAmount (number) and paid flag
    bookings[appointmentIndex].paidAmount = paidAmount;
    bookings[appointmentIndex].paid = paidAmount > 0;
    
    localStorage.setItem('beautyspa_bookings', JSON.stringify(bookings));
    persistBookingsToCloud();
    
    // Generate PDF invoice
    generateInvoicePDF(appointmentId);
    
    showConfigSection('appointments');
    
    const feedback = document.createElement('div');
    feedback.textContent = '¡Cita marcada como ejecutada! Factura generada.';
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #007bff;
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        z-index: 3000;
        animation: fadeInOut 2s ease;
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

function viewInvoice(appointmentId) {
    generateInvoicePDF(appointmentId, false); // Ver sin imprimir
}

function printInvoice(appointmentId) {
    generateInvoicePDF(appointmentId, true); // Ver con opción de imprimir
}

function generateInvoicePDF(appointmentId, enablePrint = false) {
    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    const appointment = bookings.find(b => b.id === appointmentId);
    
    if (!appointment) return;
    
    const serviceName = getServiceName(appointment.service);
    const servicePrice = getServicePrice(appointment.service);
    const contact = dataManager.getData('contact');
    const general = dataManager.getData('general');
    
    // Use stored logo or default
    const logoData = localStorage.getItem('business_logo') || '';
    
    // Crear el contenido de la factura optimizado para una sola hoja A4
    const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Factura - ${appointment.invoiceNumber || 'INV-' + appointmentId}</title>
            <style>
                @page { 
                    margin: 1cm 0.5cm 0.5cm 0.5cm; 
                    size: A4; 
                }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 10px; 
                    background: white;
                    color: #333;
                    line-height: 1.3;
                    font-size: 12px;
                }
                .invoice-header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #d4af37;
                    padding-bottom: 10px;
                }
                .logo {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 8px;
                    display: block;
                    object-fit: cover;
                    border: 2px solid #d4af37;
                }
                .company-name {
                    color: #d4af37;
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0;
                }
                .company-subtitle {
                    color: #666;
                    font-size: 11px;
                    margin: 3px 0;
                }
                .invoice-title {
                    color: #2c1810;
                    font-size: 18px;
                    margin: 10px 0 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .invoice-info {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 5px;
                    margin: 8px 0;
                    border-left: 3px solid #d4af37;
                    font-size: 10px;
                }
                .section {
                    margin: 12px 0;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .section-header {
                    background: linear-gradient(135deg, #d4af37, #f4e4bc);
                    color: white;
                    padding: 8px;
                    font-weight: bold;
                    font-size: 12px;
                }
                .section-content {
                    padding: 10px;
                }
                .service-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                    background: linear-gradient(90deg, transparent, #f8f9fa);
                }
                .service-name {
                    font-weight: 600;
                    color: #2c1810;
                    font-size: 11px;
                }
                .service-price {
                    font-size: 14px;
                    font-weight: bold;
                    color: #d4af37;
                }
                .total-row {
                    background: linear-gradient(135deg, #2c1810, #4a3728);
                    color: white;
                    padding: 10px;
                    text-align: right;
                    border-radius: 0 0 5px 5px;
                }
                .total-amount {
                    font-size: 16px;
                    font-weight: bold;
                    color: #d4af37;
                }
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 8px;
                    border-top: 1px solid #d4af37;
                    font-size: 9px;
                    color: #666;
                }
                .no-print {
                    position: fixed;
                    bottom: 15px;
                    right: 15px;
                    background: #d4af37;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 11px;
                    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
                }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 5px; font-size: 11px; }
                    .section { box-shadow: none; border: 1px solid #ddd; }
                }
                p { margin: 4px 0; }
                strong { color: #2c1810; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                ${logoData ? `<img src="${logoData}" alt="BeautySPA" class="logo">` : '<div class="logo" style="background: #d4af37; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: bold;">B</div>'}
                <h1 class="company-name">BeautySPA</h1>
                <p class="company-subtitle">Belleza & Bienestar</p>
                <h2 class="invoice-title">FACTURA</h2>
                <div class="invoice-info">
                    <strong>Factura:</strong> ${appointment.invoiceNumber || 'INV-' + appointmentId}<br>
                    <strong>Fecha:</strong> ${new Date(appointment.completedAt || Date.now()).toLocaleDateString()}<br>
                    <strong>Horario:</strong> ${general.businessHours}
                </div>
            </div>

            <div class="section">
                <div class="section-header">Datos del Cliente</div>
                <div class="section-content">
                    <p><strong>Cliente:</strong> ${appointment.name}</p>
                    <p><strong>Teléfono:</strong> ${appointment.phone}</p>
                    <p><strong>Fecha cita:</strong> ${appointment.date} <strong>Hora:</strong> ${appointment.time}</p>
                </div>
            </div>

            <div class="section">
                <div class="section-header">Servicio Prestado</div>
                <div class="service-row">
                    <div class="service-name">${serviceName}</div>
                    <div class="service-price">${formatCurrency(servicePrice)}</div>
                </div>
                <div class="total-row">
                    <div style="font-size: 12px; margin-bottom: 2px;">TOTAL A PAGAR</div>
                    <div class="total-amount">${formatCurrency(servicePrice)}</div>
                    <div style="font-size: 9px; margin-top: 2px; opacity: 0.8;">Moneda: ${general.currency}</div>
                </div>
            </div>

            <div class="footer">
                <p><strong>BeautySPA - Tu centro de belleza y bienestar</strong></p>
                <p>${contact.address} | Tel: ${contact.phone} | ${contact.email}</p>
                <p>Emitida el ${new Date().toLocaleString()} - Gracias por confiar en nosotros</p>
            </div>
            
            ${enablePrint ? '<button class="no-print" onclick="window.print()">📄 Imprimir</button>' : ''}
        </body>
        </html>
    `;
    
    // Abrir la factura en una nueva ventana
    const invoiceWindow = window.open('', '_blank', 'width=800,height=700');
    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
    
    if (!enablePrint) {
        invoiceWindow.focus();
    }
}

// Add new function to handle image uploads
function handleImageUpload(input, type, id) {
    const file = input.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede pesar más de 5MB');
            return;
        }
        
        // Show loading state
        const container = input.closest('.service-item, .product-item');
        const previewContainer = container.querySelector('.image-preview-container');
        if (previewContainer) {
            previewContainer.classList.add('uploading');
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store image in localStorage with a unique key
            const imageKey = `${type}_${id}_image`;
            localStorage.setItem(imageKey, e.target.result);
            
            // Update preview
            updateImagePreview(input, e.target.result);
            
            // Visual feedback
            input.style.backgroundColor = 'var(--primary-color)';
            input.style.color = 'white';
            setTimeout(() => {
                input.style.backgroundColor = '';
                input.style.color = '';
                if (previewContainer) {
                    previewContainer.classList.remove('uploading');
                }
            }, 1000);
            
            // Refresh the display
            setTimeout(() => {
                if (type === 'service') {
                    loadServices();
                } else if (type === 'product') {
                    loadProducts();
                }
            }, 500);
        };
        reader.readAsDataURL(file);
    }
}

// Update image preview
function updateImagePreview(input, imageData) {
    const container = input.parentElement;
    const preview = container.querySelector('.image-preview');
    const placeholder = container.querySelector('.image-preview-placeholder');
    
    if (imageData) {
        if (preview) {
            preview.src = imageData;
        } else if (placeholder) {
            const img = document.createElement('img');
            img.src = imageData;
            img.className = 'image-preview';
            placeholder.replaceWith(img);
        }
    }
}

// Add new function to handle logo upload
function handleLogoUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('business_logo', e.target.result);
            showConfigSection('general');
            updateLogoDisplay();
        };
        reader.readAsDataURL(file);
    }
}

// Add function to update logo display throughout the app
function updateLogoDisplay() {
    const logoData = localStorage.getItem('business_logo');
    const logoElements = document.querySelectorAll('.nav-brand h1, .company-logo');
    
    logoElements.forEach(element => {
        if (logoData) {
            element.style.backgroundImage = `url(${logoData})`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
            element.textContent = '';
        }
    });
}

// Add near other upload/preview handlers (e.g. after handleLogoUpload)
function handleHeroImageUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecciona una imagen válida.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('business_hero_image', e.target.result);
        const heroImg = document.getElementById('heroImg');
        if (heroImg) heroImg.src = e.target.result;
        // quick visual feedback
        const fb = document.createElement('div');
        fb.textContent = 'Imagen principal actualizada';
        fb.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:var(--primary-color);color:#fff;padding:0.6rem 1rem;border-radius:12px;z-index:4000;';
        document.body.appendChild(fb);
        setTimeout(()=>fb.remove(),1500);
    };
    reader.readAsDataURL(file);
}

function loadHeroImage() {
    const stored = localStorage.getItem('business_hero_image');
    if (stored) {
        const heroImg = document.getElementById('heroImg');
        if (heroImg) heroImg.src = stored;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Store original function reference
    originalHandleModuleClick = window.handleModuleClick;
    
    ensureHTTPS();
    getCSRFToken();
    await generateSessionKey(); // prepare ephemeral key for encrypt/decrypt during session
    
    // Ensure data is fully loaded before initializing modules that depend on it
    await dataManager.loadData();
    // Now safe to create cartManager which uses dataManager.getData(...)
    cartManager = new CartManager();
    
    loadServices();
    loadZones();
    loadProducts();
    loadContactInfo();
    loadBookingServices();
    generateTimeSlots();
    // Load custom hero image if admin uploaded previously
    loadHeroImage();
    // Attach click handler so only admins can open the picker
    const heroImgEl = document.getElementById('heroImg');
    if (heroImgEl) {
        heroImgEl.style.cursor = 'pointer';
        heroImgEl.addEventListener('click', function() {
            if (authManager && authManager.currentUser && authManager.currentUser.role === 'admin') {
                const input = document.getElementById('heroImageInput');
                if (input) input.click();
            } else {
                // non-admin: slight bounce feedback to indicate non-editable
                heroImgEl.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 300 });
            }
        });
    }
    
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }
    
    // Fix admin menu button clicks
    setTimeout(() => {
        const adminMenuButtons = document.querySelectorAll('.admin-menu button');
        adminMenuButtons.forEach((button, index) => {
            button.onclick = function(e) {
                e.preventDefault();
                const sections = ['services', 'products', 'contact', 'general', 'appointments', 'sales'];
                showConfigSection(sections[index]);
            };
        });
    }, 500);
    
    // Ensure cart is visible for authenticated users
    if (authManager.currentUser) {
        const cartWidget = document.querySelector('.cart-widget');
        if (cartWidget) {
            cartWidget.style.display = 'block';
        }
    }
    
    // Replace the redundant hardcoded FIREBASE_CONFIG block with a runtime loader and ensure Firebase is initialized at startup
    FIREBASE_CONFIG = loadFirebaseConfigFromStorage() || FIREBASE_CONFIG;
    
    // Ensure Firebase is initialized as soon as possible if a config exists, and attempt an initial sync
    document.addEventListener('DOMContentLoaded', function() {
        const storedCfg = loadFirebaseConfigFromStorage();
        if (storedCfg && storedCfg.apiKey) {
            FIREBASE_CONFIG = storedCfg;
            // initialize firebase and sync local -> cloud (non-blocking)
            initFirebase().then(() => {
                // Once initialized, push local copies of key datasets to Firestore
                try {
                    const localData = JSON.parse(localStorage.getItem('beautyspa_data') || '{}');
                    if (localData && Object.keys(localData).length) {
                        firestoreSetDoc('app', 'data', localData);
                    }
                } catch (e) { console.warn('sync data->cloud failed', e); }
                try {
                    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
                    firestoreSetDoc('app', 'bookings', { list: bookings });
                } catch (e) {}
                try {
                    const sales = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
                    firestoreSetDoc('app', 'sales', { list: sales });
                } catch (e) {}
            }).catch(err => console.warn('Firebase init on startup failed', err));
        } else {
            // No stored config: leave default behavior and allow admin to paste config via UI
            console.info('No Firebase configuration found in storage; use admin panel to provide credentials.');
        }
    });
});

// Close modals when clicking outside
window.onclick = function(event) {
    const adminModal = document.getElementById('adminModal');
    const infoModal = document.getElementById('infoModal');
    
    if (event.target === adminModal) {
        adminModal.style.display = 'none';
    }
    if (event.target === infoModal) {
        infoModal.style.display = 'none';
    }
}

// Add CSS animation for feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// Add selection functionality
function selectService(event, serviceId) {
    // Allow calling selectService(serviceId) or selectService(event, serviceId)
    if (typeof event === 'number' && serviceId === undefined) {
        serviceId = event;
        event = null;
    }
    const services = dataManager.getData('services');
    const service = services.find(s => s.id === serviceId);
    if (service) {
        // Auto-fill booking form
        document.getElementById('service').value = serviceId;
        
        // Smooth scroll to booking section with enhanced animation
        scrollToSection('citas');
        
        // Enhanced visual feedback
        const serviceCard = event && event.currentTarget ? event.currentTarget : (event && event.target ? event.target.closest('.service-card') : null);
        if (serviceCard) {
            serviceCard.style.transform = 'scale(0.95)';
            serviceCard.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
            serviceCard.style.border = '3px solid var(--primary-color)';
            
            setTimeout(() => {
                serviceCard.style.transform = '';
                serviceCard.style.boxShadow = '';
                serviceCard.style.border = '';
            }, 1000);
        }
        
        // Auto-focus on the date field for better UX
        setTimeout(() => {
            const dateInput = document.getElementById('date');
            if (dateInput) {
                dateInput.focus();
            }
        }, 800);
        
        // Validate current date/time if already selected
        const selectedDate = document.getElementById('date').value;
        if (selectedDate) {
            validateDateAndTime(selectedDate);
        }
    }
}

function selectProduct(event, productId) {
    const products = dataManager.getData('products');
    const product = products.find(p => p.id === productId);
    if (product) {
        // Add to cart with enhanced feedback
        cartManager.addProduct(product);
        
        // Enhanced visual feedback with ripple effect
        const productCard = event && event.currentTarget ? event.currentTarget : null;
        
        if (productCard) {
            // Create ripple effect
            const rect = productCard.getBoundingClientRect();
            const offsetX = (event.clientX || rect.left + rect.width/2) - rect.left;
            const offsetY = (event.clientY || rect.top + rect.height/2) - rect.top;
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(212, 175, 55, 0.6);
                transform: scale(0);
                animation: ripple 0.6s linear;
                left: ${offsetX}px;
                top: ${offsetY}px;
                width: 20px;
                height: 20px;
                margin-left: -10px;
                margin-top: -10px;
                z-index: 1000;
            `;
            
            productCard.style.position = 'relative';
            productCard.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => ripple.remove(), 600);
            
            // Scale animation
            productCard.style.transform = 'scale(0.95)';
            productCard.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.7)';
            
            setTimeout(() => {
                productCard.style.transform = '';
                productCard.style.boxShadow = '';
            }, 300);
        }
        
        // Auto-open cart with enhanced animation
        setTimeout(() => {
            toggleCart();
            
            // Highlight cart button
            const cartButton = document.querySelector('.cart-button');
            if (cartButton) {
                cartButton.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    cartButton.style.animation = '';
                }, 500);
            }
        }, 500);
    }
}

// Product detail modal
function showProductModal(product) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>${product.name}</h3>
            <img src="product-${product.id}.png" alt="${product.name}" style="width: 100%; max-width: 300px; margin: 1rem auto; display: block;">
            <p><strong>Precio:</strong> ${formatCurrency(product.price)}</p>
            <p><strong>Categoría:</strong> ${product.category}</p>
            <button class="cta-button" onclick="this.parentElement.parentElement.remove(); scrollToSection('citas'); document.getElementById('service').value='';" style="margin-top: 1rem;">
                Reservar cita
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function selectServiceFromZone(event, serviceId) {
    const eventTarget = event && event.currentTarget ? event.currentTarget : null;
    selectService(event, serviceId);
    // Visual feedback
    if (eventTarget) {
        eventTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
        setTimeout(() => {
            eventTarget.style.backgroundColor = '';
        }, 1000);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const feedback = document.createElement('div');
        feedback.textContent = '¡Copiado al portapapeles!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    });
}

// Reemplazar la función handleModuleClick con esta versión corregida:
function handleModuleClick(moduleType, moduleId = null) {
    // Prevent infinite recursion with a flag
    if (window.handlingModuleClick) return;
    window.handlingModuleClick = true;
    
    try {
        // Check authentication
        if (!authManager.currentUser) {
            alert('Por favor, inicia sesión primero');
            return;
        }
        
        // Admin user - full permissions
        if (authManager.currentUser.role === 'admin') {
            if (moduleType === 'service' && moduleId) {
                selectService(moduleId);
            } else if (moduleType === 'zone') {
                // Navigate to zones section
                scrollToSection('zonas');
            } else if (moduleType === 'booking') {
                scrollToSection('citas');
            } else if (['home', 'services', 'products', 'contact'].includes(moduleType)) {
                const sectionMap = {
                    'home': 'inicio',
                    'services': 'servicios', 
                    'products': 'productos',
                    'contact': 'contacto'
                };
                const targetSection = sectionMap[moduleType];
                if (targetSection && typeof scrollToSection === 'function') {
                    scrollToSection(targetSection);
                }
            }
        } else {
            // Regular user - allow purchases and bookings
            if (moduleType === 'service' && moduleId) {
                // Allow booking appointments
                selectService(moduleId);
            } else if (moduleType === 'product') {
                // Allow adding products to cart
                // This is already handled by the onclick of products
            } else if (moduleType === 'zone') {
                // Allow navigation between zones
                scrollToSection('zonas');
            } else if (moduleType === 'booking') {
                // Allow access to booking form
                scrollToSection('citas');
            } else if (['home', 'services', 'products', 'contact'].includes(moduleType)) {
                // Normal navigation between sections
                const sectionMap = {
                    'home': 'inicio',
                    'services': 'servicios',
                    'products': 'productos', 
                    'contact': 'contacto'
                };
                const targetSection = sectionMap[moduleType];
                if (targetSection && typeof scrollToSection === 'function') {
                    scrollToSection(targetSection);
                }
            }
        }
        
    } finally {
        // Clear the flag
        window.handlingModuleClick = false;
    }
}

// Define missing functions
function saveServices() {
    const serviceItems = document.querySelectorAll('.service-item');
    const services = [];
    
    serviceItems.forEach(item => {
        const id = parseInt(item.querySelector('[data-field="name"]').dataset.id);
        const name = item.querySelector('[data-field="name"]').value;
        const price = parseInt(item.querySelector('[data-field="price"]').value);
        const duration = item.querySelector('[data-field="duration"]').value;
        const category = item.querySelector('[data-field="category"]').value;
        
        services.push({ id, name, price, duration, category });
    });
    
    dataManager.updateData('services', services);
    alert('Servicios guardados con éxito');
}

function saveProducts() {
    const productItems = document.querySelectorAll('.product-item');
    const products = [];
    
    productItems.forEach(item => {
        const id = parseInt(item.querySelector('[data-field="name"]').dataset.id);
        const name = item.querySelector('[data-field="name"]').value;
        const price = parseInt(item.querySelector('[data-field="price"]').value);
        const category = item.querySelector('[data-field="category"]').value;
        const stock = parseInt(item.querySelector('[data-field="stock"]').value) || 0;
        
        products.push({ id, name, price, category, stock });
    });
    
    dataManager.updateData('products', products);
    alert('Productos y stock guardados con éxito');
    checkStockAlerts();
}

function saveContact() {
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    
    dataManager.updateData('contact', { phone, email, address });
    alert('Información de contacto guardada');
}

function saveGeneral() {
    const currency = document.getElementById('currency').value;
    const businessHours = document.getElementById('businessHours').value;
    
    dataManager.updateData('general', { currency, businessHours });
    alert('Configuración general guardada');
}

function addService() {
    const services = dataManager.getData('services');
    const newService = {
        id: Date.now(),
        name: 'Nuevo Servicio',
        price: 0,
        duration: '30 min',
        category: 'unisex'
    };
    services.push(newService);
    dataManager.updateData('services', services);
    showConfigSection('services');
}

function addProduct() {
    const products = dataManager.getData('products');
    const newProduct = {
        id: Date.now(),
        name: 'Nuevo Producto',
        price: 0,
        category: 'general',
        stock: 0
    };
    products.push(newProduct);
    dataManager.updateData('products', products);
    showConfigSection('products');
}

function deleteService(id) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
        const services = dataManager.getData('services');
        const filtered = services.filter(s => s.id !== id);
        dataManager.updateData('services', filtered);
        showConfigSection('services');
    }
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        const products = dataManager.getData('products');
        const filtered = products.filter(p => p.id !== id);
        dataManager.updateData('products', filtered);
        showConfigSection('products');
    }
}

function getServicePrice(serviceId) {
    const services = dataManager.getData('services');
    const service = services.find(s => s.id == serviceId);
    return service ? service.price : 0;
}

// Toggle cart modal
function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.style.display = 'block';
    renderCart();
}

function closeCartModal() {
    document.getElementById('cartModal').style.display = 'none';
}

// Render cart content
function renderCart() {
    const cartContent = document.getElementById('cartContent');
    const checkoutSection = document.getElementById('checkoutSection');
    
    if (cartManager.cart.length === 0) {
        cartContent.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <p style="font-size: 3rem; margin-bottom: 1rem;">🛒</p>
                <p>Tu carrito está vacío</p>
                <button onclick="closeCartModal()" class="cta-button" style="margin-top: 1rem;">
                    Seguir comprando
                </button>
            </div>
        `;
        checkoutSection.style.display = 'none';
        return;
    }
    
    cartContent.innerHTML = `
        <div class="cart-items">
            ${cartManager.cart.map(item => {
                const imageKey = `product_${item.id}_image`;
                const storedImage = localStorage.getItem(imageKey);
                const imageSrc = storedImage || `product-${item.id}.png`;
                
                return `
                    <div class="cart-item">
                        <img src="${imageSrc}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>${item.category}</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1}); renderCart();)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1}); renderCart();)">+</button>
                        </div>
                        <div class="cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
                        <button class="remove-item-btn" onclick="cartManager.removeProduct(${item.id}); renderCart();">
                            🗑️
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="cart-total">
            Total: ${formatCurrency(cartManager.getTotal())}
        </div>
    `;
    
    checkoutSection.style.display = 'block';
    checkoutSection.innerHTML = createCheckoutForm();
}

// Create checkout form
function createCheckoutForm() {
    // Only cash payments supported — simplified checkout UI and clear notice
    return `
        <div class="checkout-form">
            <h3>💵 Finalizar Compra (Sólo Efectivo)</h3>
            <div style="background:#fff4e6;border-left:4px solid var(--primary-color);padding:12px;border-radius:8px;margin-bottom:10px;color:#3a2b1f;">
                <strong>Importante:</strong> En BeautySPA solo aceptamos pagos en efectivo tanto para servicios como para productos. Por favor, prepara el monto exacto al momento de la entrega o al acudir a tu cita.
            </div>
            <form id="checkoutForm" onsubmit="processSale(event)">
                <input type="hidden" name="csrf_token" id="csrf_token" value="${getCSRFToken()}">
                <div style="display: grid; gap: 1rem;">
                    <input type="text" id="customerName" placeholder="Nombre completo" required>
                    <input type="tel" id="customerPhone" placeholder="Teléfono" required>
                    <input type="email" id="customerEmail" placeholder="Email (opcional)">
                    <input type="text" id="notes" placeholder="Notas adicionales (opcional)" />
                    <input type="hidden" id="paymentMethod" value="cash">
                </div>
                <button type="submit" class="submit-btn" style="margin-top: 1rem;">
                    Confirmar Pago en Efectivo
                </button>
            </form>
        </div>
    `;
}

// Add new function to save sale to history
function saveSaleToHistory(saleData) {
    // Normalize: ensure saleData.paymentEncrypted exists (encrypted blob) and remove any accidental raw fields
    const toStore = Object.assign({}, saleData);
    if (!toStore.paymentEncrypted) {
        // As fallback, remove raw paymentDetails entirely
        delete toStore.paymentDetails;
    }
    // Remove any CVV or raw cardNumber if present
    if (toStore.paymentDetails) {
        delete toStore.paymentDetails.cvv;
        if (toStore.paymentDetails.cardNumber) {
            toStore.paymentMasked = toStore.paymentMasked || { last4: toStore.paymentDetails.cardNumber.slice(-4) };
            delete toStore.paymentDetails.cardNumber;
        }
    }
    let salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    salesHistory.unshift(toStore); // Add to beginning
    localStorage.setItem('beautyspa_sales_history', JSON.stringify(salesHistory));
}

// Fix the processSale function - add proper validation for payment method
function processSale(event) {
    event.preventDefault();
    
    if (cartManager.cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    // CSRF validation (client-side check)
    const submittedToken = document.getElementById('csrf_token')?.value;
    if (!submittedToken || submittedToken !== getCSRFToken()) {
        alert('Error de seguridad: token CSRF inválido. Por favor recarga la página e inténtalo de nuevo.');
        return;
    }
    
    // Enforce only cash payments: set paymentMethod to 'cash' and skip card/transfer validations
    const paymentMethod = 'cash';
    
    // Build payment details but DO NOT persist raw PAN/CVV:
    const rawPaymentDetails = {}; // no sensitive payment fields for cash
    
    // Masking for storage/audit (never store CVV and store only last4 of card)
    let masked = null;
    if (paymentMethod === 'card') {
        masked = {
            type: 'card',
            cardType: rawPaymentDetails.cardType || '',
            cardHolder: rawPaymentDetails.cardHolder || '',
            last4: (rawPaymentDetails.cardNumber || '').slice(-4),
            expiry: rawPaymentDetails.expiryDate || ''
            // Note: CVV is intentionally NOT stored
        };
    } else if (paymentMethod === 'transfer') {
        masked = {
            type: 'transfer',
            bankName: rawPaymentDetails.bankName || '',
            accountHolder: rawPaymentDetails.accountHolder || '',
            accountLast4: (rawPaymentDetails.accountNumber || '').slice(-4),
            reference: rawPaymentDetails.transferReference || '',
            transferDate: rawPaymentDetails.transferDate || '',
            transferAmount: rawPaymentDetails.transferAmount || 0
        };
    } else {
        masked = { type: 'cash' };
    }
    
    // Validate stock availability and decrement stock
    const products = dataManager.getData('products');
    for (let cartItem of cartManager.cart) {
        const prod = products.find(p => p.id === cartItem.id);
        if (!prod || prod.stock < cartItem.quantity) {
            alert(`Stock insuficiente para ${cartItem.name}. Disponible: ${prod ? prod.stock : 0}`);
            return;
        }
    }
    
    // Deduct stock
    cartManager.cart.forEach(ci => {
        const p = products.find(x => x.id === ci.id);
        if (p) p.stock = Math.max(0, p.stock - ci.quantity);
    });
    
    dataManager.updateData('products', products);
    
    // Encrypt the raw paymentDetails before storing anywhere (encrypted blob stored, key ephemeral in-memory)
    encryptSensitiveData(rawPaymentDetails).then(encryptedBlob => {
        const saleData = {
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerEmail: document.getElementById('customerEmail').value,
            paymentMethod: paymentMethod,
            // store only masked summary and encrypted payload
            paymentMasked: masked,
            paymentEncrypted: encryptedBlob,
            notes: document.getElementById('notes').value,
            items: [...cartManager.cart],
            total: cartManager.getTotal(),
            date: new Date().toISOString(),
            invoiceNumber: `VENTA-${Date.now()}`,
            status: 'completed'
        };
        
        // Save sale to history (sale record will NOT contain raw PAN/CVV)
        saveSaleToHistory(saleData);
        
        // Generate PDF invoice (it will use masked info)
        generateSalesInvoice(saleData);
        
        // Clear cart and update UI...
        cartManager.clearCart();
        closeCartModal();
        const feedback = document.createElement('div');
        feedback.textContent = '¡Venta realizada con éxito! Stock actualizado y factura generada.';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 3s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 3000);
        
        // Check for stock alerts after sale
        checkStockAlerts();
    }).catch(err => {
        console.error('Encryption failed', err);
        alert('Error al procesar el pago. Intenta nuevamente.');
    });
}

// Add new function to save sale to history
function saveSaleToHistory(saleData) {
    // Normalize: ensure saleData.paymentEncrypted exists (encrypted blob) and remove any accidental raw fields
    const toStore = Object.assign({}, saleData);
    if (!toStore.paymentEncrypted) {
        // As fallback, remove raw paymentDetails entirely
        delete toStore.paymentDetails;
    }
    // Remove any CVV or raw cardNumber if present
    if (toStore.paymentDetails) {
        delete toStore.paymentDetails.cvv;
        if (toStore.paymentDetails.cardNumber) {
            toStore.paymentMasked = toStore.paymentMasked || { last4: toStore.paymentDetails.cardNumber.slice(-4) };
            delete toStore.paymentDetails.cardNumber;
        }
    }
    let salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    salesHistory.unshift(toStore); // Add to beginning
    localStorage.setItem('beautyspa_sales_history', JSON.stringify(salesHistory));
}

// Add sales history to admin menu
function createSalesHistory() {
    const salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    
    if (salesHistory.length === 0) {
        return `
            <h3>Historial de Ventas</h3>
            <p style="text-align: center; color: var(--text-light); margin: 2rem 0;">
                📊 No hay ventas registradas aún
            </p>
        `;
    }
    
    return `
        <h3>Historial de Ventas</h3>
        <div class="sales-history-grid">
            ${salesHistory.map(sale => {
                const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                return `
                    <div class="sale-item">
                        <div class="sale-header">
                            <div>
                                <strong>Factura:</strong> ${sale.invoiceNumber}<br>
                                <small>${new Date(sale.date).toLocaleDateString()}</small>
                            </div>
                            <div class="sale-total">${formatCurrency(sale.total)}</div>
                        </div>
                        <div class="sale-details">
                            <strong>Cliente:</strong> ${sale.customerName}<br>
                            <strong>Teléfono:</strong> ${sale.customerPhone}<br>
                            <strong>Productos:</strong> ${totalItems} artículos<br>
                            <strong>Método de pago:</strong> ${sale.paymentMethod.toUpperCase()}
                        </div>
                        <div class="sale-actions">
                            <button onclick="viewSaleInvoice('${sale.invoiceNumber}')" class="btn-view">
                                👁️ Ver Factura
                            </button>
                            <button onclick="printSaleInvoice('${sale.invoiceNumber}')" class="btn-pdf">
                                📄 Imprimir
                            </button>
                            <button onclick="deleteSale('${sale.invoiceNumber}')" class="btn-delete">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function viewSaleInvoice(invoiceNumber) {
    const salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    const sale = salesHistory.find(s => s.invoiceNumber === invoiceNumber);
    
    if (sale) {
        generateSalesInvoice(sale);
    }
}

function printSaleInvoice(invoiceNumber) {
    const salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    const sale = salesHistory.find(s => s.invoiceNumber === invoiceNumber);
    
    if (sale) {
        generateSalesInvoice(sale, true);
    }
}

function deleteSale(invoiceNumber) {
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
        let salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
        salesHistory = salesHistory.filter(s => s.invoiceNumber !== invoiceNumber);
        localStorage.setItem('beautyspa_sales_history', JSON.stringify(salesHistory));
        
        // Refresh sales history view
        showSalesHistory();
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.textContent = 'Venta eliminada con éxito';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Add function to show sales history in admin panel
function showSalesHistory() {
    const configSection = document.getElementById('configSection');
    if (configSection) {
        configSection.innerHTML = createSalesHistory();
    }
}

// Update the admin menu to include sales history button
document.addEventListener('DOMContentLoaded', function() {
    // Add sales history button to admin menu
    const adminMenu = document.querySelector('.admin-menu');
    if (adminMenu) {
        const salesButton = document.createElement('button');
        salesButton.textContent = 'Historial de Ventas';
        salesButton.onclick = function() { showConfigSection('sales'); };
        adminMenu.appendChild(salesButton);
    }
    
    // Update product click behavior
    loadProducts = function() {
        const productsGrid = document.getElementById('productsGrid');
        const products = dataManager.getData('products');
        
        // Check if productsGrid exists before trying to access it
        if (!productsGrid) {
            return;
        }
        
        productsGrid.innerHTML = products.map(product => {
            const imageKey = `product_${product.id}_image`;
            const storedImage = localStorage.getItem(imageKey);
            const imageSrc = storedImage || `product-${product.id}.png`;
            const stockStatus = product.stock <= 10 ? 'low-stock' : product.stock <= 20 ? 'medium-stock' : 'high-stock';
            
            return `
                <div class="product-card ${stockStatus}" onclick="selectProduct(event, ${product.id})" style="cursor: pointer; position: relative; overflow: hidden;">
                    <div class="product-image" style="background-image: url('${imageSrc}'); background-size: cover; background-position: center; height: 200px;"></div>
                    <div class="product-info">
                        <h4 class="product-name">${product.name}</h4>
                        <p class="product-price">${formatCurrency(product.price)}</p>
                        <p class="product-stock ${stockStatus}">
                            📦 Stock: ${product.stock} unidades disponibles
                        </p>
                        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--primary-color); font-weight: 500;">
                            🛍️ Haz clic para agregar al carrito
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Check for stock alerts only if alertsContainer exists
        const alertsContainer = document.getElementById('stockAlerts');
        if (alertsContainer) {
            checkStockAlerts();
        }
    };
    
    loadProducts(); // Reload products with new behavior
});

// Add new function to validate business hours
function isWithinBusinessHours(date, time) {
    const businessHours = dataManager.getData('general').businessHours;
    
    // Parse business hours (format: "Lunes a Sábado: 8:00 - 20:00")
    const hoursMatch = businessHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!hoursMatch) return true; // If can't parse, allow all times
    
    const startHour = parseInt(hoursMatch[1]);
    const startMinute = parseInt(hoursMatch[2]);
    const endHour = parseInt(hoursMatch[3]);
    const endMinute = parseInt(hoursMatch[4]);
    
    // Parse selected time
    const [selectedHour, selectedMinute] = time.split(':').map(Number);
    
    // Convert to minutes for comparison
    const selectedTotalMinutes = selectedHour * 60 + selectedMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Check day of week (Monday to Saturday)
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Reject Sundays (0)
    if (dayOfWeek === 0) {
        return false;
    }
    
    // Check if time is within business hours
    return selectedTotalMinutes >= startTotalMinutes && selectedTotalMinutes <= endTotalMinutes;
}

// Add new function to validate date and time
function validateDateAndTime(date) {
    const timeSelect = document.getElementById('time');
    if (!date || !timeSelect) return;
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Reset previous validations
    const options = timeSelect.querySelectorAll('option');
    options.forEach(option => {
        option.disabled = false;
        option.style.color = '';
    });
    
    // Disable past dates
    if (selectedDate < today) {
        timeSelect.disabled = true;
        return;
    } else {
        timeSelect.disabled = false;
    }
    
    // Check if it's Sunday
    if (selectedDate.getDay() === 0) {
        timeSelect.disabled = true;
        alert('Lo sentimos, no atendemos los domingos. El horario es: Lunes a Sábado: 8:00 - 20:00');
        return;
    }
    
    // Validate each time slot
    const businessHours = dataManager.getData('general').businessHours;
    const hoursMatch = businessHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    
    if (hoursMatch) {
        const startHour = parseInt(hoursMatch[1]);
        const startMinute = parseInt(hoursMatch[2]);
        const endHour = parseInt(hoursMatch[3]);
        const endMinute = parseInt(hoursMatch[4]);
        
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        options.forEach(option => {
            if (option.value) {
                const [hour, minute] = option.value.split(':').map(Number);
                const totalMinutes = hour * 60 + minute;
                
                if (totalMinutes < startTotalMinutes || totalMinutes > endTotalMinutes) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                }
            }
        });
    }
}

// Add new stock management functions
function updateStock(productId, change) {
    // optional event as first parameter: updateStock(event, productId, change)
    if (arguments.length === 3 && arguments[0] && typeof arguments[0].stopPropagation === 'function') {
        arguments[0].stopPropagation();
        productId = arguments[1];
        change = arguments[2];
    } else {
        // try to stop propagation if caller provided an event via global (defensive)
        try { event && event.stopPropagation(); } catch(e) {}
    }
    const products = dataManager.getData('products');
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const newStock = Math.max(0, product.stock + change);
        product.stock = newStock;
        
        // Update the display
        const stockInput = document.querySelector(`[data-field="stock"][data-id="${productId}"]`);
        const stockIndicator = document.querySelector(`.stock-indicator[data-id="${productId}"]`);
        
        if (stockInput) {
            stockInput.value = newStock;
        }
        
        // Update visual indicators
        updateStockIndicators(productId, newStock);
        
        // Check for low stock alerts
        checkStockAlerts();
    }
}

function updateStockIndicators(productId, stock) {
    const productItem = document.querySelector(`[data-id="${productId}"]`).closest('.product-item');
    const stockIndicator = productItem.querySelector('.stock-indicator');
    
    // Remove all stock status classes
    productItem.classList.remove('low-stock', 'medium-stock', 'high-stock');
    stockIndicator.classList.remove('low-stock', 'medium-stock', 'high-stock');
    
    // Add appropriate class based on stock level
    if (stock <= 10) {
        productItem.classList.add('low-stock');
        stockIndicator.classList.add('low-stock');
    } else if (stock <= 20) {
        productItem.classList.add('medium-stock');
        stockIndicator.classList.add('medium-stock');
    } else {
        productItem.classList.add('high-stock');
        stockIndicator.classList.add('high-stock');
    }
    
    stockIndicator.textContent = stock;
}

function getStockMessage(stock) {
    if (stock <= 5) return '¡Stock crítico! Reabastecer urgente';
    if (stock <= 10) return 'Stock bajo, considerar reabastecer';
    if (stock <= 20) return 'Stock medio';
    return 'Stock suficiente';
}

function checkStockAlerts() {
    const products = dataManager.getData('products');
    const lowStockProducts = products.filter(p => p.stock <= 10);
    const alertsContainer = document.getElementById('stockAlerts');
    
    // Check if alertsContainer exists before trying to access it
    if (!alertsContainer) {
        return;
    }
    
    if (lowStockProducts.length > 0) {
        alertsContainer.innerHTML = `
            <div class="stock-alert">
                <h4>⚠️ Alertas de Stock Bajo</h4>
                ${lowStockProducts.map(product => `
                    <div class="alert-item">
                        <span>${product.name}: ${product.stock} unidades</span>
                        <button onclick="updateStock(${product.id}, 10)" class="restock-btn">
                            +10
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        alertsContainer.innerHTML = '';
    }
}

// Add CSS for stock management
const stockStyle = document.createElement('style');
stockStyle.textContent = `
    /* Stock management styles */
    .stock-control {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    
    .stock-input-group {
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    
    .stock-input-group input {
        width: 60px !important;
        padding: 0.3rem !important;
        text-align: center;
    }
    
    .stock-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        cursor: pointer;
        font-weight: bold;
        transition: var(--transition);
    }
    
    .stock-btn:hover {
        background: var(--secondary-color);
        transform: scale(1.1);
    }
    
    .stock-btn:active {
        transform: scale(0.9);
    }
    
    .stock-indicator {
        font-weight: bold;
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        text-align: center;
    }
    
    .stock-indicator.low-stock {
        background: #dc3545;
        color: white;
        animation: pulse 1s infinite;
    }
    
    .stock-indicator.medium-stock {
        background: #ffc107;
        color: #212529;
    }
    
    .stock-indicator.high-stock {
        background: #28a745;
        color: white;
    }
    
    .product-item.low-stock {
        border-left: 4px solid #dc3545;
        background: #fff5f5;
    }
    
    .product-item.medium-stock {
        border-left: 4px solid #ffc107;
        background: #fff8e1;
    }
    
    .product-item.high-stock {
        border-left: 4px solid #28a745;
        background: #f0fff4;
    }
    
    .stock-alert {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 10px;
        padding: 1rem;
        margin-top: 1rem;
    }
    
    .stock-alert h4 {
        color: #856404;
        margin-bottom: 0.5rem;
    }
    
    .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border-radius: 5px;
        margin: 0.3rem 0;
    }
    
    .restock-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 0.3rem 0.6rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: var(--transition);
    }
    
    .restock-btn:hover {
        background: #218838;
        transform: scale(1.05);
    }
    
    .restock-btn:active {
        transform: scale(0.95);
    }
    
    /* Stock management in mobile */
    @media (max-width: 768px) {
        .stock-control {
            grid-column: 1 / -1;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }
        
        .stock-input-group {
            flex-direction: row;
        }
        
        .stock-input-group input {
            width: 50px !important;
        }
    }
`;
document.head.appendChild(stockStyle);

// Add contact admin function
function contactAdmin(method) {
    const email = 'enzemajr@gmail.com';
    const whatsapp = '+240222084663';
    
    if (method === 'email') {
        // Create email with subject and body
        const subject = encodeURIComponent('Solicitud de ayuda - BeautySPA');
        const body = encodeURIComponent(
            'Hola, soy un usuario de BeautySPA y necesito ayuda con:\n\n' +
            '[Describe aquí el problema que estás experimentando]\n\n' +
            'Gracias por tu atención.\n\n' +
            '---\n' +
            'Este mensaje fue enviado desde el panel de login de BeautySPA'
        );
        
        // Open email client
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Visual feedback
        const feedback = document.createElement('div');
        feedback.textContent = '📧 Abriendo cliente de email...';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #d4af37;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
        
    } else if (method === 'whatsapp') {
        // Create WhatsApp message
        const message = encodeURIComponent(
            'Hola, soy un usuario de BeautySPA y necesito ayuda con mi cuenta. ¿Podrías ayudarme, por favor? 🙏'
        );
        
        // Open WhatsApp
        window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
        
        // Visual feedback
        const feedback = document.createElement('div');
        feedback.textContent = '💬 Abriendo WhatsApp...';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #25d366;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 3000;
            animation: fadeInOut 2s ease;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Add CSS animation for feedback
const contactStyle = document.createElement('style');
contactStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(contactStyle);

// Add CSS for enhanced animations
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .service-card:hover, .product-card:hover {
        transform: translateY(-8px) scale(1.02) !important;
        box-shadow: 0 15px 30px rgba(0,0,0,0.15) !important;
    }
    
    .service-card:active, .product-card:active {
        transform: translateY(-2px) scale(0.98) !important;
    }
    
    .service-card.selected, .product-card.selected {
        animation: pulse 0.5s ease;
        border: 3px solid var(--primary-color) !important;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
        100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
    }
    
    .cart-button {
        transition: all 0.3s ease;
    }
    
    .cart-button:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
`;
document.head.appendChild(enhancedStyle);

// Add new function to ensure updatePaymentFields won't show non-existent fields (no-op now that only cash exists)
function updatePaymentFields() {
    const cardFields = document.getElementById('cardFields');
    const transferFields = document.getElementById('transferFields');
    if (cardFields) cardFields.style.display = 'none';
    if (transferFields) transferFields.style.display = 'none';
}

// Add new function to validate card payment (always true for compatibility)
function validateCardPayment() {
    // Card and transfer methods removed — always true for compatibility (no-op)
    return true;
}

// Add new function to validate transfer payment (always true for compatibility)
function validateTransferPayment() {
    // Card and transfer methods removed — always true for compatibility (no-op)
    return true;
}

// Add new function to generate sales invoice
function generateSalesInvoice(saleData, enablePrint = false) {
    const salesHistory = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
    const sale = salesHistory.find(s => s.invoiceNumber === saleData.invoiceNumber);
    
    if (!sale) return;
    
    const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    const contact = dataManager.getData('contact');
    const general = dataManager.getData('general');
    
    // Use stored logo or default
    const logoData = localStorage.getItem('business_logo') || '';
    
    // Crear el contenido de la factura optimizado para una sola hoja A4
    const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Factura - ${sale.invoiceNumber}</title>
            <style>
                @page { 
                    margin: 1cm 0.5cm 0.5cm 0.5cm; 
                    size: A4; 
                }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 10px; 
                    background: white;
                    color: #333;
                    line-height: 1.3;
                    font-size: 12px;
                }
                .invoice-header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #d4af37;
                    padding-bottom: 10px;
                }
                .logo {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 8px;
                    display: block;
                    object-fit: cover;
                    border: 2px solid #d4af37;
                }
                .company-name {
                    color: #d4af37;
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0;
                }
                .company-subtitle {
                    color: #666;
                    font-size: 11px;
                    margin: 3px 0;
                }
                .invoice-title {
                    color: #2c1810;
                    font-size: 18px;
                    margin: 10px 0 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .invoice-info {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 5px;
                    margin: 8px 0;
                    border-left: 3px solid #d4af37;
                    font-size: 10px;
                }
                .section {
                    margin: 12px 0;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .section-header {
                    background: linear-gradient(135deg, #d4af37, #f4e4bc);
                    color: white;
                    padding: 8px;
                    font-weight: bold;
                    font-size: 12px;
                }
                .section-content {
                    padding: 10px;
                }
                .service-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                    background: linear-gradient(90deg, transparent, #f8f9fa);
                }
                .service-name {
                    font-weight: 600;
                    color: #2c1810;
                    font-size: 11px;
                }
                .service-price {
                    font-size: 14px;
                    font-weight: bold;
                    color: #d4af37;
                }
                .total-row {
                    background: linear-gradient(135deg, #2c1810, #4a3728);
                    color: white;
                    padding: 10px;
                    text-align: right;
                    border-radius: 0 0 5px 5px;
                }
                .total-amount {
                    font-size: 16px;
                    font-weight: bold;
                    color: #d4af37;
                }
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 8px;
                    border-top: 1px solid #d4af37;
                    font-size: 9px;
                    color: #666;
                }
                .no-print {
                    position: fixed;
                    bottom: 15px;
                    right: 15px;
                    background: #d4af37;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 11px;
                    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
                }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 5px; font-size: 11px; }
                    .section { box-shadow: none; border: 1px solid #ddd; }
                }
                p { margin: 4px 0; }
                strong { color: #2c1810; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                ${logoData ? `<img src="${logoData}" alt="BeautySPA" class="logo">` : '<div class="logo" style="background: #d4af37; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: bold;">B</div>'}
                <h1 class="company-name">BeautySPA</h1>
                <p class="company-subtitle">Belleza & Bienestar</p>
                <h2 class="invoice-title">FACTURA DE VENTA</h2>
                <div class="invoice-info">
                    <strong>Factura:</strong> ${sale.invoiceNumber}<br>
                    <strong>Fecha:</strong> ${new Date(sale.date).toLocaleDateString()}<br>
                    <strong>Horario:</strong> ${general.businessHours}
                </div>
            </div>

            <div class="section">
                <div class="section-header">Datos del Cliente</div>
                <div class="section-content">
                    <p><strong>Cliente:</strong> ${sale.customerName}</p>
                    <p><strong>Teléfono:</strong> ${sale.customerPhone}</p>
                    <p><strong>Productos:</strong> ${totalItems} artículos</p>
                </div>
            </div>

            <div class="section">
                <div class="section-header">Productos Vendidos</div>
                <div class="section-content">
                    ${sale.items.map(item => `
                        <div class="service-row">
                            <div class="service-name">${item.name}</div>
                            <div class="service-price">${formatCurrency(item.price * item.quantity)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-header">Resumen de Venta</div>
                <div class="section-content">
                    <div class="total-row">
                        <div style="font-size: 12px; margin-bottom: 2px;">TOTAL A PAGAR</div>
                        <div class="total-amount">${formatCurrency(sale.total)}</div>
                        <div style="font-size: 9px; margin-top: 2px; opacity: 0.8;">Moneda: ${general.currency}</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p><strong>BeautySPA - Tu centro de belleza y bienestar</strong></p>
                <p>${contact.address} | Tel: ${contact.phone} | ${contact.email}</p>
                <p>Emitida el ${new Date().toLocaleString()} - Gracias por confiar en nosotros</p>
            </div>
            
            ${enablePrint ? '<button class="no-print" onclick="window.print()">📄 Imprimir</button>' : ''}
        </body>
        </html>
    `;
    
    // Abrir la factura en una nueva ventana
    const invoiceWindow = window.open('', '_blank', 'width=800,height=700');
    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
    
    if (!enablePrint) {
        invoiceWindow.focus();
    }
}

// New function: send professional payment reminder via mailto: for appointments with pending payment
function sendPaymentReminder(appointmentId) {
    const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
    const apt = bookings.find(b => b.id === appointmentId);
    if (!apt) {
        alert('No se encontró la cita.');
        return;
    }
    if (!apt.email) {
        alert('El cliente no tiene un correo electrónico registrado.');
        return;
    }
    // Compose professional reminder
    const serviceName = getServiceName(apt.service);
    const amount = formatCurrency( getServicePrice(apt.service) );
    const subject = encodeURIComponent(`Recordatorio de Pago - BeautySPA`);
    // Body: plain text, clear and professional, includes service and amount (currency XAF displayed by formatCurrency)
    const bodyText = 
`Hola, ${apt.name}

Le recordamos amablemente que tiene un saldo pendiente con BeautySPA correspondiente al servicio de ${serviceName} por un importe de ${amount}.

Por favor, proceda con el pago en efectivo a la mayor brevedad posible o contacte con nosotros si necesita asistencia adicional.

Gracias por confiar en BeautySPA.
`;
    const body = encodeURIComponent(bodyText);
    // Open default mail client with prefilled fields
    window.open(`mailto:${encodeURIComponent(apt.email)}?subject=${subject}&body=${body}`, '_blank');
    // Visual feedback
    const feedback = document.createElement('div');
    feedback.textContent = 'Abriendo cliente de correo para enviar recordatorio de pago...';
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffc107;
        color: #212529;
        padding: 1rem 2rem;
        border-radius: 25px;
        z-index: 3000;
        animation: fadeInOut 2s ease;
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// Add new function to persist bookings to cloud
function persistBookingsToCloud() {
    try {
        const bookings = JSON.parse(localStorage.getItem('beautyspa_bookings') || '[]');
        if (firestoreDB) {
            firestoreSetDoc('app', 'bookings', { list: bookings });
        }
    } catch (e) { console.warn(e); }
}

// Add new function to persist sales to cloud
function persistSalesToCloud() {
    try {
        const sales = JSON.parse(localStorage.getItem('beautyspa_sales_history') || '[]');
        if (firestoreDB) {
            firestoreSetDoc('app', 'sales', { list: sales });
        }
    } catch (e) { console.warn(e); }
}

// New: Validate Firebase connection by attempting init + small write/read test.
async function validateFirebaseConnection() {
    const resultEl = document.getElementById('firebaseValidationResult');
    if (resultEl) resultEl.textContent = 'Validando conexión...';
    // Read values from inputs
    const cfg = {
        apiKey: document.getElementById('fb_apiKey')?.value || '',
        authDomain: document.getElementById('fb_authDomain')?.value || '',
        projectId: document.getElementById('fb_projectId')?.value || '',
        storageBucket: document.getElementById('fb_storageBucket')?.value || '',
        messagingSenderId: document.getElementById('fb_messagingSenderId')?.value || '',
        appId: document.getElementById('fb_appId')?.value || ''
    };
    if (!cfg.apiKey || !cfg.projectId || !cfg.appId) {
        if (resultEl) resultEl.textContent = 'Rellena al menos apiKey, projectId y appId antes de validar.';
        return;
    }
    try {
        // Temporarily initialize a new firebase app instance to avoid clobbering existing one
        if (!window.firebase) {
            if (resultEl) resultEl.textContent = 'SDK Firebase no cargado en la página.';
            return;
        }
        // If an app with this projectId is already initialized, reuse; otherwise create named app
        const existing = firebase.apps.find(a => a.options && a.options.projectId === cfg.projectId);
        let appInstance;
        if (existing) {
            appInstance = existing;
        } else {
            // Create a temporary named app instance to test connectivity
            const name = 'test-' + Date.now();
            appInstance = firebase.initializeApp(cfg, name);
        }
        const testDb = firebase.firestore(appInstance);
        // Attempt a write-read cycle on a test doc (with short TTL)
        const testRef = testDb.collection('_beautyspa_test').doc('connectivity_test');
        const payload = { ok: true, ts: Date.now(), by: navigator.userAgent };
        await testRef.set(payload, { merge: true });
        const snap = await testRef.get();
        const data = snap.exists ? snap.data() : null;
        if (data && data.ok) {
            // Save config for later use (do not overwrite if different projects are used)
            saveFirebaseConfigToStorage(cfg);
            if (resultEl) {
                resultEl.style.color = 'green';
                resultEl.textContent = 'Conexión a Firebase validada correctamente. Configuración guardada localmente.';
            }
        } else {
            if (resultEl) {
                resultEl.style.color = 'red';
                resultEl.textContent = 'La escritura/lectura de prueba no devolvió el resultado esperado.';
            }
        }
        // Clean up temporary app if we created it (keep saved config initialized by saveFirebaseConfigToStorage)
        if (!existing && appInstance) {
            try { appInstance.delete(); } catch (e) { /* ignore */ }
        }
    } catch (err) {
        console.error('Firebase validation error', err);
        if (resultEl) {
            resultEl.style.color = 'red';
            resultEl.textContent = 'Error validando Firebase: ' + (err.message || String(err));
        }
    }
}
