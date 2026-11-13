import { percent, signed, trend } from '../format'
import type { breakdown } from '../stats'

interface Props {
  title: string
  /** Header of the label column */
  heading: string
  groups: ReturnType<typeof breakdown>
}

export default function Breakdown({ title, heading, groups }: Props) {
  const played = groups.filter((g) => g.games)
  if (!played.length) return null
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>{heading}</th>
              <th className="num">Games</th>
              <th className="num">W–L</th>
              <th className="num">Win rate</th>
              <th className="num">Avg ±</th>
            </tr>
          </thead>
          <tbody>
            {played.map((g) => (
              <tr key={g.label}>
                <td>{g.label}</td>
                <td className="num">{g.games}</td>
                <td className="num">
                  {g.wins}–{g.losses}
                </td>
                <td className="num">{percent(g.winRate)}</td>
                <td className="num" data-trend={trend(g.avgDelta)}>
                  {signed(g.avgDelta, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
