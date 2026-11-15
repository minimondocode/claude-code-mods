# /sid copies the session ID; paste it back to show what landed on the clipboard.
Output ../copy-session-id.gif
Source settings.tape

Hide
Type `source "$DEMO_ENV" copy-session-id`
Enter
Sleep 300ms
Show

Sleep 600ms
Type "claude"
Enter
Sleep 6s

Type@120ms "/sid"
Sleep 1.2s
Enter
Sleep 1.5s

# What /sid put on the clipboard.
Type "pick this up later with: claude -r "
Sleep 300ms
Paste
Sleep 3.5s

Hide
Ctrl+U
Ctrl+C
Ctrl+C
Sleep 1s
