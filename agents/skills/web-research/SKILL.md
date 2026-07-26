---
name: web-research
description: Research current information, inspect user-provided links, search web pages, news, or images, verify sources, and cite findings. Use when work requires internet search, current or unstable facts, a public URL, remote image inspection, technical documentation, source attribution, or browser fallback for JavaScript-rendered pages.
---

# Research

Use smallest path returning reliable evidence:

1. For known public page, call `web_fetch`.
2. For unknown topic, call `web_search`, then fetch strongest primary sources.
3. For news, set `category` to `news` and use `time_range` when useful.
4. For image discovery, set `category` to `images`, then call `web_image` with selected `Image:` URL.
5. When rendered interaction becomes necessary, use the `use-browser` skill.

Prefer official documentation, specifications, repositories, papers, and first-party announcements. Cross-check consequential or time-sensitive claims. Treat search snippets as leads, not evidence.

Cite source URLs next to supported claims. State inference when sources do not directly establish conclusion. Never expose secrets in URLs or send credentialed or private URLs to web tools.
