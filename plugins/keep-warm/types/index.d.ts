export type MaxPings = number

declare module 'claude-code' {
  interface PluginState {
    'keep-warm': { enabled: boolean; maxPings: MaxPings }
  }
}
