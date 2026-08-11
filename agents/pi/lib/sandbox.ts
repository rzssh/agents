import { existsSync, realpathSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export type SandboxMode = "strict" | "trusted";

export const TRUSTED_MODE_PHRASE = "TRUST";

export type SessionTrigger = "trust" | "untrust";

export function classifySessionTrigger(
	value: string | undefined,
): SessionTrigger | undefined {
	if (value === TRUSTED_MODE_PHRASE) return "trust";
	if (value === "UNTRUST") return "untrust";
	return undefined;
}

export function initialSandboxMode(
	env: NodeJS.ProcessEnv = process.env,
): SandboxMode {
	return env.PI_SANDBOX_START_MODE === "trusted" ? "trusted" : "strict";
}

export function hasFullHostAccess(mode: SandboxMode): boolean {
	return mode === "trusted";
}

export function trustedModePhraseMatches(value: string | undefined): boolean {
	return value === TRUSTED_MODE_PHRASE;
}

export function canonical(path: string): string {
	let cursor = resolve(path);
	const tail: string[] = [];
	while (!existsSync(cursor)) {
		const parent = dirname(cursor);
		if (parent === cursor) break;
		tail.unshift(relative(parent, cursor));
		cursor = parent;
	}
	return resolve(existsSync(cursor) ? realpathSync(cursor) : cursor, ...tail);
}

export function expandPath(
	path: string,
	cwd: string,
	home = process.env.HOME ?? cwd,
): string {
	const clean = path.startsWith("@") ? path.slice(1) : path;
	if (clean === "~") return home;
	if (clean.startsWith("~/")) return join(home, clean.slice(2));
	return resolve(cwd, clean);
}

export function within(path: string, root: string): boolean {
	return path === root || path.startsWith(`${root}${sep}`);
}

export function configuredCachePaths(
	env: NodeJS.ProcessEnv = process.env,
): string[] {
	if (!env.HOME) return [];
	const home = canonical(env.HOME);
	const paths = [env.XDG_CACHE_HOME, env.NPM_CONFIG_CACHE];
	if (env.CARGO_HOME) {
		paths.push(
			join(env.CARGO_HOME, "registry"),
			join(env.CARGO_HOME, "git"),
			join(env.CARGO_HOME, ".global-cache"),
			join(env.CARGO_HOME, ".package-cache"),
			join(env.CARGO_HOME, ".package-cache-mutate"),
		);
	}
	return paths
		.filter((path): path is string => Boolean(path))
		.map(canonical)
		.filter(
			(path, index, all) =>
				path !== home &&
				within(path, home) &&
				existsSync(path) &&
				all.indexOf(path) === index,
		);
}

function repositoryRoot(path: string, boundary?: string): string | undefined {
	let cursor =
		existsSync(path) && statSync(path).isDirectory() ? path : dirname(path);
	while (true) {
		if (existsSync(join(cursor, ".git")) || existsSync(join(cursor, ".jj")))
			return canonical(cursor);
		if (cursor === boundary) return undefined;
		const parent = dirname(cursor);
		if (parent === cursor || (boundary && !within(parent, boundary)))
			return undefined;
		cursor = parent;
	}
}

export function workspaceRoot(cwd: string): string {
	const root = canonical(cwd);
	return repositoryRoot(root) ?? root;
}

export function projectRootFor(
	path: string,
	projectsRoot: string,
): string | undefined {
	const target = canonical(path);
	const projects = canonical(projectsRoot);
	if (target === projects || !within(target, projects)) return undefined;
	const repository = repositoryRoot(target, projects);
	if (repository) return repository;
	const [first] = relative(projects, target).split(sep);
	const root = canonical(join(projects, first));
	return existsSync(root) && statSync(root).isDirectory() ? root : undefined;
}

export function protectedRoots(env: NodeJS.ProcessEnv = process.env): string[] {
	const home = env.HOME;
	const runtime = env.XDG_RUNTIME_DIR;
	const cargo = env.CARGO_HOME ?? (home ? join(home, ".cargo") : undefined);
	const data =
		env.XDG_DATA_HOME ?? (home ? join(home, ".local", "share") : undefined);
	const roots = [
		env.AI_PROFILES_DIR ??
			(home ? join(home, ".local", "share", "ai", "profiles") : undefined),
		env.SOPS_AGE_KEY_FILE,
		home ? join(home, ".config", "sops") : undefined,
		runtime ? join(runtime, "secrets.d") : undefined,
		home ? join(home, ".ssh") : undefined,
		home ? join(home, ".gnupg") : undefined,
		home ? join(home, ".aws") : undefined,
		env.GH_CONFIG_DIR ?? (home ? join(home, ".config", "gh") : undefined),
		home ? join(home, ".npmrc") : undefined,
		home ? join(home, ".netrc") : undefined,
		home ? join(home, ".docker", "config.json") : undefined,
		cargo ? join(cargo, "credentials") : undefined,
		cargo ? join(cargo, "credentials.toml") : undefined,
		home ? join(home, ".claude", ".credentials.json") : undefined,
		home ? join(home, ".codex", "auth.json") : undefined,
		home ? join(home, ".hermes", "auth.json") : undefined,
		data ? join(data, "opencode", "auth.json") : undefined,
		env.PI_CODING_AGENT_DIR
			? join(env.PI_CODING_AGENT_DIR, "auth.json")
			: home
				? join(home, ".pi", "agent", "auth.json")
				: undefined,
	]
		.filter((path): path is string => Boolean(path))
		.map(canonical)
		.filter((path, index, all) => all.indexOf(path) === index)
		.sort((left, right) => left.length - right.length);
	return roots.filter(
		(path, index) => !roots.slice(0, index).some((root) => within(path, root)),
	);
}

export function protectedPath(
	path: string,
	roots: string[],
): string | undefined {
	const root = roots.find(
		(candidate) => within(path, candidate) || within(candidate, path),
	);
	return root ? `Protected credential path: ${root}` : undefined;
}

export function deniedWritePath(path: string): string | undefined {
	const parts = path.split(sep).filter(Boolean);
	const leaf = parts.at(-1);
	if (
		leaf &&
		[
			".gitconfig",
			".gitmodules",
			".bashrc",
			".bash_profile",
			".zshrc",
			".zprofile",
			".profile",
			".ripgreprc",
			".mcp.json",
		].includes(leaf)
	) {
		return `Protected executable configuration: ${path}`;
	}
	for (let index = 0; index < parts.length; index += 1) {
		if ([".vscode", ".idea"].includes(parts[index]))
			return `Protected editor configuration: ${path}`;
		if (
			parts[index] === ".git" &&
			["hooks", "config"].includes(parts[index + 1])
		) {
			return `Protected Git configuration: ${path}`;
		}
		if (
			parts[index] === ".claude" &&
			["commands", "agents"].includes(parts[index + 1])
		) {
			return `Protected agent configuration: ${path}`;
		}
	}
	return undefined;
}

export function credentialEnvironmentKeys(
	env: NodeJS.ProcessEnv = process.env,
): string[] {
	const profileKeys = (env.AI_PROFILE_KEYS ?? "").split(",").filter(Boolean);
	const secretPattern =
		/(?:API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIALS|PRIVATE_KEY)$/;
	const keys = Object.keys(env).filter((key) => secretPattern.test(key));
	return [
		...new Set([
			...profileKeys,
			...keys,
			"AI_PROFILE_KEYS",
			"SSH_AUTH_SOCK",
			"GPG_AGENT_INFO",
		]),
	];
}
