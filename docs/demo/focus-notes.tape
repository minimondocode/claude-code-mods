# In focus mode, the notes Claude writes between tool calls show in a band.
Output ../focus-notes.gif
Source settings.tape
Set Height 640

Hide
Type `export CLAUDE_CODE_NO_FLICKER=1; source "$DEMO_ENV" focus-notes --settings '{"viewMode":"focus"}'`
Enter
Sleep 300ms
Show

Sleep 600ms
Type "claude"
Enter
Sleep 6s

Type@35ms "Read package.json, then src/server.js. Before each read, write one short sentence on what you're checking. Then say in one sentence how the app starts."
Sleep 500ms
Enter
Wait+Screen@90s /mid-turn/
Sleep 1s
Wait+Screen@90s /done [0-9]/
Sleep 5s

Hide
Ctrl+C
Ctrl+C
Sleep 1s
