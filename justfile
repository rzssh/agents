check:
    #!/usr/bin/env bash
    set -euo pipefail
    nix flake check
    output="$(nix build .#pi-coding-agent --no-link --print-out-paths)"
    "$output/bin/pi" --version
    firstmate="${FIRSTMATE_ROOT:-${PI_PROJECTS_ROOT:-$HOME/projects}/firstmate}"
    if [[ -x "$firstmate/tests/fm-pi-primary-types.test.sh" ]]; then
        FM_PI_PACKAGE_DIR="$output/lib/node_modules/@earendil-works/pi-coding-agent" \
            "$firstmate/tests/fm-pi-primary-types.test.sh"
    fi

update:
    nix shell --inputs-from . nixpkgs#nix-update nixpkgs#nodejs_24 nixpkgs#python3 nixpkgs#prefetch-npm-deps -c bash ./bin/update

update-pi:
    nix shell --inputs-from . nixpkgs#nodejs_24 nixpkgs#prefetch-npm-deps -c bash ./bin/update-pi
