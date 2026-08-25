import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { userMessagesSinceName, words } from "../lib/session-name.ts";

const tool = "set_session_name";
const refreshAfter = 5;

function cleanName(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

export default function sessionName(pi: ExtensionAPI) {
	const reconcile = (ctx: ExtensionContext) => {
		const active = pi.getActiveTools().filter((name) => name !== tool);
		const due =
			!pi.getSessionName() ||
			(!process.env.FM_PI_HARNESS &&
				userMessagesSinceName(ctx.sessionManager.getEntries()) >= refreshAfter);
		if (due) active.push(tool);
		pi.setActiveTools(active);
	};

	pi.registerTool({
		name: tool,
		label: "Name Session",
		description:
			"Set a concise 6-8 word name summarizing the session's main completed and current work.",
		promptSnippet: "Refresh this session's concise summary name",
		promptGuidelines: [
			"When set_session_name is available, call it before finishing with exactly 6-8 words summarizing the session's main completed and current work, not its latest micro-step.",
		],
		parameters: Type.Object({
			name: Type.String({ minLength: 1, maxLength: 80 }),
		}),
		executionMode: "sequential",
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const name = cleanName(params.name);
			const length = words(name);
			if (length < 6 || length > 8)
				throw new Error("Session name must contain 6-8 words");
			pi.setSessionName(name);
			reconcile(ctx);
			return {
				content: [{ type: "text", text: `Session named: ${name}` }],
				details: { name },
			};
		},
	});

	pi.on("session_start", (_event, ctx) => reconcile(ctx));
	pi.on("before_agent_start", (_event, ctx) => reconcile(ctx));
}
