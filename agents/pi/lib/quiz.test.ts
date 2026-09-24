import assert from "node:assert/strict";
import test from "node:test";
import { prepareQuiz } from "./quiz.ts";

test("tracks the correct answer after shuffling", () => {
	const quiz = prepareQuiz(
		[
			{ label: "Alpha", value: "a" },
			{ label: "Beta", value: "b" },
			{ label: "Gamma", value: "c" },
		],
		"c",
		true,
		() => 0,
	);

	assert.deepEqual(
		quiz.options.map((option) => option.value),
		["b", "c", "a"],
	);
	assert.equal(quiz.correctIndex, 1);
});

test("uses labels as default values", () => {
	const quiz = prepareQuiz(
		[{ label: " Alpha " }, { label: "Beta" }],
		"Alpha",
		false,
	);

	assert.equal(quiz.options[0].value, "Alpha");
	assert.equal(quiz.correctIndex, 0);
});

test("rejects ambiguous or missing answers", () => {
	assert.throws(
		() =>
			prepareQuiz(
				[
					{ label: "Alpha", value: "same" },
					{ label: "Beta", value: "same" },
				],
				"same",
			),
		/duplicate quiz value/,
	);
	assert.throws(
		() => prepareQuiz([{ label: "Alpha" }, { label: "Beta" }], "Gamma"),
		/correctAnswer must match/,
	);
});
