# Pi extension audit

Snapshot: 2026-08-10

## Outcome

Install nothing from the Reddit list now.

Current setup already has narrower owners for orchestration, web access, browser control, validation, safety, task state, and communication. Adding overlapping extensions would create competing tools, duplicate state, more prompt surface, and harder failure diagnosis.

Useful candidates remain conditional:

1. Voice dictation when a package supports current Pi and a local Nix-managed backend. `@senad-d/micme` is attractive for reflective writing, but its documented Pi range is `>=0.80.7 <0.81.0`; current runtime is 0.84.1.
2. DAP only when a real debugging task needs breakpoints that logs and tests cannot provide.
3. Codex remote compaction only after native Pi 0.84.1 compaction shows a measured continuity or latency problem.
4. FFF only after repository search is measurably slow. Current `rg`, `fd`, bounded tools, and indexed editor navigation are sufficient.

The useful immediate upgrade was Pi itself from 0.82.1 to 0.84.1, not another extension layer.

## Existing owners

- Fleet orchestration: FirstMate, Herdr, `delegate-work`, and `herdr-agent-comms`.
- Web and browser: local SearXNG tools, `web-research`, CDP browser tools, and `pi-computer-use`.
- Validation and review: no-mistakes, crit, repository checks, and isolated workers.
- Safety: profile-isolated credentials plus the local strict/trusted sandbox extension.
- Durable tasks: FirstMate backlog, tasks-axi, repository roadmaps, and Babysitter for explicit process runs.
- Style and learning: caveman, ponytail, and `teach-code`.

## Item-by-item review

