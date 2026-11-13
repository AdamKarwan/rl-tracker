import { useEffect, useState, type FormEvent } from 'react'
import { db, type Entry } from '../db'
import { signed, trend } from '../format'
import { DIVISIONS, PLAYLISTS, RANKS, SSL, stepDivision, type PlaylistId } from '../ranks'
import { commonDeltas, predictRank, type Row } from '../stats'
import RankBadge from './RankBadge'

export type Draft = Pick<Entry, 'playlist' | 'rank' | 'division'> & { elo: string }

interface Props {
  /** Sorted oldest first */
  rows: Row[]
  onDetails: (draft: Draft) => void
}

export default function QuickAdd({ rows, onDetails }: Props) {
  // Anything left unset follows the previous entry
  const [chosen, setChosen] = useState<Partial<Draft>>({})
  const [loggedId, setLoggedId] = useState<number>()

  const playlist = chosen.playlist ?? rows.at(-1)?.playlist ?? 'doubles'
  const inPlaylist = rows.filter((r) => r.playlist === playlist)
  const previous = inPlaylist.at(-1)
  const logged = rows.find((r) => r.id === loggedId)
  const elo = chosen.elo ?? ''

  /** A manual choice wins; otherwise the division follows the elo once a boundary has been seen */
  function rankFor(elo: number) {
    const base = (chosen.rank ?? chosen.division) === undefined ? predictRank(inPlaylist, elo) : previous
    return {
      rank: chosen.rank ?? base?.rank ?? 0,
      division: chosen.division ?? base?.division ?? 0,
    }
  }
  const shown = rankFor(elo === '' ? (previous?.elo ?? 0) : Number(elo))

  async function log(elo: number) {
    const { rank, division } = rankFor(elo)
    setLoggedId(
      await db.entries.add({ playlist, elo, rank, division: rank === SSL ? 0 : division, timestamp: Date.now() }),
    )
    setChosen({ playlist })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    log(Number(elo))
  }

  const step = (direction: 1 | -1) =>
    setChosen({ ...chosen, ...stepDivision(shown.rank, shown.division, direction) })

  const deltas = previous ? commonDeltas(inPlaylist) : []

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = (event.target as HTMLElement).matches('input, select, textarea')
      if (typing || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      if (document.querySelector('dialog[open]')) return
      const delta = deltas[Number(event.key) - 1]
      if (delta !== undefined) log(previous!.elo + delta)
      else if (event.key === ']' && previous) step(1)
      else if (event.key === '[' && previous) step(-1)
      else if (event.key === 'z' && logged) db.entries.delete(logged.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <form className="quick card" onSubmit={submit}>
      <select
        aria-label="Playlist"
        value={playlist}
        onChange={(e) => setChosen({ playlist: e.target.value as PlaylistId })}
      >
        {PLAYLISTS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {previous ? (
        <span className="stepper">
          <button type="button" aria-label="Division down" onClick={() => step(-1)}>
            ▼<kbd>[</kbd>
          </button>
          <RankBadge {...shown} />
          <button type="button" aria-label="Division up" onClick={() => step(1)}>
            ▲<kbd>]</kbd>
          </button>
        </span>
      ) : (
        <>
          <select
            aria-label="Rank"
            value={shown.rank}
            onChange={(e) => setChosen({ ...chosen, rank: Number(e.target.value) })}
          >
            {RANKS.map((name, rank) => (
              <option key={rank} value={rank}>
                {name}
              </option>
            ))}
          </select>
          {shown.rank !== SSL && (
            <select
              aria-label="Division"
              value={shown.division}
              onChange={(e) => setChosen({ ...chosen, division: Number(e.target.value) })}
            >
              {DIVISIONS.map((name, division) => (
                <option key={division} value={division}>
                  Div {name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {previous &&
        deltas.map((delta, i) => (
          <button
            key={delta}
            type="button"
            data-trend={trend(delta)}
            title={`Log ${previous.elo + delta}`}
            onClick={() => log(previous.elo + delta)}
          >
            {signed(delta)}
            <kbd>{i + 1}</kbd>
          </button>
        ))}

      <input
        type="number"
        required
        min={0}
        aria-label="Elo"
        placeholder={previous ? `Other (${previous.elo})` : 'Elo'}
        value={elo}
        onChange={(e) => setChosen({ ...chosen, elo: e.target.value })}
      />
      <button type="submit" className="primary">
        Log
      </button>
      <button type="button" onClick={() => onDetails({ playlist, elo, ...shown })}>
        With details…
      </button>

      {logged && (
        <span className="status">
          Logged {logged.elo} <span data-trend={trend(logged.delta)}>{signed(logged.delta)}</span>
          <RankBadge rank={logged.rank} division={logged.division} />
          <button type="button" onClick={() => db.entries.delete(logged.id)}>
            Undo<kbd>Z</kbd>
          </button>
        </span>
      )}
    </form>
  )
}
