---
name: teach-code
description: Teach programming through real project work using retrieval, prediction, implementation, debugging, explanation, and later transfer. Use when the user says teach mode, asks to learn a language or systems concept while building, wants AI-written code without losing understanding, or asks for checkpoints and quizzes during implementation. Do not use for ordinary coding tasks or one-off explanations.
---

# Teach Code

Use working software as lesson. Optimize long-term recall without turning repository into courseware.

Do not create lesson files, learning records, HTML, assets, glossaries, or notes unless user explicitly requests persistence.

## Choose lesson

1. Inspect current code, tests, project instructions, and requested outcome.
2. Select next smallest complete project slice.
3. Select one concept necessary for that slice and near user's current ability.
4. Use official documentation or primary sources for unfamiliar or unstable APIs.

Avoid detached exercises when real code can expose same concept.

## Run learning loop

### Recall

When prior sessions exist, begin with one or two short retrieval questions. Do not show notes first.

### Model

Explain only knowledge required now. Prefer concrete data flow, ownership graph, state transition, or failure path over general lecture. Keep pre-code theory below ten minutes unless user asks for depth.

### Predict

Before consequential code, ask user to predict one relevant outcome:

- owner or lifetime;
- return type or compiler error;
- cleanup order;
- failure behavior;
- allocation, copy, lock, or blocking point.

Wait for answer when prediction is lesson's core. Do not turn session into interrogation.

### Build

Let AI handle mechanical bulk. Make user own decisions carrying transferable insight: state shape, ownership, invariants, error boundaries, trust boundaries, concurrency, and resource lifetime.

Implement minimum complete vertical slice. Run relevant compiler, tests, linters, and program behavior.

Never accept cargo-cult fixes such as unexplained clones, reference counting, locks, lifetime annotations, unsafe blocks, discarded errors, or broad abstractions.

### Stress

Exercise concept once through real friction. Choose one:

- introduce or diagnose a failure;
- change requirement;
- remove suspicious workaround;
- trace partial initialization or cleanup;
- inspect allocation, synchronization, or generated behavior.

### Explain

Ask user to explain why resulting design works and name one rejected alternative. Correct mental model, not wording.

Feature may be complete while concept remains incomplete. Say so plainly.

### Transfer

End with one small future retrieval prompt. Revisit concept after spacing in another feature instead of repeating same exercise immediately.

## Review lenses

Use only relevant lens.

- Rust: ownership, borrowing, enums, errors, trait boundaries, allocations, `Send`/`Sync`, async cancellation, unsafe boundaries.
- Zig: pointers and slices, allocators, `defer`/`errdefer`, partial initialization, error unions, tagged unions, `comptime`, C ABI, resource lifetime.
- Systems: invariants, bounded work, backpressure, consistency, recovery, observability, hostile inputs.

## Close session

Report three terse items:

- learned;
- still uncertain;
- next retrieval.
