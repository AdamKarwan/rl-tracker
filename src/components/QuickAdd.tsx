import { useRef, useState, type FormEvent } from 'react'
import { db, type Entry } from '../db'
import { signed, trend } from '../format'
import { DIVISIONS, PLAYLISTS, RANKS, SSL, stepDivision, type PlaylistId } from '../ranks'
import { commonDeltas, type Row } from '../stats'
import RankBadge from './RankBadge'

export type Draft = Pick<Entry, 'playlist' | 'rank' | 'division'> & { elo: string }

interface Props {
  /** Sorted oldest first */
  rows: Row[]
  onDetails: (draft: Draft) => void
}

export default function QuickAdd({ rows, onDetails }: Props) {
  const save = useRef<HTMLButtonElement>(null)
  // Anything left unset follows the previous entry
  const [chosen, setChosen] = useState<Partial<Draft>>({})
  const [logged, setLogged] = useState<Entry>()

  const playlist = chosen.playlist ?? rows.at(-1)?.playlist ?? 'doubles'
  const inPlaylist = rows.filter((r) => r.playlist === playlist)
  const previous = inPlaylist.at(-1)
  const draft: Draft = {
    playlist,
    elo: chosen.elo ?? '',
    rank: chosen.rank ?? previous?.rank ?? 0,
    division: chosen.division ?? previous?.division ?? 0,
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const entry = {
      ...draft,
      timestamp: Date.now(),
      elo: Number(draft.elo),
      division: draft.rank === SSL ? 0 : draft.division,
    }
    const id = await db.entries.add(entry)
    setLogged({ ...entry, id })
    setChosen({ playlist })
  }

  const step = (direction: 1 | -1) =>
    setChosen({ ...chosen, ...stepDivision(draft.rank, draft.division, direction) })

  function undo() {
    db.entries.delete(logged!.id)
    setLogged(undefined)
  }

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

      {previous &&
        commonDeltas(inPlaylist).map((delta) => (
          <button
            key={delta}
            type="button"
            data-trend={trend(delta)}
            onClick={() => {
              setChosen({ ...chosen, elo: String(previous.elo + delta) })
              // Enter then saves straight away
              save.current?.focus()
            }}
          >
            {signed(delta)}
          </button>
        ))}

      <input
        type="number"
        required
        min={0}
        aria-label="Elo"
        placeholder={previous ? `Elo (${previous.elo})` : 'Elo'}
        value={draft.elo}
        onChange={(e) => setChosen({ ...chosen, elo: e.target.value })}
      />

      {previous ? (
        <span className="stepper">
          <button type="button" aria-label="Division down" onClick={() => step(-1)}>
            ▼
          </button>
          <RankBadge rank={draft.rank} division={draft.division} />
          <button type="button" aria-label="Division up" onClick={() => step(1)}>
            ▲
          </button>
        </span>
      ) : (
        <>
          <select
            aria-label="Rank"
            value={draft.rank}
            onChange={(e) => setChosen({ ...chosen, rank: Number(e.target.value) })}
          >
            {RANKS.map((name, rank) => (
              <option key={rank} value={rank}>
                {name}
              </option>
            ))}
          </select>
          {draft.rank !== SSL && (
            <select
              aria-label="Division"
              value={draft.division}
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

      <button ref={save} type="submit" className="primary">
        Log
      </button>
      <button type="button" onClick={() => onDetails(draft)}>
        With details…
      </button>

      {logged && (
        <span className="status">
          Logged {logged.elo} <button type="button" onClick={undo}>Undo</button>
        </span>
      )}
    </form>
  )
}
