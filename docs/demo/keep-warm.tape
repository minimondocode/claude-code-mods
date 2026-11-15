# /keep-warm pings the prompt cache before it expires while you're away.
Output ../keep-warm.gif
Source settings.tape
Set Height 440

Hide
Type `source "$DEMO_ENV" keep-warm`
Enter
Sleep 300ms
Show

Sleep 600ms
Type "claude"
Enter
Sleep 6s

Type@90ms "/keep-warm on 3"
Sleep 800ms
Enter
Sleep 3s
Sleep 3s

Type@90ms "/keep-warm status"
Sleep 800ms
Enter
Sleep 3s
Sleep 3.5s

Hide
Ctrl+C
Ctrl+C
Sleep 1s
