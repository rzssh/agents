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

Pi starts every session in strict mode: credential paths remain unreadable, executable configuration stays protected, and writes are scoped to the current or explicitly approved projects.

`/sandbox trusted` requests full host access for the current session. Enabling it requires an interactive warning plus the exact confirmation phrase `TRUST THIS SESSION`; non-interactive sessions cannot enable it. The footer keeps trusted mode visible. `/sandbox strict` restores the default immediately, and every new or reloaded session starts strict.

Trusted mode changes technical access, not authorization. Pushes, deployments, publication, deletion, spend, and secret disclosure still require their own explicit instruction.

## Checks

```sh
nix flake check
```
