---
name: capture-knowledge
description: Classify, deduplicate, and store durable personal knowledge without polluting implementation repositories. Use only when the user explicitly asks to preserve personal knowledge for later or requests a knowledge sweep. Generic mentions of notes, findings, documentation, patterns, workflows, or decisions do not trigger this skill. Never persist task discoveries automatically. Do not use for transient task status, required project documentation, secrets, raw logs, or FirstMate-internal state.
---

# Capture Knowledge

Store cross-project personal knowledge under `~/notes/knowledge`.

## Route

Use first matching destination:

1. User-specified destination.
2. Documentation required by project users, behavior, API, or maintenance: project repository.
3. FirstMate-only preferences, fleet facts, task state, or backlog: follow FirstMate local routing under `FM_HOME`.
4. Explicitly requested durable personal knowledge: `~/notes/knowledge`.
5. Everything transient or obvious: do not write.

Never add personal workflow notes to an implementation repository.

## Classify

- `findings/<slug>.md`: evidence-backed observation not yet proven reusable.
- `patterns/<slug>.md`: reusable rule supported across contexts or repeated findings.
- `workflows/<slug>.md`: repeatable procedure or tool sequence.
- `decisions/<slug>.md`: durable choice, alternatives, and rationale.

When uncertain, use `findings`. Promote a finding by moving its substance into a pattern only after stronger evidence; keep provenance.

## Capture

1. Resolve `~/notes/knowledge` to an absolute path. Create selected category directory when absent.
2. Search filenames and content with `rg -i` using topic terms and synonyms.
3. Read likely matches. Update best existing note instead of creating a duplicate.
4. Use a short stable kebab-case slug. Keep one topic per file.
5. Record only useful substance:
   - title;
   - `Type`, `Status`, `Updated`, and `Scope` fields;
   - concise claim or outcome;
   - evidence, source paths, or links;
   - implications, reusable steps, or rationale appropriate to type.
6. Mark findings `observed`; mark patterns `validated` only with repeated or strong evidence.
7. Preserve contradictory evidence. Revise status or scope instead of silently erasing history.
8. Report written path and one-line change summary.

Never store credentials, tokens, private copied transcripts, large raw outputs, or speculative claims presented as fact. Link source material when possible.
