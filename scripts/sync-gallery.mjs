import { createHmac, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const cachePath = path.join(rootDir, ".cache", "home-gallery.json");
const defaultPublicBaseUrl = "https://pub-68d4e56b495346c097026e9087c01342.r2.dev";
const defaultPrefix = "";
const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;

function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
	return createHmac("sha256", key).update(value).digest(encoding);
}

function getSigningKey(secretKey, dateStamp, region, service) {
	const kDate = hmac(`AWS4${secretKey}`, dateStamp);
	const kRegion = hmac(kDate, region);
	const kService = hmac(kRegion, service);
	return hmac(kService, "aws4_request");
}

function encodeRfc3986(value) {
	return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
		`%${char.charCodeAt(0).toString(16).toUpperCase()}`
	);
}

function toAmzDate(date) {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function escapeXml(value = "") {
	return value
		.replace(/&quot;/g, "\"")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

function labelFromPath(filePath, index) {
	const raw = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || `photo-${index + 1}`;
	return raw
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim() || `Gallery photo ${index + 1}`;
}

function parseListObjectsV2(xml) {
	const keyMatches = [...xml.matchAll(/<Contents>[\s\S]*?<Key>(.*?)<\/Key>[\s\S]*?<\/Contents>/g)];
	const continuation = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/)?.[1];
	const isTruncated = xml.includes("<IsTruncated>true</IsTruncated>");

	return {
		keys: keyMatches.map((match) => escapeXml(match[1])),
		continuationToken: continuation ? escapeXml(continuation) : "",
		isTruncated,
	};
}

async function listObjectsPage({
	accountId,
	bucketName,
	accessKeyId,
	secretAccessKey,
	jurisdiction,
	prefix,
	continuationToken,
}) {
	const host = jurisdiction
		? `${accountId}.${jurisdiction}.r2.cloudflarestorage.com`
		: `${accountId}.r2.cloudflarestorage.com`;
	const now = new Date();
	const amzDate = toAmzDate(now);
	const dateStamp = amzDate.slice(0, 8);
	const region = "auto";
	const service = "s3";

	const queryEntries = [
		["list-type", "2"],
		["prefix", prefix],
		["max-keys", "1000"],
	];

	if (continuationToken) {
		queryEntries.push(["continuation-token", continuationToken]);
	}

	const canonicalQueryString = queryEntries
		.filter(([, value]) => value !== "")
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
		.join("&");

	const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
	const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
	const canonicalRequest = [
		"GET",
		`/${bucketName}`,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		"UNSIGNED-PAYLOAD",
	].join("\n");

	const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256(canonicalRequest),
	].join("\n");

	const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service);
	const signature = hmac(signingKey, stringToSign, "hex");
	const authorization = [
		`AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
		`SignedHeaders=${signedHeaders}`,
		`Signature=${signature}`,
	].join(", ");

	const response = await fetch(`https://${host}/${bucketName}?${canonicalQueryString}`, {
		headers: {
			Authorization: authorization,
			"x-amz-content-sha256": "UNSIGNED-PAYLOAD",
			"x-amz-date": amzDate,
		},
	});

	if (!response.ok) {
		throw new Error(`R2 list request failed: ${response.status} ${response.statusText}`);
	}

	return response.text();
}

async function listAllObjects(config) {
	const keys = [];
	let continuationToken = "";

	do {
		const xml = await listObjectsPage({
			...config,
			continuationToken,
		});
		const page = parseListObjectsV2(xml);
		keys.push(...page.keys);
		continuationToken = page.isTruncated ? page.continuationToken : "";
	} while (continuationToken);

	return keys;
}

function toGalleryData(keys, publicBaseUrl, prefix) {
	const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");
	const baseUrl = publicBaseUrl.replace(/\/+$/, "");

	const photos = keys
		.filter((key) => imagePattern.test(key))
		.sort((left, right) => left.localeCompare(right))
		.map((key, index) => ({
			src: `${baseUrl}/${key.replace(/^\/+/, "")}`,
			alt: labelFromPath(key, index),
		}));

	return {
		syncedAt: new Date().toISOString(),
		prefix: normalizedPrefix,
		photos,
	};
}

async function readExistingData() {
	try {
		const existing = await readFile(cachePath, "utf8");
		return JSON.parse(existing);
	} catch {
		return null;
	}
}

async function syncGallery() {
	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
	const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
	const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
	const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
	const publicBaseUrl = process.env.CLOUDFLARE_IMAGE_BUCKET_URL || defaultPublicBaseUrl;
	const prefix = process.env.CLOUDFLARE_IMAGE_BUCKET_PREFIX || defaultPrefix;
	const jurisdiction = process.env.CLOUDFLARE_R2_JURISDICTION || "";

	if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
		throw new Error("Missing R2 sync credentials. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
	}

	const keys = await listAllObjects({
		accountId,
		bucketName,
		accessKeyId,
		secretAccessKey,
		jurisdiction,
		prefix,
	});

	const data = toGalleryData(keys, publicBaseUrl, prefix);

	await mkdir(path.dirname(cachePath), { recursive: true });
	await writeFile(cachePath, `${JSON.stringify(data, null, 2)}\n`);

	return data;
}

try {
	const data = await syncGallery();
	console.log(`Synced ${data.photos.length} gallery photos to ${path.relative(rootDir, cachePath)}`);
} catch (error) {
	const existingData = await readExistingData();

	if (existingData) {
		console.warn(`Gallery sync failed, using cached data: ${error.message}`);
		process.exit(0);
	}

	console.warn(`Gallery sync skipped: ${error.message}`);
	process.exit(0);
}
