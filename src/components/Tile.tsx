import type { ReactNode } from 'react'

export default function Tile({ label, children, trend }: { label: string; children: ReactNode; trend?: string }) {
  return (
    <div className="tile">
      <span>{label}</span>
      <strong data-trend={trend}>{children}</strong>
    </div>
  )
}
