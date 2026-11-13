const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion']
const TIER_COLORS = ['#b0703c', '#9aa3ad', '#d9a520', '#5fc9d6', '#3d8bff', '#a66bff', '#e0453f', '#f5f5f5']

/** Index into RANKS is the stored rank value */
export const RANKS = [...TIERS.flatMap((tier) => ['I', 'II', 'III'].map((n) => `${tier} ${n}`)), 'Supersonic Legend']
export const DIVISIONS = ['I', 'II', 'III', 'IV']
export const SSL = RANKS.length - 1

export const rankColor = (rank: number) => TIER_COLORS[Math.floor(rank / 3)]

export const rankLabel = (rank: number, division?: number) =>
  division === undefined || rank === SSL ? RANKS[rank] : `${RANKS[rank]} Div ${DIVISIONS[division]}`

const TIER_INITIALS = ['B', 'S', 'G', 'P', 'D', 'C', 'GC']
export const rankShort = (rank: number) => (rank === SSL ? 'SSL' : `${TIER_INITIALS[Math.floor(rank / 3)]}${(rank % 3) + 1}`)

/** Moves one division, rolling over into the neighbouring rank */
export function stepDivision(rank: number, division: number, direction: 1 | -1) {
  const position = Math.min(Math.max(rank * 4 + (rank === SSL ? 0 : division) + direction, 0), SSL * 4)
  return { rank: Math.floor(position / 4), division: position % 4 }
}

export const PLAYLISTS = [
  { id: 'duel', name: '1v1 Duel', teamSize: 1 },
  { id: 'doubles', name: '2v2 Doubles', teamSize: 2 },
  { id: 'standard', name: '3v3 Standard', teamSize: 3 },
  { id: 'hoops', name: 'Hoops', teamSize: 2 },
  { id: 'rumble', name: 'Rumble', teamSize: 3 },
  { id: 'dropshot', name: 'Dropshot', teamSize: 3 },
  { id: 'snowday', name: 'Snow Day', teamSize: 3 },
] as const

export type PlaylistId = (typeof PLAYLISTS)[number]['id']

export const playlist = (id: PlaylistId) => PLAYLISTS.find((p) => p.id === id)!
/** Colour follows the playlist's fixed position, so filtering never repaints a series */
export const playlistColor = (id: PlaylistId) => `var(--series-${PLAYLISTS.findIndex((p) => p.id === id) + 1})`
