#!/usr/bin/env bash
set -euo pipefail

repo="${1:-$PWD}"
repo="$(cd "$repo" && pwd)"
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tuicr_skill_dir="$(cd "$dir/../tuicr" && pwd)"

if [[ "${HERDR_ENV:-}" == "1" ]]; then
	wrapper="$tuicr_skill_dir/tuicr-wrapper-herdr.sh"
elif [[ -n "${ZELLIJ:-}" ]]; then
	wrapper="$tuicr_skill_dir/tuicr-wrapper-zellij.sh"
elif [[ -n "${TMUX:-}" ]]; then
	wrapper="$tuicr_skill_dir/tuicr-wrapper.sh"
else
	echo "tuicr-loop: run inside tmux, Zellij, or Herdr" >&2
	exit 1
fi

for wrapper_dep in tuicr python3; do
	command -v "$wrapper_dep" >/dev/null || {
		echo "tuicr-loop: $wrapper_dep not found" >&2
		exit 1
	}
done

"$wrapper" "$repo"

session="$(tuicr review list --repo "$repo" | python3 -c '
import json, sys
sessions = [s for s in json.load(sys.stdin) if s["kind"] == "local"]
if not sessions:
    raise SystemExit(1)
best = max(sessions, key=lambda s: s["updated_at"])
print(best["slug"] + "\t" + best["path"])
')" || { echo "tuicr-loop: no review session for $repo" >&2; exit 1; }

slug="$(printf '%s' "$session" | cut -f1)"
path="$(printf '%s' "$session" | cut -f2)"

echo "TUICR_SESSION $slug"
echo "TUICR_SESSION_PATH $path"
tuicr review comments --session "$path"
