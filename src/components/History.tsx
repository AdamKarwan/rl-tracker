import { db, type Entry } from '../db'
import { dateTime, signed, trend } from '../format'
import { playlist } from '../ranks'
import type { Row } from '../stats'
import RankBadge from './RankBadge'

async function exportEntries() {
  const blob = new Blob([JSON.stringify(await db.entries.toArray(), null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `rl-tracker-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

async function importEntries(file?: File) {
  if (!file) return
  try {
    await db.entries.bulkPut(JSON.parse(await file.text()))
  } catch {
    alert('Could not import that file.')
  }
}

export default function History({ rows, onEdit }: { rows: Row[]; onEdit: (entry: Entry) => void }) {
  return (
    <section className="card">
      <header>
        <h2>History</h2>
        <div className="actions">
          <button onClick={exportEntries}>Export</button>
          <label className="button">
            Import
            <input type="file" accept="application/json" hidden onChange={(e) => importEntries(e.target.files?.[0])} />
          </label>
        </div>
      </header>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Playlist</th>
              <th>Rank</th>
              <th className="num">Elo</th>
              <th className="num">±</th>
              <th>Result</th>
              <th>Final</th>
              <th className="num">Score</th>
              <th className="num">Goals</th>
              <th className="num">Assists</th>
              <th className="num">Saves</th>
              <th className="num">Shots</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.toReversed().map((row) => (
              <tr key={row.id}>
                <td>{dateTime(row.timestamp)}</td>
                <td>{playlist(row.playlist).name}</td>
                <td>
                  <RankBadge rank={row.rank} division={row.division} />
                </td>
                <td className="num">{row.elo}</td>
                <td className="num" data-trend={trend(row.delta)}>
                  {signed(row.delta)}
                </td>
                <td>{row.result ?? '–'}</td>
                <td>{row.goalsFor !== undefined ? `${row.goalsFor}–${row.goalsAgainst ?? '?'}` : '–'}</td>
                <td className="num">{row.score ?? '–'}</td>
                <td className="num">{row.goals ?? '–'}</td>
                <td className="num">{row.assists ?? '–'}</td>
                <td className="num">{row.saves ?? '–'}</td>
                <td className="num">{row.shots ?? '–'}</td>
                <td className="actions">
                  <button onClick={() => onEdit(row)}>Edit</button>
                  <button onClick={() => confirm('Delete this entry?') && db.entries.delete(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
