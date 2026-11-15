# Sourced, hidden, at the start of each tape: a clean prompt, the dummy
# project, and `claude` running only the one mod the tape shows (no user
# settings, so no other plugins, hooks or status line), on a fast model.
# $1 is the mod; any further arguments go to every `claude` the tape runs.
mod=$1; shift
extra=("$@")
export PS1='\[\e[36m\]~/acme-api\[\e[0m\] \[\e[35m\]❯\[\e[0m\] '
claude() {
  command claude --setting-sources project --plugin-dir "$DEMO_MODS/$mod" \
    --model claude-haiku-5-5 --permission-mode default "${extra[@]}" "$@"
}
cd "$DEMO_PROJECT"
clear
