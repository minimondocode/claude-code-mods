export type Note = { text: string }

declare module 'claude-code' {
  interface PluginState {
    'focus-notes': { notes: Note[]; isHidden: boolean }
  }
}
