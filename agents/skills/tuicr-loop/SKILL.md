---
name: tuicr-loop
description: "Crit-style blocking review loop with tuicr: Pi opens the TUI, the user comments inline, Pi addresses feedback and replies, repeating until approved. Use when the user says 'tuicr loop', 'review in tuicr and take over', or wants round-based review without crit's browser."
---

# Pi-Driven tuicr Review Loop

The user reviews Pi's changes in the tuicr TUI. Pi runs rounds in the
foreground, addresses every new comment, replies in-session, and stops when a
round produces no new feedback.

## Step 1 — Run a round

```bash
<skill-directory>/tuicr-loop.sh /path/to/repo
```

Run in the foreground with a long timeout (10 minutes). The script opens tuicr
in a split pane (tmux / Zellij / Herdr auto-detected), blocks until the user
presses `q`, then prints:

- `TUICR_SESSION <slug>` and `TUICR_SESSION_PATH <path>` — keep this path for
  all later `tuicr review` calls in this loop
- the session's comments as a JSON array on stdout

Tell the user: **"tuicr is open in the review pane. Leave comments, press `q`
when done."** Do not proceed until the script exits.

## Step 2 — Filter to unseen comments

The comments JSON has **no author field**, so track a seen-ID set across the
whole loop:

- Round 1: seed seen with the IDs of any comments the user already left in an
  earlier conversation; otherwise treat all as new.
- After processing: add each handled comment's ID to seen.
- Every `tuicr review add` call prints the created comment — add its `id` to
  seen too, or your own replies will look like new user feedback next round.

Only unseen IDs are feedback to act on. A round with **zero unseen comments**
means approved — stop the loop and report.

## Step 3 — Address and reply

Per comment type:

- `issue` — fix first
- `suggestion` — implement, or reply why not
- `note` — acknowledge or answer
- `praise` — no action

Reply to each handled comment, anchored at its own location so the user sees
the answer inline next round:

```bash
tuicr review add --session <TUICR_SESSION_PATH> \
  --target-file <path> --line <start_line> --side <side> \
  --type note --username "Pi" \
  "<what you did>"
```

Omit `--target-file`/`--line` for review-level comments. Line numbers may have
drifted after your edits; use the comment's original location anyway. Always
pass `--username "Pi"`. Never resolve or rewrite the user's comments.

## Step 4 — Next round

Rerun `tuicr-loop.sh` for the next round. Repeat Steps 2–3 until a round
yields zero unseen user comments, then tell the user the review is approved.

## Limits

- No reply threading or resolve state in the CLI — replies are plain comments
  anchored at the same spot.
- The round boundary is the user pressing `q`, unlike crit's explicit
  "Finish Review" click.
- Session selection picks the repo's most recently updated local session; if
  the user had several TUIs open, confirm the slug before replying.
