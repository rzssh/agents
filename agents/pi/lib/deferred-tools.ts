export function withToolGroup(
	active: string[],
	loader: string,
	tools: readonly string[],
	enabled: boolean,
): string[] {
	const hidden = new Set(tools);
	const next = active.filter((name) => !hidden.has(name));
	if (!next.includes(loader)) next.push(loader);
	if (enabled) {
		for (const name of tools) {
			if (!next.includes(name)) next.push(name);
		}
	}
	return next;
}
