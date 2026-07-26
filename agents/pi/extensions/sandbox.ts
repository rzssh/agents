import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
	type BashOperations,
	createBashTool,
	type ExtensionAPI,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	canonical,
	configuredCachePaths,
	credentialEnvironmentKeys,
	deniedWritePath,
	expandPath,
	projectRootFor,
	protectedPath,
	protectedRoots,
	within,
	workspaceRoot,
} from "../lib/sandbox.ts";

interface RuntimeConfig {
	network: { deniedDomains: string[] };
	filesystem: {
		denyRead: string[];
		allowWrite: string[];
		denyWrite: string[];
		allowGitConfig: boolean;
	};
	credentials: {
		files: { path: string; mode: "deny" }[];
		envVars: { name: string; mode: "deny" }[];
	};
	bwrapPath: string;
	ripgrep: { command: string };
}

interface SandboxManager {
	initialize(config: RuntimeConfig): Promise<void>;
	wrapWithSandbox(
		command: string,
		binShell?: string,
		customConfig?: unknown,
		signal?: AbortSignal,
	): Promise<string>;
	updateConfig(config: RuntimeConfig): void;
	cleanupAfterCommand(): void;
	reset(): Promise<void>;
}

interface SandboxDirectories {
	root: string;
	runtime: string;
	temporary: string;
}

