import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const tool = "ask_user_question";

export default function askUser(pi: ExtensionAPI) {
	pi.events.on("rpiv:ask-user:blocked", (data) => {
		const { active } = data as { active: boolean };
		pi.events.emit("herdr:blocked", { active, label: "question" });
	});

	if (!process.env.FM_PI_HARNESS) return;

	let registered = false;
	const hide = () => {
		const active = pi.getActiveTools();
		if (active.includes(tool))
			pi.setActiveTools(active.filter((name) => name !== tool));
	};

	pi.on("session_start", () => {
		hide();
		if (!registered) {
			pi.on("before_agent_start", hide);
			registered = true;
		}
	});

	pi.on("tool_call", (event) => {
		if (event.toolName === tool)
			return {
				block: true,
				reason:
					"FirstMate workers must report needs-decision to their parent instead of waiting for direct user input.",
			};
		return undefined;
	});
}
