import { dateTime, fixed, percent, signed, trend } from '../format'
import { breakdown, defined, mean, sessions, summarize, type Row } from '../stats'
import Breakdown from './Breakdown'
import Tile from './Tile'

interface Props {
  /** Every entry, oldest first. Sessions span playlists, so they are worked out from these. */
  rows: Row[]
  /** Entries matching the playlist filter */
  visible: Row[]
}

const STATS = ['score', 'goals', 'assists', 'saves', 'shots'] as const
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIMES = ['Night (12–6am)', 'Morning (6am–12pm)', 'Afternoon (12–6pm)', 'Evening (6pm–12am)']

export default function Insights({ rows, visible }: Props) {
  const context = new Map<number, { game: number; after: Row['result'] }>()
  for (const session of sessions(rows))
    session.forEach((row, i) => context.set(row.id, { game: i, after: session[i - 1]?.result ?? null }))

  const played = sessions(visible).map((session) => ({ start: session[0].timestamp, ...summarize(session) }))
  const nets = played.map((s) => s.net)
  const last10 = summarize(visible.slice(-10))
  const wins = visible.filter((r) => r.result === 'W')
  const losses = visible.filter((r) => r.result === 'L')
  const averages = STATS.map((key) => ({
    key,
    win: mean(defined(wins.map((r) => r[key]))),
    loss: mean(defined(losses.map((r) => r[key]))),
  })).filter((a) => a.win !== null || a.loss !== null)

  return (
    <>
      <div className="tiles">
        <Tile label="Last 10 games">
          {last10.wins}–{last10.losses} <small>{percent(last10.winRate)}</small>
        </Tile>
        <Tile label="Last 10 net elo" trend={trend(last10.net)}>
          {signed(last10.net)}
        </Tile>
        <Tile label="Best session" trend={trend(Math.max(...nets))}>
          {signed(Math.max(...nets))}
        </Tile>
        <Tile label="Worst session" trend={trend(Math.min(...nets))}>
          {signed(Math.min(...nets))}
        </Tile>
        <Tile label="Avg games per session">{fixed(mean(played.map((s) => s.entries)))}</Tile>
      </div>

      <div className="columns">
        <Breakdown
          title="By game of session"
          heading="Game"
          groups={breakdown(visible, ['Games 1–3', 'Games 4–6', 'Games 7–9', 'Game 10+'], (r) =>
            Math.min(Math.floor(context.get(r.id)!.game / 3), 3),
          )}
        />
        <Breakdown
          title="After the previous game"
          heading="Previous game in session"
          groups={breakdown(visible, ['After a win', 'After a loss'], (r) => {
            const { after } = context.get(r.id)!
            return after === 'W' ? 0 : after === 'L' ? 1 : undefined
          })}
        />
        <Breakdown
          title="By time of day"
          heading="Time"
          groups={breakdown(visible, TIMES, (r) => Math.floor(new Date(r.timestamp).getHours() / 6))}
        />
        <Breakdown
          title="By day of week"
          heading="Day"
          groups={breakdown(visible, DAYS, (r) => (new Date(r.timestamp).getDay() + 6) % 7)}
        />
        <Breakdown
          title="By goal margin"
          heading="Margin"
          groups={breakdown(visible, ['1 goal', '2 goals', '3+ goals'], (r) =>
            r.goalsFor === undefined || r.goalsAgainst === undefined
              ? undefined
              : Math.min(Math.abs(r.goalsFor - r.goalsAgainst), 3) - 1,
          )}
        />

        {averages.length > 0 && (
          <section className="card">
            <h2>Your stats in wins vs losses</h2>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Per game</th>
                    <th className="num">Wins</th>
                    <th className="num">Losses</th>
                    <th className="num">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {averages.map(({ key, win, loss }) => {
                    const difference = win === null || loss === null ? null : win - loss
                    return (
                      <tr key={key}>
                        <td className="capitalize">{key}</td>
                        <td className="num">{fixed(win)}</td>
                        <td className="num">{fixed(loss)}</td>
                        <td className="num" data-trend={trend(difference)}>
                          {signed(difference, 1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <section className="card">
        <h2>Recent sessions</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Started</th>
                <th className="num">Games</th>
                <th className="num">W–L</th>
                <th className="num">Win rate</th>
                <th className="num">Net elo</th>
              </tr>
            </thead>
            <tbody>
              {played
                .slice(-10)
                .reverse()
                .map((s) => (
                  <tr key={s.start}>
                    <td>{dateTime(s.start)}</td>
                    <td className="num">{s.entries}</td>
                    <td className="num">
                      {s.wins}–{s.losses}
                    </td>
                    <td className="num">{percent(s.winRate)}</td>
                    <td className="num" data-trend={trend(s.net)}>
                      {signed(s.net)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
