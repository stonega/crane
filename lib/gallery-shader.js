const galleryVertexShaderSource = `#version 300 es
in vec2 aPosition;
in vec2 aUv;
out vec2 vUv;
void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const galleryFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;
uniform vec2 uResolution;
const float uScale = 1.00;
const float uContrast = 1.20;
const float uBrightness = 0.00;
const vec3 uColorDark = vec3(0.122, 0.129, 0.137); /* #1f2123 */
const vec3 uColorLight = vec3(0.902, 0.902, 0.902); /* #e6e6e6 */
const float uScanlineIntensity = 1.00;
const float uVignette = 0.50;

const int bayer[64] = int[](
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21
);

void main() {
    vec4 color = texture(uImage, vUv);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Vignette
    float dist = distance(vUv, vec2(0.5));
    gray -= smoothstep(0.3, 0.8, dist) * uVignette;

    gray = (gray - 0.5) * uContrast + 0.5 + uBrightness;

    // Scanlines
    float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.04 * uScanlineIntensity;
    gray -= scanline;

    gray = clamp(gray, 0.0, 1.0);

    int x = int(mod(gl_FragCoord.x / uScale, 8.0));
    int y = int(mod(gl_FragCoord.y / uScale, 8.0));
    float threshold = float(bayer[x + y * 8]) / 64.0;

    float dithered = step(threshold, gray);

    fragColor = vec4(mix(uColorDark, uColorLight, dithered), 1.0);
}
`;

const compileGalleryShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	if (!shader) {
		return null;
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
};

const createGalleryProgram = (gl) => {
	const vertexShader = compileGalleryShader(gl, gl.VERTEX_SHADER, galleryVertexShaderSource);
	const fragmentShader = compileGalleryShader(gl, gl.FRAGMENT_SHADER, galleryFragmentShaderSource);
	if (!vertexShader || !fragmentShader) {
		return null;
	}

	const program = gl.createProgram();
	if (!program) {
		return null;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	return program;
};

const initGalleryShader = async (figure) => {
	const canvas = figure.querySelector('.photo-gallery__shader');
	const image = figure.querySelector('.photo-gallery__image');

	if (!(canvas instanceof HTMLCanvasElement) || !(image instanceof HTMLImageElement)) {
		return;
	}

	try {
		if (!image.complete) {
			await image.decode();
		}
	} catch {
		return;
	}

	const gl = canvas.getContext('webgl2', {
		alpha: true,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: true,
	});

	if (!gl) {
		canvas.style.display = 'none';
		return;
	}

	const program = createGalleryProgram(gl);
	if (!program) {
		canvas.style.display = 'none';
		return;
	}

	const positionLocation = gl.getAttribLocation(program, 'aPosition');
	const uvLocation = gl.getAttribLocation(program, 'aUv');
	const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
	const imageLocation = gl.getUniformLocation(program, 'uImage');

	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1, -1, 0, 0,
		1, -1, 1, 0,
		-1, 1, 0, 1,
		-1, 1, 0, 1,
		1, -1, 1, 0,
		1, 1, 1, 1,
	]), gl.STATIC_DRAW);

	const texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	const render = () => {
		const width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
		const height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}

		gl.viewport(0, 0, width, height);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(program);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
		gl.enableVertexAttribArray(uvLocation);
		gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);

		gl.uniform1i(imageLocation, 0);
		gl.uniform2f(resolutionLocation, width, height);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	};

	const resizeObserver = new ResizeObserver(render);
	resizeObserver.observe(canvas);
	resizeObserver.observe(image);

	if (!image.complete) {
		image.addEventListener('load', () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			render();
		}, { once: true });
	}

	render();
};

window.addEventListener('load', () => {
	document.querySelectorAll('.photo-gallery__item').forEach((figure) => {
		initGalleryShader(figure);
	});
});
