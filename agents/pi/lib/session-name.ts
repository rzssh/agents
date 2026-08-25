interface SessionEntry {
	type: string;
	message?: { role?: string };
}

export function words(value: string): number {
	return value.trim().split(/\s+/).filter(Boolean).length;
}

export function userMessagesSinceName(entries: SessionEntry[]): number {
	let count = 0;
	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index];
		if (entry?.type === "session_info") break;
		if (entry?.type === "message" && entry.message?.role === "user") count++;
	}
	return count;
}
