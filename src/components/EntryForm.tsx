import { useEffect, useRef, useState, type FormEvent } from 'react'
import { db, type Entry, type NewEntry } from '../db'
import { DIVISIONS, PLAYLISTS, RANKS, SSL, playlist as getPlaylist, type PlaylistId } from '../ranks'

interface Props {
  /** Sorted oldest first */
  entries: Entry[]
  editing?: Entry
  onClose: () => void
}

const STATS = ['score', 'goals', 'assists', 'saves', 'shots'] as const

const toLocalInput = (timestamp: number) =>
  new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const text = (value?: number) => value?.toString() ?? ''
const optional = (value: string) => (value === '' ? undefined : Number(value))
const ranks = (values: string[]) => values.filter(Boolean).map(Number)

export default function EntryForm({ entries, editing, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const elo = useRef<HTMLInputElement>(null)
  const lastIn = (id: PlaylistId) => entries.findLast((e) => e.playlist === id && e.id !== editing?.id)

  const [form, setForm] = useState(() => {
    const source = editing ?? entries.at(-1)
    return {
      timestamp: toLocalInput(editing?.timestamp ?? Date.now()),
      playlist: source?.playlist ?? ('doubles' as PlaylistId),
      elo: text(editing?.elo),
      rank: source?.rank ?? 0,
      division: source?.division ?? 0,
      goalsFor: text(editing?.goalsFor),
      goalsAgainst: text(editing?.goalsAgainst),
      score: text(editing?.score),
      goals: text(editing?.goals),
      assists: text(editing?.assists),
      saves: text(editing?.saves),
      shots: text(editing?.shots),
      teammateRanks: (editing?.teammateRanks ?? []).map(String),
      opponentRanks: (editing?.opponentRanks ?? []).map(String),
    }
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
    // showModal focuses the first control, which would be the playlist
    elo.current?.focus()
  }, [])

  const { teamSize } = getPlaylist(form.playlist)
  const previous = lastIn(form.playlist)

  function changePlaylist(id: PlaylistId) {
    const last = lastIn(id)
    set({
      playlist: id,
      ...(last && { rank: last.rank, division: last.division }),
      teammateRanks: [],
      opponentRanks: [],
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const entry: NewEntry = {
      timestamp: new Date(form.timestamp).getTime(),
      playlist: form.playlist,
      elo: Number(form.elo),
      rank: form.rank,
      division: form.rank === SSL ? 0 : form.division,
      goalsFor: optional(form.goalsFor),
      goalsAgainst: optional(form.goalsAgainst),
      score: optional(form.score),
      goals: optional(form.goals),
      assists: optional(form.assists),
      saves: optional(form.saves),
      shots: optional(form.shots),
      teammateRanks: ranks(form.teammateRanks),
      opponentRanks: ranks(form.opponentRanks),
    }
    if (editing) await db.entries.put({ ...entry, id: editing.id })
    else await db.entries.add(entry)
    onClose()
  }

  const rankSelects = (key: 'teammateRanks' | 'opponentRanks', count: number) =>
    Array.from({ length: count }, (_, i) => (
      <select
        key={i}
        aria-label={`${key === 'teammateRanks' ? 'Teammate' : 'Opponent'} ${i + 1} rank`}
        value={form[key][i] ?? ''}
        onChange={(e) => set({ [key]: Object.assign([...form[key]], { [i]: e.target.value }) })}
      >
        <option value="">–</option>
        {RANKS.map((name, rank) => (
          <option key={rank} value={rank}>
            {name}
          </option>
        ))}
      </select>
    ))

  return (
    <dialog ref={dialog} onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{editing ? 'Edit entry' : 'Log entry'}</h2>

        <label>
          Playlist
          <select value={form.playlist} onChange={(e) => changePlaylist(e.target.value as PlaylistId)}>
            {PLAYLISTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Elo
          <input
            type="number"
            ref={elo}
            required
            min={0}
            value={form.elo}
            placeholder={previous ? `Previous: ${previous.elo}` : undefined}
            onChange={(e) => set({ elo: e.target.value })}
          />
        </label>

        <div className="fields">
          <label>
            Rank
            <select value={form.rank} onChange={(e) => set({ rank: Number(e.target.value) })}>
              {RANKS.map((name, rank) => (
                <option key={rank} value={rank}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {form.rank !== SSL && (
            <label>
              Division
              <select value={form.division} onChange={(e) => set({ division: Number(e.target.value) })}>
                {DIVISIONS.map((name, division) => (
                  <option key={division} value={division}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label>
          Played at
          <input
            type="datetime-local"
            required
            value={form.timestamp}
            onChange={(e) => set({ timestamp: e.target.value })}
          />
        </label>

        <details open={!!editing}>
          <summary>Match details (optional)</summary>

          <div className="fields">
            <label>
              My team goals
              <input
                type="number"
                min={0}
                value={form.goalsFor}
                onChange={(e) => set({ goalsFor: e.target.value })}
              />
            </label>
            <label>
              Opponent goals
              <input
                type="number"
                min={0}
                value={form.goalsAgainst}
                onChange={(e) => set({ goalsAgainst: e.target.value })}
              />
            </label>
          </div>

          <div className="fields">
            {STATS.map((stat) => (
              <label key={stat} className="capitalize">
                {stat}
                <input
                  type="number"
                  min={0}
                  value={form[stat]}
                  onChange={(e) => set({ [stat]: e.target.value })}
                />
              </label>
            ))}
          </div>

          {teamSize > 1 && (
            <fieldset>
              <legend>Teammate ranks</legend>
              {rankSelects('teammateRanks', teamSize - 1)}
            </fieldset>
          )}
          <fieldset>
            <legend>Opponent ranks</legend>
            {rankSelects('opponentRanks', teamSize)}
          </fieldset>
        </details>

        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save
          </button>
        </footer>
      </form>
    </dialog>
  )
}
