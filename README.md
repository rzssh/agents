# agents

Personal AI agent runtime, skills, safety policy, launchers, and pinned packages.

Dotfiles consume this repository through a local flake input. Machine-specific secrets, desktop integration, and service endpoints stay in dotfiles.

## Layout

- `agents/`: shared instructions, skills, and agent-specific extensions
- `bin/`: profile, workspace, FirstMate, and update commands
- `home/`: Home Manager module
- `pkgs/`: pinned agent packages

FirstMate remains its own upstream checkout. This repository owns launcher, integration policy, and its pinned AXI toolchain.

## Pi access modes

Pi starts in strict mode unless its trusted launcher explicitly selects otherwise: credential paths remain unreadable, executable configuration stays protected, and writes are scoped to the current or explicitly approved projects.

`/sandbox trusted` requests full host access for the current session. Enabling it requires one interactive warning; non-interactive sessions cannot enable it. Typing `TRUST` as a standalone input or running `/trust` triggers the same single confirmation. The footer keeps trusted mode visible. While trusted, sibling-project grant calls are recorded without another confirmation. `/sandbox strict` restores isolation immediately; typing `UNTRUST` or running `/untrust` does the same without confirmation. Reload returns to the launcher's selected mode.

Trusted launchers may set `PI_SANDBOX_START_MODE=trusted` for unattended child sessions. The variable is reserved from credential profiles, unknown values stay strict, and the footer remains visibly trusted.

Trusted mode changes technical access, not authorization. Pushes, deployments, publication, deletion, spend, and secret disclosure still require their own explicit instruction.

## Evaluations

- [`docs/pi-extension-audit-2026-08-10.md`](docs/pi-extension-audit-2026-08-10.md): current extension-by-extension fit review and revisit triggers.

## Checks

```sh
nix flake check
```
