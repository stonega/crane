const toggle = document.querySelector('[data-theme-toggle]');
const themeIcon = document.querySelector('[data-theme-icon]');

const setMode = (mode) => {
	if (mode === 'dark') {
		document.documentElement.classList.add('dark');
		document.documentElement.classList.remove('light');
	} else {
		document.documentElement.classList.add('light');
		document.documentElement.classList.remove('dark');
	}

	if (themeIcon) {
		themeIcon.textContent = mode === 'dark' ? '☀️' : '🌙';
	}

	localStorage.setItem('mode', mode);
};

const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

if (toggle && themeIcon) {
	const savedMode = localStorage.getItem('mode');
	const normalizedMode = savedMode === 'snow' ? 'dark' : savedMode;
	setMode(normalizedMode || (darkModeMediaQuery.matches ? 'dark' : 'light'));

	darkModeMediaQuery.addEventListener('change', (e) => {
		if (!localStorage.getItem('mode')) {
			setMode(e.matches ? 'dark' : 'light');
		}
	});

	toggle.addEventListener('click', () => {
		const rect = toggle.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;

		document.documentElement.style.setProperty('--mask-x', `${x}px`);
		document.documentElement.style.setProperty('--mask-y', `${y}px`);

		const currentMode = localStorage.getItem('mode') === 'snow'
			? 'dark'
			: (localStorage.getItem('mode') || 'light');
		const nextMode = currentMode === 'dark' ? 'light' : 'dark';

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
}

window.setMode = setMode;
