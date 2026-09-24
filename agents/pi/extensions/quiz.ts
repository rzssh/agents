import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { prepareQuiz } from "../lib/quiz.ts";

const tool = "quiz";
const unknown = "I don't know";

type QuizStatus = "answered" | "cancelled";

interface QuizDetails {
	status: QuizStatus;
	question: string;
	selected?: string;
	correctAnswer?: string;
	correct?: boolean;
	dontKnow?: boolean;
	explanation?: string;
}

const OptionSchema = Type.Object({
	label: Type.String({ minLength: 1, description: "Displayed answer" }),
	value: Type.Optional(
		Type.String({
			minLength: 1,
			description: "Stable answer value; defaults to label",
		}),
	),
	description: Type.Optional(
		Type.String({ minLength: 1, description: "Optional displayed detail" }),
	),
});

const QuizSchema = Type.Object({
	question: Type.String({ minLength: 1, description: "Question to ask" }),
	details: Type.Optional(
		Type.String({ minLength: 1, description: "Optional question context" }),
	),
	options: Type.Array(OptionSchema, {
		minItems: 2,
		maxItems: 6,
		description: "Possible answers",
	}),
	correctAnswer: Type.String({
		minLength: 1,
		description: "Value of the correct option",
	}),
	explanation: Type.String({
		minLength: 1,
		description: "Explanation revealed after answering",
	}),
	shuffle: Type.Optional(
		Type.Boolean({ description: "Shuffle options; defaults to true" }),
	),
});

function displayOption(
	option: { label: string; description?: string },
	index: number,
): string {
	const label = `${index + 1}. ${option.label}`;
	return option.description ? `${label} — ${option.description}` : label;
}

export default function quiz(pi: ExtensionAPI) {
	const reconcile = (ctx: ExtensionContext) => {
		const active = pi.getActiveTools().filter((name) => name !== tool);
		if (ctx.hasUI && !process.env.FM_PI_HARNESS) active.push(tool);
		pi.setActiveTools(active);
	};

	pi.registerTool({
		name: tool,
		label: "Quiz",
		description:
			"Ask one optional graded multiple-choice question, wait for the user's answer, and reveal concise feedback. Use only during an explicit learning interaction when a knowledge check would help. Never use for preferences, requirements, or ordinary coding work.",
		promptSnippet:
			"Optionally test understanding with one graded multiple-choice question",
		promptGuidelines: [
			"Use quiz only during explicit learning interactions, and only when a brief knowledge check adds value; never quiz the user by default.",
			"Use quiz for questions with one objectively correct answer. Use ask_user_question for preferences, requirements, and decisions.",
			"Keep quiz options parallel and concise, with plausible but unambiguously wrong distractors. Never reveal the answer before the user responds.",
			"Never call quiz alongside another interactive tool in the same turn.",
		],
		parameters: QuizSchema,
		executionMode: "sequential",
		async execute(_id, params, signal, _onUpdate, ctx) {
			if (!ctx.hasUI || process.env.FM_PI_HARNESS)
				throw new Error("quiz requires an interactive main session");

			const prepared = prepareQuiz(
				params.options,
				params.correctAnswer,
				params.shuffle !== false,
			);
			const choices = prepared.options.map(displayOption);
			choices.push(`${choices.length + 1}. ${unknown}`);
			const title = params.details
				? `${params.question}\n\n${params.details}`
				: params.question;
			const choice = await ctx.ui.select(title, choices, { signal });

			if (choice === undefined) {
				return {
					content: [
						{ type: "text" as const, text: "User cancelled the quiz." },
					],
					details: {
						status: "cancelled",
						question: params.question,
					} satisfies QuizDetails,
				};
			}

			const selectedIndex = choices.indexOf(choice);
			const dontKnow = selectedIndex === prepared.options.length;
			const correct = !dontKnow && selectedIndex === prepared.correctIndex;
			const selected = dontKnow
				? unknown
				: prepared.options[selectedIndex].label;
			const correctAnswer = prepared.options[prepared.correctIndex].label;
			const verdict = dontKnow
				? `User selected "${unknown}".`
				: `User answered ${correct ? "correctly" : "incorrectly"}.`;
			ctx.ui.notify(
				correct ? "Correct" : `Correct answer: ${correctAnswer}`,
				correct ? "info" : "warning",
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `${verdict}\nSelected: ${selected}\nCorrect: ${correctAnswer}\nExplanation: ${params.explanation}`,
					},
				],
				details: {
					status: "answered",
					question: params.question,
					selected,
					correctAnswer,
					correct,
					dontKnow,
					explanation: params.explanation,
				} satisfies QuizDetails,
			};
		},
		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("quiz ")) +
					theme.fg("muted", args.question),
				0,
				0,
			);
		},
		renderResult(result, _options, theme) {
			const details = result.details as QuizDetails | undefined;
			if (!details) {
				const content = result.content[0];
				return new Text(content?.type === "text" ? content.text : "", 0, 0);
			}
			if (details.status === "cancelled")
				return new Text(theme.fg("warning", "Quiz cancelled"), 0, 0);

			const verdict = details.dontKnow
				? theme.fg("warning", unknown)
				: details.correct
					? theme.fg("success", "✓ Correct")
					: theme.fg("error", "✗ Incorrect");
			const answer = details.correct
				? ""
				: `\n${theme.fg("muted", `Correct: ${details.correctAnswer}`)}`;
			const explanation = details.explanation
				? `\n${theme.fg("muted", details.explanation)}`
				: "";
			return new Text(`${verdict}${answer}${explanation}`, 0, 0);
		},
	});

	pi.on("session_start", (_event, ctx) => reconcile(ctx));
	pi.on("before_agent_start", (_event, ctx) => reconcile(ctx));
}
