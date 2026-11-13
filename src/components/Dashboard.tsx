import { fixed, percent, signed, trend } from '../format'
import { PLAYLISTS, type PlaylistId } from '../ranks'
import { matchups, summarize, type Row } from '../stats'
import Breakdown from './Breakdown'
import EloChart from './EloChart'
import RankBadge from './RankBadge'
import Tile from './Tile'

interface Props {
  /** Every entry, oldest first */
  rows: Row[]
  /** Entries matching the playlist filter */
  visible: Row[]
  onSelect: (id: PlaylistId) => void
}

export default function Dashboard({ rows, visible, onSelect }: Props) {
  const stats = summarize(visible)
  const latest = visible.at(-1)
  const singlePlaylist = new Set(visible.map((r) => r.playlist)).size === 1
  const breakdown = PLAYLISTS.map((p) => {
    const games = rows.filter((r) => r.playlist === p.id)
    return { ...p, latest: games.at(-1), stats: summarize(games) }
  }).filter((p) => p.latest)

  return (
    <>
      <div className="tiles">
        {singlePlaylist && latest && (
          <>
            <Tile label="Current rank">
              <RankBadge rank={latest.rank} division={latest.division} />
            </Tile>
            <Tile label="Current elo">{latest.elo}</Tile>
            <Tile label="Peak elo">{stats.peak}</Tile>
          </>
        )}
        <Tile label="Entries">{stats.entries}</Tile>
        <Tile label="Record">
          {stats.wins}–{stats.losses} <small>{percent(stats.winRate)}</small>
        </Tile>
        <Tile label="Streak">{stats.streak ?? '–'}</Tile>
        <Tile label="Net elo" trend={trend(stats.net)}>
          {signed(stats.net)}
        </Tile>
        <Tile label="Today" trend={trend(stats.today)}>
          {signed(stats.today)}
        </Tile>
        <Tile label="Avg ± per game" trend={trend(stats.avgDelta)}>
          {signed(stats.avgDelta, 1)}
        </Tile>
      </div>

      <section className="card">
        <h2>Elo over time</h2>
        <EloChart rows={visible} />
      </section>

      <section className="card">
        <h2>Per-game averages</h2>
        <div className="tiles">
          <Tile label="Score">{fixed(stats.avgScore, 0)}</Tile>
          <Tile label="Goals">{fixed(stats.avgGoals)}</Tile>
          <Tile label="Assists">{fixed(stats.avgAssists)}</Tile>
          <Tile label="Saves">{fixed(stats.avgSaves)}</Tile>
          <Tile label="Shots">{fixed(stats.avgShots)}</Tile>
          <Tile label="Shooting">{percent(stats.shootingPct)}</Tile>
        </div>
      </section>

      <section className="card">
        <h2>Playlists</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Playlist</th>
                <th>Rank</th>
                <th className="num">Elo</th>
                <th className="num">Peak</th>
                <th className="num">Entries</th>
                <th className="num">W–L</th>
                <th className="num">Win rate</th>
                <th className="num">Net</th>
                <th className="num">Avg goals</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((p) => (
                <tr key={p.id} className="clickable" onClick={() => onSelect(p.id)}>
                  <td>{p.name}</td>
                  <td>
                    <RankBadge rank={p.latest!.rank} division={p.latest!.division} />
                  </td>
                  <td className="num">{p.latest!.elo}</td>
                  <td className="num">{p.stats.peak}</td>
                  <td className="num">{p.stats.entries}</td>
                  <td className="num">
                    {p.stats.wins}–{p.stats.losses}
                  </td>
                  <td className="num">{percent(p.stats.winRate)}</td>
                  <td className="num" data-trend={trend(p.stats.net)}>
                    {signed(p.stats.net)}
                  </td>
                  <td className="num">{fixed(p.stats.avgGoals)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="columns">
        <Breakdown title="Against opponents" heading="Compared to me" groups={matchups(visible, 'opponentRanks')} />
        <Breakdown title="With teammates" heading="Compared to me" groups={matchups(visible, 'teammateRanks')} />
      </div>
    </>
  )
}
