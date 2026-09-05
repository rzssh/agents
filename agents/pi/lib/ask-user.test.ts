import assert from "node:assert/strict";
import test from "node:test";
import askUser from "../extensions/ask-user.ts";

test("reports ask-user waits to Herdr", () => {
	const handlers = new Map<string, (data: unknown) => void>();
	let reported: unknown;
	askUser({
		events: {
			on: (event: string, handler: (data: unknown) => void) => {
				handlers.set(event, handler);
			},
			emit: (event: string, data: unknown) => {
				if (event === "herdr:blocked") reported = data;
			},
		},
	} as never);

	handlers.get("rpiv:ask-user:blocked")?.({ active: true });
	assert.deepEqual(reported, { active: true, label: "question" });
});

test("keeps ask-user hidden after package reconciliation in FirstMate workers", async () => {
	const previous = process.env.FM_PI_HARNESS;
	process.env.FM_PI_HARNESS = "pi";
	const handlers = new Map<
		string,
		Array<(event: { toolName?: string }) => unknown>
	>();
	let active = ["read", "ask_user_question"];
	const pi = {
		events: { on: () => {}, emit: () => {} },
		getActiveTools: () => active,
		setActiveTools: (tools: string[]) => {
			active = tools;
		},
		on: (
			event: string,
			handler: (payload: { toolName?: string }) => unknown,
		) => {
			handlers.set(event, [...(handlers.get(event) ?? []), handler]);
		},
	};
	try {
		askUser(pi as never);
		handlers.set("before_agent_start", [
			() => {
				active = [...active, "ask_user_question"];
			},
		]);
		for (const handler of handlers.get("session_start") ?? []) handler({});
		for (const handler of handlers.get("before_agent_start") ?? []) handler({});
		assert.deepEqual(active, ["read"]);
		const result = await handlers.get("tool_call")?.[0]?.({
			toolName: "ask_user_question",
		});
		assert.equal((result as { block?: boolean }).block, true);
	} finally {
		if (previous === undefined) delete process.env.FM_PI_HARNESS;
		else process.env.FM_PI_HARNESS = previous;
	}
});
