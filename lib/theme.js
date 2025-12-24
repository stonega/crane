const toggle = document.querySelector('#dark-mode-toggle');
const themeIcon = document.querySelector('#theme-icon');

// Three modes: 'light', 'snow', 'dark'
// light: 🌙 (moon icon, click to get snow)
// snow: ❄️ (snowflake icon, click to get dark)
// dark: ☀️ (sun icon, click to get light)

// Function to set theme and snow
const setMode = (mode) => {
	// Handle theme classes
	if (mode === 'dark' || mode === 'snow') {
		document.documentElement.classList.add('dark');
		document.documentElement.classList.remove('light');
	} else {
		document.documentElement.classList.add('light');
		document.documentElement.classList.remove('dark');
	}

	// Handle snow
	if (mode === 'snow') {
		// Start snow if available
		if (window.startSnow) window.startSnow();
		themeIcon.textContent = '❄️';
	} else {
		// Stop snow if available
		if (window.stopSnow) window.stopSnow();
		themeIcon.textContent = mode === 'dark' ? '☀️' : '🌙';
	}

	// Save mode preference to localStorage
	localStorage.setItem('mode', mode);
}

// Get system preferences
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Check if we're in Christmas period (December 1 - January 6)
const isChristmasPeriod = () => {
	const now = new Date();
	const month = now.getMonth(); // 0-indexed: 0=Jan, 11=Dec
	const day = now.getDate();

	// December (month 11) or January 1-6 (month 0, days 1-6)
	return (month === 11) || (month === 0 && day <= 6);
};

// Get saved mode from localStorage or use Christmas/system preference
const savedMode = localStorage.getItem('mode');
if (savedMode) {
	setMode(savedMode);
} else {
	// During Christmas period, default to 'snow' mode! 🎄
	if (isChristmasPeriod()) {
		setMode('snow');
	} else {
		setMode(darkModeMediaQuery.matches ? 'dark' : 'light');
	}
}

// Listen for system theme changes (only if no saved preference)
darkModeMediaQuery.addEventListener('change', (e) => {
	if (!localStorage.getItem('mode')) {
		setMode(e.matches ? 'dark' : 'light');
	}
});

// Cycle through modes: light → snow → dark → light → ...
toggle.addEventListener('click', () => {
	// Get toggle button position for view transition
	const rect = toggle.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;

	// Set CSS variables on the html element
	document.documentElement.style.setProperty('--mask-x', `${x}px`);
	document.documentElement.style.setProperty('--mask-y', `${y}px`);

	// Determine current mode and next mode
	const currentMode = localStorage.getItem('mode') || 'light';
	let nextMode;

	if (currentMode === 'light') {
		nextMode = 'snow';
	} else if (currentMode === 'snow') {
		nextMode = 'dark';
	} else {
		nextMode = 'light';
	}

	// Apply transition
	if (!document.startViewTransition) {
		setMode(nextMode);
		return;
	}

	document.documentElement.classList.add('theme-transition');
	const transition = document.startViewTransition(() => {
		setMode(nextMode);
	});

	transition.finished.finally(() => {
		document.documentElement.classList.remove('theme-transition');
	});
});

// Export setMode for external use
window.setMode = setMode;

