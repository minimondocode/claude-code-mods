# A live countdown to when the prompt cache goes cold.
Output ../cache-countdown.gif
Source settings.tape
Set Height 440

Hide
Type `source "$DEMO_ENV" cache-countdown`
Enter
Sleep 300ms
Show

Sleep 600ms
Type "claude"
Enter
Sleep 6s

Type@35ms "Say hi in three words."
Sleep 500ms
Enter
Wait+Screen@60s /⏱/
Sleep 6s

Hide
Ctrl+C
Ctrl+C
Sleep 1s
