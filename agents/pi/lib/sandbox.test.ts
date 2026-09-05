import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	configuredCachePaths,
	credentialEnvironmentKeys,
	deniedWritePath,
	hasFullHostAccess,
	initialSandboxMode,
	projectRootFor,
	protectedPath,
	protectedRoots,
	sandboxGitExcludePatterns,
	withHerdrBlocked,
	withSandboxGitExclude,
	workspaceRoot,
} from "./sandbox.ts";

test("reports sandbox approval waits to Herdr", async () => {
	const events: unknown[] = [];
	await assert.rejects(
		withHerdrBlocked(
			{ emit: (event: string, data: unknown) => events.push([event, data]) },
			"sandbox access",
			async () => {
				throw new Error("denied");
			},
		),
		/denied/,
	);
	assert.deepEqual(events, [
		["herdr:blocked", { active: true, label: "sandbox access" }],
		["herdr:blocked", { active: false, label: "sandbox access" }],
	]);
});

test("launch policy selects sandbox mode", () => {
	assert.equal(initialSandboxMode({}), "strict");
	assert.equal(
		initialSandboxMode({ PI_SANDBOX_START_MODE: "trusted" }),
		"trusted",
	);
	assert.equal(
		initialSandboxMode({ PI_SANDBOX_START_MODE: "other" }),
		"strict",
	);
	assert.equal(hasFullHostAccess("strict"), false);
	assert.equal(hasFullHostAccess("trusted"), true);
});

test("finds workspace and sibling project roots", (context) => {
	const root = mkdtempSync(join(tmpdir(), "pi-sandbox-policy-"));
	context.after(() => rmSync(root, { force: true, recursive: true }));
	const projects = join(root, "projects");
	const current = join(projects, "current");
	const sibling = join(projects, "sibling");
	mkdirSync(join(current, ".git"), { recursive: true });
	mkdirSync(join(sibling, ".git"), { recursive: true });
	mkdirSync(join(current, "src"));
	mkdirSync(join(sibling, "src"));
	assert.equal(workspaceRoot(join(current, "src")), current);
	assert.equal(
		projectRootFor(join(sibling, "src", "new.ts"), projects),
		sibling,
	);
	assert.equal(projectRootFor(join(root, "outside"), projects), undefined);
});

test("protects credentials and executable configuration", () => {
	assert.match(
		protectedPath("/home/user/.ssh/id_ed25519", ["/home/user/.ssh"]) ?? "",
		/credential/,
	);
	assert.match(
		protectedPath("/home/user", ["/home/user/.ssh"]) ?? "",
		/credential/,
	);
	assert.match(
		deniedWritePath("/work/repo/.git/hooks/pre-commit") ?? "",
		/Git/,
	);
	assert.match(deniedWritePath("/work/repo/.mcp.json") ?? "", /executable/);
	assert.ok(
		protectedRoots({
			HOME: "/home/user",
			CARGO_HOME: "/home/user/.cargo",
		}).includes("/home/user/.cargo/credentials.toml"),
	);
	assert.deepEqual(
		credentialEnvironmentKeys({
			AI_PROFILE_KEYS: "OPENAI_API_KEY,CUSTOM",
			GH_TOKEN: "secret",
			PATH: "/bin",
		}),
		[
			"OPENAI_API_KEY",
			"CUSTOM",
			"GH_TOKEN",
			"AI_PROFILE_KEYS",
			"SSH_AUTH_SOCK",
			"GPG_AGENT_INFO",
		],
	);
});

test("hides sandbox mount points from git status", () => {
	const patterns = sandboxGitExcludePatterns("__pycache__/\n");
	assert.match(patterns, /^__pycache__\//);
	assert.match(patterns, /\*\*\/\.bashrc/);
	assert.match(patterns, /\*\*\/\.claude\/commands/);
	assert.match(patterns, /\*\*\/\.idea/);
	assert.deepEqual(
		withSandboxGitExclude(
			{
				GIT_CONFIG_COUNT: "1",
				GIT_CONFIG_KEY_0: "safe.directory",
				GIT_CONFIG_VALUE_0: "/work",
			},
			"/tmp/git-exclude",
		),
		{
			GIT_CONFIG_COUNT: "2",
			GIT_CONFIG_KEY_0: "safe.directory",
			GIT_CONFIG_VALUE_0: "/work",
			GIT_CONFIG_KEY_1: "core.excludesFile",
			GIT_CONFIG_VALUE_1: "/tmp/git-exclude",
		},
	);
});

test("uses configured cache paths without inventing environment values", (context) => {
	const home = mkdtempSync(join(tmpdir(), "pi-sandbox-cache-"));
	context.after(() => rmSync(home, { force: true, recursive: true }));
	const xdg = join(home, ".cache");
	const npm = join(home, ".npm");
	const cargo = join(home, ".cargo");
	for (const path of [
		xdg,
		npm,
		join(cargo, "registry"),
		join(cargo, ".package-cache"),
	]) {
		mkdirSync(path, { recursive: true });
	}
	assert.deepEqual(
		configuredCachePaths({
			HOME: home,
			XDG_CACHE_HOME: xdg,
			NPM_CONFIG_CACHE: npm,
			CARGO_HOME: cargo,
		}),
		[xdg, npm, join(cargo, "registry"), join(cargo, ".package-cache")],
	);
});
