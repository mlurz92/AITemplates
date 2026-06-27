// =====================================================================
// ANIMATIONS & HAPTICS LAYER
// =====================================================================

// Local Animation States
let particlesContainer = null;
let particles = [];
const PARTICLE_COUNT = 25;
let glowBurstElement = null;
let tiltEnabled = true;
let tiltRafId = null;
let tiltPending = false;
let konfettiContainer = null;
let orientationRafId = null;
let pendingOrientation = null;
const DEVICE_ORIENTATION_PERMISSION_KEY = 'deviceOrientationPermission';
let lastOrientationTime = 0;
const ORIENTATION_THROTTLE_MS = 100; // ~10 FPS for better performance

// Setup visibility observer to pause particles when not visible
let particlesVisibilityObserver = null;
let isParticlesVisible = true;

window.initParticlesSystem = function() {
    if (window.prefersReducedMotion) return;
    
    particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(particlesContainer);
    
    window.createParticles();
    
    if (typeof IntersectionObserver !== 'undefined') {
        particlesVisibilityObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    isParticlesVisible = entry.isIntersecting;
                    if (particlesContainer) {
                        particlesContainer.classList.toggle('paused', !isParticlesVisible);
                    }
                });
            },
            { threshold: 0, rootMargin: '50px' }
        );
        particlesVisibilityObserver.observe(particlesContainer);
    }
};

window.createParticles = function() {
    if (!particlesContainer) return;
    
    const colors = [
        'rgba(94, 92, 230, 0.50)',   /* Indigo */
        'rgba(90, 200, 250, 0.42)',   /* Teal */
        'rgba(50, 215, 75, 0.38)',    /* Green */
        'rgba(255, 159, 10, 0.40)'    /* Orange */
    ];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${color};
            box-shadow: 0 0 ${size * 2}px ${color};
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
};

window.initGlowBurstSystem = function() {
    if (window.prefersReducedMotion) return;
    
    glowBurstElement = document.createElement('div');
    glowBurstElement.className = 'glow-burst';
    glowBurstElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glowBurstElement);
};

window.triggerGlowBurst = function(x, y, color = 'rgba(94, 92, 230, 0.38)') {
    if (!glowBurstElement || window.prefersReducedMotion) return;
    
    const size = 100;
    glowBurstElement.style.cssText = `
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${color} 0%, transparent 70%);
    `;
    
    glowBurstElement.classList.remove('active');
    void glowBurstElement.offsetWidth; // Force reflow
    glowBurstElement.classList.add('active');
};

window.initKonfettiSystem = function() {
    if (window.prefersReducedMotion) return;

    konfettiContainer = document.createElement('div');
    konfettiContainer.className = 'konfetti-container';
    konfettiContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(konfettiContainer);
};