function requiredEnvironment(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not configured`);
	return value;
}

function sessionDirectories(): SandboxDirectories {
	const root = join(
		tmpdir(),
		`pi-sandbox-${process.getuid?.() ?? "user"}-${process.pid}`,
	);
	mkdirSync(root, { mode: 0o700, recursive: true });
	if (process.getuid && statSync(root).uid !== process.getuid())
		throw new Error(`Unsafe sandbox directory owner: ${root}`);
	chmodSync(root, 0o700);
	const runtime = join(root, `run-${process.pid}`);
	const temporary = join(root, `tmp-${process.pid}`);
	for (const path of [runtime, temporary]) {
		mkdirSync(path, { mode: 0o700, recursive: true });
	}
	return { root, runtime, temporary };
}

function sandboxEnvironment(
	env: NodeJS.ProcessEnv,
	directories: SandboxDirectories,
): NodeJS.ProcessEnv {
	return {
		...env,
		TMPDIR: directories.temporary,
		XDG_RUNTIME_DIR: directories.runtime,
	};
}

function terminate(child: ReturnType<typeof spawn>): void {
	if (!child.pid) return;
	try {
		process.kill(-child.pid, "SIGKILL");
	} catch {
		child.kill("SIGKILL");
	}
}

function createSandboxedBashOperations(
	manager: SandboxManager,
	directories: SandboxDirectories,
): BashOperations {
	return {
		async exec(command, cwd, { onData, signal, timeout, env }) {
			if (!existsSync(cwd))
				throw new Error(`Working directory does not exist: ${cwd}`);
			const wrapped = await manager.wrapWithSandbox(
				command,
				undefined,
				undefined,
				signal,
			);
			return new Promise((resolve, reject) => {
				const child = spawn("bash", ["-c", wrapped], {
					cwd,
					detached: true,
					env: sandboxEnvironment(env ?? process.env, directories),
					stdio: ["ignore", "pipe", "pipe"],
				});
				let timedOut = false;
				let timeoutHandle: NodeJS.Timeout | undefined;
				let finished = false;
				if (timeout !== undefined && timeout > 0) {
					timeoutHandle = setTimeout(() => {
						timedOut = true;
						terminate(child);
					}, timeout * 1000);
				}
				child.stdout?.on("data", onData);
				child.stderr?.on("data", onData);
				const finish = () => {
					if (finished) return false;
					finished = true;
					if (timeoutHandle) clearTimeout(timeoutHandle);
					signal?.removeEventListener("abort", onAbort);
					manager.cleanupAfterCommand();
					return true;
				};
				const onAbort = () => terminate(child);
				signal?.addEventListener("abort", onAbort, { once: true });
				child.on("error", (error) => {
					if (finish()) reject(error);
				});
				child.on("close", (code) => {
					if (!finish()) return;
					if (signal?.aborted) reject(new Error("aborted"));
					else if (timedOut) reject(new Error(`timeout:${timeout}`));
					else resolve({ exitCode: code });
				});
			});
		},
	};
}

export default async function sandbox(pi: ExtensionAPI) {
	const runtimePath = requiredEnvironment("PI_SANDBOX_RUNTIME_PATH");
	const { SandboxManager: manager } = (await import(
		pathToFileURL(runtimePath).href
	)) as { SandboxManager: SandboxManager };
	const cwd = canonical(process.cwd());
	const projectsRoot = canonical(requiredEnvironment("PI_PROJECTS_ROOT"));
	const credentials = protectedRoots();
	const directories = sessionDirectories();
	const cachePaths = configuredCachePaths();
	const writable = new Set<string>();
	const pending = new Map<string, Promise<boolean>>();
	let initialized = false;
	let currentRoot = workspaceRoot(cwd);

	const config = (): RuntimeConfig => ({
		network: { deniedDomains: [] },
		filesystem: {
			denyRead: credentials,
			allowWrite: [...writable, ...cachePaths, directories.root],
			denyWrite: credentials,
			allowGitConfig: false,
		},
		credentials: {
			files: credentials.map((path) => ({ path, mode: "deny" })),
			envVars: credentialEnvironmentKeys().map((name) => ({
				name,
				mode: "deny",
			})),
		},
		bwrapPath: requiredEnvironment("PI_SANDBOX_BWRAP_PATH"),
		ripgrep: { command: requiredEnvironment("PI_SANDBOX_RG_PATH") },
	});

	const setStatus = (ctx: ExtensionContext) => {
		ctx.ui.setStatus(
			"sandbox",
			`Sandbox: ${writable.size} writable project${writable.size === 1 ? "" : "s"}`,
		);
	};

	const addGrant = (root: string, ctx: ExtensionContext) => {
		writable.add(root);
		if (initialized) manager.updateConfig(config());
		setStatus(ctx);
	};

	const requestGrant = async (
		rawPath: string,
		ctx: ExtensionContext,
		confirm: boolean,
	) => {
		const target = canonical(expandPath(rawPath, ctx.cwd));
		const protectedReason = protectedPath(target, credentials);
		if (protectedReason) return { granted: false, reason: protectedReason };
		const deniedReason = deniedWritePath(target);
		if (deniedReason) return { granted: false, reason: deniedReason };
		const existingRoot = [...writable].find((root) => within(target, root));
		if (existingRoot) return { granted: true, root: existingRoot };
		const root = projectRootFor(target, projectsRoot);
		if (!root)
			return {
				granted: false,
				reason: `Write access can only be added for a project under ${projectsRoot}`,
			};
		if (!confirm) {
			addGrant(root, ctx);
			return { granted: true, root };
		}
		if (!ctx.hasUI)
			return { granted: false, reason: "Interactive approval unavailable" };
		let approval = pending.get(root);
		if (!approval) {
			approval = ctx.ui.confirm(
				"Sandbox write access",
				`Allow writes to ${root} for this Pi session?`,
			);
			pending.set(root, approval);
		}
		const approved = await approval.finally(() => pending.delete(root));
		if (!approved)
			return { granted: false, reason: `Write access denied: ${root}` };
		addGrant(root, ctx);
		return { granted: true, root };
	};

	const operations = createSandboxedBashOperations(manager, directories);
	const bash = createBashTool(cwd, { operations });
	pi.registerTool({
		...bash,
		label: "bash (sandboxed)",
		async execute(id, params, signal, onUpdate) {
			if (!initialized) throw new Error("Sandbox unavailable");
			return bash.execute(id, params, signal, onUpdate);
		},
	});

	pi.on("user_bash", () => {
		if (!initialized) throw new Error("Sandbox unavailable");
		return { operations };
	});

	pi.on("session_start", async (_event, ctx) => {
		if (initialized) await manager.reset();
		initialized = false;
		writable.clear();
		currentRoot = workspaceRoot(ctx.cwd);
		writable.add(currentRoot);
		await manager.initialize(config());
		initialized = true;
		setStatus(ctx);
	});

	pi.on("session_shutdown", async () => {
		if (!initialized) return;
		initialized = false;
		await manager.reset();
	});

	pi.on("tool_call", async (event, ctx) => {
		if (
			!["read", "write", "edit", "grep", "find", "ls"].includes(event.toolName)
		)
			return undefined;
		const input = event.input as { path?: unknown };
		const rawPath = typeof input.path === "string" ? input.path : ".";
		const target = canonical(expandPath(rawPath, ctx.cwd));
		const protectedReason = protectedPath(target, credentials);
		if (protectedReason) return { block: true, reason: protectedReason };
		if (!["write", "edit"].includes(event.toolName)) return undefined;
		const deniedReason = deniedWritePath(target);
		if (deniedReason) return { block: true, reason: deniedReason };
		const grant = await requestGrant(rawPath, ctx, true);
		return grant.granted ? undefined : { block: true, reason: grant.reason };
	});

	pi.registerTool({
		name: "sandbox_access",
		label: "Sandbox Access",
		description: `Request session-scoped write access to another existing project under ${projectsRoot}. Use before a bash command must modify a sibling project.`,
		promptSnippet: "Request write access to a sibling project",
		promptGuidelines: [
			`Before writing outside the current project, call sandbox_access with the exact sibling project path under ${projectsRoot} and wait for approval.`,
			"Do not request access for read-only cross-project inspection; all projects are already readable.",
		],
		parameters: Type.Object({ path: Type.String({ minLength: 1 }) }),
		executionMode: "sequential",
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const grant = await requestGrant(params.path, ctx, true);
			return {
				content: [
					{
						type: "text",
						text: grant.granted
							? `Write access granted for this session: ${grant.root}`
							: (grant.reason ?? "Write access denied"),
					},
				],
				details: grant,
			};
		},
	});

	pi.registerCommand("sandbox", {
		description:
			"Show or change session write grants: /sandbox [allow|revoke] <project>",
		handler: async (args, ctx) => {
			const [action, ...rest] = args.trim().split(/\s+/);
			if (!action) {
				ctx.ui.notify(
					[
						"Writable this session:",
						...[...writable].map((path) => `  ${path}`),
					].join("\n"),
					"info",
				);
				return;
			}
			const rawPath = rest.join(" ");
			if (!rawPath || !["allow", "revoke"].includes(action)) {
				ctx.ui.notify("Usage: /sandbox [allow|revoke] <project>", "warning");
				return;
			}
			if (action === "allow") {
				const grant = await requestGrant(rawPath, ctx, false);
				ctx.ui.notify(
					grant.granted
						? `Write access granted: ${grant.root}`
						: (grant.reason ?? "Write access denied"),
					grant.granted ? "info" : "error",
				);
				return;
			}
			const root = projectRootFor(
				canonical(expandPath(rawPath, ctx.cwd)),
				projectsRoot,
			);
			if (!root || root === currentRoot) {
				ctx.ui.notify(
					root === currentRoot
						? "Current project access cannot be revoked"
						: "Project not found",
					"error",
				);
				return;
			}
			writable.delete(root);
			if (initialized) manager.updateConfig(config());
			setStatus(ctx);
			ctx.ui.notify(`Write access revoked: ${root}`, "info");
		},
	});
}
