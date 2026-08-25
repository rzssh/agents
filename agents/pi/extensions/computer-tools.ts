import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { withToolGroup } from "../lib/deferred-tools.ts";

const loader = "load_computer_use";
const tools = [
	"find_roots",
	"observe_ui",
	"search_ui",
	"expand_ui",
	"inspect_ui",
	"act_ui",
	"read_text",
	"wait_for",
	"launch_browser",
	"navigate_browser",
	"evaluate_browser",
] as const;

export default function computerTools(pi: ExtensionAPI) {
	const setEnabled = (enabled: boolean) => {
		const available = new Set(pi.getAllTools().map((tool) => tool.name));
		const registered = tools.filter((name) => available.has(name));
		pi.setActiveTools(
			withToolGroup(pi.getActiveTools(), loader, registered, enabled),
		);
		return registered;
	};

	pi.registerTool({
		name: loader,
		label: "Load Computer Use",
		description:
			"Activate rendered browser and desktop UI tools when direct interaction is required.",
		promptSnippet:
			"Load computer-use tools only when static fetching or shell access cannot complete the task",
		parameters: Type.Object({}),
		executionMode: "sequential",
		async execute() {
			const registered = setEnabled(true);
			return {
				content: [
					{
						type: "text",
						text: registered.length
							? `Activated ${registered.length} computer-use tools.`
							: "Computer-use tools are unavailable.",
					},
				],
				details: { tools: registered },
			};
		},
	});

	pi.on("session_start", () => {
		setEnabled(false);
	});

	pi.registerCommand("computer-tools", {
		description: "Show or change computer-use tools: /computer-tools [on|off]",
		handler: async (args, ctx) => {
			const action = args.trim();
			if (action === "on" || action === "off") {
				const registered = setEnabled(action === "on");
				ctx.ui.notify(
					registered.length
						? `Computer-use tools ${action === "on" ? "enabled" : "disabled"}`
						: "Computer-use tools are unavailable",
					registered.length ? "info" : "warning",
				);
				return;
			}
			if (action) {
				ctx.ui.notify("Usage: /computer-tools [on|off]", "warning");
				return;
			}
			const active = new Set(pi.getActiveTools());
			ctx.ui.notify(
				tools.some((name) => active.has(name))
					? "Computer-use tools enabled"
					: "Computer-use tools deferred",
				"info",
			);
		},
	});
}
