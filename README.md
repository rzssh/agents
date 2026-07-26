# agents

Personal AI agent runtime, skills, safety policy, launchers, and pinned packages.

Dotfiles consume this repository through a local flake input. Machine-specific secrets, desktop integration, and service endpoints stay in dotfiles.

## Layout

- `agents/`: shared instructions, skills, and agent-specific extensions
- `bin/`: profile, workspace, FirstMate, and update commands
- `home/`: Home Manager module
- `pkgs/`: pinned agent packages

FirstMate remains its own upstream checkout. This repository owns only launcher and integration policy.

## Checks

```sh
nix flake check
```
