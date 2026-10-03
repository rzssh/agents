import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type {
	Api,
	AssistantMessage,
	Message,
	Model,
} from "@earendil-works/pi-ai";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

const HANDOFF_PROMPT = `Create a self-contained handoff for another model to continue this exact task in a new session.

Include only durable, actionable context:
- the user's current goal and preferences
- decisions already made and rejected alternatives
- relevant files, code changes, commands, and repository state
- verified results, failures, and unresolved problems
- the precise next action

Preserve important technical details and explicit constraints. Do not call tools, continue the task, add a preamble, or discuss this request. Output only the handoff.`;

type PendingHandoff = {
	sessionId: string;
	target: Model<Api>;
	summary?: string;
	completing: boolean;
};

function sanitize(
	message: AgentMessage,
	provider: string,
	api: string,
	model: string,
): AgentMessage {
	if (
		message.role !== "assistant" ||
		(message.provider === provider &&
			message.api === api &&
			message.model === model)
	) {
		return message;
	}

	const content = message.content.map((block) => {
		if (block.type === "thinking") {
			const { thinkingSignature: _, ...portable } = block;
			return portable;
		}
		if (block.type === "text") {
			const { textSignature: _, ...portable } = block;
			return portable;
		}
		const { thoughtSignature: _, ...portable } = block;
		return portable;
	}) as AssistantMessage["content"];

	return { ...message, content, responseId: undefined, deferred: undefined };
}

function assistantText(messages: AgentMessage[]): string | undefined {
	const message = messages.findLast(
		(candidate): candidate is AssistantMessage =>
			candidate.role === "assistant",
	);
	if (
		!message ||
		message.stopReason === "error" ||
		message.stopReason === "aborted"
	)
		return;

	const text = message.content
		.filter(
			(block): block is { type: "text"; text: string } => block.type === "text",
		)
		.map((block) => block.text)
		.join("\n")
		.trim();

	return text || undefined;
}

function availableModels(ctx: ExtensionCommandContext): Model<Api>[] {
	const models = ctx.scopedModels.length
		? ctx.scopedModels.map(({ model }) => model)
		: ctx.modelRegistry.getAvailable();
	return models.filter(
		(model, index) =>
			models.findIndex(
				(candidate) =>
					candidate.provider === model.provider && candidate.id === model.id,
			) === index,
	);
}

async function selectTarget(
	args: string,
	ctx: ExtensionCommandContext,
): Promise<Model<Api> | undefined> {
	const models = availableModels(ctx);
	const requested = args.trim();
	if (requested) {
		const matches = models.filter(
			(model) =>
				requested === model.id || requested === `${model.provider}/${model.id}`,
		);
		if (matches.length === 1) return matches[0];
		ctx.ui.notify(
			matches.length
				? `Ambiguous model: ${requested}`
				: `Unknown model: ${requested}`,
			"error",
		);
		return;
	}

	const labels = models.map((model) => `${model.provider}/${model.id}`);
	const selected = await ctx.ui.select("Switch model with handoff", labels);
	return selected ? models[labels.indexOf(selected)] : undefined;
}

async function openHandoffSession(
	pending: PendingHandoff,
	ctx: ExtensionCommandContext,
): Promise<void> {
	if (!pending.summary) return;
	const edited = await ctx.ui.editor("Review model handoff", pending.summary);
	if (edited === undefined) return;

	const parentSession = ctx.sessionManager.getSessionFile();
	const target = pending.target;
	const userMessage: Message = {
		role: "user",
		content: [{ type: "text", text: edited }],
		timestamp: Date.now(),
	};

	await ctx.newSession({
		parentSession,
		setup: async (sessionManager) => {
			sessionManager.appendModelChange(target.provider, target.id);
			sessionManager.appendMessage(userMessage);
		},
		withSession: async (replacementCtx) => {
			const sessionFile = replacementCtx.sessionManager.getSessionFile();
			if (!sessionFile) throw new Error("Handoff session was not persisted");
			await replacementCtx.switchSession(sessionFile, {
				withSession: async (targetCtx) => {
					await targetCtx.sendUserMessage("Continue from the handoff above.");
				},
			});
		},
	});
}

export default function (pi: ExtensionAPI) {
	let pending: PendingHandoff | undefined;

	pi.on("context", (event, ctx) => {
		const model = ctx.model;
		if (!model) return;

		return {
			messages: event.messages.map((message) =>
				sanitize(message, model.provider, model.api, model.id),
			),
		};
	});

	pi.on("agent_end", (event, ctx) => {
		if (!pending || pending.sessionId !== ctx.sessionManager.getSessionId())
			return;
		const summary = assistantText(event.messages);
		if (summary) pending.summary = summary;
	});

	pi.on("agent_settled", (_event, ctx) => {
		if (!pending || pending.sessionId !== ctx.sessionManager.getSessionId())
			return;
		if (!pending.summary) {
			pending = undefined;
			ctx.ui.notify("Model handoff generation failed", "error");
			return;
		}
		if (pending.completing) return;

		pending.completing = true;
		pi.sendUserMessage("/switch-model", { expandPromptTemplates: true });
	});

	pi.registerCommand("switch-model", {
		description: "Switch models through a reviewed context handoff",
		handler: async (args, ctx) => {
			if (pending?.summary && pending.completing) {
				const current = pending;
				pending = undefined;
				await openHandoffSession(current, ctx);
				return;
			}
			if (pending) {
				ctx.ui.notify("A model handoff is already running", "warning");
				return;
			}
			if (!ctx.model) {
				ctx.ui.notify("No model selected", "error");
				return;
			}

			const target = await selectTarget(args, ctx);
			if (!target) return;
			if (
				target.provider === ctx.model.provider &&
				target.id === ctx.model.id
			) {
				ctx.ui.notify(`${target.id} is already selected`, "info");
				return;
			}

			pending = {
				sessionId: ctx.sessionManager.getSessionId(),
				target,
				completing: false,
			};
			pi.sendUserMessage(HANDOFF_PROMPT);
		},
	});
}
