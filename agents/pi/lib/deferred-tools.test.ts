import assert from "node:assert/strict";
import test from "node:test";
import { withToolGroup } from "./deferred-tools.ts";

const tools = ["observe_ui", "act_ui"];

test("hides deferred tools and keeps the loader", () => {
	assert.deepEqual(
		withToolGroup(["read", ...tools], "load_computer_use", tools, false),
		["read", "load_computer_use"],
	);
});

test("enables deferred tools without duplicates", () => {
	assert.deepEqual(
		withToolGroup(
			["read", "load_computer_use", "observe_ui"],
			"load_computer_use",
			tools,
			true,
		),
		["read", "load_computer_use", "observe_ui", "act_ui"],
	);
});
