const paperShadersVersion = '0.0.77';
const paperShadersBaseUrl = `https://unpkg.com/@paper-design/shaders@${paperShadersVersion}/dist`;

let paperGalleryShaderPromise;

const decodeGalleryImage = async (image) => {
	if (image.complete && image.naturalWidth > 0) {
		return;
	}

	if ('decode' in image) {
		try {
			await image.decode();
			return;
		} catch {
			if (image.complete && image.naturalWidth > 0) {
				return;
			}
		}
	}

	await new Promise((resolve, reject) => {
		if (image.complete && image.naturalWidth > 0) {
			resolve();
			return;
		}

		image.addEventListener('load', resolve, { once: true });
		image.addEventListener('error', reject, { once: true });
	});
};

const loadPaperGalleryShader = () => {
	if (!paperGalleryShaderPromise) {
		paperGalleryShaderPromise = Promise.all([
			import(`${paperShadersBaseUrl}/shader-mount.js`),
			import(`${paperShadersBaseUrl}/shaders/halftone-cmyk.js`),
			import(`${paperShadersBaseUrl}/get-shader-color-from-string.js`),
			import(`${paperShadersBaseUrl}/get-shader-noise-texture.js`),
			import(`${paperShadersBaseUrl}/shader-sizing.js`),
		]).then(async ([
			{ ShaderMount },
			{ HalftoneCmykTypes, halftoneCmykFragmentShader },
			{ getShaderColorFromString },
			{ getShaderNoiseTexture },
			{ ShaderFitOptions },
		]) => {
			const noiseTexture = getShaderNoiseTexture();
			await decodeGalleryImage(noiseTexture);

			return {
				HalftoneCmykTypes,
				ShaderFitOptions,
				ShaderMount,
				getShaderColorFromString,
				halftoneCmykFragmentShader,
				noiseTexture,
			};
		});
	}

	return paperGalleryShaderPromise;
};

const createHalftoneCmykUniforms = (image, paperShaders) => {
	const {
		HalftoneCmykTypes,
		ShaderFitOptions,
		getShaderColorFromString,
		noiseTexture,
	} = paperShaders;

	return {
		u_image: image,
		u_noiseTexture: noiseTexture,
		u_colorBack: getShaderColorFromString('#fbfaf5'),
		u_colorC: getShaderColorFromString('#00b4ff'),
		u_colorM: getShaderColorFromString('#fc519f'),
		u_colorY: getShaderColorFromString('#ffd800'),
		u_colorK: getShaderColorFromString('#231f20'),
		u_size: 0.2,
		u_contrast: 1,
		u_softness: 1,
		u_grainSize: 0.5,
		u_grainMixer: 0,
		u_grainOverlay: 0,
		u_gridNoise: 0.2,
		u_floodC: 0.15,
		u_floodM: 0,
		u_floodY: 0,
		u_floodK: 0,
		u_gainC: 0.3,
		u_gainM: 0,
		u_gainY: 0.2,
		u_gainK: 0,
		u_type: HalftoneCmykTypes.ink,
		u_fit: ShaderFitOptions.cover,
		u_rotation: 0,
		u_scale: 1,
		u_offsetX: 0,
		u_offsetY: 0,
		u_originX: 0.5,
		u_originY: 0.5,
		u_worldWidth: 0,
		u_worldHeight: 0,
	};
};

const normalizePathname = (pathname) => {
	if (pathname !== '/' && pathname.endsWith('/')) {
		return pathname.slice(0, -1);
	}

	return pathname;
};

const getCurrentGalleryIndex = () => {
	const currentPath = normalizePathname(window.location.pathname);
	const links = document.querySelectorAll('[data-gallery-index]');

	for (const link of links) {
		if (!(link instanceof HTMLAnchorElement)) {
			continue;
		}

		const linkPath = normalizePathname(new URL(link.href, window.location.href).pathname);
		if (linkPath === currentPath) {
			return Number.parseInt(link.dataset.galleryIndex || '', 10);
		}
	}

	return Number.NaN;
};

const scrollGalleryToCurrentPage = () => {
	const gallery = document.querySelector('.photo-gallery');
	if (!(gallery instanceof HTMLElement)) {
		return;
	}

	const items = Array.from(gallery.querySelectorAll('.photo-gallery__item'));
	const index = getCurrentGalleryIndex();
	if (!items.length || !Number.isInteger(index) || index < 0) {
		return;
	}

	const target = items[Math.min(index, items.length - 1)];
	if (!(target instanceof HTMLElement)) {
		return;
	}

	requestAnimationFrame(() => {
		const galleryRect = gallery.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();

		gallery.scrollTo({
			left: gallery.scrollLeft + targetRect.left - galleryRect.left,
			top: gallery.scrollTop + targetRect.top - galleryRect.top,
			behavior: 'auto',
		});
	});
};

const initGalleryShader = async (figure) => {
	const container = figure.querySelector('.photo-gallery__shader');
	const image = figure.querySelector('.photo-gallery__image');

	if (!(container instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
		return;
	}

	try {
		await decodeGalleryImage(image);

		if ('paperShaderMount' in container) {
			container.paperShaderMount.dispose();
		}
		container.replaceChildren();

		const paperShaders = await loadPaperGalleryShader();

		new paperShaders.ShaderMount(
			container,
			paperShaders.halftoneCmykFragmentShader,
			createHalftoneCmykUniforms(image, paperShaders),
			{
				alpha: true,
				antialias: false,
				depth: false,
				stencil: false,
				premultipliedAlpha: true,
			},
			0,
			0,
			2,
			1920 * 1080 * 2
		);

		container.hidden = false;
	} catch (error) {
		console.warn('Unable to initialize Paper Shaders Halftone CMYK filter.', error);
		container.replaceChildren();
		container.hidden = true;
	}
};

const initGalleryShaders = () => {
	scrollGalleryToCurrentPage();

	document.querySelectorAll('.photo-gallery__item').forEach((figure) => {
		initGalleryShader(figure);
	});
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initGalleryShaders, { once: true });
} else {
	initGalleryShaders();
}
