import assert from "node:assert/strict";
import test from "node:test";
import { userMessagesSinceName, words } from "./session-name.ts";

test("counts words in a session name", () => {
	assert.equal(words("Add lazy tools and session naming"), 6);
});

test("counts user messages after the latest session name", () => {
	assert.equal(
		userMessagesSinceName([
			{ type: "message", message: { role: "user" } },
			{ type: "session_info" },
			{ type: "message", message: { role: "assistant" } },
			{ type: "message", message: { role: "user" } },
			{ type: "message", message: { role: "user" } },
		]),
		2,
	);
});
