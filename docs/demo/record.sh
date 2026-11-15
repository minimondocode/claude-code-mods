#!/usr/bin/env bash
# Record the README's demo GIFs into docs/: ./record.sh [mod ...] (default: all).
#
# Needs vhs (brew install vhs), the JetBrainsMono Nerd Font, and a signed-in
# `claude`. Each tape runs a real Claude Code session in a copy of the dummy
# project in acme-api/, with only its own mod loaded. The run makes a few
# small model calls, and /sid and /copycode write to the system clipboard.
set -euo pipefail

demo=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$demo/../.." && pwd)
project=/tmp/acme-api
rm -rf "$project"
cp -R "$demo/acme-api" "$project"
trap 'rm -rf "$project"' EXIT

mods=("$@")
[ ${#mods[@]} -gt 0 ] || mods=(copy-session-id copy-code focus-notes keep-warm cache-countdown)

cd "$demo"
for mod in "${mods[@]}"; do
  echo "Recording $mod"
  # A clean environment, so nothing of the session running this script (its
  # plugin folders, its session markers) reaches the recorded one.
  env -i HOME="$HOME" USER="$USER" PATH="$PATH" LANG=en_US.UTF-8 \
    DEMO_PROJECT="$project" DEMO_MODS="$repo/plugins" DEMO_ENV="$demo/env.sh" \
    vhs "$mod.tape"
done
