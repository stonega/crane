// Function to set theme
document.documentElement.style.setProperty('--mask-size', '0');
function setTheme(theme) {
	if (theme === 'dark') {
		document.documentElement.classList.add('dark');
		document.documentElement.classList.remove('light');
		toggle.innerHTML = '☀️';
	} else {
		document.documentElement.classList.add('light');
		document.documentElement.classList.remove('dark');
		toggle.innerHTML = '🌙';
	}
	// Save theme preference to localStorage
	localStorage.setItem('theme', theme);
}

// Get DOM elements and system preferences
const toggle = document.getElementById('dark-mode-toggle');
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Get saved theme from localStorage or use system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
	setTheme(savedTheme);
} else {
	setTheme(darkModeMediaQuery.matches ? 'dark' : 'light');
}

// Listen for system theme changes (only if no saved preference)
darkModeMediaQuery.addEventListener('change', (e) => {
	if (!localStorage.getItem('theme')) {
		setTheme(e.matches ? 'dark' : 'light');
	}
});
// Get toggle button position
const rect = toggle.getBoundingClientRect();
const x = rect.left + rect.width / 2;
const y = rect.top + rect.height / 2;

// Toggle theme manually
toggle.addEventListener('click', () => {
	// Set CSS variables on the html element
	document.documentElement.style.setProperty('--mask-x', `${x}px`);
	document.documentElement.style.setProperty('--mask-y', `${y}px`);
	document.documentElement.style.setProperty('--mask-size', '300vmax');
	const isDark = document.documentElement.classList.contains('dark');
	if (!document.startViewTransition) {
		setTheme(isDark ? 'light' : 'dark');
	}
	document.startViewTransition(() => {
		setTheme(isDark ? 'light' : 'dark');
	});
});
