import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cachePath = path.join(__dirname, "..", ".cache", "home-gallery.json");

const splitList = (value = "") =>
	value
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);

const joinUrl = (...parts) =>
	parts
		.filter(Boolean)
		.map((part, index) => {
			if (index === 0) {
				return part.replace(/\/+$/, "");
			}

			return part.replace(/^\/+|\/+$/g, "");
		})
		.join("/");

const labelFromPath = (path, index) => {
	const raw = path.split("/").pop()?.replace(/\.[^.]+$/, "") || `photo-${index + 1}`;
	return raw
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim() || `Gallery photo ${index + 1}`;
};

const normalizePhoto = (photo, index, baseUrl, prefix) => {
	if (typeof photo === "string") {
		return {
			src: joinUrl(baseUrl, prefix, photo),
			alt: labelFromPath(photo, index),
		};
	}

	if (!photo || typeof photo !== "object") {
		return null;
	}

	const src = photo.src?.startsWith("http")
		? photo.src
		: joinUrl(baseUrl, prefix, photo.src || photo.path || photo.key || "");

	if (!src) {
		return null;
	}

	return {
		src,
		alt: photo.alt || labelFromPath(photo.src || photo.path || photo.key || "", index),
	};
};

export default async function () {
	try {
		const cached = await readFile(cachePath, "utf8");
		const parsed = JSON.parse(cached);
		if (Array.isArray(parsed.photos) && parsed.photos.length) {
			return parsed;
		}
	} catch {
		// Fall through to env-based configuration.
	}

	const baseUrl = process.env.CLOUDFLARE_IMAGE_BUCKET_URL || "https://pub-68d4e56b495346c097026e9087c01342.r2.dev";
	const prefix = process.env.CLOUDFLARE_IMAGE_BUCKET_PREFIX || "";
	const manifestUrl = process.env.CLOUDFLARE_IMAGE_BUCKET_MANIFEST_URL || "";
	const inlinePhotos = splitList(process.env.CLOUDFLARE_IMAGE_BUCKET_IMAGES || "");

	let sourcePhotos = inlinePhotos;

	if (manifestUrl) {
		try {
			const response = await fetch(manifestUrl);
			if (response.ok) {
				const manifest = await response.json();
				sourcePhotos = Array.isArray(manifest) ? manifest : (manifest.photos || manifest.images || []);
			}
		} catch {
			// Fall back to inline environment configuration when the manifest is unavailable.
		}
	}

	const photos = sourcePhotos
		.map((photo, index) => normalizePhoto(photo, index, baseUrl, prefix))
		.filter(Boolean);

	return {
		photos,
	};
}
