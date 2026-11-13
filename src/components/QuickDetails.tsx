import { useEffect, useRef, useState } from 'react'
import { db } from '../db'
import { RANKS, SSL, playlist as getPlaylist, rankShort } from '../ranks'
import { parseStats, type Row } from '../stats'

type Slots = (number | undefined)[]

const STATS = ['score', 'goals', 'assists', 'saves', 'shots'] as const
const filled = (slots: Slots) => slots.filter((rank) => rank !== undefined)

/** Rebuilds the one-line form of an entry's stats, stopping at the first gap as the line is positional */
function statsLine(entry: Row) {
  const final = entry.goalsFor !== undefined && entry.goalsAgainst !== undefined
  const stats = STATS.map((key) => entry[key])
  const gap = stats.indexOf(undefined)
  return [...(final ? [`${entry.goalsFor}-${entry.goalsAgainst}`] : []), ...stats.slice(0, gap < 0 ? 5 : gap)].join(' ')
}

interface PickerProps {
  label: string
  /** The player's own rank, which the one-click choices sit around */
  mine: number
  count: number
  slots: Slots
  onChange: (slots: Slots) => void
}

function RankPicker({ label, mine, count, slots, onChange }: PickerProps) {
  const nearby = [mine - 1, mine, mine + 1].filter((rank) => rank >= 0 && rank <= SSL)
  const set = (i: number, rank?: number) => onChange(Object.assign([...slots], { [i]: rank }))

  return (
    <div className="ranks">
      <span>{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="segment">
          {nearby.map((rank) => (
            <button
              key={rank}
              type="button"
              title={RANKS[rank]}
              aria-pressed={slots[i] === rank}
              onClick={() => set(i, slots[i] === rank ? undefined : rank)}
            >
              {rankShort(rank)}
            </button>
          ))}
          <select
            aria-label={`${label} ${i + 1} other rank`}
            value={slots[i] !== undefined && !nearby.includes(slots[i]) ? slots[i] : ''}
            onChange={(e) => set(i, e.target.value === '' ? undefined : Number(e.target.value))}
          >
            <option value="">Other</option>
            {RANKS.map((name, rank) => (
              <option key={rank} value={rank}>
                {name}
              </option>
            ))}
          </select>
        </span>
      ))}
    </div>
  )
}

interface Props {
  entry: Row
  focus: boolean
  onBlur: () => void
}

/** Saves as you type, so there is nothing to submit */
export default function QuickDetails({ entry, focus, onBlur }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(() => statsLine(entry))
  const [teammates, setTeammates] = useState<Slots>(entry.teammateRanks ?? [])
  const [opponents, setOpponents] = useState<Slots>(entry.opponentRanks ?? [])
  const { name, teamSize } = getPlaylist(entry.playlist)
  const stats = parseStats(text)

  useEffect(() => {
    if (focus) input.current?.focus()
  }, [focus])

  function changeText(value: string) {
    setText(value)
    db.entries.update(entry.id, parseStats(value))
  }

  function changeRanks(nextTeammates: Slots, nextOpponents: Slots) {
    setTeammates(nextTeammates)
    setOpponents(nextOpponents)
    db.entries.update(entry.id, { teammateRanks: filled(nextTeammates), opponentRanks: filled(nextOpponents) })
  }

  return (
    <div className="details">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          input.current?.blur()
        }}
      >
        <label>
          Stats for {name} {entry.elo}: final score, then score, goals, assists, saves, shots
          <input
            ref={input}
            value={text}
            placeholder="3-1 450 2 1 0 4"
            autoComplete="off"
            onChange={(e) => changeText(e.target.value)}
            onBlur={onBlur}
            onKeyDown={(e) => e.key === 'Escape' && input.current?.blur()}
          />
        </label>
      </form>
      <p className="session">
        <span>Final {stats.goalsFor === undefined ? '–' : `${stats.goalsFor}–${stats.goalsAgainst}`}</span>
        {STATS.map((key) => (
          <span key={key} className="capitalize">
            {key} {stats[key] ?? '–'}
          </span>
        ))}
      </p>

      {teamSize > 1 && (
        <RankPicker
          label="Teammate"
          mine={entry.rank}
          count={teamSize - 1}
          slots={teammates}
          onChange={(slots) => changeRanks(slots, opponents)}
        />
      )}
      <RankPicker
        label="Opponent"
        mine={entry.rank}
        count={teamSize}
        slots={opponents}
        onChange={(slots) => changeRanks(teammates, slots)}
      />
      <button
        type="button"
        onClick={() => changeRanks(Array(teamSize - 1).fill(entry.rank), Array(teamSize).fill(entry.rank))}
      >
        Everyone {rankShort(entry.rank)}
      </button>
    </div>
  )
}
