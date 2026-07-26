---
name: delegate-work
description: Delegate one or two bounded coding units from an already-inspected task to isolated Pi workers in Herdr. Use after repository and test inspection reveals independent write scopes, or when the user requests a lead/worker flow. Do not use for initial exploration, architecture, coupled edits, or unrelated tasks.
---

# Delegate Work

Remain lead. Own decisions, integration, and final verification.

## Gate

1. Inspect repository, relevant callers, tests, and current diff before deciding.
2. Stay solo when work is ambiguous, coupled, architectural, small, or lacks an executable check.
3. Delegate only a bounded unit with an independent write set and clean integration boundary.
4. Require `HERDR_ENV=1`; otherwise stay solo.
5. Load the `herdr` skill before controlling Herdr. Installed CLI output is authority.

Use one worker by default. Two is hard maximum and requires two disjoint write sets. Put unrelated
tasks in separate user-owned Herdr workspaces instead of managing them as workers.

## Contract

Send every worker:

- goal and reason;
- exact allowed files or subsystem;
- known dependencies and invariants;
- prohibited files, including acceptance tests the worker must not weaken;
- executable acceptance command;
- required return: summary, changed paths, commit or change ID, command result, and blockers.

Worker must stop and report when scope is wrong, dependency is missing, or acceptance cannot run.

## Isolation

Never start concurrent writers in the lead's working copy.

- Git: use `herdr worktree create`, then parse `result.workspace.workspace_id`,
  `result.worktree.path`, and `result.root_pane.pane_id` from returned JSON.
- JJ: use `jj workspace add` in a unique sibling path, create a Herdr workspace for that path, and
  parse returned JSON.
- Re-read IDs after every mutation. Never invent Herdr IDs.

Preserve selected profile:

```bash
profile=${AI_PROFILE:-personal}
parent=${HERDR_PANE_ID:?}
worker_name="worker-${parent//[:]/-}"
printf -v worker_env 'export AI_PROFILE=%q HERDR_AGENT_ROLE=worker HERDR_PARENT_PANE_ID=%q' \
  "$profile" "$parent"
herdr pane run "$worker_pane" "$worker_env"
herdr agent start "$worker_name" --kind pi --pane "$worker_pane"
```

Use unique worker names when another worker exists. Follow the `herdr` skill for prompt submission,
state waits, output reads, and cleanup. Load `herdr-agent-comms` when either side needs a later update.

## Review

1. Wait for completion or blocked state without polling aggressively.
2. Read result and inspect actual diff; never trust summary alone.
3. Run acceptance independently from lead workspace.
4. Give at most one bounded corrective follow-up. Then take over or ask user.
5. Integrate explicitly. Do not auto-merge or delete worker workspace.
