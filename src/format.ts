export const signed = (n: number | null, digits = 0) =>
  n === null ? '–' : `${n > 0 ? '+' : ''}${n.toFixed(digits)}`
export const fixed = (n: number | null, digits = 1) => (n === null ? '–' : n.toFixed(digits))
export const percent = (n: number | null) => (n === null ? '–' : `${Math.round(n * 100)}%`)
export const dateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
export const trend = (n: number | null) => (!n ? undefined : n > 0 ? 'up' : 'down')
