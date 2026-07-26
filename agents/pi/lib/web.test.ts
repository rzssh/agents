import assert from "node:assert/strict";
import test from "node:test";
import {
	formatSearchResults,
	isPublicAddress,
	isSupportedImageContentType,
	readableText,
} from "./web.ts";

test("blocks private addresses", () => {
	assert.equal(isPublicAddress("127.0.0.1"), false);
	assert.equal(isPublicAddress("10.0.0.1"), false);
	assert.equal(isPublicAddress("1.1.1.1"), true);
});

test("extracts readable HTML", () => {
	assert.equal(
		readableText(
			"<main><h1>Title</h1><p>A &amp; B</p><script>bad()</script></main>",
			"text/html",
		),
		"Title\nA & B",
	);
});

test("formats image search fields", () => {
	const text = formatSearchResults(
		[
			{
				title: "Image result",
				url: "https://example.com/page",
				img_src: "https://example.com/image.png",
				thumbnail_src: "https://example.com/thumb.png",
				resolution: "1280 x 720",
			},
		],
		1,
	);
	assert.match(text, /Image: https:\/\/example\.com\/image\.png/);
	assert.match(text, /Resolution: 1280 x 720/);
});

test("accepts provider-supported image types", () => {
	assert.equal(isSupportedImageContentType("image/png"), true);
	assert.equal(isSupportedImageContentType("image/jpeg; charset=binary"), true);
	assert.equal(isSupportedImageContentType("image/svg+xml"), false);
});
