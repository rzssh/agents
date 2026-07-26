---
name: herdr-agent-comms
description: Coordinate an existing lead and worker running in Herdr. Use when an agent must identify its parent or worker, report progress or blockers, request a decision, deliver a result, or send a follow-up without interrupting an active peer. Do not use to create delegation topology or concurrent writers.
---

# Herdr Agent Comms

Load the `herdr` skill first. Require `HERDR_ENV=1`.

## Identify relationship

Read current identity:

```bash
herdr agent get "$HERDR_PANE_ID"
```

Worker uses `HERDR_PARENT_PANE_ID` as lead target. `delegate-work` injects it with
`HERDR_AGENT_ROLE=worker`. If either variable is absent, do not guess a parent. List agents and ask
user only when multiple plausible targets remain.

Lead keeps `result.agent.pane_id` returned by `herdr agent start`. After context loss, list agents
and match worker name prefix `worker-${HERDR_PANE_ID//[:]/-}`.

## Send safely

Inspect target before sending:

```bash
herdr agent get "$target"
```

If target is `working`, wait for `idle`, `done`, or `blocked`. Do not type into an active prompt. When
safe, submit one concise message with `herdr agent prompt "$target" "$message"`.

Use these message shapes:

- progress: `PROGRESS: result; current check; next action.`
- blocker: `BLOCKED: exact blocker; evidence; decision needed.`
- result: `RESULT: changed paths; commit/change ID; acceptance result; remaining risk.`
- correction: `FOLLOW-UP: one bounded correction; scope; acceptance command.`

Do not stream routine updates. Send only decision-changing progress, blockers, final results, or one
corrective follow-up. Lead inspects actual diff and reruns acceptance before integration.