window.triggerKonfetti = function(x, y) {
    if (!konfettiContainer || window.prefersReducedMotion) return;

    const konfettiColors = [
        '#FFD60A', '#FF9F0A', '#FF375F', '#BF5AF2', '#5E5CE6', '#0A84FF', '#5AC8FA', '#32D74B'
    ];

    for (let i = 0; i < 24; i++) {
        const konfetti = document.createElement('div');
        const tilt = (Math.random() * 2) - 1;
        const size = Math.random() * 8 + 6;
        const color = konfettiColors[Math.floor(Math.random() * konfettiColors.length)];

        konfetti.className = 'konfetti-piece';
        konfetti.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            --konfetti-tilt: ${tilt}deg;
            --konfetti-rotate: ${(Math.random() * 200) + 100}deg;
            --konfetti-duration: ${(Math.random() * 0.5) + 0.8}s;
            --konfetti-delay: ${Math.random() * 50}ms;
        `;

        konfettiContainer.appendChild(konfetti);

        setTimeout(() => {
            konfetti.remove();
        }, 2000);
    }
};

window.initCardTiltEffect = function() {
    if (window.prefersReducedMotion) {
        tiltEnabled = false;
        return;
    }
    
    if (window.containerEl) {
        window.containerEl.addEventListener('mousemove', window.handleCardTilt, { passive: true });
        window.containerEl.addEventListener('mouseleave', window.resetCardTilt, { passive: true });
    }
};

window.handleCardTilt = function(e) {
    if (!tiltEnabled || tiltPending) return;
    tiltPending = true;
    
    tiltRafId = requestAnimationFrame(() => {
        tiltPending = false;
        
        const card = e.target.closest('.card');
        if (!card || (window.containerEl && window.containerEl.classList.contains('edit-mode'))) return;
        
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        const clampedRotateX = Math.max(-10, Math.min(10, rotateX));
        const clampedRotateY = Math.max(-10, Math.min(10, rotateY));
        
        card.style.transform = `translateY(-6px) scale(1.04) perspective(1000px) rotateX(${clampedRotateX}deg) rotateY(${clampedRotateY}deg) translateZ(0)`;
        
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        card.style.setProperty('--glow-x', `${glowX}%`);
        card.style.setProperty('--glow-y', `${glowY}%`);
    });
};

window.resetCardTilt = function(e) {
    if (window.containerEl) {
        const cards = window.containerEl.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.transform = '';
        });
    }
};

window.initDeviceOrientationParallax = function() {
    if (window.prefersReducedMotion) return;
    
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permissionState = localStorage.getItem(DEVICE_ORIENTATION_PERMISSION_KEY);
            if (permissionState === 'granted') {
                window.enableDeviceOrientationListener();
            } else if (permissionState === 'denied') {
                return;
            } else {
                document.addEventListener('click', window.requestOrientationPermissionOnce, { once: true });
            }
        } else {
            window.enableDeviceOrientationListener();
        }
    }
};

window.requestOrientationPermissionOnce = function() {
    DeviceOrientationEvent.requestPermission()
        .then(response => {
            localStorage.setItem(DEVICE_ORIENTATION_PERMISSION_KEY, response);
            if (response === 'granted') {
                window.enableDeviceOrientationListener();
            }
        })
        .catch(error => {
            localStorage.setItem(DEVICE_ORIENTATION_PERMISSION_KEY, 'denied');
            console.warn('Device orientation permission denied or error:', error);
        });
};

window.enableDeviceOrientationListener = function() {
    window.addEventListener('deviceorientation', window.handleDeviceOrientation, { passive: true });
};

window.handleDeviceOrientation = function(e) {
    const now = Date.now();
    if (now - lastOrientationTime < ORIENTATION_THROTTLE_MS) return;
    lastOrientationTime = now;
    
    if (!window.auroraContainerEl || window.prefersReducedMotion) return;
    
    pendingOrientation = {
        beta: e.beta || 0,
        gamma: e.gamma || 0
    };
    
    if (!orientationRafId) {
        orientationRafId = requestAnimationFrame(() => {
            orientationRafId = null;
            if (!pendingOrientation) return;
            
            const { beta, gamma } = pendingOrientation;
            const normalizedBeta = Math.max(-30, Math.min(30, beta)) / 30;
            const normalizedGamma = Math.max(-30, Math.min(30, gamma)) / 30;
            
            const moveX = normalizedGamma * 20;
            const moveY = normalizedBeta * 15;
            
            window.auroraContainerEl.classList.add('parallax-active');
            
            const shapes = window.auroraContainerEl.querySelectorAll('.aurora-shape');
            shapes.forEach((shape, index) => {
                const factor = (index + 1) * 0.3;
                const offset = window.auroraParallaxOffset || 0;
                shape.style.transform = `translate3d(${moveX * factor}px, ${moveY * factor + offset}px, 0)`;
            });
        });
    }
};

window.triggerHapticFeedback = function(type = 'light') {
    if (!('vibrate' in navigator) || window.prefersReducedMotion) return;
    
    const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [30, 50, 30]
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
};

window.enhancedCopySuccess = function(buttonElement, x, y) {
    if (window.prefersReducedMotion) return;

    window.triggerGlowBurst(x, y, 'rgba(90, 200, 250, 0.45)');
    window.triggerKonfetti(x, y);
    window.triggerHapticFeedback('success');
};

window.addSparklesToFavoriteChip = function(chip) {
    if (window.prefersReducedMotion) return;
    
    if (chip.querySelector('.sparkle-container')) return;
    
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'sparkle-container';
    sparkleContainer.setAttribute('aria-hidden', 'true');
    
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkleContainer.appendChild(sparkle);
    }
    
    chip.appendChild(sparkleContainer);
};
