const snowToggle = document.querySelector('#snow-toggle');
const snowIcon = document.querySelector('#snow-icon');
let snowEnabled = false;
let snowflakes = [];
let animationId = null;

// Function to create snowflakes
const createSnowflake = () => {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.style.cssText = `
		position: fixed;
		top: -80px;
		color: white;
		font-size: ${Math.random() * 80 + 40}px;
		opacity: ${Math.random() * 0.6 + 0.4};
		pointer-events: none;
		z-index: 9999;
		user-select: none;
	`;

    // Random snowflake characters - big flakes
    const snowChars = ['❄', '❅', '❆'];
    snowflake.textContent = snowChars[Math.floor(Math.random() * snowChars.length)];

    // Random horizontal position
    snowflake.style.left = Math.random() * window.innerWidth + 'px';

    // Store animation properties
    snowflake.x = parseFloat(snowflake.style.left);
    snowflake.y = -50;
    snowflake.speed = Math.random() * 1 + 0.5; // Slower fall
    snowflake.drift = Math.random() * 0.5 - 0.25; // Horizontal drift
    snowflake.rotation = Math.random() * 360;
    snowflake.rotationSpeed = Math.random() * 2 - 1;

    document.body.appendChild(snowflake);
    return snowflake;
};

// Animation loop
const animateSnow = () => {
    if (!snowEnabled) return;

    // Create new snowflakes occasionally
    if (Math.random() < 0.5 && snowflakes.length < 3000) {
        snowflakes.push(createSnowflake());
    }

    // Animate existing snowflakes
    snowflakes = snowflakes.filter(flake => {
        if (!flake.parentNode) return false;

        flake.y += flake.speed;
        flake.x += flake.drift;
        flake.rotation += flake.rotationSpeed;

        flake.style.transform = `translate(${flake.x}px, ${flake.y}px) rotate(${flake.rotation}deg)`;

        // Remove if off screen
        if (flake.y > window.innerHeight + 50) {
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
