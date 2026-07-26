import { existsSync, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { homedir } from "node:os";

function canonical(path) {
  let cursor = path;
  const tail = [];
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) break;
    tail.unshift(cursor.slice(parent.length + 1));
    cursor = parent;
  }
  return resolve(existsSync(cursor) ? realpathSync(cursor) : cursor, ...tail);
}

function expand(path, cwd) {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return resolve(cwd, path);
}

function within(path, root) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function protectedRoots() {
  const home = homedir();
  const data = process.env.XDG_DATA_HOME ?? join(home, ".local", "share");
  const runtime = process.env.XDG_RUNTIME_DIR;
  return [
    process.env.AI_PROFILES_DIR,
    join(home, ".local", "share", "ai", "profiles"),
    join(home, ".config", "sops"),
    runtime ? join(runtime, "secrets.d") : undefined,
    join(process.env.CLAUDE_CONFIG_DIR ?? join(home, ".claude"), ".credentials.json"),
    join(process.env.CODEX_HOME ?? join(home, ".codex"), "auth.json"),
    join(process.env.GH_CONFIG_DIR ?? join(home, ".config", "gh"), "hosts.yml"),
    join(process.env.HERMES_HOME ?? join(home, ".hermes"), "auth.json"),
    join(process.env.PI_CODING_AGENT_DIR ?? join(home, ".pi", "agent"), "auth.json"),
    join(data, "opencode", "auth.json"),
    join(home, ".git-credentials"),
    join(home, ".netrc"),
  ].filter(Boolean).map(canonical);
}

function profileKeys(env) {
  return new Set(`${process.env.AI_PROFILE_KEYS ?? ""},${env.AI_PROFILE_KEYS ?? ""}`.split(",").filter(Boolean));
}

export const ProfileProtection = async () => ({
  "shell.env": async (_input, output) => {
    for (const key of profileKeys(output.env)) delete output.env[key];
    delete output.env.AI_PROFILE_KEYS;
  },
  "tool.execute.before": async (input, output) => {
    if (!["read", "grep", "glob", "list"].includes(input.tool)) return;
    const cwd = process.cwd();
    const roots = protectedRoots();
    for (const key of ["filePath", "path", "directory"]) {
      const value = output.args[key];
      if (typeof value !== "string") continue;
      const target = canonical(expand(value, cwd));
      if (roots.some((root) => within(target, root))) throw new Error(`Protected path: ${value}`);
    }
  },
});