| Item | What it provides | Decision | Reason |
|---|---|---|---|
| [`@ff-labs/pi-fff`](https://github.com/dmtrKovalenko/fff/tree/main/packages/pi-fff) | Native fuzzy `find`/`grep`, indexing, frecency | Defer | Good implementation, but current search is not a bottleneck. It also stores cross-session search history and adds three overlapping tools. |
| [`@juicesharp/rpiv-ask-user-question`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-ask-user-question) | Structured questionnaires | Reject | Current unattended posture deliberately minimizes questions; extension would fight that policy. |
| [`@juicesharp/rpiv-todo`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-todo) | Persistent todo overlay | Reject | FirstMate, tasks-axi, roadmaps, and Babysitter already own task state. |
| [`@juicesharp/rpiv-web-tools`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-web-tools) | Multi-provider search/fetch | Reject | Duplicates local SearXNG/fetch/image tools and `web-research`. |
| [`context-mode`](https://github.com/mksglu/context-mode) | MCP execution, FTS knowledge base, context reduction | Reject | Large second context subsystem with sandboxed execution and persistence. Native compaction plus scoped docs is simpler. |
| [`pi-mcp-adapter`](https://github.com/nicobailon/pi-mcp-adapter) | General MCP bridge | Defer | Add only for one MCP-only capability. Current browser/web/GitHub tools are native. |
| [`pi-powerline-footer`](https://github.com/nicobailon/pi-powerline-footer) | Rich footer | Reject | Herdr and current Pi footer already show model, context, cost, git, and trusted-mode state. |
| [`pi-rtk-optimizer`](https://github.com/MasuRii/pi-rtk-optimizer) | Command rewriting and output compaction | Reject | Tool outputs are already bounded. Rewriting commands obscures exact validation evidence. |
| [`pi-subagents`](https://github.com/nicobailon/pi-subagents) | Delegation, workflows, background fleet | Reject | Strong package, but directly duplicates FirstMate and Herdr. Reddit reports also mention recent stuck/broken workers and disruptive workflow changes. |
| `grill-me` | Socratic questioning skill | Reject | `teach-code` already owns retrieval, prediction, quizzes, and transfer. |
| `karpathy-guidelines` | Minimal coding guidance | Reject | Ponytail and repository AGENTS files already enforce simpler, evidence-backed code. |
| `last30days` | Recent web research skill | Reject | `web-research` already supports current search, sources, news, and time windows. |
| `caveman` | Terse prose and commit/review skills | Keep | Already installed and governed by durable global instructions. |
| [`@juanbenjumea/pi-dynamic-footer`](https://github.com/juanbenjumea/dotfiles) | Context, TPS, cost, quota, git footer | Reject | Duplicates Herdr footer and quota-axi; more polling and UI without missing information. |
| [`@ogulcancelik/pi-ghostty-theme-sync`](https://github.com/ogulcancelik/pi-extensions) | Ghostty color synchronization | Defer | Harmless cosmetic option, but no workflow benefit. Trial only after a visual regression check. |
| [`@mobrienv/pi-tidy-tools`](https://github.com/mikeyobrien/pi-tidy-tools) | Compact tool rendering | Reject | Current tool API already truncates and pages output deterministically. |
| [`pi-next-cue`](https://github.com/ouzhenkun/pi-next-cue) | Predicts next user prompt | Reject | Adds inference, UI noise, and accidental-send risk; user intent should not be guessed. |
| [`@ogulcancelik/pi-codex-compaction`](https://github.com/ogulcancelik/pi-extensions) | Native Codex remote compaction | Defer | Compatible with current Pi, but native 0.84.1 compaction should be measured first. |
| [`pi-eta`](https://github.com/alasano/house-of-pi) | Calibrated completion estimates | Reject | Estimates do not unblock work and become misleading during parallel agents or external builds. |
| `restart` custom extension | Fresh-session handoff around 80% context | Reject | Pi compaction/resume and FirstMate durable state already cover handoff. No stable public package was identified from the post. |
| `worksheet-loop` custom extension | Shared Markdown task loop | Reject | Duplicates FirstMate/tasks-axi and risks two task authorities. No stable public package was identified from the post. |
| [`pi-web-access`](https://github.com/nicobailon/pi-web-access) | Search, fetch, PDF, video, cloning | Reject | Broad duplicate of current web/browser stack; video analysis is not a standing need. |
| [`pi-goal`](https://www.npmjs.com/package/pi-goal) | Persistent autonomous goal loop | Reject | Babysitter and FirstMate already own long-running loops and recovery. |
| [`pi-autoresearch`](https://github.com/davebcn87/pi-autoresearch) | Run/measure/keep experiment loop | Defer | Useful only for a concrete benchmark optimization task; avoid as ambient behavior. |
| [`pi-computer-use`](https://www.npmjs.com/package/@injaneity/pi-computer-use) | Desktop automation | Keep | Already installed. Use only when browser/native tools cannot expose the flow. |
| [`pi-session-recall`](https://github.com/gchigoo/pi-session-recall) | Read-only session indexing and recall | Reject | Manual session files remain available; automatic cross-session recall risks stale or cross-project context. |
| [`@ogulcancelik/pi-herdr`](https://github.com/ogulcancelik/pi-extensions) | Pi-native Herdr tools | Reject | Current harness exposes first-party Herdr tools and a version-matched skill. |
| [`pi-herdr-subagents`](https://github.com/0xRichardH/pi-herdr-subagents) | Herdr-backed child agents | Reject | Duplicates `delegate-work` and FirstMate. |
| [`pi-intercom`](https://www.npmjs.com/package/pi-intercom) | Session-to-session messaging | Reject | Existing parent-bound `herdr-agent-comms` is narrower. Reddit reports orphan messages reaching unrelated sessions. |
| [`pi-ask-herdr`](https://github.com/leset0ng/pi-ask-herdr) | `ask_user` plus Herdr notifications | Reject | Current goal is unattended work with explicit safety boundaries, not more question surfaces. |
| [`@tifan/pi-rename`](https://github.com/tifandotme/pi-extensions) | Session and Herdr tab naming | Reject | Cosmetic; Herdr already labels project/worktree contexts. |
| [`pi-link`](https://github.com/alvivar/pi-link) | Local WebSocket terminal links | Reject | Another messaging topology would weaken current explicit parent/worker routing. |
| [`pi-sandbox`](https://github.com/carderne/pi-sandbox) | OS sandbox with interactive grants | Reject | Local sandbox has stronger credential/profile integration plus explicit trusted session mode. |
| [`@narumitw/pi-btw`](https://github.com/narumiruna/pi-extensions) | Inline side question | Reject | Side questions can remain ordinary prompts; another hidden context branch is not needed. |
| [`pi-observational-memory`](https://github.com/elpapi42/pi-observational-memory) | Background observations/reflections and proactive compaction | Reject | Automatically manufactures persistent memory and spends model calls, conflicting with explicit-only knowledge capture. |
| [`pi-memory`](https://github.com/jayzeng/pi-memory) | Markdown memory, scratchpad, qmd semantic search | Reject | Conflicts with explicit `capture-knowledge` authorization and injects up to 16K characters into turns. |
| [`pi-loadout`](https://github.com/tianrendong/pi-loadout) | Live tool/skill presets | Reject | Current package list is intentionally small; skill descriptions already provide lazy loading. Frequent toggles also invalidate prompt caches. |
| [`pi-effort`](https://github.com/ricardofrantz/pi-effort) | Model-adaptive thinking aliases | Reject | Pi `--thinking` and FirstMate dispatch profiles already set effort explicitly. |
| [`@senad-d/micme`](https://github.com/senad-d/micme) | Local Whisper dictation | Wait for compatibility | Best new idea for blog capture, review-first and local by default, but documented Pi support stops below 0.81.0. Do not force it onto 0.84.1. |
| [`@juicesharp/rpiv-voice`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-voice) | Local sherpa-onnx dictation | Defer | Potential MicMe alternative, but requires isolated privacy/latency/compatibility validation and Nix packaging first. |
| [`@vigolium/piolium`](https://github.com/vigolium/piolium) | Multi-agent security audit phases | Reject | no-mistakes plus focused security tests and isolated reviewers already cover this without a second orchestrator. |
| [`pi-lens`](https://github.com/apmantza/pi-lens) | LSP, lint, formatting, AST rules, security scans | Defer | Capable but very broad, rapidly changing, and able to auto-install tooling. Existing repository checks are more deterministic. Trial only against one measured feedback gap. |
| [`pi-agent-browser-native`](https://github.com/fitchmultz/pi-agent-browser-native) | Agent-browser tool | Reject | Duplicates managed CDP browser tools and `pi-computer-use`. |
| [`@gwynnnplaine/pi-github`](https://github.com/gwynnnplaine/pi-github) | Read GitHub issues/PRs/checks through `gh` | Reject | gh-axi, no-mistakes, and direct bounded `gh` reads already own this. |
| [`@piex-dev/dap`](https://github.com/piex-dev/piex) | Debug Adapter Protocol | Defer | Genuine unique capability. Install project-locally only when a native debugging task needs interactive breakpoints. |
| [`@feniix/pi-devtools`](https://github.com/feniix/pi-extensions/tree/main/packages/pi-devtools) | Branch, PR, release, merge, GitHub/Linear automation | Reject | Overlaps guarded FirstMate/no-mistakes/gh-axi delivery and expands remote mutation surface. |
| [`@danypops/pi-pipes`](https://github.com/DanyPops/pipes) | Cross-platform CI control | Reject | CI visibility and actions already live behind no-mistakes and gh-axi. |
| `@halsolot/ank` | ADR/task-awareness helper | Reject | Package/repository could not be verified from the spelling in the post. FirstMate/tasks-axi already own task awareness. |
| [`quincycs/pi-qcode`](https://github.com/quincycs/pi-qcode) | Native VS Code UI for Pi | Reject | Current Neovim/Herdr terminal workflow is deliberate; another primary UI adds no missing capability. |
| Extra provider extensions | Cursor, Command Code, Nous, Umans, OpenCode fallbacks | Reject for now | Current OpenAI Codex and configured OpenCode providers cover required model classes. Add a provider only for a concrete quota or capability gap. |
| Per-model temperature/top-p extension | Sampling overrides | Reject | Pi 0.84.1 now supports custom sampling parameters natively where needed. |

## Revisit triggers

- Dictation: package declares Pi 0.84 compatibility and passes a one-run local privacy/latency test.
- DAP: one real bug cannot be efficiently diagnosed through tests, traces, or a core dump.
- Codex compaction: measured native compaction latency or continuity loss recurs.
- FFF: timed `rg`/`fd` discovery becomes material in large repositories.
- pi-lens: repeated defects would have been prevented by immediate LSP feedback and existing checks are too slow.

Until one trigger fires, fewer extensions is the higher-quality setup.
