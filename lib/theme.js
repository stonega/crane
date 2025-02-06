const toggle = document.querySelector('#dark-mode-toggle');
const themeIcon = document.querySelector('#theme-icon');

// Function to set theme
const setTheme = (theme) => {
	if (theme === 'dark') {
		document.documentElement.classList.add('dark');
		document.documentElement.classList.remove('light');
		themeIcon.textContent = '☀️';
	} else {
		document.documentElement.classList.add('light');
		document.documentElement.classList.remove('dark');
		themeIcon.textContent = '🌙';
	}
	// Save theme preference to localStorage
	localStorage.setItem('theme', theme);
}

// Get system preferences
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

// Toggle theme manually
toggle.addEventListener('click', () => {
	// Get toggle button position
	const rect = toggle.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;

	// Set CSS variables on the html element
	document.documentElement.style.setProperty('--mask-x', `${x}px`);
	document.documentElement.style.setProperty('--mask-y', `${y}px`);

	const isDark = document.documentElement.classList.contains('dark');
	if (!document.startViewTransition) {
		setTheme(isDark ? 'light' : 'dark');
		return;
	}

	document.startViewTransition(() => {
		setTheme(isDark ? 'light' : 'dark');
	});
});
