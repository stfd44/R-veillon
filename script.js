// ===== Configuration & State =====
const CONFIG = {
    defaultTargetDate: new Date('2026-01-01T00:00:00'),
    urgentThreshold: 60000, // 1 minute in milliseconds
};

let targetDate = loadTargetDate();
let currentScene = 1;
let transitionInProgress = false;

// ===== DOM Elements =====
const elements = {
    scene1: document.getElementById('scene1'),
    scene2: document.getElementById('scene2'),
    countdown: document.getElementById('countdown'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    saveSettings: document.getElementById('saveSettings'),
    closeSettings: document.getElementById('closeSettings'),
    targetDateInput: document.getElementById('targetDate'),
    targetTimeInput: document.getElementById('targetTime'),
    fireCanvas: document.getElementById('fireCanvas'),
    snowCanvas: document.getElementById('snowCanvas'),
    fireworksCanvas: document.getElementById('fireworksCanvas'),
};

// ===== Settings Management =====
function loadTargetDate() {
    const saved = localStorage.getItem('newYearTargetDate');
    return saved ? new Date(saved) : new Date(CONFIG.defaultTargetDate);
}

function saveTargetDate(date) {
    localStorage.setItem('newYearTargetDate', date.toISOString());
    targetDate = date;
}

function initializeSettings() {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');

    elements.targetDateInput.value = `${year}-${month}-${day}`;
    elements.targetTimeInput.value = `${hours}:${minutes}`;
}

elements.settingsBtn.addEventListener('click', () => {
    elements.settingsPanel.classList.add('active');
    initializeSettings();
});

elements.closeSettings.addEventListener('click', () => {
    elements.settingsPanel.classList.remove('active');
});

elements.saveSettings.addEventListener('click', () => {
    const dateValue = elements.targetDateInput.value;
    const timeValue = elements.targetTimeInput.value;

    if (dateValue && timeValue) {
        const newTargetDate = new Date(`${dateValue}T${timeValue}:00`);
        saveTargetDate(newTargetDate);
        elements.settingsPanel.classList.remove('active');

        // Reset to scene 1 if we changed the date
        if (currentScene === 2) {
            switchToScene1();
        }
    }
});

// ===== Countdown Logic =====
function updateCountdown() {
    const now = new Date();
    const difference = targetDate - now;

    if (difference <= 0) {
        // It's midnight or past!
        if (currentScene === 1 && !transitionInProgress) {
            triggerMidnightTransition();
        }
        elements.days.textContent = '00';
        elements.hours.textContent = '00';
        elements.minutes.textContent = '00';
        elements.seconds.textContent = '00';
        return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    elements.days.textContent = String(days).padStart(2, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');

    // Add urgent class when less than 1 minute remaining
    if (difference < CONFIG.urgentThreshold) {
        elements.countdown.classList.add('urgent');
    } else {
        elements.countdown.classList.remove('urgent');
    }
}

// ===== Scene Transition =====
function triggerMidnightTransition() {
    transitionInProgress = true;
    currentScene = 2;

    // Fade out scene 1, fade in scene 2
    elements.scene1.classList.remove('scene-active');
    elements.scene2.classList.add('scene-active');

    // Start fireworks after transition
    setTimeout(() => {
        startFireworks();
        transitionInProgress = false;
    }, 3000);
}

function switchToScene1() {
    currentScene = 1;
    elements.scene2.classList.remove('scene-active');
    elements.scene1.classList.add('scene-active');
    stopFireworks();
}

// ===== Canvas Setup =====
function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return ctx;
}

// ===== Fire Animation (Scene 1) =====
class FireParticle {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(Math.random() * 3 + 2);
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * 20 + 10;
        this.canvas = canvas;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy -= 0.1; // Gravity effect upward
    }

    draw(ctx) {
        if (this.life <= 0) return;

        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);

        if (this.life > 0.7) {
            gradient.addColorStop(0, `rgba(255, 255, 200, ${this.life})`);
            gradient.addColorStop(0.3, `rgba(255, 200, 0, ${this.life * 0.8})`);
            gradient.addColorStop(0.6, `rgba(255, 100, 0, ${this.life * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        } else {
            gradient.addColorStop(0, `rgba(255, 150, 0, ${this.life})`);
            gradient.addColorStop(0.5, `rgba(255, 50, 0, ${this.life * 0.5})`);
            gradient.addColorStop(1, `rgba(100, 0, 0, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }

    isDead() {
        return this.life <= 0;
    }
}

let fireParticles = [];
const fireCtx = setupCanvas(elements.fireCanvas);

function animateFire() {
    if (currentScene !== 1) return;

    fireCtx.clearRect(0, 0, elements.fireCanvas.width, elements.fireCanvas.height);

    // Create new particles
    for (let i = 0; i < 2; i++) {
        const x = Math.random() * elements.fireCanvas.width;
        const y = elements.fireCanvas.height - 20;
        fireParticles.push(new FireParticle(x, y, elements.fireCanvas));
    }

    // Update and draw particles
    fireParticles = fireParticles.filter(particle => {
        particle.update();
        particle.draw(fireCtx);
        return !particle.isDead();
    });

    requestAnimationFrame(animateFire);
}

// ===== Snow Animation (Scene 1) =====
class SnowFlake {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.drift = Math.random() * 0.5 - 0.25;
    }

    update() {
        this.y += this.speed;
        this.x += this.drift;

        if (this.y > this.canvas.height) {
            this.y = -10;
            this.x = Math.random() * this.canvas.width;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let snowFlakes = [];
const snowCtx = setupCanvas(elements.snowCanvas);

function initSnow() {
    for (let i = 0; i < 100; i++) {
        snowFlakes.push(new SnowFlake(elements.snowCanvas));
    }
}

function animateSnow() {
    if (currentScene !== 1) return;

    snowCtx.clearRect(0, 0, elements.snowCanvas.width, elements.snowCanvas.height);

    snowFlakes.forEach(flake => {
        flake.update();
        flake.draw(snowCtx);
    });

    requestAnimationFrame(animateSnow);
}

// ===== Fireworks Animation (Scene 2) =====
class Firework {
    constructor(x, y, targetY, canvas) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.canvas = canvas;
        this.speed = 5;
        this.exploded = false;
        this.particles = [];
        this.hue = Math.random() * 360;
    }

    update() {
        if (!this.exploded) {
            this.y -= this.speed;
            if (this.y <= this.targetY) {
                this.explode();
            }
        } else {
            this.particles = this.particles.filter(particle => {
                particle.update();
                return particle.life > 0;
            });
        }
    }

    explode() {
        this.exploded = true;
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 5 + 2;
            this.particles.push(new FireworkParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.hue
            ));
        }
    }

    draw(ctx) {
        if (!this.exploded) {
            ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            this.particles.forEach(particle => particle.draw(ctx));
        }
    }

    isDone() {
        return this.exploded && this.particles.length === 0;
    }
}

class FireworkParticle {
    constructor(x, y, vx, vy, hue) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.hue = hue + Math.random() * 30 - 15;
        this.gravity = 0.05;
    }

    update() {
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

let fireworks = [];
let fireworksAnimationId = null;
const fireworksCtx = setupCanvas(elements.fireworksCanvas);

function animateFireworks() {
    fireworksCtx.fillStyle = 'rgba(10, 17, 40, 0.1)';
    fireworksCtx.fillRect(0, 0, elements.fireworksCanvas.width, elements.fireworksCanvas.height);

    // Randomly create new fireworks
    if (Math.random() < 0.05) {
        const x = Math.random() * elements.fireworksCanvas.width;
        const y = elements.fireworksCanvas.height;
        const targetY = Math.random() * (elements.fireworksCanvas.height * 0.3) + 50;
        fireworks.push(new Firework(x, y, targetY, elements.fireworksCanvas));
    }

    // Update and draw fireworks
    fireworks = fireworks.filter(firework => {
        firework.update();
        firework.draw(fireworksCtx);
        return !firework.isDone();
    });

    fireworksAnimationId = requestAnimationFrame(animateFireworks);
}

function startFireworks() {
    if (!fireworksAnimationId) {
        animateFireworks();
    }
}

function stopFireworks() {
    if (fireworksAnimationId) {
        cancelAnimationFrame(fireworksAnimationId);
        fireworksAnimationId = null;
        fireworks = [];
        fireworksCtx.clearRect(0, 0, elements.fireworksCanvas.width, elements.fireworksCanvas.height);
    }
}

// ===== Window Resize Handler =====
window.addEventListener('resize', () => {
    setupCanvas(elements.fireCanvas);
    setupCanvas(elements.snowCanvas);
    setupCanvas(elements.fireworksCanvas);
});

// ===== Initialization =====
function init() {
    initializeSettings();
    initSnow();

    // Start animations
    animateFire();
    animateSnow();

    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Check if we should already be in scene 2
    const now = new Date();
    if (now >= targetDate) {
        triggerMidnightTransition();
    }
}

// Start the application
init();
