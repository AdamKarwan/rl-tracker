import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dateTime, signed, trend } from '../format'
import { PLAYLISTS, playlist, playlistColor, rankLabel } from '../ranks'
import type { Row } from '../stats'

const DAY = 86_400_000

function EloTooltip({ payload }: { payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload
  if (!row) return null
  return (
    <div className="tooltip">
      <strong>
        {row.elo} <span data-trend={trend(row.delta)}>{signed(row.delta)}</span>
      </strong>
      <span>{playlist(row.playlist).name}</span>
      <span>{rankLabel(row.rank, row.division)}</span>
      <span>{dateTime(row.timestamp)}</span>
    </div>
  )
}

export default function EloChart({ rows }: { rows: Row[] }) {
  const series = PLAYLISTS.map((p) => ({ ...p, rows: rows.filter((r) => r.playlist === p.id) })).filter(
    (s) => s.rows.length,
  )
  const singleDay = rows.length > 0 && rows.at(-1)!.timestamp - rows[0].timestamp < DAY
  const tick = (timestamp: number) =>
    new Date(timestamp).toLocaleString(
      undefined,
      singleDay ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short' },
    )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={tick}
          stroke="var(--axis)"
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
          allowDuplicatedCategory={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          width={48}
          stroke="var(--axis)"
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
        />
        <Tooltip content={<EloTooltip />} cursor={{ stroke: 'var(--axis)' }} />
        {series.length > 1 && <Legend formatter={(name) => <span className="legend">{name}</span>} />}
        {series.map((s) => (
          <Line
            key={s.id}
            data={s.rows}
            dataKey="elo"
            name={s.name}
            stroke={playlistColor(s.id)}
            strokeWidth={2}
            dot={{ r: 3, fill: playlistColor(s.id), stroke: 'var(--surface)', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
