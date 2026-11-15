# A copy link under each code block in a reply, and /copycode for the keyboard.
Output ../copy-code.gif
Source settings.tape
Set Height 600

Hide
Type `source "$DEMO_ENV" copy-code`
Enter
Sleep 300ms
Show

Sleep 600ms
Type "claude"
Enter
Sleep 6s

Type@35ms "Without using tools: how do I run this project's tests? One short sentence, then the single command `npm test` alone in a bash block."
Sleep 500ms
Enter
Wait+Screen@60s /⧉/
Sleep 3s

# /copycode copies the last block from the keyboard.
Type@100ms "/copycode"
Sleep 800ms
Enter
Sleep 2s

# Paste it to show what was copied.
Type "copied: "
Sleep 300ms
Paste
Sleep 3.5s

Hide
Ctrl+U
Escape
Ctrl+C
Ctrl+C
Sleep 1s
