import type { Entry } from './db'

export interface Row extends Entry {
  /** Elo change from the previous entry in the same playlist */
  delta: number | null
  result: 'W' | 'L' | null
}

/** Sorts oldest first. Result comes from the final score when entered, otherwise from the elo change. */
export function toRows(entries: Entry[]): Row[] {
  const lastElo = new Map<string, number>()
  return [...entries]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((entry) => {
      const previous = lastElo.get(entry.playlist)
      lastElo.set(entry.playlist, entry.elo)
      const delta = previous === undefined ? null : entry.elo - previous
      const margin =
        entry.goalsFor !== undefined && entry.goalsAgainst !== undefined
          ? entry.goalsFor - entry.goalsAgainst
          : (delta ?? 0)
      return { ...entry, delta, result: margin > 0 ? 'W' : margin < 0 ? 'L' : null }
    })
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const defined = (values: (number | undefined | null)[]) => values.filter((v) => v != null) as number[]
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

function record(rows: Row[]) {
  const wins = rows.filter((r) => r.result === 'W').length
  const losses = rows.filter((r) => r.result === 'L').length
  return { wins, losses, winRate: wins + losses ? wins / (wins + losses) : null }
}

export function summarize(rows: Row[]) {
  const results = rows.map((r) => r.result).filter(Boolean)
  const last = results.at(-1)
  let streak = 0
  while (streak < results.length && results[results.length - 1 - streak] === last) streak++

  const startOfDay = new Date().setHours(0, 0, 0, 0)
  const withShots = rows.filter((r) => r.goals !== undefined && r.shots)

  return {
    entries: rows.length,
    ...record(rows),
    streak: last ? `${last}${streak}` : null,
    peak: rows.length ? Math.max(...rows.map((r) => r.elo)) : null,
    net: sum(defined(rows.map((r) => r.delta))),
    today: sum(defined(rows.filter((r) => r.timestamp >= startOfDay).map((r) => r.delta))),
    avgDelta: mean(defined(rows.map((r) => r.delta))),
    avgScore: mean(defined(rows.map((r) => r.score))),
    avgGoals: mean(defined(rows.map((r) => r.goals))),
    avgAssists: mean(defined(rows.map((r) => r.assists))),
    avgSaves: mean(defined(rows.map((r) => r.saves))),
    avgShots: mean(defined(rows.map((r) => r.shots))),
    shootingPct: withShots.length
      ? sum(withShots.map((r) => r.goals!)) / sum(withShots.map((r) => r.shots!))
      : null,
  }
}

const MATCHUPS = ['Lower ranked', 'Same rank', 'Higher ranked']

/** Groups games by how the average teammate/opponent rank compares to the player's own */
export function matchups(rows: Row[], key: 'teammateRanks' | 'opponentRanks') {
  return MATCHUPS.map((label, i) => {
    const group = rows.filter((r) => {
      const average = mean(r[key] ?? [])
      return average !== null && Math.sign(Math.round(average - r.rank)) === i - 1
    })
    return { label, games: group.length, ...record(group), avgDelta: mean(defined(group.map((r) => r.delta))) }
  })
}

/** The two most frequent gains and losses, falling back to the usual ±9/±10 until there is history */
export function commonDeltas(rows: Row[]) {
  const counts = new Map<number, number>()
  for (const { delta } of rows) if (delta) counts.set(delta, (counts.get(delta) ?? 0) + 1)
  const frequent = [...counts].sort((a, b) => b[1] - a[1]).map(([delta]) => delta)
  const pick = (sign: number) =>
    [...new Set([...frequent.filter((d) => Math.sign(d) === sign), sign * 10, sign * 9])].slice(0, 2)
  return [...pick(1), ...pick(-1)].sort((a, b) => b - a)
}
