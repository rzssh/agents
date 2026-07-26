import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { fetchImage, fetchReadable, formatSearchResults } from "../lib/web.ts";

const searxUrl = process.env.SEARXNG_URL || "http://127.0.0.1:8888";

function withTimeout(signal?: AbortSignal): AbortSignal {
	const timeout = AbortSignal.timeout(15000);
	return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function resultsFrom(value: unknown): unknown[] {
	if (typeof value !== "object" || value === null) return [];
	const results = Reflect.get(value, "results");
	return Array.isArray(results) ? results : [];
}

export default function web(pi: ExtensionAPI) {
	pi.registerTool({
		name: "web_search",
		label: "Web Search",
		description:
			"Search web pages, news, or images through local SearXNG and return compact results with source URLs.",
		parameters: Type.Object({
			query: Type.String({ minLength: 1 }),
			max_results: Type.Optional(Type.Integer({ minimum: 1, maximum: 10 })),
			time_range: Type.Optional(
				Type.Union([
					Type.Literal("day"),
					Type.Literal("month"),
					Type.Literal("year"),
				]),
			),
			category: Type.Optional(
				Type.Union([
					Type.Literal("general"),
					Type.Literal("news"),
					Type.Literal("images"),
				]),
			),
		}),
		async execute(_id, params, signal) {
			const url = new URL("/search", searxUrl);
			url.searchParams.set("q", params.query);
			url.searchParams.set("format", "json");
			url.searchParams.set("safesearch", "0");
			if (params.time_range)
				url.searchParams.set("time_range", params.time_range);
			if (params.category && params.category !== "general")
				url.searchParams.set("categories", params.category);
			const response = await fetch(url, { signal: withTimeout(signal) });
			if (!response.ok) throw new Error(`SearXNG HTTP ${response.status}`);
			const text = formatSearchResults(
				resultsFrom(await response.json()),
				params.max_results ?? 8,
			);
			return {
				content: [{ type: "text", text: text || "No results." }],
				details: {
					query: params.query,
					category: params.category ?? "general",
				},
			};
		},
	});

	pi.registerTool({
		name: "web_fetch",
		label: "Web Fetch",
		description:
			"Fetch a public HTTP or HTTPS page as size-limited readable text. Private, local, credentialed, and binary URLs are blocked.",
		parameters: Type.Object({
			url: Type.String({ minLength: 1 }),
			max_chars: Type.Optional(Type.Integer({ minimum: 1000, maximum: 50000 })),
		}),
		async execute(_id, params, signal) {
			const result = await fetchReadable(
				params.url,
				params.max_chars ?? 20000,
				withTimeout(signal),
			);
			return {
				content: [
					{ type: "text", text: `Source: ${result.url}\n\n${result.text}` },
				],
				details: { url: result.url },
			};
		},
	});

	pi.registerTool({
		name: "web_image",
		label: "Web Image",
		description:
			"Fetch a public PNG, JPEG, GIF, or WebP URL and show it to the vision model. Private, local, credentialed, and oversized URLs are blocked.",
		parameters: Type.Object({
			url: Type.String({ minLength: 1 }),
		}),
		async execute(_id, params, signal) {
			const result = await fetchImage(params.url, withTimeout(signal));
			return {
				content: [
					{ type: "text", text: `Source: ${result.url}` },
					{ type: "image", data: result.data, mimeType: result.mimeType },
				],
				details: { url: result.url, mimeType: result.mimeType },
			};
		},
	});
}
