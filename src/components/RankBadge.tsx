import { rankColor, rankLabel } from '../ranks'

export default function RankBadge({ rank, division }: { rank: number; division?: number }) {
  return (
    <span className="badge">
      <i style={{ background: rankColor(rank) }} />
      {rankLabel(rank, division)}
    </span>
  )
}
