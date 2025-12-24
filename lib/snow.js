/* ============================================
   ENHANCED SNOW EFFECT WITH REALISTIC PHYSICS
   ============================================
   
   Customize the snow behavior by adjusting the weatherParams below:
   - windSpeedX: Horizontal wind (0-2 recommended, can be negative for wind from right)
   - windSpeedY: Vertical fall speed (0.5-2 recommended, higher = faster fall)
   - turbulence: Chaotic swirling (0-5 recommended, higher = more chaotic)
   - spawnRate: How often to create new snowflakes (0-1, where 1 = every frame)
   - maxSnowflakes: Maximum number of particles (100-1000 recommended)
   
   Features:
   ✓ Three depth layers (near/mid/far) for parallax effect
   ✓ Realistic physics with wind, gravity, and turbulence
   ✓ Smooth sinusoidal movement patterns
   ✓ Glowing snowflakes with text shadows
   ✓ Performance optimized with will-change hints
   ============================================ */

const snowToggle = document.querySelector('#snow-toggle');
const snowIcon = document.querySelector('#snow-icon');
let snowEnabled = false;
let snowflakes = [];
let animationId = null;
let time = 0;

// Weather parameters - customize to your liking!
// Current preset: 💨 WINDY DAY
const weatherParams = {
    windSpeedX: 2.0,      // Horizontal wind force (try 0-2)
    windSpeedY: 1.2,      // Base gravity/fall speed (try 0.5-2)
    turbulence: 3.5,      // Amount of chaotic movement (try 0-5)
    spawnRate: 0.6,       // Probability of creating new snowflake each frame (0-1)
    maxSnowflakes: 1000,   // Optimized particle count (try 100-1000)
};

// Function to create snowflakes with depth layers
const createSnowflake = () => {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';

    // Create depth layers (0=far, 1=mid, 2=near)
    const layer = Math.floor(Math.random() * 3);
    const layerConfig = [
        { size: [20, 40], opacity: [0.3, 0.5], blur: 1.5, speed: 0.5 },  // Far
        { size: [40, 70], opacity: [0.5, 0.7], blur: 0.8, speed: 1.0 },  // Mid
        { size: [70, 120], opacity: [0.7, 0.9], blur: 0.3, speed: 1.5 }, // Near
    ][layer];

    const size = Math.random() * (layerConfig.size[1] - layerConfig.size[0]) + layerConfig.size[0];
    const opacity = Math.random() * (layerConfig.opacity[1] - layerConfig.opacity[0]) + layerConfig.opacity[0];

    snowflake.style.cssText = `
        position: fixed;
        top: -120px;
        color: white;
        font-size: ${size}px;
        opacity: ${opacity};
        pointer-events: none;
        z-index: ${9997 + layer};
        user-select: none;
        text-shadow: 0 0 ${layerConfig.blur * 3}px rgba(255, 255, 255, 0.8),
                     0 0 ${layerConfig.blur * 6}px rgba(200, 220, 255, 0.4);
        filter: blur(${layerConfig.blur}px);
        will-change: transform;
    `;

    // Enhanced snowflake characters with more variety
    const snowChars = ['❄', '❅', '❆', '✻', '❉'];
    snowflake.textContent = snowChars[Math.floor(Math.random() * snowChars.length)];

    // Random horizontal position
    const startX = Math.random() * (window.innerWidth + 200) - 100;
    snowflake.style.left = startX + 'px';

    // Store animation properties with improved physics
    snowflake.x = startX;
    snowflake.y = -100;
    snowflake.layer = layer;

    // Per-particle velocity variance (increases min speed like Three.js example)
    snowflake.baseSpeed = (Math.random() * 1.5 + 2.0) * layerConfig.speed;
    snowflake.drift = (Math.random() - 0.5) * 1.2;
    snowflake.turbulencePhase = Math.random() * Math.PI * 2; // Random phase for sine wave

    snowflake.rotation = Math.random() * 360;
    snowflake.rotationSpeed = (Math.random() * 3 - 1.5);

    document.body.appendChild(snowflake);
    return snowflake;
};

// Animation loop with enhanced physics
const animateSnow = () => {
    if (!snowEnabled) return;

    time += 0.016; // Approximate 60fps time step

    // Create new snowflakes with controlled spawn rate
    if (Math.random() < weatherParams.spawnRate && snowflakes.length < weatherParams.maxSnowflakes) {
        snowflakes.push(createSnowflake());
    }

    // Animate existing snowflakes with turbulence
    snowflakes = snowflakes.filter(flake => {
        if (!flake.parentNode) return false;

        // Apply turbulence using sine waves (like Three.js example)
        const turbulenceX = Math.sin(time * 2 + flake.turbulencePhase + flake.y * 0.005) * weatherParams.turbulence;
        const turbulenceZ = Math.cos(time * 1.5 + flake.turbulencePhase + flake.x * 0.005) * weatherParams.turbulence * 0.5;

        // Apply wind + gravity + turbulence + per-particle variation
        flake.x += (weatherParams.windSpeedX * 0.5) + turbulenceX + (flake.drift * 0.3);
        flake.y += (weatherParams.windSpeedY * 0.8) + (flake.baseSpeed * 0.4);

        // Gentle swaying motion
        const sway = Math.sin(time + flake.y * 0.01) * 15;

        // Rotation
        flake.rotation += flake.rotationSpeed;

        // Apply transforms with 3D perspective hint
        const scale = 1 + (flake.layer * 0.1); // Slight scale variation by depth
        flake.style.transform = `translate(${flake.x + sway}px, ${flake.y}px) rotate(${flake.rotation}deg) scale(${scale})`;

        // Wrap horizontally for infinite effect
        if (flake.x > window.innerWidth + 100) {
            flake.x = -100;
        } else if (flake.x < -100) {
            flake.x = window.innerWidth + 100;
        }

        // Remove if off screen (bottom)
        if (flake.y > window.innerHeight + 100) {
            flake.remove();
            return false;
        }

        return true;
    });

    animationId = requestAnimationFrame(animateSnow);
};

// Start snow
const startSnow = () => {
    snowEnabled = true;
    snowIcon.textContent = '❄️';
    localStorage.setItem('snowEnabled', 'true');
    animateSnow();
};

// Stop snow
const stopSnow = () => {
    snowEnabled = false;
    snowIcon.textContent = '🌨️';
    localStorage.setItem('snowEnabled', 'false');

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Remove all snowflakes
    snowflakes.forEach(flake => flake.remove());
    snowflakes = [];
};

// Initialize from localStorage
const savedSnowState = localStorage.getItem('snowEnabled');
if (savedSnowState === 'true') {
    startSnow();
} else {
    snowIcon.textContent = '🌨️';
}

// Toggle snow on button click
snowToggle.addEventListener('click', () => {
    if (snowEnabled) {
        stopSnow();
    } else {
        startSnow();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Update positions if needed
    snowflakes.forEach(flake => {
        if (flake.x > window.innerWidth) {
            flake.x = window.innerWidth - 50;
        }
    });
});
